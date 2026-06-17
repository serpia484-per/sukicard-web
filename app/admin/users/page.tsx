"use client"

import { useEffect, useState } from "react"
import adminApi from "@/lib/adminApi"

interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  _count: { cards: number }
}

function SkeletonRow() {
  return (
    <tr>
      {[160, 200, 40, 100, 40].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 rounded bg-zinc-200 animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    adminApi.get<User[]>("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!confirming) return
    setDeleting(true)
    try {
      await adminApi.delete(`/admin/users/${confirming.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== confirming.id))
      setConfirming(null)
    } catch {
      // keep dialog open on failure
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Users</h1>
        {!loading && (
          <p className="text-sm text-zinc-400 mt-0.5">{users.length} total</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Cards</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Member since</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                  No users yet
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 font-medium text-zinc-900">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-900">{u._count.cards}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirming(u)}
                      className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete user"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation dialog */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Delete user?</h2>
            <p className="text-sm text-zinc-500 mb-5">
              Delete <span className="font-medium text-zinc-800">{confirming.name ?? confirming.email}</span>?
              This will also delete all their cards.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirming(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
