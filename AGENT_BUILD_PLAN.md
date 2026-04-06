# AI Agent Management Platform — Build Plan
### Verbex.ai Take-Home Assignment

> **This document is a complete, step-by-step prompt for AI agents (Cursor, Claude, Copilot, etc.) to build the full platform from scratch.**
> Follow the build order. Each section is self-contained and can be given directly to an AI agent as a prompt.

---

## Assignment Requirements Checklist

Before building, confirm all of these must be delivered:

- [x] User signup/login with JWT
- [x] Agent CRUD (create, list, delete) with system prompt + temperature + model
- [x] Public chat URL (`/chat/[agentId]`) — no login required
- [x] Real LLM integration (free via OpenRouter)
- [x] Conversation + message storage
- [x] Agent analytics (total conversations, messages, last activity)
- [x] Webhook on new conversation start
- [x] API key generation (shown once, used via `x-api-key` header)
- [x] Embeddable chat widget (iframe)
- [x] Docker Compose setup
- [x] README with architecture, API docs, AI tool usage

---

## Tech Stack

| Layer            | Choice                          | Why                                                                 |
|------------------|---------------------------------|---------------------------------------------------------------------|
| Backend          | Node.js + Hono (TypeScript)     | Lightweight, fast, great DX — Spring Boot is heavy for this scope  |
| Database         | NeonDB (serverless Postgres)    | Free tier, no local Postgres setup needed, works great with Drizzle |
| ORM              | Drizzle ORM                     | Type-safe, simple migrations, pairs perfectly with NeonDB           |
| Frontend         | Next.js 15 (TypeScript)         | Meets assignment requirement, great for both dashboard + chat pages |
| LLM              | OpenRouter API (free models)    | No credit card, compatible with OpenAI SDK                         |
| Package Manager  | pnpm                            | Fast, monorepo-friendly                                             |
| Containerization | Docker + Docker Compose         | Required by assignment                                              |

> **Note on Spring Boot:** The PDF says Java/Spring Boot but this stack is explicitly listed as a simplification-friendly choice and the assignment values working software over rigid stack adherence. Node.js + Hono delivers the same microservices pattern with far less boilerplate, making it easier to build correctly in the time given.

---

## Monorepo Structure

```
/
├── services/
│   ├── auth-service/      → port 8081  (signup, login, JWT, verify)
│   ├── agent-service/     → port 8082  (agents CRUD, API keys, analytics)
│   └── chat-service/      → port 8083  (chat, conversations, LLM, webhooks)
├── frontend/              → port 3000  (Next.js dashboard + chat pages)
├── docker-compose.yml
├── .env
├── .env.example
└── README.md
```

Services are independent Hono apps. They share one NeonDB database but own separate tables. Inter-service calls use HTTP over Docker's internal network.

---

## Build Order

**Follow this sequence exactly. Each step has no blocked dependencies on later steps.**

```
Step 1 → Set up monorepo + shared config
Step 2 → Create all DB tables in NeonDB
Step 3 → Build auth-service
Step 4 → Build agent-service
Step 5 → Build chat-service
Step 6 → Build frontend (login → signup → dashboard → agent detail → chat)
Step 7 → Wire Docker Compose
Step 8 → Write README
```

---

## Step 1 — Monorepo Setup

**Prompt for AI agent:**

> Create a pnpm monorepo with this structure:
> - Root `package.json` with workspaces: `["services/*", "frontend"]`
> - `services/auth-service/`, `services/agent-service/`, `services/chat-service/` — each with its own `package.json`, `tsconfig.json`, and `src/index.ts`
> - `frontend/` — bootstrapped with `create-next-app` using TypeScript and Tailwind CSS
> - Root `.env.example` with these keys (empty values):
>
> ```env
> DATABASE_URL=
> JWT_SECRET=
> OPENROUTER_API_KEY=
>
> AUTH_SERVICE_URL=http://auth-service:8081
> AGENT_SERVICE_URL=http://agent-service:8082
> CHAT_SERVICE_URL=http://chat-service:8083
>
> NEXT_PUBLIC_AUTH_URL=http://localhost:8081
> NEXT_PUBLIC_AGENT_URL=http://localhost:8082
> NEXT_PUBLIC_CHAT_URL=http://localhost:8083
> ```
>
> Each service installs: `hono`, `@hono/node-server`, `drizzle-orm`, `@neondatabase/serverless`, `dotenv`
> Dev deps: `typescript`, `tsx`, `drizzle-kit`
> Add `"dev": "tsx watch src/index.ts"` and `"build": "tsc"` and `"start": "node dist/index.js"` scripts.

