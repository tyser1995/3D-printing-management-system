import { ShoppingCart, Printer, Package } from 'lucide-react'

const steps = [
  {
    icon: ShoppingCart,
    step: '01',
    title: 'Browse & Order',
    description:
      'Browse our catalog or submit a custom order. Upload your design files or describe what you need.',
  },
  {
    icon: Printer,
    step: '02',
    title: 'We Print & Inspect',
    description:
      'Your order enters the print queue. We print using high-quality filaments and inspect every piece.',
  },
  {
    icon: Package,
    step: '03',
    title: 'Packed & Delivered',
    description:
      'We pack your prints carefully and ship them straight to your door. Track every step in real time.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wider text-orange-500 uppercase">
            Simple Process
          </p>
          <h2 className="mt-2 text-4xl font-bold text-slate-900">How it works</h2>
          <p className="mt-4 text-lg text-slate-500">
            Get your custom 3D prints in three easy steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, description }, index) => (
            <div key={title} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-full hidden h-px w-full -translate-x-1/2 border-t-2 border-dashed border-slate-200 md:block" />
              )}

              <div className="text-center">
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25">
                  <Icon className="h-9 w-9 text-white" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {step}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
