import express, { type Express } from "express";
import helmet from "helmet";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
          "connect-src": ["'self'"],
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
