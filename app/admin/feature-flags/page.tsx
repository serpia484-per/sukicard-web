"use client"

import { useEffect, useState } from "react"
import adminApi from "@/lib/adminApi"

interface Flags {
  enable_photo_cards: boolean
  enable_barcode_cards: boolean
  enable_partner_cards: boolean
  maintenance_mode: boolean
}

const FLAG_META: { key: keyof Flags; label: string; description: string }[] = [
  {
    key: "enable_photo_cards",
    label: "Photo Cards",
    description: "Allow users to add photo cards",
  },
  {
    key: "enable_barcode_cards",
    label: "Barcode Cards",
    description: "Allow users to scan barcodes and QR codes",
  },
  {
    key: "enable_partner_cards",
    label: "Partner Cards",
    description: "Enable B2B partner card type",
  },
  {
    key: "maintenance_mode",
    label: "Maintenance Mode",
    description: "Show maintenance page to all users",
  },
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

  useEffect(() => {
    adminApi.get<Flags>("/admin/feature-flags")
      .then(({ data }) => setFlags(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(key: keyof Flags, value: boolean) {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Feature Flags</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Toggle features across the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3.5 w-32 rounded bg-zinc-200 animate-pulse" />
                <div className="h-3 w-52 rounded bg-zinc-200 animate-pulse" />
              </div>
              <div className="w-10 h-6 rounded-full bg-zinc-200 animate-pulse" />
            </div>
          ))
        ) : FLAG_META.map(({ key, label, description }) => (
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
      </div>
    </div>
  )
}
