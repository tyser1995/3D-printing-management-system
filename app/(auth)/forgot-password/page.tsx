'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    })
    if (authError) {
      setError(authError.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <Card className="text-center">
          <div className="mb-4 text-5xl">📬</div>
          <h2 className="text-xl font-bold text-slate-900">Reset link sent</h2>
          <p className="mt-2 text-slate-500">
            Check your email for the password reset link. It expires in 1 hour.
          </p>
          <Link href="/login" className="mt-6 block">
            <Button variant="outline" fullWidth>
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-slate-500">Enter your email and we&apos;ll send you a reset link</p>
      </div>

      <Card>
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            <Send className="h-4 w-4" />
            Send Reset Link
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember it now?{' '}
        <Link href="/login" className="font-medium text-orange-500 hover:text-orange-600">
          Sign in
        </Link>
      </p>
    </div>
  )
}
