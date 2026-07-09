'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterInput) => {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
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
          <div className="mb-4 text-5xl">📧</div>
          <h2 className="text-xl font-bold text-white">Check your email</h2>
          <p className="mt-2 text-slate-400">
            We sent a confirmation link to your email. Click it to activate your account.
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
        <h1 className="text-3xl font-bold text-white">Create account</h1>
        <p className="mt-2 text-slate-400">Start ordering custom 3D prints today</p>
      </div>

      <Card className="border-white/10 bg-white/5 text-white">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="Juan dela Cruz"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#6EC30B] hover:text-[#94e04a]">
          Sign in
        </Link>
      </p>
    </div>
  )
}
