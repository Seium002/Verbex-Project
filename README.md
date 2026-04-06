# 🚀 AI Agent Management Platform

A full-stack SaaS platform where users can create, manage, and deploy AI chatbot agents with public chat interfaces.

> Built for the Verbex.ai Full Stack Engineer Take-Home Assignment.

---

## 📌 Features

### 🔐 Authentication
- User signup & login
- JWT-based authentication
- Protected dashboard routes

### 🤖 AI Agent Management
- Create agents with:
  - Name
  - System prompt
  - Temperature
  - Model selection
- View all agents
- Delete agents
- Each agent has a public chat URL

### 💬 Public Chat Interface
- Accessible via `/chat/[agentId]`
- No authentication required
- Real AI responses using OpenRouter
- Message history display

### 🗂️ Conversation History
- All conversations stored in database
- View conversations per agent
- Includes:
  - Timestamp
  - Message count
  - First message preview

### 📊 Analytics
- Total conversations
- Total messages
- Last activity timestamp

### 🔗 Webhook Support
- Triggered when conversation starts
- Sends:
{
  "agentId": "...",
  "conversationId": "..."
}

### 🔑 API Keys
- One API key per user
- Shown only once
- Used via header:
x-api-key: YOUR_KEY

### 🌐 Embeddable Chat Widget
<iframe src="https://yourapp.com/chat/AGENT_ID" width="400" height="600"></iframe>

---

## 🧰 Tech Stack

| Layer | Tech |
|------|------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Node.js + Hono (Microservices) |
| Database | NeonDB (PostgreSQL) |
| ORM | Drizzle ORM |
| AI | OpenRouter API |
| Package Manager | pnpm |
| Containerization | Docker + Docker Compose |

---

## 🏗️ Architecture

```
                ┌───────────────────────────┐
                │        Browser (User)     │
                └────────────┬──────────────┘
                             │
                             ▼
                ┌───────────────────────────┐
                │   Next.js Frontend (3000) │
                └────────────┬──────────────┘
                             │
        ┌───────────────┬────┴─────┬───────────────┐
        ▼               ▼          ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Service │ │ Agent Service│ │ Chat Service │
│   (8081)     │ │   (8082)     │ │   (8083)     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └──────────┬─────┴─────┬──────────┘
                  ▼           ▼
        ┌───────────────────────────┐
        │   PostgreSQL (NeonDB)     │
        └────────────┬──────────────┘
                     ▼
        ┌───────────────────────────┐
        │   OpenRouter LLM API      │
        └───────────────────────────┘
```

### 🔁 Flow Overview

1. User interacts with **Next.js frontend**
2. Frontend calls backend services:
   - Auth Service → login/signup
   - Agent Service → manage agents
   - Chat Service → handle chat
3. Chat Service:
   - Fetches agent config
   - Calls OpenRouter API
   - Stores messages in database
4. All services use **PostgreSQL (NeonDB)**


## 📂 Project Structure

```
.
├── services/
│   ├── auth-service/        # Authentication (JWT, signup, login)
│   ├── agent-service/       # Agent CRUD, API keys, analytics
│   └── chat-service/        # Chat, conversations, LLM, webhooks
│
├── frontend/                # Next.js app (dashboard + chat UI)
│
├── docker-compose.yml       # Runs all services
├── .env.example             # Environment variables template
├── AGENT_BUILD_PLAN.md      # AI build instructions
└── README.md                # Project documentation
```

### 🧩 Structure Explanation

- **services/** → Contains all backend microservices  
- **auth-service/** → Handles authentication and JWT  
- **agent-service/** → Manages chatbot agents  
- **chat-service/** → Handles chat logic and AI integration  
- **frontend/** → User interface (dashboard + public chat)  
- **docker-compose.yml** → Runs everything together  
- **.env.example** → Required environment variables  


## ⚙️ Setup Instructions

Run:

docker-compose up --build  

---

### 🔹 Manual Setup

pnpm install  

cd services/auth-service && pnpm dev  
cd services/agent-service && pnpm dev  
cd services/chat-service && pnpm dev  
cd frontend && pnpm dev  

---

## 🔌 API Overview

### Auth Service
POST /auth/signup  
POST /auth/login  
GET /auth/verify  
GET /auth/verify-apikey  

### Agent Service
POST /agents  
GET /agents  
GET /agents/:id  
DELETE /agents/:id  
GET /agents/public/:id  
GET /agents/:id/analytics  
POST /apikeys  
GET /apikeys  

### Chat Service
POST /chat  
GET /conversations/:agentId  
GET /conversations/:conversationId/messages  
GET /internal/analytics/:agentId  

---

## 🔄 Example Chat Request

POST /chat
{
  "agentId": "123",
  "message": "Hello"
}

Response:
{
  "data": {
    "reply": "Hi! How can I help you?",
    "conversationId": "abc"
  }
}

---

## 🤖 AI Tools Usage

Tools:
- ChatGPT
- Cursor
- GitHub Copilot

Estimated time saved: ~60%

Example prompt:
"Build a Hono microservice with JWT authentication and PostgreSQL using Drizzle ORM"

Challenge:
Managing communication between services

Solution:
Clear API structure + consistent response format

---

## 🧠 Design Decisions

Why Hono?
- Lightweight
- Fast development
- Less boilerplate

Why NeonDB?
- No setup needed
- Free tier
- Easy scaling

Why Microservices?
- Matches assignment
- Better architecture separation

---

## ✅ Completion Checklist

- Authentication works  
- Agents created  
- Public chat works  
- AI responses working  
- Conversations stored  
- Analytics working  
- Webhook fires  
- API key works  
- Docker runs  

---

## ⚠️ Limitations

- No rate limiting  
- No email verification  
- No streaming responses  

---

## 🚀 Future Improvements

- Streaming responses  
- Better UI/UX  
- Rate limiting  
- Multi-user system  

---

## 🙌 Final Note

Working software > perfect software
