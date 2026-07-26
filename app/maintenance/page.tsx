import { Printer } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A] px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6EC30B]/15">
        <Printer className="h-8 w-8 text-[#6EC30B]" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">We&apos;ll be back shortly</h1>
      <p className="mt-3 max-w-md text-slate-400">
        KAI3D is undergoing scheduled maintenance. Thanks for your patience — please check back
        soon.
      </p>
    </div>
  )
}
