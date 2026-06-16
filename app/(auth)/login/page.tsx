"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import api from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      Cookies.set("sukicard_token", data.token, { expires: 7 })
      router.push("/dashboard")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message ?? "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-zinc-500 mt-1">Sign in to your SukiCard account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-zinc-500 text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-zinc-900 font-medium hover:underline">
          Register
        </Link>
      </p>
    </>
  )
}
