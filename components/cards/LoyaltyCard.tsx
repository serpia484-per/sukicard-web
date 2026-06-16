type CardType = "PHONE_ID" | "PHOTO" | "PARTNER"

const TYPE_LABELS: Record<CardType, string> = {
  PHONE_ID: "Phone ID",
  PHOTO: "Photo",
  PARTNER: "Partner",
}

interface LoyaltyCardProps {
  id: string
  storeName: string
  cardholderName: string
  type: CardType
  color: string
  cardNumber?: string
  phoneNumber?: string
}

function maskIdentifier(value: string): string {
  if (value.length <= 4) return value
  return "•".repeat(value.length - 4) + value.slice(-4)
}

export default function LoyaltyCard({
  storeName,
  cardholderName,
  type,
  color,
  cardNumber,
  phoneNumber,
}: LoyaltyCardProps) {
  const identifier = cardNumber ?? phoneNumber ?? ""
  const masked = identifier ? maskIdentifier(identifier) : null

  return (
    <div
      className="w-full h-full flex flex-col justify-between px-5 py-4"
      style={{ backgroundColor: color, borderRadius: 18 }}
    >
      {/* Top row */}
      <div className="flex flex-col gap-0.5">
        <span
          className="font-medium tracking-widest"
          style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textTransform: "uppercase" }}
        >
          {storeName}
        </span>
        <span className="text-white font-medium" style={{ fontSize: 14 }}>
          {cardholderName}
        </span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {masked && (
          <span className="text-white font-mono" style={{ fontSize: 13, letterSpacing: 1 }}>
            {masked}
          </span>
        )}
        <span
          className="ml-auto text-white font-medium px-2.5 py-1 rounded-full"
          style={{ fontSize: 11, backgroundColor: "rgba(255,255,255,0.18)" }}
        >
          {TYPE_LABELS[type] ?? type}
        </span>
      </div>
    </div>
  )
}
