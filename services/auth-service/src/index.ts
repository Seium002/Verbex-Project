import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./lib/db.js";
import { users, apiKeys } from "./modules/auth/schema.js";

const app = new Hono();
app.use("*", cors({ origin: "*" }));

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

async function ensureSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      email text UNIQUE NOT NULL,
      password text NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id uuid PRIMARY KEY,
      user_id uuid UNIQUE NOT NULL,
      key_hash text NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `);
}

ensureSchema().catch((error) => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});

app.post("/auth/signup", async (c) => {
  const body = await c.req.json();
  const { email, password } = body ?? {};
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (existing.length > 0) {
    return c.json({ error: "Email already exists" }, 400);
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, email: normalizedEmail, password: hashed });
  const token = jwt.sign({ userId: id, email: normalizedEmail }, JWT_SECRET, { expiresIn: "7d" });
  return c.json({ data: { token } });
});

app.post("/auth/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body ?? {};
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const normalizedEmail = email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  return c.json({ data: { token } });
});

app.get("/auth/verify", async (c) => {
  const authHeader = c.req.header("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET) as { userId: string; email: string };
    return c.json({ data: { userId: payload.userId, email: payload.email } });
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

app.get("/auth/verify-apikey", async (c) => {
  const rawKey = c.req.header("x-api-key");
  if (!rawKey) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const [record] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
  if (!record) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  return c.json({ data: { userId: record.userId } });
});

serve({ fetch: app.fetch, port: Number(process.env.PORT || 8081) });
