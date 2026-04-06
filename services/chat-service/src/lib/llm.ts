import OpenAI from "openai";

const keysStr = process.env.OPENROUTER_API_KEY || "";
const apiKeys = keysStr.split(",").map((k) => k.trim()).filter(Boolean);

const keyMapStr = process.env.OPENROUTER_API_KEY_MAP || "";
const apiKeyMap = new Map<string, string[]>();
const providerKeyIndexes = new Map<string, number>();
let currentKeyIndex = 0;

function parseProviderKeyMap(value: string) {
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [provider, keys] = entry.split(":", 2).map((part) => part.trim());
      if (!provider || !keys) {
        return;
      }
      const parsedKeys = keys
        .split(/\||;/)
        .map((key) => key.trim())
        .filter(Boolean);
      if (parsedKeys.length > 0) {
        apiKeyMap.set(provider, parsedKeys);
      }
    });
}

parseProviderKeyMap(keyMapStr);

function getProviderFromModel(model: string) {
  const provider = model.split("/")[0]?.trim();
  return provider || "";
}

function getApiKeyForModel(model: string) {
  const provider = getProviderFromModel(model);
  const providerKeys = apiKeyMap.get(provider);
  let key = "";
  
  if (providerKeys && providerKeys.length > 0) {
    const index = providerKeyIndexes.get(provider) ?? 0;
    providerKeyIndexes.set(provider, (index + 1) % providerKeys.length);
    key = providerKeys[index];
  } else if (apiKeys.length > 0) {
    key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  }

  if (!key || !key.startsWith("sk-or-")) {
    for (const keys of apiKeyMap.values()) {
      const valid = keys.find(k => k.startsWith("sk-or-"));
      if (valid) return valid;
    }
  }

  return key;
}

function createClient(model: string) {
  const apiKey = getApiKeyForModel(model);
  const provider = getProviderFromModel(model);
  if (!apiKey) {
    throw new Error(
      `Missing OpenRouter API key for provider '${provider}'. Add a key for this provider in OPENROUTER_API_KEY_MAP, e.g. '${provider}:sk-or-v1-...'`,
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Agent Platform",
    },
  });
}

function normalizeModel(model: string) {
  let normalized = model.trim();
  
  // Enforce free tier usage to avoid 402 Insufficient credits
  const legacyModelMap = new Map<string, string>([
    ["openai/gpt-5.4", "openrouter/free"],
    ["qwen/qwen3.6-plus-preview:free", "openrouter/free"],
    ["perplexity/embed-v1.0.6b", "openrouter/free"],
    ["minimax/minimax-m2.5:free", "openrouter/free"],
    ["openai/gpt-3.5-turbo", "openrouter/free"],
    ["qwen/qwen-2.5-72b-instruct", "openrouter/free"],
    ["qwen/qwen-plus", "openrouter/free"],
    ["perplexity/sonar-pro-search", "openrouter/free"],
    ["qwen/qwen-2.5-72b-instruct:free", "openrouter/free"],
    ["perplexity/llama-3.1-sonar-small-128k-chat", "openrouter/free"]
  ]);

  return legacyModelMap.get(normalized) ?? normalized;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateReply(
  messages: ChatMessage[],
  model: string,
  temperature: number,
): Promise<string> {
  const normalizedModel = normalizeModel(model);
  try {
    const client = createClient(normalizedModel);
    const res = await client.chat.completions.create({ model: normalizedModel, messages, temperature });
    return res.choices?.[0]?.message?.content?.trim() ?? "No response";
  } catch (error) {
    console.error("LLM error for model:", normalizedModel, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}
