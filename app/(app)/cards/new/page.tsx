"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconPhone,
  IconQrcode,
  IconCamera,
  IconCircleCheck,
  IconX,
} from "@tabler/icons-react"
import api from "@/lib/api"
import BottomNav from "@/components/layout/BottomNav"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/hooks/useAuth"
import { trackCardAdded, trackScannerOpened, trackScanSuccess } from "@/lib/analytics"

const BarcodeScanner = dynamic(() => import("@/components/scanner/BarcodeScanner"), { ssr: false })
const PhotoCapture = dynamic(() => import("@/components/scanner/PhotoCapture"), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

type CardType = "PHONE_ID" | "BARCODE" | "PHOTO"
type BarcodeFormat = "QR_CODE" | "CODE_128" | "EAN_13" | "EAN_8"

interface StoreResult {
  id: string
  name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_TYPES: { value: CardType; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "PHONE_ID",
    label: "Phone number / ID",
    description: "Your phone number or member ID is looked up at checkout",
    icon: IconPhone,
  },
  {
    value: "BARCODE",
    label: "Barcode / QR code",
    description: "Show a barcode or QR code to the cashier",
    icon: IconQrcode,
  },
  {
    value: "PHOTO",
    label: "Take a photo",
    description: "Photo of your physical card",
    icon: IconCamera,
  },
]

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

const BARCODE_FORMATS: { value: BarcodeFormat; label: string }[] = [
  { value: "QR_CODE", label: "QR Code" },
  { value: "CODE_128", label: "Code 128" },
  { value: "EAN_13", label: "EAN-13" },
  { value: "EAN_8", label: "EAN-8" },
]

const FORMAT_MAP: Record<string, BarcodeFormat> = {
  QR_CODE: "QR_CODE",
  CODE_128: "CODE_128",
  EAN_13: "EAN_13",
  EAN_8: "EAN_8",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ onBack, title }: { onBack: () => void; title?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition flex-shrink-0"
      >
        <IconArrowLeft size={18} stroke={2} />
      </button>
      {title && (
        <h1 className="text-[22px] font-medium text-zinc-900 tracking-tight">{title}</h1>
      )}
    </div>
  )
}

function PrimaryButton({
  children,
  disabled,
  loading,
  onClick,
  type = "button",
}: {
  children: React.ReactNode
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3 px-4 text-sm font-medium rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {loading ? "Saving…" : children}
    </button>
  )
}

// ─── Step 1: Choose type ──────────────────────────────────────────────────────

