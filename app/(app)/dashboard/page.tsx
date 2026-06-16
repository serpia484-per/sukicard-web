"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"
import api from "@/lib/api"
import LoyaltyCard from "@/components/cards/LoyaltyCard"
import BottomNav from "@/components/layout/BottomNav"

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

export default function DashboardPage() {
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(0)
  const [activeFilter, setActiveFilter] = useState("All")

  useEffect(() => {
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

  const stackHeight = loading ? 130 + 2 * 52 : (cards.length > 0 ? cards.length * 52 + 130 : 130)

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

      {/* Card stack */}
      <div className="relative mb-8" style={{ height: stackHeight }}>
        {loading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute w-full rounded-[18px] animate-pulse bg-zinc-200"
                style={{ top: i * 52, height: 130, zIndex: i }}
              />
            ))}
          </>
        ) : cards.length === 0 ? (
          <div className="w-full h-[130px] rounded-[18px] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-zinc-400">No cards yet</p>
            <Link href="/cards/new" className="text-xs font-medium text-zinc-900 underline">
              Add your first card
            </Link>
          </div>
        ) : (
          cards.map((card, i) => (
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
          ))
        )}
      </div>

      {/* Dot indicators */}
      {!loading && cards.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveCard(i)}
              className="transition-all duration-200 rounded-full bg-zinc-900"
              style={{
                width: i === activeCard ? 12 : 5,
                height: 5,
                opacity: i === activeCard ? 1 : 0.25,
              }}
            />
          ))}
        </div>
      )}

      {/* Browse stores section */}
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

      <BottomNav />
    </div>
  )
}
