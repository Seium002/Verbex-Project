"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useAuth from "../../../lib/useAuth";
import { api } from "../../../lib/api";

export default function AgentDetailPage() {
  useAuth();
  const params = useParams() as { id?: string };
  const agentId = params.id ?? "";
  const [agent, setAgent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [agentRes, analyticsRes, convRes] = await Promise.all([
      api.getAgentDetails(agentId),
      api.getAgentAnalytics(agentId),
      api.getConversations(agentId),
    ]);

    const [agentPayload, analyticsPayload, convPayload] = await Promise.all([
      api.parseJson(agentRes),
      api.parseJson(analyticsRes),
      api.parseJson(convRes),
    ]);

    if (agentRes.ok) {
      setAgent(agentPayload.data.agent);
    }
    if (analyticsRes.ok) {
      setAnalytics(analyticsPayload.data);
    }
    if (convRes.ok) {
      setConversations(convPayload.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (agentId) {
      loadData();
    }
  }, [agentId]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-violet-700/20 p-8 shadow-[0_20px_40px_-25px_rgba(59,130,246,0.75)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-indigo-500/20 p-3">
              <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Agent Details</h1>
              <p className="mt-2 text-slate-400">Review analytics and conversation history for this agent.</p>
            </div>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 text-slate-200 transition hover:border-indigo-500 hover:bg-indigo-500/10">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">Loading agent...</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="animate-fade-in-up rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-violet-700/20 p-6 shadow-[0_20px_40px_-25px_rgba(59,130,246,0.75)] transition hover:scale-[1.01]">
                <p className="text-xs uppercase tracking-wider text-indigo-200">Agent name</p>
                <p className="mt-2 text-2xl font-bold text-white">{agent?.name || "Unknown"}</p>
                <p className="mt-1 text-sm text-slate-300">{agent?.system_prompt || "No prompt set"}</p>
              </div>
              <div className="animate-fade-in-up rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-emerald-600/20 via-slate-900/40 to-cyan-700/20 p-6 shadow-[0_20px_40px_-25px_rgba(16,185,129,0.65)] transition hover:scale-[1.01]">
                <p className="text-xs uppercase tracking-wider text-emerald-200">Total conversations</p>
                <p className="mt-2 text-4xl font-extrabold text-white">{analytics?.totalConversations ?? 0}</p>
                <p className="mt-1 text-sm text-slate-300">New growth from 7d ago</p>
              </div>
              <div className="animate-fade-in-up rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-purple-600/20 via-slate-900/40 to-indigo-700/20 p-6 shadow-[0_20px_40px_-25px_rgba(99,102,241,0.65)] transition hover:scale-[1.01]">
                <p className="text-xs uppercase tracking-wider text-purple-200">Total messages</p>
                <p className="mt-2 text-4xl font-extrabold text-white">{analytics?.totalMessages ?? 0}</p>
                <p className="mt-1 text-sm text-slate-300">Last activity: {analytics?.lastActivity ? new Date(analytics.lastActivity).toLocaleString() : "—"}</p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.8)]">
              <h2 className="text-xl font-semibold text-white">Conversations</h2>
              {conversations.length === 0 ? (
                <p className="mt-4 text-slate-400">No conversations have started yet for this agent.</p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="animate-pop-in rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-zinc-950/80 p-5 backdrop-blur-md transition hover:scale-[1.01] hover:border-indigo-400">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Started</p>
                        <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-200">{conv.messageCount} msgs</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{new Date(conv.startedAt).toLocaleString()}</p>
                      <p className="mt-3 text-base font-medium text-white">{conv.firstMessage || "No preview available."}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-emerald-600/20 via-slate-900/40 to-cyan-700/20 p-8 shadow-[0_20px_40px_-25px_rgba(16,185,129,0.65)]">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-500/20 p-3">
                  <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Open Public Chat</h2>
                  <p className="mt-1 text-slate-400">Share or embed the public chat page for this agent.</p>
                </div>
              </div>
              <div className="mt-6">
                <Link href={`/chat/${agentId}`} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-medium transition hover:bg-emerald-500 hover:shadow-lg">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Chat
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
