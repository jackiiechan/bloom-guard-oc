import { createFileRoute, Link } from "@tanstack/react-router";
import { useAllPlants } from "@/lib/user-plants";
import leavesBg from "@/assets/leaves-bg.jpg";

export const Route = createFileRoute("/plants")({
  head: () => ({
    meta: [
      { title: "All Plants — Plant Safety" },
      { name: "description", content: "Details for every plant in the inventory, safe and dangerous." },
    ],
  }),
  component: AllPlants,
});

function AllPlants() {
  const plantList = useAllPlants();
  return (
    <main
      className="relative min-h-screen flex flex-col bg-background bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${leavesBg})` }}
    >
      <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative flex flex-1 flex-col px-5 py-6">
        <Link to="/" className="self-start text-sm font-medium text-foreground/80 hover:text-foreground mb-4">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground text-center mb-6">Plant Inventory</h1>

        <div className="mx-auto w-full max-w-2xl space-y-5">
          {plantList.map((plant) => {
            const isSafe = plant.tone === "safe";
            return (
              <article
                key={plant.id}
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-card shadow-md ring-2 ${
                  isSafe
                    ? "ring-emerald-500/70 shadow-[0_0_0_3px_rgb(16_185_129_/_0.2)]"
                    : "ring-destructive/70 shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_20%,transparent)]"
                }`}
              >
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full sm:w-32 h-32 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1">
                  <span
                    className={`inline-block text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isSafe
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {isSafe ? "Safe" : "Danger"}
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-foreground">{plant.name}</h2>
                  <p className="mt-1 text-sm font-medium text-foreground/90">{plant.summary}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{plant.details}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
