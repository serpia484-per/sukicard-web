import posthog from "posthog-js"

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  if (!posthog.__loaded) return
  posthog.capture(event, props)
}

export function trackRegister() {
  capture("user_registered")
}

export function trackLogin() {
  capture("user_logged_in")
}

export function trackCardAdded(cardType: string) {
  capture("card_added", { card_type: cardType })
}

export function trackCardViewed(cardType: string) {
  capture("card_viewed", { card_type: cardType })
}

export function trackScannerOpened() {
  capture("scanner_opened")
}

export function trackScanSuccess(format: string) {
  capture("scan_success", { format })
}
