import { useEffect, useState } from "react";
import { plantList, type Plant } from "./plants";

const STORAGE_KEY = "user-plants-v1";
const EVENT = "user-plants-changed";

export type UserPlant = Plant & { userAdded: true; createdAt: number };

function read(): UserPlant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserPlant[];
  } catch {
    return [];
  }
}

function write(items: UserPlant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function addUserPlant(p: Omit<UserPlant, "userAdded" | "createdAt">) {
  const items = read();
  const next: UserPlant = { ...p, userAdded: true, createdAt: Date.now() };
  write([next, ...items]);
  return next;
}

export function useUserPlants(): UserPlant[] {
  // Start empty so server-rendered HTML matches the first client render
  // (localStorage is unavailable during SSR). The effect below hydrates it.
  const [items, setItems] = useState<UserPlant[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

export function useAllPlants(): Plant[] {
  const user = useUserPlants();
  return [...user, ...plantList];
}
