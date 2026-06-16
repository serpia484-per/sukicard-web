"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconCreditCard, IconBuildingStore, IconUser } from "@tabler/icons-react"

const items = [
  { label: "Cards", href: "/dashboard", icon: IconCreditCard },
  { label: "Stores", href: "/stores", icon: IconBuildingStore },
  { label: "Profile", href: "/profile", icon: IconUser },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100">
      <div className="max-w-sm mx-auto flex">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3"
            >
              <Icon
                size={22}
                stroke={1.5}
                className={active ? "text-zinc-900" : "text-zinc-400"}
              />
              <span
                className={`text-[10px] font-medium ${active ? "text-zinc-900" : "text-zinc-400"}`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
