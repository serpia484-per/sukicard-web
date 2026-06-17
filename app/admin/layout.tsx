"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import {
  IconUsers,
  IconBuildingStore,
  IconToggleLeft,
  IconLogout,
} from "@tabler/icons-react"

const NAV_LINKS = [
  { href: "/admin/users", label: "Users", icon: IconUsers },
  { href: "/admin/stores", label: "Stores", icon: IconBuildingStore },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: IconToggleLeft },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!Cookies.get("sukicard_admin_token")) {
      router.push("/admin/login")
    }
  }, [router])

  function handleLogout() {
    Cookies.remove("sukicard_admin_token")
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-[200px] flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-100">
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">SukiCard Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon size={16} stroke={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-zinc-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
          >
            <IconLogout size={16} stroke={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-8">
        {children}
      </main>
    </div>
  )
}
