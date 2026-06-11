import { createFileRoute, Link } from "@tanstack/react-router";
import leavesBg from "@/assets/leaves-bg.jpg";
import { plantList, type Plant } from "@/lib/plants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plant Safety Warning" },
      { name: "description", content: "Community alert about toxic pesticide spraying and which plants are safe vs dangerous." },
    ],
  }),
  component: Index,
});

function PlantCard({ plant }: { plant: Plant }) {
  const ring =
    plant.tone === "safe"
      ? "ring-emerald-500/70 shadow-[0_0_0_3px_rgb(16_185_129_/_0.25)]"
      : "ring-destructive/70 shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_25%,transparent)]";
  return (
    <Link
      to="/plant/$id"
      params={{ id: plant.id }}
      className={`block aspect-square w-full overflow-hidden rounded-xl ring-2 ${ring} bg-card shadow-md hover:shadow-lg active:scale-95 transition-all focus:outline-none focus:ring-4`}
    >
      <img src={plant.image} alt={plant.name} loading="lazy" className="h-full w-full object-cover" />
    </Link>
  );
}

function Index() {
  const safe = plantList.filter((p) => p.tone === "safe");
  const danger = plantList.filter((p) => p.tone === "danger");

  return (
    <main
      className="relative min-h-screen flex flex-col bg-background bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${leavesBg})` }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative flex flex-1 flex-col">
        <section className="px-5 pt-8 pb-6 text-center">
          <p className="text-3xl font-extrabold uppercase tracking-widest text-destructive mb-3">Warning!</p>
          <h1 className="text-lg font-semibold leading-snug text-foreground">
            Gardeners are spraying plants in our communities to keep the weeds away,
            but they contain toxic chemicals getting residents sick, and they are
            passing away. What are we going to do about this?
          </h1>
        </section>

        <section className="flex-1 px-5 py-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
            >
              📷 Upload Your Plant
            </Link>
            <Link
              to="/plants"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition-all"
            >
              View Plant Details
            </Link>
            <Link
              to="/game"
              className="inline-flex items-center justify-center rounded-lg bg-destructive px-6 py-3 text-sm font-semibold text-destructive-foreground shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              🎮 Play Plant Patrol
            </Link>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center justify-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Safe
            </h2>
            <div className="grid grid-cols-2 gap-3 max-w-[260px] mx-auto">
              {safe.map((p) => (
                <PlantCard key={p.id} plant={p} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center justify-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
              Danger
            </h2>
            <div className="grid grid-cols-2 gap-3 max-w-[260px] mx-auto">
              {danger.map((p) => (
                <PlantCard key={p.id} plant={p} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
