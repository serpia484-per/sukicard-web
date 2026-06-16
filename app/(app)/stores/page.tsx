"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { IconSearch, IconBuildingStore } from "@tabler/icons-react"
import api from "@/lib/api"
import BottomNav from "@/components/layout/BottomNav"
import { useAuth } from "@/lib/hooks/useAuth"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Store {
  id: string
  name: string
  category?: string
  isPartner?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Grocery", "Pharmacy", "Food", "Fashion", "Convenience", "Bookstore"]

const AVATAR_COLORS = ["#534AB7", "#185FA5", "#3B6D11", "#854F0B", "#993556", "#0F6E56"]

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0">
      <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-zinc-200 animate-pulse" />
        <div className="h-3 w-20 rounded bg-zinc-200 animate-pulse" />
      </div>
      <div className="w-16 h-8 rounded-lg bg-zinc-200 animate-pulse flex-shrink-0" />
    </div>
  )
}

// ─── Store row ────────────────────────────────────────────────────────────────

function StoreRow({ store, index }: { store: Store; index: number }) {
  const router = useRouter()
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]
  const initial = store.name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0">
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: avatarColor }}
      >
        <span className="text-white font-semibold text-sm">{initial}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm text-zinc-900 truncate">{store.name}</span>
          {store.isPartner && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full leading-none">
              Partner
            </span>
          )}
        </div>
        {store.category && (
          <span className="text-xs text-zinc-400 mt-0.5 block">{store.category}</span>
        )}
      </div>

      {/* Action */}
      <button
        onClick={() => router.push("/cards/new")}
        className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-zinc-900 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
      >
        Add card
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoresPage() {
  useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStores = useCallback((q: string, category: string) => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (q) params.search = q
    if (category !== "All") params.category = category
    api
      .get<Store[]>("/stores", { params })
      .then(({ data }) => setStores(data))
      .catch(() => setStores([]))
      .finally(() => setLoading(false))
  }, [])

  // Initial load
  useEffect(() => {
    fetchStores("", "All")
  }, [fetchStores])

  function handleSearch(q: string) {
    setSearch(q)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchStores(q, activeFilter), 300)
  }

  function handleFilter(category: string) {
    setActiveFilter(category)
    if (debounce.current) clearTimeout(debounce.current)
    fetchStores(search, category)
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-5 pt-10 pb-24">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-zinc-900 tracking-tight">Stores</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Find loyalty programs near you</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <IconSearch
          size={16}
          stroke={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search stores..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 mb-4 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeFilter === f
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-500 border border-zinc-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Store list */}
      <div className="rounded-xl border border-zinc-100 overflow-hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <IconBuildingStore size={40} stroke={1} className="text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No stores found</p>
            {search && (
              <p className="text-xs text-zinc-400">Try a different search term</p>
            )}
          </div>
        ) : (
          stores.map((store, i) => <StoreRow key={store.id} store={store} index={i} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
