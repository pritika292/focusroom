import { DefaultAzureCredential } from "@azure/identity";
import { config } from "../config.js";

// The @azure-rest/ai-content-safety SDK at v1.0.1 only types /text:analyze
// and the blocklist routes. Prompt Shields lives at /text:shieldPrompt and
// is reachable via direct REST. We auth with a bearer token from the same
// DefaultAzureCredential chain the @azure/openai client uses, so the auth
// story stays uniform.

export interface ShieldResult {
  attackDetected: boolean;
}

const SCOPE = "https://cognitiveservices.azure.com/.default";
const API_VERSION = "2024-09-01";
const CALL_TIMEOUT_MS = 5_000;

const credential = new DefaultAzureCredential();

interface ShieldResponse {
  userPromptAnalysis?: { attackDetected?: boolean };
  documentsAnalysis?: { attackDetected?: boolean }[];
}

/**
 * Runs Azure AI Content Safety Prompt Shields on the visitor prompt.
 * Returns `attackDetected: true` if Microsoft's classifier flags any
 * direct user-prompt attack category (jailbreak, role-play override,
 * encoding tricks, conversation-mockup injection, etc.).
 *
 * Fails SAFE on any error: timeout, 5xx, network drop, JSON parse issue
 * all return `attackDetected: true`. Better a false positive than a
 * silent bypass.
 */
export async function shieldPrompt(prompt: string): Promise<ShieldResult> {
  if (!config.FOCUSROOM_CONTENT_SAFETY_ENDPOINT) {
    console.warn("[promptShield] FOCUSROOM_CONTENT_SAFETY_ENDPOINT not set, failing safe");
    return { attackDetected: true };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CALL_TIMEOUT_MS);
  try {
    const tokenResp = await credential.getToken(SCOPE);
    if (!tokenResp) {
      console.warn("[promptShield] no token from DefaultAzureCredential");
      return { attackDetected: true };
    }

    const base = config.FOCUSROOM_CONTENT_SAFETY_ENDPOINT.replace(/\/$/, "");
    const url = `${base}/contentsafety/text:shieldPrompt?api-version=${API_VERSION}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResp.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userPrompt: prompt, documents: [] }),
      signal: ac.signal,
    });

    if (!res.ok) {
      console.warn(`[promptShield] non-2xx status: ${res.status}`);
      return { attackDetected: true };
    }

    const json = (await res.json()) as ShieldResponse;
    const flagged = json.userPromptAnalysis?.attackDetected === true;
    return { attackDetected: flagged };
  } catch (err) {
    console.warn(`[promptShield] call failed, failing safe: ${(err as Error).message}`);
    return { attackDetected: true };
  } finally {
    clearTimeout(timer);
  }
}
