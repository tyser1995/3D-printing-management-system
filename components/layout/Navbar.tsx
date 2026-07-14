'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/ui/Button'

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/products?category=keychains', label: 'Keychains' },
  { href: '/products?category=figurines', label: 'Figurines' },
  { href: '/products?category=custom', label: 'Custom Orders' },
  { href: '/lab', label: '✦ AI Lab' },
]

const isViewPageMode = process.env.NEXT_PUBLIC_VIEW_PAGE_MODE === 'true'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'bg-[#1A1A1A]/95 shadow-sm backdrop-blur-sm' : 'bg-[#1A1A1A]'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.svg" alt="KAI3D" width={40} height={40} priority />
          <span className="text-xl font-bold text-white">
            KAI<span className="text-[#6EC30B]">3D</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {/* <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div> */}

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {!isViewPageMode && (
            <>
              <Link
                href="/cart"
                className="relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {!isViewPageMode && (
            <Link href="/cart" className="relative rounded-lg p-2 text-slate-300">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white active:bg-white/10"
          >
            {open ? (
              <X className="pointer-events-none h-5 w-5" />
            ) : (
              <Menu className="pointer-events-none h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-[#1A1A1A] px-4 pb-4 md:hidden">
          <div className="mt-2 flex flex-col gap-1">
            {/* {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))} */}
            {!isViewPageMode && (
              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" fullWidth>
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <Button fullWidth>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
