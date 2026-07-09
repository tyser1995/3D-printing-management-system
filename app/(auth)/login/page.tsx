import { Suspense } from 'react'
import LoginForm from './LoginForm'
import Spinner from '@/components/ui/Spinner'

export const metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-slate-400">Sign in to your KAI3D account</p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
