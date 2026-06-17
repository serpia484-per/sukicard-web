"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import api from "@/lib/api"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Inline validation messages
  const emailError = email && !EMAIL_RE.test(email) ? "Invalid email address" : ""
  const passwordError = password && password.length < 8 ? "Password must be at least 8 characters" : ""
  const confirmError = confirm && confirm !== password ? "Passwords do not match" : ""

  const canSubmit =
    name.trim() &&
    EMAIL_RE.test(email) &&
    password.length >= 8 &&
    confirm === password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    setLoading(true)
    try {
      const { data } = await api.post("/auth/register", { name, email, password })
      Cookies.set("sukicard_token", data.token, { expires: 7 })
      router.push("/dashboard")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
          ?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
  const fieldError = (msg: string) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null

  return (
    <>
      <title>Create account | SukiCard</title>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Create account</h1>
        <p className="text-sm text-zinc-500 mt-1">Start managing your loyalty cards</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="Juan dela Cruz"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
          />
          {fieldError(emailError)}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="Min. 8 characters"
          />
          {fieldError(passwordError)}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="Re-enter your password"
          />
          {fieldError(confirmError)}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-zinc-500 text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
