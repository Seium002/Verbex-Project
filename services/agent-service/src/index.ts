import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import crypto from "crypto";
import { db } from "./lib/db";
import { agents, apiKeys } from "./modules/agent/schema";
import { requireAuth } from "./middleware/auth";
import { and, eq, inArray } from "drizzle-orm";

const app = new Hono();
app.use("*", cors({ origin: "*" }));

const authBase = process.env.AUTH_SERVICE_URL || "http://auth-service:8081";
const chatBase = process.env.CHAT_SERVICE_URL || "http://chat-service:8083";

app.post("/agents", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json();

  const { name, system_prompt, temperature = 0.7, model, webhook_url = "" } = body ?? {};
  if (!name || !system_prompt || !model) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await db.insert(agents).values({
      id,
      userId,
      name,
      systemPrompt: system_prompt,
      temperature: temperature.toString(),
      model,
      webhookUrl: webhook_url,
    });
  } catch (error) {
    console.error("Create agent failed", error);
    return c.json(
      {
        error: `Unable to create agent${error instanceof Error ? `: ${error.message}` : ""}`,
      },
      500,
    );
  }

  return c.json({ data: { agent: { id, userId, name, system_prompt, temperature, model, webhook_url } } }, 201);
});

app.get("/agents", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const rows = await db.select().from(agents).where(eq(agents.userId, userId));
  return c.json({ data: { agents: rows } });
});

app.get("/agents/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Agent not found" }, 404);
  }
  const rows = await db.select().from(agents).where(and(eq(agents.id, id), eq(agents.userId, userId)));
  const agent = rows[0];
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }
  return c.json({ data: { agent } });
});

app.delete("/agents/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Agent not found" }, 404);
  }
  const rows = await db.select().from(agents).where(and(eq(agents.id, id), eq(agents.userId, userId)));
  if (rows.length === 0) {
    return c.json({ error: "Agent not found" }, 404);
  }
  await db.delete(agents).where(eq(agents.id, id));
  return new Response("", { status: 204 });
});

app.get("/agents/public/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(agents).where(eq(agents.id, id));
  const agent = rows[0];
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }
  return c.json({ data: { id: agent.id, name: agent.name, system_prompt: agent.systemPrompt, temperature: Number(agent.temperature), model: agent.model, webhook_url: agent.webhookUrl } });
});

app.get("/agents/:id/analytics", requireAuth, async (c) => {
  const id = c.req.param("id");
  const res = await fetch(`${chatBase}/internal/analytics/${id}`);
  if (!res.ok) {
    return c.json({ error: "Unable to fetch analytics" }, 500);
  }
  const payload = await res.json();
  return c.json({ data: payload.data });
});

app.post("/apikeys", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const rawKey = crypto.randomUUID();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
  await db.insert(apiKeys).values({ id: crypto.randomUUID(), userId, keyHash });
  return c.json({ data: { key: rawKey } });
});

app.get("/apikeys", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  const key = rows[0];
  return c.json({ data: { hasKey: Boolean(key), createdAt: key?.createdAt ?? null } });
});

serve({ fetch: app.fetch, port: Number(process.env.PORT || 8082) });
