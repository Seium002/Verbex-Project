"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

export default function SignupPage() {
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
      const res = await api.signup(email, password);
      const payload = await api.parseJson(res);

      if (!res.ok || !payload?.data?.token) {
        setError(payload?.error || "Unable to sign up");
        return;
      }

      window.localStorage.setItem("token", payload.data.token);
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-800/90 p-10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 p-2">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Join Verbex</p>
            </div>
            <h1 className="text-4xl font-semibold text-white">Create your account</h1>
            <p className="text-slate-300">Start building AI agents, generate API keys, and manage conversations in one place.</p>
          </div>
          <form onSubmit={handleSubmit} className="relative mt-10 flex flex-col gap-5">
            <label className="space-y-2 text-sm text-slate-200">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 backdrop-blur-sm"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-3xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 backdrop-blur-sm"
                required
              />
            </label>
            {error ? <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="rounded-3xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg hover:shadow-xl border border-emerald-500/30"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
          <p className="relative mt-6 text-sm text-slate-400">
            Already have an account? <Link href="/login" className="text-emerald-300 hover:text-emerald-200 font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
