"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  IconArrowLeft,
  IconTrash,
  IconPalette,
  IconX,
} from "@tabler/icons-react"
import { QRCodeSVG } from "qrcode.react"
import api from "@/lib/api"
import BottomNav from "@/components/layout/BottomNav"

// ─── Types ────────────────────────────────────────────────────────────────────

type CardType = "PHONE_ID" | "PHOTO" | "BARCODE" | "PARTNER"

const TYPE_LABELS: Record<CardType, string> = {
  PHONE_ID: "Phone ID",
  PHOTO: "Photo",
  BARCODE: "Barcode",
  PARTNER: "Partner",
}

const COLORS = [
  "#534AB7",
  "#185FA5",
  "#3B6D11",
  "#854F0B",
  "#993556",
  "#0F6E56",
  "#185F5F",
  "#444441",
]

interface CardDetail {
  id: string
  type: CardType
  color: string
  cardholderName?: string
  store?: { name: string }
  storeNameCustom?: string
  cardPhoneId?: { phoneNumber?: string; cardNumber?: string }
  cardPhoto?: { barcodeValue?: string; barcodeFormat?: string }
  createdAt?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function resolveIdentifier(card: CardDetail): string {
  if (card.type === "PHONE_ID") {
    return card.cardPhoneId?.phoneNumber ?? card.cardPhoneId?.cardNumber ?? ""
  }
  return card.cardPhoto?.barcodeValue ?? ""
}

// ─── Card visual ──────────────────────────────────────────────────────────────

function CardVisual({ card }: { card: CardDetail }) {
  const storeName = card.storeNameCustom ?? card.store?.name ?? "Unknown store"
  const identifier = resolveIdentifier(card)
  const isQR = card.type === "BARCODE" && card.cardPhoto?.barcodeFormat === "QR_CODE"
  const isOtherBarcode = card.type === "BARCODE" && !isQR

  return (
    <div
      className="w-full flex flex-col justify-between px-6 py-5"
      style={{ backgroundColor: card.color, borderRadius: 20, height: 200 }}
    >
      {/* Top */}
      <div className="flex flex-col gap-0.5">
        <span
          className="font-medium tracking-widest"
          style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textTransform: "uppercase" }}
        >
          {storeName}
        </span>
        <span className="text-white font-medium" style={{ fontSize: 18 }}>
          {card.cardholderName ?? ""}
        </span>
      </div>

      {/* Center — QR code, barcode value, or phone/ID */}
      {isQR && identifier ? (
        <div className="flex flex-col items-center gap-1">
          <QRCodeSVG
            value={identifier}
            size={100}
            bgColor="transparent"
            fgColor="white"
          />
          <span
            className="font-mono text-center"
            style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 1 }}
          >
            {identifier}
          </span>
        </div>
      ) : identifier ? (
        <span
          className="text-white font-mono text-center w-full"
          style={{
            fontSize: isOtherBarcode ? 16 : 20,
            letterSpacing: isOtherBarcode ? 3 : 2,
          }}
        >
          {identifier}
        </span>
      ) : null}

      {/* Bottom */}
      <div className="flex justify-end">
        <span
          className="text-white font-medium px-3 py-1 rounded-full"
          style={{ fontSize: 12, backgroundColor: "rgba(255,255,255,0.18)" }}
        >
          {TYPE_LABELS[card.type] ?? card.type}
        </span>
      </div>
    </div>
  )
}

// ─── Info rows ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value}</span>
    </div>
  )
}

// ─── Color picker sheet ───────────────────────────────────────────────────────

function ColorSheet({
  current,
  onSelect,
  onClose,
}: {
  current: string
  onSelect: (color: string) => void
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-6 pt-5 pb-10 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-5">
          <span className="text-base font-medium text-zinc-900">Choose color</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition">
            <IconX size={20} stroke={1.5} />
          </button>
        </div>
        <div className="flex gap-4 justify-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              className={`w-9 h-9 rounded-full flex-shrink-0 transition ${
                current === c ? "ring-2 ring-offset-2 ring-zinc-900" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Delete card?</h2>
          <p className="text-sm text-zinc-500 mb-5">
            This card will be removed from your wallet. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-5 pt-10 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-zinc-200 animate-pulse" />
        <div className="w-16 h-5 rounded-lg bg-zinc-200 animate-pulse" />
      </div>
      <div className="w-full h-[200px] rounded-[20px] bg-zinc-200 animate-pulse mb-6" />
      <div className="rounded-xl bg-zinc-100 animate-pulse h-28 mb-6" />
      <div className="flex gap-3">
        <div className="flex-1 h-12 rounded-xl bg-zinc-200 animate-pulse" />
        <div className="flex-1 h-12 rounded-xl bg-zinc-200 animate-pulse" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CardDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [card, setCard] = useState<CardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showColorSheet, setShowColorSheet] = useState(false)
  const [colorSaving, setColorSaving] = useState(false)

  useEffect(() => {
    api
      .get<CardDetail>(`/cards/${id}`)
      .then(({ data }) => setCard(data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.patch(`/cards/${id}`, { isActive: false })
      router.push("/dashboard")
    } catch {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  async function handleColorSelect(color: string) {
    if (!card) return
    setColorSaving(true)
    try {
      await api.patch(`/cards/${id}`, { color })
      setCard((prev) => (prev ? { ...prev, color } : prev))
    } finally {
      setColorSaving(false)
      setShowColorSheet(false)
    }
  }

  if (loading) return <Skeleton />
  if (!card) return null

  const storeName = card.storeNameCustom ?? card.store?.name ?? "Unknown store"

  return (
    <>
      <div className="max-w-md mx-auto min-h-screen bg-white px-5 pt-10 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition flex-shrink-0"
          >
            <IconArrowLeft size={18} stroke={2} />
          </button>
          <h1 className="text-[18px] font-medium text-zinc-900 tracking-tight">Card</h1>
        </div>

        {/* Card visual */}
        <div className="mb-6">
          <CardVisual card={card} />
        </div>

        {/* Info rows */}
        <div className="bg-white rounded-xl px-4 mb-6 border border-zinc-100">
          <InfoRow label="Store" value={storeName} />
          <InfoRow label="Type" value={TYPE_LABELS[card.type] ?? card.type} />
          <InfoRow label="Added" value={formatDate(card.createdAt)} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowDelete(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            <IconTrash size={16} stroke={1.5} />
            Delete card
          </button>
          <button
            onClick={() => setShowColorSheet(true)}
            disabled={colorSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
          >
            <IconPalette size={16} stroke={1.5} />
            Edit color
          </button>
        </div>
      </div>

      {showDelete && (
        <DeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}

      {showColorSheet && (
        <ColorSheet
          current={card.color}
          onSelect={handleColorSelect}
          onClose={() => setShowColorSheet(false)}
        />
      )}

      <BottomNav />
    </>
  )
}
