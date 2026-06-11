import safe1 from "@/assets/safe-1.jpg";
import safe2 from "@/assets/safe-2.jpg";
import danger1 from "@/assets/danger-1.jpg";
import danger2 from "@/assets/danger-2.jpg";

export type Plant = {
  id: string;
  name: string;
  tone: "safe" | "danger";
  image: string;
  summary: string;
  details: string;
};

export const plants: Record<string, Plant> = {
  lavender: {
    id: "lavender",
    name: "Lavender",
    tone: "safe",
    image: safe1,
    summary: "Safe to touch and grow near the home.",
    details:
      "Lavender is non-toxic to humans and pets. It naturally repels some pests, so it rarely needs chemical sprays.",
  },
  rosemary: {
    id: "rosemary",
    name: "Rosemary",
    tone: "safe",
    image: safe2,
    summary: "Safe culinary herb, gentle on skin.",
    details:
      "Rosemary is edible and safe to handle. It thrives without pesticides, making it a great choice for community gardens.",
  },
  "poison-ivy": {
    id: "poison-ivy",
    name: "Poison Ivy",
    tone: "danger",
    image: danger1,
    summary: "Causes painful skin rashes on contact.",
    details:
      "Poison ivy releases urushiol oil that triggers severe allergic reactions. Do not touch — and never burn it, as the smoke is also toxic.",
  },
  "giant-hogweed": {
    id: "giant-hogweed",
    name: "Giant Hogweed",
    tone: "danger",
    image: danger2,
    summary: "Sap can cause burns and blindness.",
    details:
      "Giant hogweed sap reacts with sunlight on skin, causing serious burns and blisters. Contact with eyes can cause permanent blindness. Report sightings to local authorities.",
  },
};

export const plantList = Object.values(plants);
