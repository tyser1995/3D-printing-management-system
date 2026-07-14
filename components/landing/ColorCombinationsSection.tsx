import Image from 'next/image'

const combinations = [
  { src: '/images/Kai3d-color-combination.png', alt: 'Popular clicker color combination example' },
  {
    src: '/images/Kai3d-color-combination-2.png',
    alt: 'Another popular clicker color combination example',
  },
]

export default function ColorCombinationsSection() {
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
            customers love.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {combinations.map(({ src, alt }) => (
            <div
              key={src}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
            >
              <Image src={src} alt={alt} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
