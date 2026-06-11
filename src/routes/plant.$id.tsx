import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { plants } from "@/lib/plants";
import leavesBg from "@/assets/leaves-bg.jpg";

export const Route = createFileRoute("/plant/$id")({
  loader: ({ params }) => {
    const plant = plants[params.id];
    if (!plant) throw notFound();
    return { plant };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.plant.name} — Plant Safety` : "Plant" },
      {
        name: "description",
        content: loaderData?.plant.summary ?? "Plant safety details.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <p className="text-foreground">Something went wrong: {error.message}</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 text-center">
      <p className="text-foreground">Plant not found.</p>
      <Link to="/" className="text-primary underline">
        Back to home
      </Link>
    </main>
  ),
  component: PlantDetail,
});

function PlantDetail() {
  const { plant } = Route.useLoaderData();
  const isSafe = plant.tone === "safe";

  return (
    <main
      className="relative min-h-screen flex flex-col bg-background bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${leavesBg})` }}
    >
      <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative flex flex-1 flex-col px-5 py-6">
        <Link
          to="/"
          className="self-start text-sm font-medium text-foreground/80 hover:text-foreground mb-4"
        >
          ← Back
        </Link>

        <div
          className={`mx-auto w-full max-w-sm overflow-hidden rounded-2xl ring-2 ${
            isSafe
              ? "ring-emerald-500/70 shadow-[0_0_0_4px_rgb(16_185_129_/_0.25)]"
              : "ring-destructive/70 shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_25%,transparent)]"
          } bg-card shadow-lg`}
        >
          <img src={plant.image} alt={plant.name} className="w-full aspect-square object-cover" />
        </div>

        <div className="mx-auto w-full max-w-sm mt-5 text-center">
          <span
            className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
              isSafe
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {isSafe ? "Safe" : "Danger"}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{plant.name}</h1>
          <p className="mt-2 text-base font-medium text-foreground/90">{plant.summary}</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">{plant.details}</p>
        </div>
      </div>
    </main>
  );
}
