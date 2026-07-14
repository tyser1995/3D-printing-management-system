'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'

const combinations = [
  { src: '/images/Kai3d-color-combination.png', alt: 'Popular clicker color combination example' },
  {
    src: '/images/Kai3d-color-combination-2.png',
    alt: 'Another popular clicker color combination example',
  },
]

export default function ColorCombinationsSection() {
  const [activeSrc, setActiveSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!activeSrc) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSrc(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeSrc])

  const active = combinations.find((c) => c.src === activeSrc)

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-orange-500 uppercase">
            Style Guide
          </p>
          <h2 className="mt-2 text-4xl font-bold text-slate-900">Color Combination Ideas</h2>
          <p className="mt-4 text-lg text-slate-500">
            Not sure which colors to pick for your clicker? Here are a few combinations our
            customers love. Click an image to view it larger.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {combinations.map(({ src, alt }) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveSrc(src)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveSrc(null)}
        >
          <button
            type="button"
            onClick={() => setActiveSrc(null)}
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative h-[85vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.src}
              alt={active.alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </section>
  )
}
