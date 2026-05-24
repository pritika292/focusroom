import { useEffect } from "react";

// Fire-and-forget landing-page visit beacon. Sent once per page mount to
// controlroom's /api/visit/<slug> endpoint via navigator.sendBeacon so it
// survives page unload, doesn't block paint, and never breaks the page
// when the endpoint is missing or returns an error.
//
// Privacy: empty body. controlroom hashes the source IP server-side with
// a daily-rotating salt; no cookies, no fingerprinting.
//
// See controlroom#87 for the receiving pipeline.

const BEACON_URL = "https://controlroom.pritika.studio/api/visit/focusroom";

export function useVisitBeacon(): void {
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
    try {
      navigator.sendBeacon(BEACON_URL);
    } catch {
      // Telemetry must never break the page.
    }
  }, []);
}