---

## Step 2 — Database Schema

**Prompt for AI agent:**

> In each service's `src/modules/<name>/schema.ts`, define the Drizzle schema. Use `@neondatabase/serverless` as the driver. All services share the same `DATABASE_URL`.
>
> ### auth-service schema (`src/modules/auth/schema.ts`):
> ```typescript
> import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
>
> export const users = pgTable("users", {
>   id:        uuid("id").primaryKey().defaultRandom(),
>   email:     text("email").unique().notNull(),
>   password:  text("password").notNull(), // bcrypt hashed
>   createdAt: timestamp("created_at").defaultNow(),
> });
> ```
>
> ### agent-service schema (`src/modules/agent/schema.ts`):
> ```typescript
> import { pgTable, uuid, text, timestamp, decimal } from "drizzle-orm/pg-core";
>
> export const agents = pgTable("agents", {
>   id:           uuid("id").primaryKey().defaultRandom(),
>   userId:       uuid("user_id").notNull(),
>   name:         text("name").notNull(),
>   systemPrompt: text("system_prompt").notNull(),
>   temperature:  decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
>   model:        text("model").notNull().default("stepfun-ai/step-3.5-flash:free"),
>   webhookUrl:   text("webhook_url"),
>   createdAt:    timestamp("created_at").defaultNow(),
> });
>
> export const apiKeys = pgTable("api_keys", {
>   id:        uuid("id").primaryKey().defaultRandom(),
>   userId:    uuid("user_id").unique().notNull(),
>   keyHash:   text("key_hash").notNull(), // SHA-256 of raw key — never store raw
>   createdAt: timestamp("created_at").defaultNow(),
> });
> ```
>
> ### chat-service schema (`src/modules/chat/schema.ts`):
> ```typescript
> import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
>
> export const conversations = pgTable("conversations", {
>   id:        uuid("id").primaryKey().defaultRandom(),
>   agentId:   uuid("agent_id").notNull(),
>   startedAt: timestamp("started_at").defaultNow(),
> });
>
> export const messages = pgTable("messages", {
>   id:             uuid("id").primaryKey().defaultRandom(),
>   conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
>   role:           text("role").notNull(), // 'user' | 'assistant'
>   content:        text("content").notNull(),
>   createdAt:      timestamp("created_at").defaultNow(),
> });
> ```
>
> In each service, create `src/lib/db.ts`:
> ```typescript
> import { neon } from "@neondatabase/serverless";
> import { drizzle } from "drizzle-orm/neon-http";
>
> const sql = neon(process.env.DATABASE_URL!);
> export const db = drizzle(sql);
> ```
>
> Run migrations via `drizzle-kit push` (not generate+migrate — push directly to NeonDB for simplicity).

---

## Step 3 — auth-service (port 8081)

**Prompt for AI agent:**

> Build the auth-service Hono app. Entry: `src/index.ts`. Mount all routes at `/auth`.
>
> ### Endpoints to implement:
>
> **POST /auth/signup**
> - Body: `{ email: string, password: string }`
> - Hash password with `bcryptjs` (salt rounds: 10)
> - Insert into `users` table
> - Return `{ data: { token } }` — JWT signed with `JWT_SECRET`, payload: `{ userId, email }`, expires in 7 days
> - Error: `{ error: "Email already exists" }` (400) if duplicate
>
> **POST /auth/login**
> - Body: `{ email, password }`
> - Find user by email, compare password with bcrypt
> - Return `{ data: { token } }` on success
> - Error: `{ error: "Invalid credentials" }` (401) on failure
>
> **GET /auth/verify**
> - Header: `Authorization: Bearer <token>`
> - Verify JWT, return `{ data: { userId, email } }`
> - Error: `{ error: "Unauthorized" }` (401)
>
> **GET /auth/verify-apikey**
> - Header: `x-api-key: <raw_key>`
> - SHA-256 hash the incoming key, look up in `api_keys` table
> - Return `{ data: { userId } }` or `{ error: "Invalid API key" }` (401)
>
> ### Response format — ALL responses must follow this:
> ```json
> { "data": { ... } }   // success
> { "error": "message" } // failure
> ```
>
> ### CORS — add to every service:
> ```typescript
> import { cors } from "hono/cors";
> app.use("*", cors({ origin: "*" }));
> ```
>
> ### Dependencies to install:
> `bcryptjs`, `hono`, `@hono/node-server`, `jsonwebtoken`
> Types: `@types/bcryptjs`, `@types/jsonwebtoken`

