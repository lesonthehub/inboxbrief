/**
 * OpenRouter AI Helper
 * Drop-in replacement for the Manus built-in LLM.
 * Uses OpenRouter's OpenAI-compatible API with google/gemini-2.0-flash-001 by default.
 * API key is injected from OPENROUTER_API_KEY environment variable.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export interface ORMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OROResponseFormat {
  type: "json_schema" | "text" | "json_object";
  json_schema?: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
}

export interface OROParams {
  messages: ORMessage[];
  model?: string;
  max_tokens?: number;
  response_format?: OROResponseFormat;
}

export interface OROResult {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Invoke OpenRouter with the given messages and options.
 * Throws on HTTP errors or missing API key.
 */
export async function invokeOpenRouter(params: OROParams): Promise<OROResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const payload: Record<string, unknown> = {
    model: params.model ?? DEFAULT_MODEL,
    messages: params.messages,
    max_tokens: params.max_tokens ?? 1024,
  };

  if (params.response_format) {
    payload.response_format = params.response_format;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://inboxbrief.org",
      "X-Title": "InboxBrief",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  return (await response.json()) as OROResult;
}
