"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    if (!Cookies.get("sukicard_token")) {
      router.push("/login")
    }
  }, [router])
}