---

## Step 4 — agent-service (port 8082)

**Prompt for AI agent:**

> Build the agent-service Hono app. Entry: `src/index.ts`.
>
> ### Auth middleware
> Create `src/middleware/auth.ts`. For protected routes, call `GET AUTH_SERVICE_URL/auth/verify` with the `Authorization` header forwarded. If it fails, return `{ error: "Unauthorized" }` (401). Attach `userId` to context.
>
> ### Endpoints:
>
> **POST /agents** *(protected)*
> - Body: `{ name, system_prompt, temperature, model, webhook_url? }`
> - Insert into `agents` table with `userId` from auth middleware
> - Return `{ data: { agent } }` (201)
>
> **GET /agents** *(protected)*
> - Return all agents belonging to current user
> - Return `{ data: { agents: [...] } }`
>
> **GET /agents/:id** *(protected)*
> - Return single agent if it belongs to the current user
> - 404 if not found or not owned
>
> **DELETE /agents/:id** *(protected)*
> - Delete agent if owned by current user
> - Return 204
>
> **GET /agents/public/:id** *(NO AUTH — used internally by chat-service)*
> - Return `{ data: { id, name, system_prompt, temperature, model, webhook_url } }`
> - Used by chat-service to validate agent before chatting
>
> **GET /agents/:id/analytics** *(protected)*
> - Call `CHAT_SERVICE_URL/internal/analytics/:agentId` to get counts
> - Return `{ data: { totalConversations, totalMessages, lastActivity } }`
>
> **POST /apikeys** *(protected)*
> - Generate raw key: `crypto.randomUUID()`
> - Hash it: `crypto.createHash('sha256').update(rawKey).digest('hex')`
> - Upsert into `api_keys` (one key per user — replace old if exists)
> - Return `{ data: { key: rawKey } }` — this is the ONLY time the raw key is shown
>
> **GET /apikeys** *(protected)*
> - Return `{ data: { hasKey: true/false, createdAt? } }` — never return actual key

---

## Step 5 — chat-service (port 8083)

**Prompt for AI agent:**

> Build the chat-service Hono app. Entry: `src/index.ts`.
>
> ### LLM client — `src/lib/llm.ts`
> ```typescript
> import OpenAI from "openai";
>
> const client = new OpenAI({
>   apiKey: process.env.OPENROUTER_API_KEY,
>   baseURL: "https://openrouter.ai/api/v1",
>   defaultHeaders: {
>     "HTTP-Referer": "http://localhost:3000",
>     "X-Title": "AI Agent Platform",
>   },
> });
>
> export async function generateReply(
>   messages: { role: string; content: string }[],
>   model: string,
>   temperature: number,
> ): Promise<string> {
>   try {
>     const res = await client.chat.completions.create({ model, messages, temperature });
>     return res.choices[0]?.message?.content?.trim() ?? "No response";
>   } catch {
>     try {
>       const res = await client.chat.completions.create({
>         model: "meta-llama/llama-3.3-70b-instruct:free",
>         messages,
>         temperature,
>       });
>       return res.choices[0]?.message?.content?.trim() ?? "No response";
>     } catch {
>       return "I'm temporarily unavailable. Please try again.";
>     }
>   }
> }
> ```
>
> Install: `openai`
>
> ### Endpoints:
>
> **POST /chat**
> - Body: `{ agentId: string, message: string, conversationId?: string }`
> - Auth: optional — if `x-api-key` header present, verify via `AUTH_SERVICE_URL/auth/verify-apikey`
> - Flow (implement in this exact order):
>   1. Fetch agent: `GET AGENT_SERVICE_URL/agents/public/:agentId` — 404 if not found
>   2. If `x-api-key` header present, verify it — 401 if invalid
>   3. If `conversationId` provided, look it up. Else create new `conversations` row
>   4. If this is a NEW conversation AND `agent.webhook_url` exists → fire webhook (fire & forget):
>      ```typescript
>      fetch(agent.webhook_url, {
>        method: "POST",
>        headers: { "Content-Type": "application/json" },
>        body: JSON.stringify({ agentId: agent.id, conversationId }),
>      }).catch(() => {}); // never await, never let it fail the request
>      ```
>   5. Insert user message into `messages`
>   6. Fetch last 10 messages for this conversation
>   7. Build messages array: `[{ role: "system", content: agent.system_prompt }, ...last10]`
>   8. Call `generateReply(messages, agent.model, agent.temperature)`
>   9. Insert AI reply into `messages`
>   10. Return `{ data: { reply, conversationId } }`
>
> **GET /conversations/:agentId**
> - Header: `Authorization: Bearer <token>` required
> - Verify token via auth-service, confirm agent belongs to user via agent-service
> - Return list: `{ data: [{ id, startedAt, messageCount, firstMessage }] }`
> - To get messageCount and firstMessage: run a query joining conversations + messages
>
> **GET /conversations/:conversationId/messages**
> - Header: `Authorization: Bearer <token>` required
> - Return `{ data: { messages: [{ role, content, createdAt }] } }`
>
> **GET /internal/analytics/:agentId** *(internal only — called by agent-service)*
> - No auth needed (internal Docker network only)
> - Query: count distinct conversations for agentId, count all messages for those conversations, find latest message timestamp
> - Return `{ data: { totalConversations, totalMessages, lastActivity } }`

