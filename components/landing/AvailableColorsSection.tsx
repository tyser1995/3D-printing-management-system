import { prisma } from '@/lib/prisma/client'

export default async function AvailableColorsSection() {
  const filaments = await prisma.filament.findMany({
    where: { isActive: true, stockGrams: { gt: 0 } },
    select: { color: true, colorHex: true },
    distinct: ['color'],
    orderBy: { color: 'asc' },
  })

  if (filaments.length === 0) return null

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-orange-500 uppercase">
            In Stock Now
          </p>
          <h2 className="mt-2 text-4xl font-bold text-slate-900">Available Filament Colors</h2>
          <p className="mt-4 text-lg text-slate-500">
            Pick from our current color lineup, ready to print today.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {filaments.map(({ color, colorHex }) => (
            <div key={color} className="flex w-20 flex-col items-center gap-2 text-center">
              <div
                className="h-14 w-14 shrink-0 rounded-full border-2 border-slate-200 shadow-inner"
                style={{ background: colorHex ?? color }}
              />
              <p className="text-sm font-medium text-slate-700">{color}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
