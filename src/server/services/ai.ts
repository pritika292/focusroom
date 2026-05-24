import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";
import { config } from "../config.js";
import { reportAiUsage } from "./aiUsageEmit.js";

export interface ChatResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

const SCOPE = "https://cognitiveservices.azure.com/.default";
const API_VERSION = "2024-10-21";
const CALL_TIMEOUT_MS = 60_000;

let client: AzureOpenAI | undefined;

function getClient(): AzureOpenAI {
  if (!client) {
    if (!config.AZURE_OPENAI_ENDPOINT) {
      throw new Error("AZURE_OPENAI_ENDPOINT not set");
    }
    const credential = new DefaultAzureCredential();
    const tokenProvider = getBearerTokenProvider(credential, SCOPE);
    client = new AzureOpenAI({
      endpoint: config.AZURE_OPENAI_ENDPOINT,
      azureADTokenProvider: tokenProvider,
      deployment: config.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: API_VERSION,
    });
  }
  return client;
}

/**
 * Sends a system + user pair to the deployed model and returns the reply
 * plus token usage. Hard 60-second timeout. Single retry on 429 with a
 * 2-second backoff. All other errors bubble.
 */
export async function chat(systemPrompt: string, userMessage: string): Promise<ChatResult> {
  return doChat(systemPrompt, userMessage, /*retried*/ false);
}

async function doChat(
  systemPrompt: string,
  userMessage: string,
  retried: boolean,
): Promise<ChatResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CALL_TIMEOUT_MS);
  try {
    const c = getClient();
    const res = await c.chat.completions.create(
      {
        model: config.AZURE_OPENAI_DEPLOYMENT,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 250,
        temperature: 0.85,
      },
      { signal: ac.signal },
    );
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    const tokensIn = res.usage?.prompt_tokens ?? 0;
    const tokensOut = res.usage?.completion_tokens ?? 0;
    // Report to controlroom for the cross-family dashboard tiles.
    // Fire-and-forget; never blocks the caller.
    reportAiUsage(config.AZURE_OPENAI_DEPLOYMENT, tokensIn, tokensOut);
    return { text, tokensIn, tokensOut };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 429 && !retried) {
      await sleep(2_000);
      return doChat(systemPrompt, userMessage, true);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
