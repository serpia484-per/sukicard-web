import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "SukiCard — Your loyalty cards, all in one place",
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-zinc-400 tracking-widest uppercase mb-4">SukiCard</p>
      <h1 className="text-5xl font-semibold text-zinc-900 tracking-tight leading-tight max-w-xs">
        Your loyalty cards, all in one place
      </h1>
      <p className="text-zinc-500 mt-4 text-base max-w-xs">
        Collect points, redeem rewards, and never lose a loyalty card again.
      </p>
      <div className="flex gap-3 mt-8">
        <Link
          href="/register"
          className="px-5 py-2.5 text-sm font-medium rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 transition"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
