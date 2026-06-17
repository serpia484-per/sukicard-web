"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"
import api from "@/lib/api"
import LoyaltyCard from "@/components/cards/LoyaltyCard"
import BottomNav from "@/components/layout/BottomNav"
import { useAuth } from "@/lib/hooks/useAuth"

interface Card {
  id: string
  store?: { name: string }
  storeNameCustom?: string
  cardholderName?: string
  type: "PHONE_ID" | "PHOTO" | "BARCODE" | "PARTNER"
  color: string
  cardPhoneId?: { phoneNumber?: string; cardNumber?: string }
}

const FILTERS = ["All", "Grocery", "Pharmacy", "Food", "Fashion", "Convenience", "Bookstore"]

interface Config {
  show_browse_stores_on_dashboard: boolean
  cards_per_page: number
}

const DEFAULT_CONFIG: Config = { show_browse_stores_on_dashboard: true, cards_per_page: 5 }

export default function DashboardPage() {
  useAuth()
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeFilter, setActiveFilter] = useState("All")
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const mouseStartX = useRef(0)

  useEffect(() => {
    api.get<Config>("/config").then(({ data }) => setConfig(data)).catch(() => {})
    console.time("[dashboard] GET /cards")
    api
      .get("/cards")
      .then(({ data }) => setCards(data))
      .catch(() => setCards([]))
      .finally(() => {
        console.timeEnd("[dashboard] GET /cards")
        setLoading(false)
      })
  }, [])

  const pageSize = config.cards_per_page ?? 5
  const totalPages = Math.ceil(cards.length / pageSize)

  // Height is based on max cards per page, except when there's only one partial page
  const maxCardsOnAnyPage = loading ? 3 : cards.length === 0 ? 0 : Math.min(pageSize, cards.length)
  const stackHeight = loading ? 130 + 2 * 52 : cards.length === 0 ? 130 : maxCardsOnAnyPage * 52 + 130

  // Split cards into pages
  const pages = Array.from({ length: Math.max(1, totalPages) }, (_, p) =>
    cards.slice(p * pageSize, p * pageSize + pageSize)
  )

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-5 pt-10 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-medium text-zinc-900 tracking-tight">My cards</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {loading ? "Loading…" : `${cards.length} loyalty card${cards.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/cards/new"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition mt-0.5"
        >
          <IconPlus size={18} stroke={2} />
        </Link>
      </div>

      {/* Carousel outer — clips overflow */}
      <div
        className="overflow-hidden mb-8"
        style={{ height: stackHeight }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
          touchStartY.current = e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          const deltaX = e.changedTouches[0].clientX - touchStartX.current
          const deltaY = e.changedTouches[0].clientY - touchStartY.current
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            if (deltaX < 0 && currentPage < totalPages - 1) setCurrentPage(p => p + 1)
            if (deltaX > 0 && currentPage > 0) setCurrentPage(p => p - 1)
          }
        }}
        onMouseDown={(e) => { mouseStartX.current = e.clientX }}
        onMouseUp={(e) => {
          const deltaX = e.clientX - mouseStartX.current
          if (Math.abs(deltaX) > 40) {
            if (deltaX < 0 && currentPage < totalPages - 1) setCurrentPage(p => p + 1)
            if (deltaX > 0 && currentPage > 0) setCurrentPage(p => p - 1)
          }
        }}
      >
        {/* Carousel inner — slides horizontally */}
        <div
          className="flex h-full"
          style={{
            width: `${Math.max(1, totalPages) * 100}%`,
            transform: `translateX(-${currentPage * (100 / Math.max(1, totalPages))}%)`,
            transition: "transform 0.3s ease",
          }}
        >
          {loading ? (
            <div className="relative h-full" style={{ width: `${100 / 1}%`, flexShrink: 0 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute w-full rounded-[18px] animate-pulse bg-zinc-200"
                  style={{ top: i * 52, height: 130, zIndex: i }}
                />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div
              className="h-full flex items-center justify-center"
              style={{ width: "100%", flexShrink: 0 }}
            >
              <div className="w-full h-[130px] rounded-[18px] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-zinc-400">No cards yet</p>
                <Link href="/cards/new" className="text-xs font-medium text-zinc-900 underline">
                  Add your first card
                </Link>
              </div>
            </div>
          ) : (
            pages.map((pageCards, p) => (
              <div
                key={p}
                className="relative h-full"
                style={{ width: `${100 / totalPages}%`, flexShrink: 0 }}
              >
                {pageCards.map((card, i) => (
                  <div
                    key={card.id}
                    className="absolute w-full cursor-pointer"
                    style={{ top: i * 52, zIndex: i, height: 130 }}
                    onClick={() => router.push(`/cards/${card.id}`)}
                  >
                    <LoyaltyCard
                      id={card.id}
                      storeName={card.storeNameCustom || card.store?.name || "Unknown store"}
                      cardholderName={card.cardholderName || ""}
                      type={card.type}
                      color={card.color}
                      cardNumber={card.cardPhoneId?.cardNumber}
                      phoneNumber={card.cardPhoneId?.phoneNumber}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Page dots */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className="transition-all duration-200 rounded-full bg-zinc-900"
              style={{
                width: i === currentPage ? 12 : 5,
                height: 5,
                opacity: i === currentPage ? 1 : 0.25,
              }}
            />
          ))}
        </div>
      )}

      {/* Browse stores section */}
      {config.show_browse_stores_on_dashboard && (
        <div>
          <h2 className="text-base font-medium text-zinc-900 mb-3">Browse stores</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  activeFilter === f
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-500 border border-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
