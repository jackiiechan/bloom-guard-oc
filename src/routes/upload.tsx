import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { identifyPlant } from "@/lib/identify-plant.functions";
import { addUserPlant } from "@/lib/user-plants";
import type { IdentifiedPlant } from "@/lib/identify-plant.functions";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Your Plant" },
      { name: "description", content: "Upload a photo of a plant from your community. Our AI identifies it and tags it as safe or dangerous." },
    ],
  }),
  component: UploadPage,
});

const MAX_FILE_BYTES = 25 * 1024 * 1024; // reject absurdly large originals up front
const MAX_DIMENSION = 1024; // longest edge after downscale
const JPEG_QUALITY = 0.8;

/**
 * Read a File and return a downscaled JPEG data URL. Phone photos are often
 * 5–12 MB; sending those raw to the server (and storing them in localStorage)
 * is what makes uploads silently fail. Resizing to a max edge keeps the
 * payload small and reliable while staying good enough for identification.
 */
function fileToScaledDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback: use the original data URL if canvas is unavailable.
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function UploadPage() {
  const router = useRouter();
  const identify = useServerFn(identifyPlant);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "identifying" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifiedPlant | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so picking the SAME file again still fires onChange.
    input.value = "";
    if (!file) return;

    setError(null);
    setNote(null);
    setResult(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      setStatus("error");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That image is too large. Please pick one under 25 MB.");
      setStatus("error");
      return;
    }

    let dataUrl: string;
    try {
      dataUrl = await fileToScaledDataUrl(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
      setStatus("error");
      return;
    }

    setPreview(dataUrl);
    setStatus("identifying");
    try {
      const r = await identify({ data: { imageDataUrl: dataUrl } });
      setResult(r);
      setStatus("done");

      // Saving to the inventory is best-effort: if localStorage is full or
      // unavailable, the identification still succeeded — don't fail the flow.
      try {
        const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        addUserPlant({
          id,
          name: r.name,
          tone: r.tone,
          image: dataUrl,
          summary: r.summary,
          details: r.details,
        });
      } catch {
        setNote("Identified, but couldn't save to your inventory (storage may be full).");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identification failed.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
      <h1 className="text-2xl font-bold text-foreground mt-3 mb-1">Upload Your Plant</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Snap or upload a photo of a plant you found in your community. We'll identify it, share details, and add it to your inventory and the Plant Patrol game.
      </p>

      <label className="block rounded-2xl border-2 border-dashed border-foreground/25 bg-card p-6 text-center cursor-pointer hover:border-primary transition">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPick}
          disabled={status === "identifying"}
        />
        {preview ? (
          <img src={preview} alt="Selected plant" className="mx-auto max-h-64 rounded-lg object-cover" />
        ) : (
          <div className="py-10">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm font-semibold text-foreground">Tap to take a photo or upload</p>
            <p className="text-xs text-muted-foreground mt-1">JPG or PNG of a real plant</p>
          </div>
        )}
      </label>

      {status === "identifying" && (
        <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-center text-sm font-semibold animate-pulse">
          Identifying plant…
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 rounded-xl bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {status === "done" && result && (
        <div
          className={`mt-4 rounded-2xl p-4 bg-card ring-2 ${
            result.tone === "safe" ? "ring-emerald-500/70" : "ring-destructive/70"
          }`}
        >
          <span
            className={`inline-block text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              result.tone === "safe"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {result.tone === "safe" ? "Safe" : "Danger"}
          </span>
          <h2 className="mt-2 text-lg font-bold text-foreground">{result.name}</h2>
          <p className="mt-1 text-sm font-medium text-foreground/90">{result.summary}</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{result.details}</p>
          <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            {note ?? "✓ Added to your plant inventory and Plant Patrol game"}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setPreview(null);
                setResult(null);
                setNote(null);
                setStatus("idle");
              }}
              className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
            >
              Upload another
            </button>
            <button
              onClick={() => router.navigate({ to: "/plants" })}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              View inventory
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
