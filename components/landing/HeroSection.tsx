import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { prisma } from '@/lib/prisma/client'

const features = [
  { icon: Zap, text: 'Bambu Lab A1' },
  // { icon: CheckCircle2, text: 'PH-based, ships nationwide' },
  // { icon: Shield, text: 'Quality guaranteed or reprinted' },
]

const isViewPageMode = process.env.NEXT_PUBLIC_VIEW_PAGE_MODE === 'true'

export default async function HeroSection() {
  const deliveredCount = await prisma.order.count({
    where: { status: 'DELIVERED', deletedAt: null },
  })

  const stats = [
    { value: `${deliveredCount}`, label: 'Orders Delivered' },
    { value: '4.9★', label: 'Avg Rating' },
    { value: '24h', label: 'Fast Turnaround' },
    { value: '100%', label: 'Quality Checked' },
  ]

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#1A1A1A]">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#6EC30B 1px, transparent 1px), linear-gradient(90deg, #6EC30B 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full bg-[#6EC30B] opacity-[0.08] blur-3xl" />
      <div className="absolute right-0 -bottom-40 h-[500px] w-[500px] rounded-full bg-[#6EC30B] opacity-[0.06] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6EC30B] opacity-[0.04] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        {/* Top badge */}
        {/* <div className="mb-10 flex justify-center lg:justify-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6EC30B]/40 bg-[#6EC30B]/10 px-5 py-2 text-sm font-medium text-[#6EC30B]">
            <Star className="h-3.5 w-3.5 fill-[#6EC30B]" />
            #1 Custom 3D Printing Shop in the Philippines
            <span className="ml-1 rounded-full bg-[#6EC30B] px-2 py-0.5 text-xs font-bold text-black">NEW</span>
          </div>
        </div> */}

        {/* Main two-column layout */}
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-12">
          {/* Left: content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-6xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl">
              Print Your
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#6EC30B] via-[#94e04a] to-[#6EC30B] bg-clip-text text-transparent">
                  Vision
                </span>
                {/* Underline accent */}
                <span className="absolute right-0 -bottom-2 left-0 h-1 rounded-full bg-gradient-to-r from-[#6EC30B] to-transparent" />
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-lg text-xl leading-relaxed text-slate-400 lg:mx-0">
              Custom 3D-Printed Keychains, Fidgets, Name Plates, Souvenirs, Desk Accessories & More.
              Personalized designs for gifts, events, businesses, and everyday use.
              {/* Designed with care, printed with precision, delivered to your door. */}
            </p>

            {/* Feature list */}
            <div className="mt-8 flex flex-col gap-3">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center justify-center gap-3 lg:justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6EC30B]/15">
                    <Icon className="h-4 w-4 text-[#6EC30B]" />
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/products">
                <Button
                  size="lg"
                  className="group gap-2 px-8 py-4 text-base shadow-lg shadow-[#6EC30B]/20"
                >
                  Browse Products
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              {!isViewPageMode && (
                <Link href="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 px-8 py-4 text-base text-slate-300 hover:border-[#6EC30B]/50 hover:bg-[#6EC30B]/10 hover:text-white"
                  >
                    Start Custom Order
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right: hero illustration */}
          <div className="relative w-full max-w-[520px] flex-shrink-0 lg:w-[520px]">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#6EC30B]/30 via-[#6EC30B]/10 to-transparent blur-2xl" />

            {/* Card frame */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-1 shadow-2xl">
              {/* Inner accent border */}
              <div className="relative overflow-hidden rounded-[1.75rem] bg-[#111] p-6">
                {/* Scanline overlay for tech feel */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
                  }}
                />
                <Image
                  src="/images/background.png"
                  alt="KAI3D 3D Printer"
                  width={520}
                  height={520}
                  className="relative w-full drop-shadow-2xl"
                  priority
                />
                {/* Bottom gradient fade */}
                <div className="absolute right-0 bottom-0 left-0 h-20 bg-gradient-to-t from-[#111] to-transparent" />
              </div>
            </div>

            {/* Floating badge — top right */}
            {/* <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1A1A1A]/90 px-4 py-2.5 shadow-xl backdrop-blur-sm">
              <span className="text-2xl">🖨️</span>
              <div>
                <p className="text-xs font-semibold text-white">Bambu Lab X1C</p>
                <p className="text-xs text-[#6EC30B]">● Printing now</p>
              </div>
            </div> */}

            {/* Floating badge — bottom left */}
            {/* <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1A1A1A]/90 px-4 py-2.5 shadow-xl backdrop-blur-sm">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-xs font-semibold text-white">Order #KAI-0421</p>
                <p className="text-xs text-slate-400">Ready for pickup</p>
              </div>
            </div> */}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="bg-[#1A1A1A] px-6 py-6 text-center">
              <p className="text-3xl font-extrabold text-[#6EC30B]">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Category quick links */}
        {/* <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Keychains', emoji: '🔑', slug: 'keychains' },
            { label: 'Figurines', emoji: '🎭', slug: 'figurines' },
            { label: 'Name Plates', emoji: '🏷️', slug: 'name-plates' },
            { label: 'Custom', emoji: '✨', slug: 'custom' },
          ].map(({ label, emoji, slug }) => (
            <Link
              key={slug}
              href={`/products?category=${slug}`}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition-all hover:border-[#6EC30B]/50 hover:bg-[#6EC30B]/10"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                {label}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:text-[#6EC30B] group-hover:opacity-100" />
            </Link>
          ))}
        </div> */}
      </div>
    </section>
  )
}
