const AUTH = process.env.NEXT_PUBLIC_AUTH_URL;
const AGENT = process.env.NEXT_PUBLIC_AGENT_URL;
const CHAT = process.env.NEXT_PUBLIC_CHAT_URL;

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") ?? "";
}

function authHeaders() {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export const api = {
  signup: (email: string, password: string) =>
    fetch(`${AUTH}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    fetch(`${AUTH}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  getAgents: () => fetch(`${AGENT}/agents`, { headers: authHeaders() }),
  createAgent: (data: object) =>
    fetch(`${AGENT}/agents`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deleteAgent: (id: string) =>
    fetch(`${AGENT}/agents/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
  getAgentAnalytics: (id: string) =>
    fetch(`${AGENT}/agents/${id}/analytics`, { headers: authHeaders() }),
  generateApiKey: () =>
    fetch(`${AGENT}/apikeys`, {
      method: "POST",
      headers: authHeaders(),
    }),
  getApiKeyStatus: () => fetch(`${AGENT}/apikeys`, { headers: authHeaders() }),
  getAgentDetails: (id: string) => fetch(`${AGENT}/agents/${id}`, { headers: authHeaders() }),
  getAgentPublic: (id: string) => fetch(`${AGENT}/agents/public/${id}`),
  getConversations: (agentId: string) =>
    fetch(`${CHAT}/conversations/${agentId}`, { headers: authHeaders() }),
  getMessages: (conversationId: string) =>
    fetch(`${CHAT}/conversations/${conversationId}/messages`, { headers: authHeaders() }),
  sendMessage: (agentId: string, message: string, conversationId?: string) =>
    fetch(`${CHAT}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, message, conversationId }),
    }),
  parseJson,
};
