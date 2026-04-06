import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import crypto from "crypto";
import { db } from "./lib/db";
import { conversations, messages } from "./modules/chat/schema";
import { generateReply, type ChatMessage } from "./lib/llm";
import { eq, inArray, desc } from "drizzle-orm";

const app = new Hono();
app.use("*", cors({ origin: "*" }));

const authBase = process.env.AUTH_SERVICE_URL || "http://auth-service:8081";
const agentBase = process.env.AGENT_SERVICE_URL || "http://agent-service:8082";

app.post("/chat", async (c) => {
  const body = await c.req.json();
  const { agentId, message, conversationId: providedConversationId } = body ?? {};
  if (!agentId || !message) {
    return c.json({ error: "agentId and message are required" }, 400);
  }

  const agentRes = await fetch(`${agentBase}/agents/public/${agentId}`);
  if (!agentRes.ok) {
    return c.json({ error: "Agent not found" }, 404);
  }

  const agentPayload = await agentRes.json();
  const agent = agentPayload?.data;
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  const apiKey = c.req.header("x-api-key");
  if (apiKey) {
    const keyRes = await fetch(`${authBase}/auth/verify-apikey`, {
      headers: { "x-api-key": apiKey },
    });
    if (!keyRes.ok) {
      return c.json({ error: "Invalid API key" }, 401);
    }
  }

  let conversationId = providedConversationId;
  const isNewConversation = !conversationId;
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await db.insert(conversations).values({ id: conversationId, agentId });
  }

  if (isNewConversation && agent.webhook_url) {
    fetch(agent.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agent.id, conversationId }),
    }).catch(() => {});
  }

  await db.insert(messages).values({
    id: crypto.randomUUID(),
    conversationId,
    role: "user",
    content: message,
  });

  const lastRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  const history: ChatMessage[] = lastRows.reverse().map((row) => ({
    role: row.role as ChatMessage["role"],
    content: row.content,
  }));
  const promptMessages: ChatMessage[] = [
    { role: "system", content: agent.system_prompt ?? "" },
    ...history,
  ];

  let reply: string;
  try {
    reply = await generateReply(promptMessages, agent.model, Number(agent.temperature));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chat route LLM failure:", message);
    return c.json({ error: message }, 502);
  }

  await db.insert(messages).values({
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: reply,
  });

  return c.json({ data: { reply, conversationId } });
});

app.get("/conversations/:agentId", async (c) => {
  const authHeader = c.req.header("authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const authRes = await fetch(`${authBase}/auth/verify`, {
    headers: { Authorization: authHeader },
  });
  if (!authRes.ok) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const agentId = c.req.param("agentId");
  const agentRes = await fetch(`${agentBase}/agents/${agentId}`, {
    headers: { Authorization: authHeader },
  });
  if (!agentRes.ok) {
    return c.json({ error: "Agent not found" }, 404);
  }

  const rows = await db.select().from(conversations).where(eq(conversations.agentId, agentId));
  const conversationsWithData = await Promise.all(
    rows.map(async (conversation) => {
      const messageRows = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(messages.createdAt)
        .limit(1);
      const countRows = await db.select().from(messages).where(eq(messages.conversationId, conversation.id));
      return {
        id: conversation.id,
        startedAt: conversation.startedAt,
        messageCount: countRows.length,
        firstMessage: messageRows[0]?.content || "",
      };
    }),
  );

  return c.json({ data: conversationsWithData });
});

app.get("/conversations/:conversationId/messages", async (c) => {
  const authHeader = c.req.header("authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const authRes = await fetch(`${authBase}/auth/verify`, {
    headers: { Authorization: authHeader },
  });
  if (!authRes.ok) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const conversationId = c.req.param("conversationId");
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return c.json({ data: { messages: rows } });
});

app.get("/internal/analytics/:agentId", async (c) => {
  const agentId = c.req.param("agentId");
  const convRows = await db.select().from(conversations).where(eq(conversations.agentId, agentId));
  const totalConversations = convRows.length;

  const conversationIds = convRows.map((row) => row.id);
  const messageRows = conversationIds.length
    ? await db.select().from(messages).where(inArray(messages.conversationId, conversationIds))
    : [];

  const totalMessages = messageRows.length;
  const lastActivity = messageRows
    .map((row) => row.createdAt)
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return c.json({ data: { totalConversations, totalMessages, lastActivity } });
});

serve({ fetch: app.fetch, port: Number(process.env.PORT || 8083) });
