import { Context, Next } from "hono";

const authUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:8081";

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const res = await fetch(`${authUrl}/auth/verify`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = await res.json();
  const userId = payload?.data?.userId;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
}
