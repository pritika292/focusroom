import { vi, beforeAll } from "vitest";

// Set env BEFORE any module that imports config.ts loads. Vitest
// setupFiles run before the test file body, so this is safe as long as
// no top-level import of config.ts happens above this file (it doesn't).
process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "3016";
process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4.1-mini-test";
process.env.AZURE_OPENAI_ENDPOINT = "https://test.example.invalid";
process.env.FOCUSROOM_CONTENT_SAFETY_ENDPOINT = "https://test-cs.example.invalid";
process.env.FOCUSROOM_DAILY_BUDGET_USD = process.env.FOCUSROOM_DAILY_BUDGET_USD ?? "2";
process.env.FOCUSROOM_IP_DENYLIST = process.env.FOCUSROOM_IP_DENYLIST ?? "9.9.9.9";
// Integration tests need a real Postgres. CI sets DATABASE_URL via the
// services block; locally a developer points it at their own pg.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://focusroom:testpass@localhost:5432/focusroom_test";

// Default LLM mock: returns a short deterministic reply with low token
// counts. Tests can override per-call via aiMock.setResponse below.
type ChatFn = (
  system: string,
  user: string,
) => Promise<{
  text: string;
  tokensIn: number;
  tokensOut: number;
}>;

let nextResponse: { text: string; tokensIn: number; tokensOut: number } | undefined;
let throwNext: Error | undefined;

export const aiMock = {
  setResponse(r: { text: string; tokensIn?: number; tokensOut?: number }) {
    nextResponse = { text: r.text, tokensIn: r.tokensIn ?? 50, tokensOut: r.tokensOut ?? 25 };
  },
  throwNext(err: Error) {
    throwNext = err;
  },
  reset() {
    nextResponse = undefined;
    throwNext = undefined;
  },
};

vi.mock("../src/server/services/ai.js", () => {
  const chat: ChatFn = async (_system, _user) => {
    if (throwNext) {
      const e = throwNext;
      throwNext = undefined;
      throw e;
    }
    const r = nextResponse ?? { text: "mocked reply.", tokensIn: 50, tokensOut: 25 };
    nextResponse = undefined;
    return r;
  };
  return { chat };
});

// Default Prompt Shield mock: allows everything. Per-test override via
// shieldMock.setAttackDetected(true).
let shieldDetected = false;

export const shieldMock = {
  setAttackDetected(v: boolean) {
    shieldDetected = v;
  },
  reset() {
    shieldDetected = false;
  },
};

vi.mock("../src/server/services/promptShield.js", () => {
  return {
    shieldPrompt: async (_prompt: string) => ({ attackDetected: shieldDetected }),
  };
});

beforeAll(() => {
  // Quiet down console noise from the orchestrator during tests. Real
  // failures still surface via the test framework.
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
