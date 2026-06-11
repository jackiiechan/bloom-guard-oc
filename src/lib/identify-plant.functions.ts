import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  // A base64 image data URL, e.g. "data:image/jpeg;base64,...."
  imageDataUrl: z
    .string()
    .min(20)
    .refine((v) => v.startsWith("data:image/"), {
      message: "Expected an image data URL (data:image/...).",
    }),
});

export type IdentifiedPlant = {
  name: string;
  tone: "safe" | "danger";
  summary: string;
  details: string;
};

/**
 * Pull a JSON object out of a model response. We request a JSON object via
 * response_format, but some models still wrap it in ```json fences or add
 * stray prose — so parse defensively instead of trusting it blindly.
 */
function parseModelJson(content: string): Record<string, unknown> {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Last resort: grab the first {...} block in the string.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as Record<string, unknown>;
    throw new Error("The AI returned a response we couldn't read. Please try again.");
  }
}

export const identifyPlant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<IdentifiedPlant> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      // Lovable injects LOVABLE_API_KEY automatically in hosted/preview builds.
      // Running locally? Add it to a `.dev.vars` (Cloudflare) or `.env` file.
      throw new Error(
        "Plant identification isn't configured yet: LOVABLE_API_KEY is missing on the server.",
      );
    }

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                'You are a botanist. Identify the plant in the image. Respond ONLY with strict JSON matching: {"name": string, "tone": "safe"|"danger", "summary": string (max 90 chars), "details": string (1-2 sentences)}. Use tone="danger" if the plant is toxic, causes burns/rashes, is poisonous to humans/pets, or is an invasive harmful species. Otherwise "safe". If you cannot identify a plant, use name="Unknown Plant".',
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify this plant and classify it." },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch (err) {
      throw new Error(
        `Couldn't reach the plant identification service. ${
          err instanceof Error ? err.message : "Check your connection and try again."
        }`,
      );
    }

    if (!res.ok) {
      // Surface the gateway's well-known statuses as friendly messages.
      if (res.status === 402) {
        throw new Error("AI credits have run out for this workspace. Top up to keep identifying plants.");
      }
      if (res.status === 429) {
        throw new Error("Too many requests right now — please wait a moment and try again.");
      }
      const text = await res.text().catch(() => "");
      throw new Error(`Plant identification failed (error ${res.status}). ${text.slice(0, 200)}`);
    }

    const json = (await res.json().catch(() => null)) as
      | { choices?: { message?: { content?: string } }[] }
      | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response. Please try again.");

    const parsed = parseModelJson(content);
    const tone = parsed.tone === "danger" ? "danger" : "safe";
    return {
      name: String(parsed.name || "Unknown Plant").slice(0, 60),
      tone,
      summary: String(parsed.summary || "").slice(0, 120),
      details: String(parsed.details || "").slice(0, 400),
    };
  });
