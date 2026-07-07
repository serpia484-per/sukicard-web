"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (posthog.__loaded) return
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
    })
    console.log('[posthog] init', { hasKey: !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, host: process.env.NEXT_PUBLIC_POSTHOG_HOST })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
