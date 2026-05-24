import { useEffect, useState } from "react";
import type { PublicPersona } from "./types.js";

let cache: PublicPersona[] | null = null;
let inflight: Promise<PublicPersona[]> | null = null;

async function load(): Promise<PublicPersona[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch("/api/personas")
    .then((r) => r.json() as Promise<{ personas: PublicPersona[] }>)
    .then((j) => {
      cache = j.personas;
      return j.personas;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function usePersonas(): PublicPersona[] | null {
  const [personas, setPersonas] = useState<PublicPersona[] | null>(cache);
  useEffect(() => {
    if (cache) {
      setPersonas(cache);
      return;
    }
    void load().then(setPersonas);
  }, []);
  return personas;
}
