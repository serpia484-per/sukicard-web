"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import {
  IconBell,
  IconShield,
  IconFileText,
  IconLogout,
  IconChevronRight,
  IconPencil,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import api from "@/lib/api"
import BottomNav from "@/components/layout/BottomNav"
import { useAuth } from "@/lib/hooks/useAuth"

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  name?: string | null
  email: string
  createdAt?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeJwtIat(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.iat ?? null
  } catch {
    return null
  }
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon: Icon,
  label,
  danger,
  right,
  onClick,
}: {
  icon: React.ElementType
  label: string
  danger?: boolean
  right?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 transition${onClick ? " cursor-pointer" : ""}`}
    >
      <Icon size={18} stroke={1.5} className={danger ? "text-red-500" : "text-zinc-500"} />
      <span className={`flex-1 text-sm font-medium ${danger ? "text-red-500" : "text-zinc-900"}`}>
        {label}
      </span>
      {right}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-5 pt-10 pb-24">
      <h1 className="text-[22px] font-medium text-zinc-900 tracking-tight mb-8">Profile</h1>
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-zinc-200 animate-pulse" />
        <div className="w-32 h-4 rounded bg-zinc-200 animate-pulse mt-2" />
        <div className="w-44 h-3 rounded bg-zinc-200 animate-pulse" />
      </div>
      <div className="h-20 rounded-xl bg-zinc-100 animate-pulse mb-4" />
      <div className="h-48 rounded-xl bg-zinc-100 animate-pulse" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [cardCount, setCardCount] = useState<number | null>(null)
  const [memberYear, setMemberYear] = useState<number | null>(null)
  const [notifications, setNotifications] = useState(false)
  const [loading, setLoading] = useState(true)

  // Name editing state
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [nameSaving, setNameSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = Cookies.get("sukicard_token")
    if (token) {
      const iat = decodeJwtIat(token)
      if (iat) setMemberYear(new Date(iat * 1000).getFullYear())
    }

    Promise.all([api.get<User>("/auth/me"), api.get<unknown[]>("/cards")])
      .then(([meRes, cardsRes]) => {
        setUser(meRes.data)
        setCardCount(cardsRes.data.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function startEditName() {
    setNameInput(user?.name ?? "")
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  function cancelEditName() {
    setEditingName(false)
    setNameInput("")
  }

  async function saveName() {
    const trimmed = nameInput.trim()
    if (!trimmed || nameSaving) return
    setNameSaving(true)
    try {
      const { data } = await api.patch<User>("/users/me", { name: trimmed })
      setUser(data)
      setEditingName(false)
    } catch {
      // keep editing open on error
    } finally {
      setNameSaving(false)
    }
  }

  function handleSignOut() {
    Cookies.remove("sukicard_token")
    router.push("/login")
  }

  if (loading) return <Skeleton />

  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()
  const displayName = user?.name ?? "—"
  const displayEmail = user?.email ?? "—"

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-5 pt-10 pb-24">
      <title>Profile | SukiCard</title>
      {/* Header */}
      <h1 className="text-[22px] font-medium text-zinc-900 tracking-tight mb-8">Profile</h1>

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-1 mb-8">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-2">
          <span className="text-white text-2xl font-semibold">{initial}</span>
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              ref={nameInputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName()
                if (e.key === "Escape") cancelEditName()
              }}
              className="text-center text-[16px] font-medium text-zinc-900 border-b-2 border-zinc-900 bg-transparent focus:outline-none w-40"
              placeholder="Your name"
            />
            <button
              onClick={saveName}
              disabled={nameSaving || !nameInput.trim()}
              className="text-emerald-600 hover:text-emerald-700 disabled:opacity-40"
            >
              <IconCheck size={18} stroke={2} />
            </button>
            <button onClick={cancelEditName} className="text-zinc-400 hover:text-zinc-600">
              <IconX size={18} stroke={2} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="text-[18px] font-medium text-zinc-900">{displayName}</p>
            <button
              onClick={startEditName}
              className="text-zinc-400 hover:text-zinc-700 transition mt-0.5"
            >
              <IconPencil size={14} stroke={1.5} />
            </button>
          </div>
        )}

        <p className="text-sm text-zinc-400">{displayEmail}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 bg-zinc-50 rounded-xl mb-4 divide-x divide-zinc-200">
        <div className="flex flex-col items-center py-4 gap-0.5">
          <span className="text-xl font-semibold text-zinc-900">{cardCount ?? "—"}</span>
          <span className="text-xs text-zinc-400">Cards</span>
        </div>
        <div className="flex flex-col items-center py-4 gap-0.5">
          <span className="text-xl font-semibold text-zinc-900">10</span>
          <span className="text-xs text-zinc-400">Stores</span>
        </div>
        <div className="flex flex-col items-center py-4 gap-0.5">
          <span className="text-xl font-semibold text-zinc-900">{memberYear ?? "—"}</span>
          <span className="text-xs text-zinc-400">Member since</span>
        </div>
      </div>

      {/* Settings list */}
      <div className="rounded-xl border border-zinc-100 overflow-hidden divide-y divide-zinc-100 mb-8">
        <SettingsRow
          icon={IconBell}
          label="Notifications"
          right={<Toggle enabled={notifications} onToggle={() => setNotifications((v) => !v)} />}
        />
        <SettingsRow
          icon={IconShield}
          label="Privacy Policy"
          right={<IconChevronRight size={16} className="text-zinc-300" />}
        />
        <SettingsRow
          icon={IconFileText}
          label="Terms of Service"
          right={<IconChevronRight size={16} className="text-zinc-300" />}
        />
        <SettingsRow icon={IconLogout} label="Sign out" danger onClick={handleSignOut} />
      </div>

      {/* Version */}
      <p className="text-xs text-zinc-400 text-center">SukiCard v0.1.0</p>

      <BottomNav />
    </div>
  )
}