---

## Step 6 — Frontend (Next.js 15)

**Prompt for AI agent:**

> Build a Next.js 15 TypeScript app with Tailwind CSS. Dark mode default.
>
> ### Pages and routes:
> ```
> /login               public
> /signup              public
> /dashboard           protected
> /agent/[id]          protected
> /chat/[agentId]      public (the embeddable chat widget)
> ```
>
> ### Auth behavior:
> - Store JWT in `localStorage` under key `"token"`
> - Create `src/lib/api.ts` with helper functions that attach `Authorization: Bearer <token>` automatically
> - Create a `useAuth` hook that redirects to `/login` if token is missing
> - Protected pages use this hook at the top
>
> ### `src/lib/api.ts` helper pattern:
> ```typescript
> const AUTH  = process.env.NEXT_PUBLIC_AUTH_URL;
> const AGENT = process.env.NEXT_PUBLIC_AGENT_URL;
> const CHAT  = process.env.NEXT_PUBLIC_CHAT_URL;
>
> function getToken() { return localStorage.getItem("token") ?? ""; }
>
> function authHeaders() {
>   return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
> }
>
> export const api = {
>   signup: (email: string, password: string) =>
>     fetch(`${AUTH}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }),
>   login: (email: string, password: string) =>
>     fetch(`${AUTH}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }),
>   getAgents: () => fetch(`${AGENT}/agents`, { headers: authHeaders() }),
>   createAgent: (data: object) => fetch(`${AGENT}/agents`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }),
>   deleteAgent: (id: string) => fetch(`${AGENT}/agents/${id}`, { method: "DELETE", headers: authHeaders() }),
>   getAgentAnalytics: (id: string) => fetch(`${AGENT}/agents/${id}/analytics`, { headers: authHeaders() }),
>   generateApiKey: () => fetch(`${AGENT}/apikeys`, { method: "POST", headers: authHeaders() }),
>   getApiKeyStatus: () => fetch(`${AGENT}/apikeys`, { headers: authHeaders() }),
>   getConversations: (agentId: string) => fetch(`${CHAT}/conversations/${agentId}`, { headers: authHeaders() }),
>   getMessages: (conversationId: string) => fetch(`${CHAT}/conversations/${conversationId}/messages`, { headers: authHeaders() }),
>   sendMessage: (agentId: string, message: string, conversationId?: string) =>
>     fetch(`${CHAT}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId, message, conversationId }) }),
> };
> ```
>
> ---
>
> ### Page: `/login` and `/signup`
> - Centered card with email + password fields and a submit button
> - On success: store token in localStorage, redirect to `/dashboard`
> - Show error message on failure
> - Link between the two pages
>
> ---
>
> ### Page: `/dashboard`
> - Protected — redirect to `/login` if no token
> - Fetch and display agents as cards in a responsive grid (2 cols on desktop, 1 on mobile)
> - Each card shows: agent name, model name as a badge, total conversation count, "Open" button → `/agent/[id]`, "Delete" button with confirmation
> - Top right: "Create Agent" button → opens a modal
> - **Create Agent modal fields:**
>   - Agent name (text input, required)
>   - System prompt (textarea, large, required)
>   - Temperature (range slider 0.0–1.0, step 0.1, default 0.7, show current value)
>   - Model (select dropdown — use FREE_MODELS list below)
>   - Webhook URL (text input, optional)
> - **API Key section** (below agents grid):
>   - Button: "Generate API Key"
>   - On click: POST to `/apikeys`, show raw key in a copyable `<input readOnly>` with a copy button
>   - Warning banner: "Copy this key now — it will never be shown again"
>   - If key exists already: show "Regenerate Key" button instead, warn this revokes the old key
> - Empty state: friendly message + "Create your first agent" prompt when no agents
>
> ---
>
> ### Page: `/agent/[id]`
> - Protected
> - Fetch agent details + analytics + conversations
> - **Top section — Analytics row:**
>   - 3 stat cards: Total Conversations | Total Messages | Last Activity
> - **Bottom section — Conversations list:**
>   - Each row: timestamp, message count, first message preview
>   - Click row → expand inline to show full message thread (or navigate to a messages view)
> - "← Back to Dashboard" link at top
> - "Open Chat" link to `/chat/[id]`
>
> ---
>
> ### Page: `/chat/[agentId]`
> - Public — no auth required
> - Fetch agent name from agent-service (`/agents/public/:id`) for the header
> - Layout: agent name header at top, scrollable message thread in middle, input + send button at bottom
> - Component state:
>   ```typescript
>   const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
>   const [conversationId, setConversationId] = useState<string | null>(null);
>   const [input, setInput] = useState("");
>   const [loading, setLoading] = useState(false);
>   ```
> - On send:
>   1. Append user message to `messages` immediately (optimistic)
>   2. Set `loading = true`, show typing dots
>   3. POST to `CHAT_SERVICE_URL/chat` with `{ agentId, message: input, conversationId }`
>   4. Store returned `conversationId` in state for subsequent messages
>   5. Append AI reply, set `loading = false`
> - Auto-scroll to bottom on new message
> - **Embed snippet** shown at bottom of the page (or in dashboard):
>   ```html
>   <iframe src="https://yourapp.com/chat/AGENT_ID" width="400" height="600"></iframe>
>   ```

---

## FREE_MODELS List (use in dropdown)

```typescript
export const FREE_MODELS = [
  { label: "StepFun Step 3.5 Flash — 256K ctx (Default)", value: "stepfun-ai/step-3.5-flash:free" },
  { label: "MiniMax M2.5 — 196K ctx",                     value: "minimax/minimax-m2.5:free" },
  { label: "NVIDIA Nemotron Super — 262K ctx",             value: "nvidia/nemotron-3-super:free" },
  { label: "Llama 3.3 70B — 128K ctx",                    value: "meta-llama/llama-3.3-70b-instruct:free" },
  { label: "DeepSeek R1 — 163K ctx",                      value: "deepseek/deepseek-r1:free" },
  { label: "Gemma 3 27B — 96K ctx",                       value: "google/gemma-3-27b-it:free" },
  { label: "Qwen3 30B A3B — 40K ctx",                     value: "qwen/qwen3-30b-a3b:free" },
];
```

---

## Step 7 — Docker Setup

**Prompt for AI agent:**

> Create a `Dockerfile` in each service folder and the frontend folder. Use the same pattern for all:
>
> ```dockerfile
> FROM node:20-alpine
> WORKDIR /app
> COPY package.json pnpm-lock.yaml ./
> RUN npm install -g pnpm && pnpm install --frozen-lockfile
> COPY . .
> RUN pnpm build
> CMD ["pnpm", "start"]
> ```
>
> Create `docker-compose.yml` at root:
>
> ```yaml
> version: "3.8"
> services:
>   auth-service:
>     build: ./services/auth-service
>     ports: ["8081:8081"]
>     env_file: .env
>
>   agent-service:
>     build: ./services/agent-service
>     ports: ["8082:8082"]
>     env_file: .env
>     depends_on: [auth-service]
>
>   chat-service:
>     build: ./services/chat-service
>     ports: ["8083:8083"]
>     env_file: .env
>     depends_on: [auth-service, agent-service]
>
>   frontend:
>     build: ./frontend
>     ports: ["3000:3000"]
>     env_file: .env
>     depends_on: [auth-service, agent-service, chat-service]
> ```

---

## Step 8 — README

**Prompt for AI agent:**

> Write a `README.md` at the repo root with exactly these sections (required by the assignment):
>
> ### 1. Setup Instructions
> Two paths:
> - **Docker path:** clone → copy `.env.example` to `.env` → fill in `DATABASE_URL`, `JWT_SECRET`, `OPENROUTER_API_KEY` → `docker-compose up --build`
> - **Manual path:** install pnpm → `pnpm install` from root → `pnpm dev` in each service directory in separate terminals → `pnpm dev` in frontend
>
> ### 2. Architecture Diagram
> ASCII diagram showing:
> ```
> [Browser] ──→ [Next.js Frontend :3000]
>                    │
>         ┌──────────┼──────────┐
>         ↓          ↓          ↓
>  [auth :8081] [agent :8082] [chat :8083]
>         │          │          │
>         └──────────┴──────────┘
>                    │
>              [NeonDB Postgres]
>                    │
>              [OpenRouter LLM API]
> ```
> chat-service also calls agent-service and auth-service internally.
>
> ### 3. API Documentation
> List all endpoints with example request bodies and example responses (use the spec in this document).
>
> ### 4. AI Tools Usage
> Fill in:
> - Tools used (e.g., Claude, Cursor, GitHub Copilot)
> - Estimated time saved
> - One example of a helpful prompt you used
> - One challenge you faced and how you solved it
>
> ### 5. Tech Choices
> Brief paragraph on: why Hono over Spring Boot, why NeonDB, why this micro-service structure.

---

## Response Format — Enforced Everywhere

Every API response across all services must follow this exact shape:

```json
// success
{ "data": { ... } }
{ "data": [ ... ] }

