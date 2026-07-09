import { Suspense } from 'react'
import type { Metadata } from 'next'
import AiLabClient from './AiLabClient'

export const metadata: Metadata = {
  title: 'AI Lab — Image to 3D | Kai3D',
  description:
    'Upload any image and let our AI turn it into a printable 3D model — keychain, clicker, keycap, or nameplate.',
}

export default function AiLabPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Hero */}
      <div className="border-b border-slate-800 px-4 py-16 text-center sm:px-6">
        <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-400 uppercase">
          Phase 3 · AI Lab
        </span>
        <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
          Image <span className="text-orange-400">→</span> 3D Model
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Upload a PNG, JPG, or SVG and let our AI convert it into a print-ready 3D model. Choose
          your product type and download the STL or 3MF file.
        </p>
      </div>

      {/* Client interaction */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Suspense>
          <AiLabClient />
        </Suspense>
      </div>

      {/* Info section */}
      <div className="border-t border-slate-800 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Upload Image',
                desc: 'Upload any PNG, JPG, or SVG file. Works best with flat logos, icons, or simple illustrations.',
              },
              {
                step: '02',
                title: 'Choose Product',
                desc: 'Select what you want to make: a keychain, clicker, keycap, or nameplate.',
              },
              {
                step: '03',
                title: 'Download & Print',
                desc: 'Our AI generates the STL/3MF file. Download it and send directly to your Bambu Lab printer.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <span className="text-3xl font-black text-orange-500">{step}</span>
                <h3 className="mt-3 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
            <p className="text-sm text-orange-300">
              <strong>Supported formats:</strong> PNG · JPG · SVG &nbsp;·&nbsp;
              <strong>Output:</strong> STL · 3MF &nbsp;·&nbsp;
              <strong>Compatible:</strong> Bambu Lab A1 · A1 Mini · P1P · P1S · X1 Carbon · H2D
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
