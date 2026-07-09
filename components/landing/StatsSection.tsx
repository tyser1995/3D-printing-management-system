const stats = [
  { value: '500+', label: 'Orders Delivered' },
  { value: '98%', label: 'Print Success Rate' },
  { value: '20+', label: 'Filament Colors' },
  { value: '48h', label: 'Avg. Turnaround' },
]

export default function StatsSection() {
  return (
    <section className="border-b border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-bold text-orange-500">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
