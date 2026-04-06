"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.login(email, password);
      const payload = await api.parseJson(res);

      if (!res.ok || !payload?.data?.token) {
        setError(payload?.error || "Unable to login");
        return;
      }

      window.localStorage.setItem("token", payload.data.token);
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-800/90 p-10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-2">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Welcome back</p>
            </div>
            <h1 className="text-4xl font-semibold text-white">Sign in to continue</h1>
            <p className="text-slate-300">Access your dashboard, manage agents, and generate secure API keys.</p>
          </div>
          <form onSubmit={handleSubmit} className="relative mt-10 flex flex-col gap-5">
            <label className="space-y-2 text-sm text-slate-200">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm"
                required
              />
            </label>
            {error ? <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg hover:shadow-xl border border-indigo-500/30"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="relative mt-6 text-sm text-slate-400">
            New here? <Link href="/signup" className="text-indigo-300 hover:text-indigo-200 font-medium">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
