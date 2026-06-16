"use client"

import { useEffect } from "react"
import api from "@/lib/api"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Warm up the Railway server on first app mount so subsequent API calls are fast
    api.get("/health").catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