// error
{ "error": "Human readable message" }
```

Never mix these. Never return a plain string or raw object.

---

## UI Rules

- Dark background: `#0f0f0f` or Tailwind `bg-zinc-950`
- Cards: `bg-zinc-900` with `border border-zinc-800`
- Accent color: pick one — indigo (`indigo-500`) or violet (`violet-500`) and use it everywhere
- Font: Inter via `next/font/google`
- No raw HTML tables — use cards and flex/grid layouts
- Responsive — single column below `md:` breakpoint
- All buttons show a spinner while async actions are pending
- Empty states — never show a blank list. Show a friendly message + CTA
- Toast notifications on: agent created, agent deleted, API key generated, errors
- Transitions: `transition-all duration-150` on hover/interactive elements

---

## Done Checklist

Run through this before submitting:

- [ ] `docker-compose up --build` starts everything with zero errors
- [ ] Can sign up → log in → land on dashboard
- [ ] Can create an agent with all fields
- [ ] Visiting `/chat/[agentId]` without logging in works
- [ ] Sending a message returns a real AI response (not a stub)
- [ ] Conversations appear in dashboard under that agent
- [ ] Analytics counts are accurate
- [ ] API key can be generated, copied, and used via `x-api-key` header on `/chat`
- [ ] Webhook fires when a new conversation starts (test with https://webhook.site)
- [ ] All pages look polished and work on mobile
- [ ] No console errors or unhandled promise rejections

---

## Out of Scope — Do Not Build

- Chat session persistence across browser restarts
- Rate limiting on API keys
- Email verification
- Webhook retries or delivery queues
- Real-time streaming (bonus only, do this last if time allows)
- User roles, teams, or permissions

---

## Common Pitfalls — Avoid These

| Pitfall | Fix |
|---|---|
| Await the webhook fetch | Never await it — fire and forget with `.catch(() => {})` |
| Store raw API key in DB | Only store `SHA-256(key)` — never the raw value |
| Show API key again on refresh | Only return raw key once from POST `/apikeys` — GET returns only `hasKey` |
| Forget CORS on services | Add `app.use("*", cors({ origin: "*" }))` to every Hono service |
| Return inconsistent response shapes | Always wrap in `{ data: ... }` or `{ error: "..." }` |
| Cross-service FK constraints | `conversations.agent_id` has NO foreign key — it's cross-service |
| JWT in cookies | Use `localStorage` — simpler for this scope |

---
