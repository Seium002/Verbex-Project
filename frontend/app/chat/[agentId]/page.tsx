"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function PublicChatPage() {
  const params = useParams() as { agentId?: string };
  const agentId = params.agentId ?? "";
  const [agentName, setAgentName] = useState("Agent Chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      const res = await api.getAgentPublic(agentId);
      const payload = await api.parseJson(res);
      if (res.ok && payload?.data?.name) {
        setAgentName(payload.data.name);
      }
    }
    loadAgent();
  }, [agentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setLoading(true);
    setIsTyping(true);
    setInput("");

    const res = await api.sendMessage(agentId, input, conversationId ?? undefined);
    const payload = await api.parseJson(res);

    if (res.ok && payload?.data?.reply) {
      setConversationId(payload.data.conversationId ?? conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: payload.data.reply } as ChatMessage]);
    } else {
      const error = payload?.error || "Unable to send message";
      setMessages((prev) => [...prev, { role: "assistant", content: error } as ChatMessage]);
    }

    setIsTyping(false);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[2rem] border border-slate-700/50 bg-slate-800/90 p-8 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <h1 className="text-4xl font-bold text-white">{agentName}</h1>
          <p className="mt-2 text-slate-300">Public chat widget for this agent. No login required.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400">Conversation</p>
              <p className="mt-1 text-lg font-semibold text-white">{conversationId ? "Live" : "New"}</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400">Messages</p>
              <p className="mt-1 text-lg font-semibold text-white">{messages.length}</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400">Status</p>
              <p className="mt-1 text-lg font-semibold text-white">{loading ? "Thinking..." : "Ready"}</p>
            </div>
          </div>
        </div>
        <div className="animate-fade-in-up rounded-[2rem] border border-slate-700/50 bg-slate-800/80 p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)] backdrop-blur-lg">
          <div className="min-h-[256px] max-h-[480px] overflow-y-auto p-2">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-slate-600 bg-slate-700/40 p-6 text-slate-300 text-center backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-indigo-500/20 p-3 border border-indigo-400/30">
                  <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p>Start the conversation by sending the first message.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`animate-pop-in flex flex-col gap-1 rounded-2xl p-4 transition duration-300 ${
                    message.role === "user"
                      ? "items-end self-end bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border border-indigo-500/30"
                      : "items-start self-start bg-slate-700/60 border border-slate-600/50 backdrop-blur-sm"
                  }`}
                >
                  <p className={`text-xs uppercase tracking-wide ${
                    message.role === "user" ? "text-indigo-200" : "text-slate-400"
                  }`}>{message.role === "user" ? "You" : agentName}</p>
                  <div className={`rounded-xl px-4 py-3 ${
                    message.role === "user" 
                      ? "bg-white/10 backdrop-blur-sm border border-white/20" 
                      : "bg-slate-600/40 backdrop-blur-sm"
                  }`}>
                    <p className={`text-sm whitespace-pre-wrap ${
                      message.role === "user" ? "text-white" : "text-slate-100"
                    }`}>{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
              {isTyping && (
                <div className="animate-pop-in rounded-2xl border border-slate-600 bg-slate-700/60 px-4 py-3 text-slate-300 backdrop-blur-sm">
                  <div className="typing-indicator">
                    <span className="text-sm font-medium">Typing</span>
                    <span className="typing-dots">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
        <form onSubmit={handleSend} className="mt-6 flex flex-col gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
            placeholder="Ask something..."
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg hover:shadow-xl border border-indigo-500/30"
          >
            {loading ? "Thinking…" : "Send message"}
          </button>
        </form>
        <div className="mt-8 rounded-2xl border border-slate-600 bg-slate-700/50 p-4 text-slate-200 backdrop-blur-sm">
          <p className="text-sm text-slate-300">Embed this chat widget anywhere:</p>
          <code className="mt-2 block rounded-lg bg-slate-800/60 p-3 text-xs text-slate-100 border border-slate-600">
            &lt;iframe src="https://yourapp.com/chat/{agentId}" width="400" height="600"&gt;&lt;/iframe&gt;
          </code>
        </div>
      </div>
    </main>
  );
}
