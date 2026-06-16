export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <p className="text-xl font-medium text-zinc-900 mb-8 tracking-tight">SukiCard</p>
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
        {children}
      </div>
    </div>
  )
}
