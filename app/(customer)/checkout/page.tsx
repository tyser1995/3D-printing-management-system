import { Suspense } from 'react'
import CheckoutForm from './CheckoutForm'

export const metadata = { title: 'Checkout | Kai3D' }

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-400">
          Loading...
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  )
}
