"use client"

import { useEffect, useState } from "react"
import { IconPlus, IconPencil, IconTrash, IconX } from "@tabler/icons-react"
import adminApi from "@/lib/adminApi"

interface Store {
  id: string
  name: string
  category: string | null
  logoUrl: string | null
  isPartner: boolean
}

interface StoreFormData {
  name: string
  category: string
  isPartner: boolean
}

const EMPTY_FORM: StoreFormData = { name: "", category: "", isPartner: false }

function Modal({
  title,
  form,
  onChange,
  onSubmit,
  onClose,
  loading,
}: {
  title: string
  form: StoreFormData
  onChange: (f: StoreFormData) => void
  onSubmit: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition">
              <IconX size={20} stroke={1.5} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                placeholder="Store name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => onChange({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                placeholder="e.g. Grocery, Pharmacy"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => onChange({ ...form, isPartner: !form.isPartner })}
                className={`relative w-10 h-6 rounded-full transition ${form.isPartner ? "bg-zinc-900" : "bg-zinc-200"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isPartner ? "left-5" : "left-1"}`}
                />
              </div>
              <span className="text-sm font-medium text-zinc-700">Partner store</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || !form.name.trim()}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function DeleteDialog({
  storeName,
  onConfirm,
  onCancel,
  loading,
}: {
  storeName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Delete store?</h2>
          <p className="text-sm text-zinc-500 mb-5">
            <span className="font-medium">{storeName}</span> will be permanently removed.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition">
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: "add" | "edit"; store?: Store } | null>(null)
  const [form, setForm] = useState<StoreFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    adminApi.get<Store[]>("/admin/stores")
      .then(({ data }) => setStores(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setForm(EMPTY_FORM)
    setModal({ mode: "add" })
  }

  function openEdit(store: Store) {
    setForm({ name: store.name, category: store.category ?? "", isPartner: store.isPartner })
    setModal({ mode: "edit", store })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = { name: form.name.trim(), category: form.category.trim() || null, isPartner: form.isPartner }
      if (modal?.mode === "add") {
        const { data } = await adminApi.post<Store>("/admin/stores", body)
        setStores((s) => [...s, data])
      } else if (modal?.store) {
        const { data } = await adminApi.patch<Store>(`/admin/stores/${modal.store.id}`, body)
        setStores((s) => s.map((st) => (st.id === data.id ? data : st)))
      }
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.delete(`/admin/stores/${deleteTarget.id}`)
      setStores((s) => s.filter((st) => st.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Stores</h1>
          {!loading && <p className="text-sm text-zinc-400 mt-0.5">{stores.length} total</p>}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition"
        >
          <IconPlus size={16} stroke={2} />
          Add store
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Partner</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {[180, 100, 60, 80].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3.5 rounded bg-zinc-200 animate-pulse" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : stores.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-400">
                  No stores yet
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 font-medium text-zinc-900">{store.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{store.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    {store.isPartner ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Partner
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(store)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                      >
                        <IconPencil size={15} stroke={1.75} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(store)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <IconTrash size={15} stroke={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal.mode === "add" ? "Add store" : "Edit store"}
          form={form}
          onChange={setForm}
          onSubmit={handleSave}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          storeName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
