"use client"

import { useEffect, useState } from "react"
import adminApi from "@/lib/adminApi"

interface Flags {
  enable_photo_cards: boolean
  enable_barcode_cards: boolean
  enable_partner_cards: boolean
  maintenance_mode: boolean
  show_browse_stores_on_dashboard: boolean
  cards_per_page: number
}

type BooleanFlagKey = "enable_photo_cards" | "enable_barcode_cards" | "enable_partner_cards" | "maintenance_mode" | "show_browse_stores_on_dashboard"

const TOGGLE_FLAGS: { key: BooleanFlagKey; label: string; description: string }[] = [
  { key: "enable_photo_cards", label: "Photo Cards", description: "Allow users to add photo cards" },
  { key: "enable_barcode_cards", label: "Barcode Cards", description: "Allow users to scan barcodes and QR codes" },
  { key: "enable_partner_cards", label: "Partner Cards", description: "Enable B2B partner card type" },
  { key: "maintenance_mode", label: "Maintenance Mode", description: "Show maintenance page to all users" },
  { key: "show_browse_stores_on_dashboard", label: "Browse Stores on Dashboard", description: "Show Browse Stores section on the Cards screen" },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition ${on ? "bg-zinc-900" : "bg-zinc-200"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-1"}`}
      />
    </button>
  )
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<Flags | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [cardsPerPage, setCardsPerPage] = useState<number>(5)

  useEffect(() => {
    adminApi.get<Flags>("/admin/feature-flags")
      .then(({ data }) => {
        setFlags(data)
        setCardsPerPage(data.cards_per_page ?? 5)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(key: BooleanFlagKey, value: boolean) {
    if (!flags) return
    setSaving(key)
    const optimistic = { ...flags, [key]: value }
    setFlags(optimistic)
    try {
      const { data } = await adminApi.patch<Flags>("/admin/feature-flags", { [key]: value })
      setFlags(data)
    } catch {
      setFlags(flags)
    } finally {
      setSaving(null)
    }
  }

  async function handleCardsPerPage(value: number) {
    if (!flags) return
    const clamped = Math.max(1, Math.min(10, value))
    setCardsPerPage(clamped)
    setSaving("cards_per_page")
    try {
      const { data } = await adminApi.patch<Flags>("/admin/feature-flags", { cards_per_page: clamped })
      setFlags(data)
    } catch {
      setCardsPerPage(flags.cards_per_page ?? 5)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Feature Flags</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Toggle features across the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3.5 w-32 rounded bg-zinc-200 animate-pulse" />
                <div className="h-3 w-52 rounded bg-zinc-200 animate-pulse" />
              </div>
              <div className="w-10 h-6 rounded-full bg-zinc-200 animate-pulse" />
            </div>
          ))
        ) : (
          <>
            {TOGGLE_FLAGS.map(({ key, label, description }) => (
              <div key={key} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
                  <p className="text-[11px] text-zinc-300 mt-0.5 font-mono">{key}</p>
                </div>
                <div className={saving === key ? "opacity-50 pointer-events-none" : ""}>
                  <Toggle on={flags?.[key] ?? false} onChange={(v) => handleToggle(key, v)} />
                </div>
              </div>
            ))}

            {/* cards_per_page — number input */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">Cards Per Page</p>
                <p className="text-xs text-zinc-400 mt-0.5">Number of cards shown per page on the dashboard (1–10)</p>
                <p className="text-[11px] text-zinc-300 mt-0.5 font-mono">cards_per_page</p>
              </div>
              <input
                type="number"
                min={1}
                max={10}
                value={cardsPerPage}
                disabled={saving === "cards_per_page"}
                onChange={(e) => setCardsPerPage(Number(e.target.value))}
                onBlur={(e) => handleCardsPerPage(Number(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter") handleCardsPerPage(cardsPerPage) }}
                className="w-16 px-2 py-1.5 text-sm text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
