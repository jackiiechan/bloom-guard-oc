import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { type Plant } from "@/lib/plants";
import { useAllPlants } from "@/lib/user-plants";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Plant Patrol — Mini Game" },
      {
        name: "description",
        content:
          "Play as a plant scout: find plants posted by the community, scan them for chemical spray, and file them as safe or danger.",
      },
    ],
  }),
  component: GamePage,
});

type ScanState = "unscanned" | "scanning" | "scanned";

type FieldPlant = {
  key: string;
  plant: Plant;
  sprayed: boolean;
  scan: ScanState;
  collected: boolean;
  x: number;
  y: number;
};

type InventoryItem = {
  key: string;
  plant: Plant;
  sprayed: boolean;
  filed: "safe" | "danger" | null;
};

const CHARACTERS = [
  { emoji: "🧑‍🌾", name: "Rin the Farmer" },
  { emoji: "🧑‍🔬", name: "Dr. Vega" },
  { emoji: "🕵️", name: "Scout Mika" },
  { emoji: "🧑‍🚀", name: "Captain Fern" },
  { emoji: "🧙", name: "Sage Willow" },
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildField(pool: Plant[]): FieldPlant[] {
  // Pick 6 plants, allow duplicates so the field feels alive
  const items: FieldPlant[] = [];
  if (pool.length === 0) return items;
  for (let i = 0; i < 6; i++) {
    const plant = rand(pool);
    items.push({
      key: `${plant.id}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      plant,
      // Danger plants are more likely to be sprayed, but it's never certain
      sprayed: Math.random() < (plant.tone === "danger" ? 0.7 : 0.35),
      scan: "unscanned",
      collected: false,
      x: 10 + Math.random() * 75,
      y: 15 + Math.random() * 65,
    });
  }
  return items;
}

function GamePage() {
  const allPlants = useAllPlants();
  const [character] = useState(() => rand(CHARACTERS));
  const [field, setField] = useState<FieldPlant[]>(() => buildField(allPlants));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [round, setRound] = useState(1);

  const selected = useMemo(
    () => field.find((p) => p.key === selectedKey) ?? null,
    [field, selectedKey],
  );

  const remaining = field.filter((p) => !p.collected).length;

  function selectPlant(key: string) {
    setSelectedKey(key);
  }

  function scanSelected() {
    if (!selected) return;
    setField((prev) =>
      prev.map((p) => (p.key === selected.key ? { ...p, scan: "scanning" } : p)),
    );
    setTimeout(() => {
      setField((prev) =>
        prev.map((p) => (p.key === selected.key ? { ...p, scan: "scanned" } : p)),
      );
    }, 900);
  }

  function collectSelected() {
    if (!selected || selected.scan !== "scanned") return;
    setInventory((inv) => [
      {
        key: selected.key,
        plant: selected.plant,
        sprayed: selected.sprayed,
        filed: null,
      },
      ...inv,
    ]);
    setField((prev) =>
      prev.map((p) => (p.key === selected.key ? { ...p, collected: true } : p)),
    );
    setSelectedKey(null);
  }

  function fileItem(key: string, where: "safe" | "danger") {
    setInventory((inv) =>
      inv.map((it) => (it.key === key ? { ...it, filed: where } : it)),
    );
  }

  function newRound() {
    setField(buildField(allPlants));
    setSelectedKey(null);
    setRound((r) => r + 1);
  }

  const safeFiled = inventory.filter((i) => i.filed === "safe");
  const dangerFiled = inventory.filter((i) => i.filed === "danger");
  const pending = inventory.filter((i) => i.filed === null);

  return (
    <main className="relative min-h-screen flex flex-col bg-background">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-base font-bold uppercase tracking-wider">Plant Patrol</h1>
        <span className="text-sm font-semibold text-primary">Round {round}</span>
      </header>

      {/* Character bar */}
      <section className="px-5 pb-3 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/15 ring-2 ring-primary/40 flex items-center justify-center text-2xl">
          {character.emoji}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Scout</p>
          <p className="text-sm font-bold text-foreground">{character.name}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Plants left</p>
          <p className="text-base font-bold text-foreground">{remaining}</p>
        </div>
      </section>

      {/* Field */}
      <section className="px-5">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden ring-2 ring-emerald-700/40 bg-gradient-to-b from-emerald-200 via-emerald-100 to-amber-100 dark:from-emerald-900 dark:via-emerald-800 dark:to-amber-900">
          {/* ground texture */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-amber-800/40 to-transparent" />
          {/* character marker */}
          <div className="absolute left-3 bottom-3 text-3xl select-none drop-shadow">
            {character.emoji}
          </div>

          {field.map((fp) =>
            fp.collected ? null : (
              <button
                key={fp.key}
                onClick={() => selectPlant(fp.key)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full overflow-hidden ring-2 transition active:scale-95 ${
                  selectedKey === fp.key
                    ? "ring-primary scale-110 shadow-xl"
                    : "ring-white/80 shadow-md"
                }`}
                style={{ left: `${fp.x}%`, top: `${fp.y}%` }}
                aria-label={`Investigate plant ${fp.plant.name}`}
              >
                <img
                  src={fp.plant.image}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ),
          )}

          {remaining === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
              <p className="text-lg font-bold text-foreground">Field cleared! 🌿</p>
              <button
                onClick={newRound}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition"
              >
                Explore a new area
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Scanner panel */}
      <section className="px-5 py-4">
        {selected ? (
          <div className="rounded-2xl border-2 border-foreground/15 bg-card p-4 shadow-md space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={selected.plant.image}
                alt={selected.plant.name}
                className="h-16 w-16 rounded-lg object-cover ring-2 ring-foreground/15"
              />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Plant found
                </p>
                <p className="text-base font-bold text-foreground">{selected.plant.name}</p>
                <p className="text-xs text-muted-foreground">{selected.plant.summary}</p>
              </div>
            </div>

            {selected.scan === "unscanned" && (
              <button
                onClick={scanSelected}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow hover:bg-primary/90 active:scale-95 transition"
              >
                📡 Scan for chemicals
              </button>
            )}
            {selected.scan === "scanning" && (
              <div className="w-full rounded-xl bg-muted px-4 py-3 text-center text-sm font-semibold animate-pulse">
                Scanning…
              </div>
            )}
            {selected.scan === "scanned" && (
              <div className="space-y-2">
                <div
                  className={`rounded-xl px-4 py-3 text-center text-sm font-bold uppercase tracking-wide ${
                    selected.sprayed
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {selected.sprayed
                    ? "⚠ Chemical spray detected"
                    : "✓ No chemicals found"}
                </div>
                <button
                  onClick={collectSelected}
                  className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-bold uppercase tracking-wide text-background hover:opacity-90 active:scale-95 transition"
                >
                  + Add to inventory
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-foreground/20 p-4 text-center text-sm text-muted-foreground">
            Tap a plant in the field to investigate it.
          </div>
        )}
      </section>

      {/* Inventory */}
      <section className="px-5 pb-8 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          🎒 Inventory ({pending.length} to file)
        </h2>
        {pending.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing pending. Scan and collect plants from the field.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((it) => (
              <div
                key={it.key}
                className="flex items-center gap-3 rounded-xl border border-foreground/15 bg-card p-2 shadow-sm"
              >
                <img
                  src={it.plant.image}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {it.plant.name}
                  </p>
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wide ${
                      it.sprayed ? "text-destructive" : "text-emerald-600"
                    }`}
                  >
                    {it.sprayed ? "Sprayed" : "Clean"}
                  </p>
                </div>
                <button
                  onClick={() => fileItem(it.key, "safe")}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-emerald-600 active:scale-95 transition"
                >
                  Safe
                </button>
                <button
                  onClick={() => fileItem(it.key, "danger")}
                  className="rounded-lg bg-destructive px-3 py-2 text-xs font-bold uppercase text-destructive-foreground hover:opacity-90 active:scale-95 transition"
                >
                  Danger
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <FiledBin title="Safe" tone="safe" items={safeFiled} />
          <FiledBin title="Danger" tone="danger" items={dangerFiled} />
        </div>
      </section>
    </main>
  );
}

function FiledBin({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "safe" | "danger";
  items: InventoryItem[];
}) {
  const ring = tone === "safe" ? "ring-emerald-500/60" : "ring-destructive/60";
  const dot = tone === "safe" ? "bg-emerald-500" : "bg-destructive";
  return (
    <div className={`rounded-xl ring-2 ${ring} bg-card p-3`}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Empty</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {items.map((it) => (
            <div
              key={it.key}
              className="relative aspect-square overflow-hidden rounded-md ring-1 ring-foreground/15"
            >
              <img src={it.plant.image} alt="" className="h-full w-full object-cover" />
              {it.sprayed && (
                <span className="absolute bottom-0 inset-x-0 bg-destructive/90 text-[8px] font-bold text-white text-center py-0.5">
                  SPRAYED
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
