'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Printer,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Cpu,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { href: '/admin/products', icon: Package, label: 'Products', section: 'main' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders', section: 'main' },
  { href: '/admin/inventory', icon: Layers, label: 'Inventory', section: 'main' },
  { href: '/admin/print-queue', icon: Printer, label: 'Print Queue', section: 'main' },
  { href: '/admin/printers', icon: Zap, label: 'Printers', section: 'main' },
  { href: '/admin/customers', icon: Users, label: 'Customers', section: 'main' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports', section: 'main' },
  { href: '/lab', icon: Cpu, label: 'AI Lab', section: 'phase3' },
  { href: '/admin/settings', icon: Settings, label: 'Settings', section: 'main' },
]

interface AdminSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export default function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-[#1A1A1A] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="KAI3D" width={36} height={36} priority />
            <span className="text-lg font-bold text-white">
              KAI<span className="text-[#6EC30B]">3D</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Image
            src="/images/logo.svg"
            alt="KAI3D"
            width={32}
            height={32}
            className="mx-auto"
            priority
          />
        )}
        <button
          onClick={onToggle}
          className={cn(
            'rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white',
            collapsed && 'mx-auto mt-1'
          )}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#6EC30B] text-white'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400',
            'transition-colors hover:bg-white/10 hover:text-red-400',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
