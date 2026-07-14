import { Printer, Package, Calculator, BarChart3, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Printer,
    title: 'High-Quality Printing',
    description:
      'Using Bambu Lab printers for precision prints with fine layer resolution and vibrant colors.',
  },
  {
    icon: Package,
    title: 'Real-Time Order Tracking',
    description:
      'Track your order from placement to delivery with live status updates at every stage.',
  },
  {
    icon: Calculator,
    title: 'Transparent Pricing',
    description:
      'Instant cost calculation based on filament, print time, and complexity. No hidden fees.',
  },
  {
    icon: Zap,
    title: 'Fast Turnaround',
    description: 'Most standard orders are completed within 24–48 hours of confirmation.',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description:
      "Each print goes through quality inspection. We reprint at no cost if you're not satisfied.",
  },
  {
    icon: BarChart3,
    title: 'Full Management System',
    description:
      'Complete dashboard for print queue, inventory, cost tracking, and business reports.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 py-20" hidden>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-orange-500 uppercase">
            Why Kai3D
          </p>
          <h2 className="mt-2 text-4xl font-bold text-slate-900">
            Everything you need in one platform
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            From storefront to production management — Kai3D handles it all.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
