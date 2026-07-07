"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (posthog.__loaded) return
    posthog.init("phc_u5rEC4LiwG7JZEwBEkDNh7MLtHNbCZqRt8YM4Wzn679x", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
    })
    console.log('[posthog] initialized in production', posthog.__loaded)
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
