import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <Link href="/" className="flex w-fit items-center gap-2">
          <Image src="/images/logo.svg" alt="KAI3D" width={36} height={36} priority />
          <span className="text-lg font-bold text-white">
            KAI<span className="text-[#6EC30B]">3D</span>
          </span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} KAI3D. All rights reserved.
      </footer>
    </div>
  )
}
