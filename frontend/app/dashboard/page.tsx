"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useAuth from "../../lib/useAuth";
import { api } from "../../lib/api";

const AVAILABLE_MODELS = [
  { label: "OpenAI GPT-3.5 Turbo — OpenRouter", value: "openai/gpt-3.5-turbo" },
  { label: "Qwen 2.5 72B Instruct — OpenRouter", value: "qwen/qwen-2.5-72b-instruct" },
  { label: "MiniMax M2.7 — OpenRouter", value: "minimax/minimax-m2.7" },
  { label: "NVIDIA Llama 3.1 Nemotron 70B — OpenRouter", value: "nvidia/llama-3.1-nemotron-70b-instruct" },
  { label: "Meta Llama 3.1 8B Instruct — OpenRouter", value: "meta-llama/llama-3.1-8b-instruct:free" },
  { label: "Perplexity Llama 3.1 Sonar 8B — OpenRouter", value: "perplexity/llama-3.1-sonar-small-128k-chat" },
  { label: "Custom model ID", value: "custom" },
];

export default function DashboardPage() {
  useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", systemPrompt: "", temperature: 0.7, model: AVAILABLE_MODELS[0].value, customModel: "", webhookUrl: "" });
  const [message, setMessage] = useState("");
  const [apiKeyMessage, setApiKeyMessage] = useState("");
  const [apiKey, setApiKey] = useState("");

  async function loadAgents() {
    setLoading(true);
    const res = await api.getAgents();
    const payload = await api.parseJson(res);
    setLoading(false);
    if (res.ok && payload?.data?.agents) {
      setAgents(payload.data.agents);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const model = form.model === "custom" ? form.customModel.trim() : form.model;
      if (!model) {
        setMessage("Please enter a custom model ID.");
        setLoading(false);
        return;
      }
      const res = await api.createAgent({
        name: form.name,
        system_prompt: form.systemPrompt,
        temperature: form.temperature,
        model,
        webhook_url: form.webhookUrl,
      });
      const payload = await api.parseJson(res);
      if (res.ok && payload?.data?.agent) {
        setMessage("Agent created successfully.");
        setShowCreate(false);
        setForm({ name: "", systemPrompt: "", temperature: 0.7, model: AVAILABLE_MODELS[0].value, customModel: "", webhookUrl: "" });
        await loadAgents();
        return;
      }
      setMessage(payload?.error || res.statusText || "Unable to create agent.");
    } catch (error) {
      setMessage(`Unable to create agent. ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this agent?");
    if (!confirmed) return;
    const res = await api.deleteAgent(id);
    if (res.ok) {
      setMessage("Agent deleted.");
      await loadAgents();
    } else {
      const payload = await api.parseJson(res);
      setMessage(payload?.error || "Unable to delete agent.");
    }
  }

  async function handleApiKey() {
    const res = await api.generateApiKey();
    const payload = await api.parseJson(res);
    if (res.ok && payload?.data?.key) {
      setApiKey(payload.data.key);
      setApiKeyMessage("Copy this key now — it will never be shown again.");
      return;
    }
    setApiKeyMessage(payload?.error || "Unable to generate API key.");
  }

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-slate-700/50 bg-slate-800/90 p-8 shadow-[0_30px_90px_-40px_rgba(59,130,246,0.3)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Dashboard</p>
              </div>
              <h1 className="text-4xl font-semibold text-white">Your AI agent workspace</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Run your agents, manage keys, and keep everything organized in a cleaner interface.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3 font-semibold text-white transition hover:brightness-110 shadow-lg hover:shadow-xl border border-indigo-500/30"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Agent
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-6 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Agents</p>
              <p className="mt-4 text-3xl font-semibold text-white">{agents.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-6 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Latest action</p>
              <p className="mt-4 text-lg font-semibold text-white">{loading ? "Refreshing…" : "Ready to manage"}</p>
            </div>
            <div className="rounded-3xl border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-6 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">API key</p>
              <p className="mt-4 text-lg font-semibold text-white">Secure and instant</p>
            </div>
          </div>
        </div>

        {message ? <div className="mb-6 rounded-3xl bg-emerald-500/10 border border-emerald-600 p-4 text-emerald-200">{message}</div> : null}

        <section className="mb-8 grid gap-6 md:grid-cols-2">
          {agents.length === 0 && !loading ? (
            <div className="rounded-[1.75rem] border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-8 backdrop-blur-sm text-slate-300">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-slate-600/50 p-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">No agents yet</p>
                  <p className="mt-3 text-slate-400">Create your first agent to start meaningful conversations and public chat experiences.</p>
                </div>
              </div>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="group rounded-[1.75rem] border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-6 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:border-indigo-400/50 hover:from-slate-600/50 hover:to-slate-700/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-2">
                        <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-white group-hover:text-indigo-200 transition">{agent.name}</h2>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Model: <span className="rounded-full bg-slate-600/50 px-2 py-1 text-xs text-slate-300 border border-slate-500/30">{agent.model}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/agent/${agent.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:bg-slate-600/50 backdrop-blur-sm">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Open
                    </Link>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-600/50 bg-rose-600/10 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-600/20 hover:border-rose-500 backdrop-blur-sm"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-[1.75rem] border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-8 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-2">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white">API Key</h2>
              </div>
              <p className="mt-2 text-sm text-slate-400">Generate a key to call public chat via <code className="rounded bg-slate-600/50 px-2 py-1 text-xs text-slate-300 border border-slate-500/30">x-api-key</code>.</p>
            </div>
            <button
              onClick={handleApiKey}
              className="rounded-3xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-3 font-semibold text-white transition hover:brightness-110 shadow-lg hover:shadow-xl border border-emerald-500/30"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Generate API Key
            </button>
          </div>
          {apiKey ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input readOnly value={apiKey} className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 backdrop-blur-sm" />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                }}
                className="rounded-3xl bg-slate-600/50 px-5 py-3 text-sm text-slate-200 transition hover:bg-slate-500/50 backdrop-blur-sm border border-slate-500/30"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          ) : null}
          {apiKeyMessage ? <p className="mt-4 text-sm text-slate-300 bg-slate-600/20 border border-slate-500/30 rounded-xl px-3 py-2">{apiKeyMessage}</p> : null}
        </section>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-600/50 bg-slate-800/95 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-2">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Create new agent</h2>
                  <p className="mt-2 text-slate-400">Fill in the details and start a new chat agent.</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-2 text-slate-400 transition hover:text-white hover:bg-slate-700/50">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>System prompt</span>
                <textarea
                  value={form.systemPrompt}
                  onChange={(event) => setForm({ ...form, systemPrompt: event.target.value })}
                  className="h-32 w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm resize-none"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Temperature: {form.temperature}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={form.temperature}
                  onChange={(event) => setForm({ ...form, temperature: Number(event.target.value) })}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Conservative (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Model</span>
                <select
                  value={form.model}
                  onChange={(event) => setForm({ ...form, model: event.target.value })}
                  className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </select>
              </label>
              {form.model === "custom" ? (
                <label className="space-y-2 text-sm text-slate-200">
                  <span>Custom model ID</span>
                  <input
                    value={form.customModel}
                    onChange={(event) => setForm({ ...form, customModel: event.target.value })}
                    placeholder="e.g. openai/gpt-4o-mini"
                    className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
                    required
                  />
                </label>
              ) : null}
              <label className="space-y-2 text-sm text-slate-200">
                <span>Webhook URL (optional)</span>
                <input
                  value={form.webhookUrl}
                  onChange={(event) => setForm({ ...form, webhookUrl: event.target.value })}
                  placeholder="https://your-webhook-url.com"
                  className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
                />
              </label>
              <button className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg hover:shadow-xl border border-indigo-500/30">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create agent
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
