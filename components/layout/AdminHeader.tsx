'use client'

import { Bell, Search, Menu } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  onMenuToggle?: () => void
}

export default function AdminHeader({ title, onMenuToggle }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 pr-4 pl-9 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
        </button>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">
          A
        </div>
      </div>
    </header>
  )
}
