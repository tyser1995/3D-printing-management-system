'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      {isDevMode && (
        <div className="mb-6 rounded-lg border border-[#6EC30B]/30 bg-[#6EC30B]/10 p-4">
          <p className="mb-3 text-xs font-semibold tracking-wider text-[#6EC30B] uppercase">
            ⚡ Dev Mode — Supabase not configured
          </p>
          <Button
            type="button"
            fullWidth
            className="gap-2"
            onClick={() => router.push('/admin/dashboard')}
          >
            <Zap className="h-4 w-4" />
            Enter Admin Panel
          </Button>
        </div>
      )}

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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
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
          <div className="mt-2 flex justify-end">
            <Link href="/forgot-password" className="text-sm text-[#6EC30B] hover:text-[#94e04a]">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-[#6EC30B] hover:text-[#94e04a]">
          Create one free
        </Link>
      </p>
    </Card>
  )
}
