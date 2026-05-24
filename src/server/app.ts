import express, { type Express } from "express";
import helmet from "helmet";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { simulationsRouter } from "./routes/simulations.js";
import { streamRouter } from "./routes/stream.js";
import { transcriptsRouter } from "./routes/transcripts.js";
import { personasRouter } from "./routes/personas.js";

const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client");

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", true);
  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "img-src": ["'self'", "data:"],
          // controlroom is allowed for the family-wide visit beacon
          // (lib/visitBeacon.ts fires sendBeacon on landing-page mount).
          "connect-src": ["'self'", "https://controlroom.pritika.studio"],
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "font-src": ["'self'"],
        },
      },
      strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true, preload: false },
    }),
  );

  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "focusroom" });
  });

  app.use(personasRouter);
  app.use(simulationsRouter);
  app.use(streamRouter);
  app.use(transcriptsRouter);

  const indexHtml = path.join(CLIENT_DIST, "index.html");
  if (existsSync(indexHtml)) {
    app.use(
      "/assets",
      express.static(path.join(CLIENT_DIST, "assets"), { immutable: true, maxAge: "1y" }),
    );
    app.use(express.static(CLIENT_DIST, { index: false }));
    app.get("/", (_req, res) => {
      res.sendFile(indexHtml);
    });
  }

  return app;
}