function StepChooseType({
  onSelect,
  onBack,
}: {
  onSelect: (t: CardType) => void
  onBack: () => void
}) {
  return (
    <div className="max-w-md mx-auto flex flex-col min-h-screen bg-white px-5 pt-10 pb-24">
      <PageHeader onBack={onBack} />

      <h1 className="text-[22px] font-medium text-zinc-900 tracking-tight">Add a card</h1>
      <p className="text-sm text-zinc-400 mt-1 mb-6">How is your loyalty card stored?</p>

      <div className="flex flex-col gap-3 flex-1">
        {CARD_TYPES.map(({ value, label, description, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className="w-full text-left rounded-2xl p-5 border-2 border-zinc-200 bg-white hover:border-zinc-300 transition"
          >
            <Icon size={32} stroke={1.5} className="text-zinc-700 mb-3" />
            <p className="font-medium text-zinc-900 text-sm">{label}</p>
            <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

// ─── Store search input ───────────────────────────────────────────────────────

function StoreSearchInput({
  value,
  onChange,
  onSelect,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (store: StoreResult | null, customName: string) => void
}) {
  const [results, setResults] = useState<StoreResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleChange(q: string) {
    onChange(q)
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get<StoreResult[]>("/stores", { params: { search: q } })
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => value && setOpen(true)}
        placeholder="e.g. SM Advantage, Jollibee"
        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
      />
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-zinc-400">Searching…</div>
          )}
          {!loading && results.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => {
                onChange(store.name)
                onSelect(store, "")
                setOpen(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-zinc-900 hover:bg-zinc-50 transition border-b border-zinc-100 last:border-0"
            >
              {store.name}
            </button>
          ))}
          {!loading && (
            <button
              type="button"
              onClick={() => {
                onSelect(null, value.trim())
                setOpen(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-zinc-500 hover:bg-zinc-50 transition"
            >
              Add custom store name &ldquo;{value}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Card details ─────────────────────────────────────────────────────

function StepCardDetails({
  cardType,
  initialBarcodeValue = "",
  initialBarcodeFormat = "QR_CODE",
  initialPhotoDataUrl = null,
  onBack,
  onSuccess,
}: {
  cardType: CardType
  initialBarcodeValue?: string
  initialBarcodeFormat?: BarcodeFormat
  initialPhotoDataUrl?: string | null
  onBack: () => void
  onSuccess: (storeName: string) => void
}) {
  const [storeName, setStoreName] = useState("")
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeNameCustom, setStoreNameCustom] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [phoneId, setPhoneId] = useState("")
  const [barcodeValue, setBarcodeValue] = useState(initialBarcodeValue)
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>(initialBarcodeFormat)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(initialPhotoDataUrl)
  const [showScanner, setShowScanner] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isPhoneId = cardType === "PHONE_ID"
  const isBarcode = cardType === "BARCODE"
  const isPhoto = cardType === "PHOTO"

  const displayName = storeId ? storeName : storeNameCustom || storeName

  const valid =
    displayName.trim() &&
    (isPhoneId
      ? phoneId.trim()
      : isBarcode
      ? barcodeValue.trim()
      : photoDataUrl != null || barcodeValue.trim())

  async function handleSubmit() {
    if (!valid) return
    setError("")
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        type: cardType,
        color,
        ...(storeId ? { storeId } : { storeNameCustom: displayName }),
      }
      if (isPhoneId) {
        payload.cardPhoneId = { phoneNumber: phoneId }
      } else {
        payload.cardPhoto = {
          barcodeValue: barcodeValue || undefined,
          barcodeFormat: barcodeValue ? barcodeFormat : undefined,
          photoUrl: photoDataUrl || undefined,
        }
      }
      console.log("[add card] payload:", JSON.stringify(payload))
      await api.post("/cards", payload)
      trackCardAdded(cardType)
      onSuccess(displayName)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown; status?: number } }
      console.error("[add card] error:", axiosErr.response?.status, axiosErr.response?.data)
      const message = (axiosErr.response?.data as { message?: string })?.message
      setError(message ?? "Failed to add card. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlays */}
      {showScanner && (
        <BarcodeScanner
          onScan={(value, format) => {
            setBarcodeValue(value)
            const mapped = FORMAT_MAP[format]
            if (mapped) setBarcodeFormat(mapped)
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showCamera && (
        <PhotoCapture
          onCapture={(dataUrl) => {
            setPhotoDataUrl(dataUrl)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="max-w-md mx-auto flex flex-col min-h-screen bg-white px-5 pt-10 pb-24">
        <PageHeader onBack={onBack} title="Card details" />

        <div className="flex flex-col gap-5">
          {/* Store name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Store name</label>
            <StoreSearchInput
              value={storeName}
              onChange={(v) => {
                setStoreName(v)
                setStoreId(null)
                setStoreNameCustom("")
              }}
              onSelect={(store, custom) => {
                if (store) {
                  setStoreId(store.id)
                  setStoreNameCustom("")
                } else {
                  setStoreId(null)
                  setStoreNameCustom(custom)
                }
              }}
            />
          </div>

          {/* Card color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Card color</label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full flex-shrink-0 transition ${
                    color === c ? "ring-2 ring-offset-2 ring-zinc-900" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Phone / ID */}
          {isPhoneId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Phone number or member ID</label>
              <input
                type="text"
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder="+63 912 345 6789"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
              />
            </div>
          )}

          {/* Barcode */}
          {isBarcode && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Barcode / QR code</label>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl border-2 border-dashed border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition"
                >
                  <IconQrcode size={18} stroke={1.5} />
                  {barcodeValue ? "Scan again" : "Scan Barcode / QR"}
                </button>
                {barcodeValue && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-200">
                    <span className="flex-1 text-sm font-mono text-zinc-900 truncate">{barcodeValue}</span>
                    <span className="text-xs text-zinc-400">{barcodeFormat}</span>
                    <button onClick={() => { setBarcodeValue(""); setBarcodeFormat("QR_CODE") }}>
                      <IconX size={14} className="text-zinc-400 hover:text-zinc-700" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Or enter manually</label>
                <input
                  type="text"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  placeholder="Enter barcode number"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Barcode format</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition appearance-none"
                >
                  {BARCODE_FORMATS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Photo */}
          {isPhoto && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Card photo</label>
              {photoDataUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoDataUrl} alt="Card photo" className="w-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <IconX size={14} stroke={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl border-2 border-dashed border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition"
                >
                  <IconCamera size={18} stroke={1.5} />
                  Open Camera
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <PrimaryButton disabled={!valid} loading={loading} onClick={handleSubmit}>
            Add card
          </PrimaryButton>
        </div>

        <BottomNav />
      </div>
    </>
  )
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────

function StepSuccess({ storeName }: { storeName: string }) {
  const router = useRouter()
  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-screen bg-white px-5 pb-24 text-center">
      <IconCircleCheck size={64} stroke={1.5} className="text-emerald-500 mb-5" />
      <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Card added!</h1>
      <p className="text-sm text-zinc-500 mt-2">
        <span className="font-medium text-zinc-700">{storeName}</span> card has been added to your
        wallet
      </p>
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-8 px-6 py-3 text-sm font-medium rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 transition"
      >
        View my cards
      </button>
      <BottomNav />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Overlay = "scanner" | "camera" | null

export default function NewCardPage() {
  useAuth()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [cardType, setCardType] = useState<CardType | null>(null)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [successStoreName, setSuccessStoreName] = useState("")

  // Pre-fill values captured before entering step 2
  const [prefillBarcodeValue, setPrefillBarcodeValue] = useState("")
  const [prefillBarcodeFormat, setPrefillBarcodeFormat] = useState<BarcodeFormat>("QR_CODE")
  const [prefillPhotoDataUrl, setPrefillPhotoDataUrl] = useState<string | null>(null)

  function handleTypeSelect(t: CardType) {
    setCardType(t)
    if (t === "BARCODE") {
      setOverlay("scanner")
      trackScannerOpened()
    } else if (t === "PHOTO") {
      setOverlay("camera")
      trackScannerOpened()
    } else {
      setStep(2)
    }
  }

  if (step === 3) {
    return (
      <>
        <title>Add Card | SukiCard</title>
        <StepSuccess storeName={successStoreName} />
      </>
    )
  }

  if (step === 2 && cardType) {
    return (
      <>
        <title>Add Card | SukiCard</title>
        <StepCardDetails
          cardType={cardType}
          initialBarcodeValue={prefillBarcodeValue}
          initialBarcodeFormat={prefillBarcodeFormat}
          initialPhotoDataUrl={prefillPhotoDataUrl}
          onBack={() => setStep(1)}
          onSuccess={(name) => {
            setSuccessStoreName(name)
            setStep(3)
          }}
        />
      </>
    )
  }

  // Step 1 — type selection + scanner/camera overlays
  return (
    <>
      <title>Add Card | SukiCard</title>

      {overlay === "scanner" && (
        <BarcodeScanner
          onScan={(value, format) => {
            setPrefillBarcodeValue(value)
            setPrefillBarcodeFormat(FORMAT_MAP[format] ?? "QR_CODE")
            trackScanSuccess(format)
            setOverlay(null)
            setStep(2)
          }}
          onClose={() => {
            setOverlay(null)
            setCardType(null)
          }}
        />
      )}

      {overlay === "camera" && (
        <PhotoCapture
          onCapture={(dataUrl) => {
            setPrefillPhotoDataUrl(dataUrl)
            setOverlay(null)
            setStep(2)
          }}
          onClose={() => {
            setOverlay(null)
            setCardType(null)
          }}
        />
      )}

      <StepChooseType
        onSelect={handleTypeSelect}
        onBack={() => router.back()}
      />
    </>
  )
}
