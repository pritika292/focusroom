import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// All server-side tests run in node env, in a single forked pool so the
// integration tests can share one Postgres connection/schema without
// stepping on each other. Setup file primes the environment, mocks the
// Azure clients, and wires up DB lifecycle for the integration suite.
export default defineConfig({
  root: rootDir,
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.server.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
