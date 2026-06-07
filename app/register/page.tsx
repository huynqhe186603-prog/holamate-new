'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  email: z.string().min(1, 'Nhập email').includes('@', { message: 'Email không hợp lệ' }),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Cần ít nhất 1 chữ số'),
})
type RegisterData = z.infer<typeof registerSchema>

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  const supabase = createClient()

  async function onSubmit(data: RegisterData) {
    setServerError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
    if (error) {
      setServerError(
        error.message.includes('already registered')
          ? 'Email này đã được đăng ký. Hãy đăng nhập.'
          : 'Đăng ký thất bại. Vui lòng thử lại.'
      )
      return
    }
    setSuccess(true)
  }

  async function signUpWithGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
    if (error) {
      setServerError('Không thể đăng ký với Google.')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Kiểm tra email của bạn</h2>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            Chúng tôi đã gửi link xác nhận đến email của bạn.
            <br />
            Nhấp vào link để hoàn tất đăng ký.
          </p>
          <Button variant="outline" className="mt-6 w-full h-11" onClick={() => router.push('/login')}>
            Về trang đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
              <Image src="/logo.jpg" alt="HolaMate" width={36} height={36} className="object-cover w-full h-full" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-neutral-900">HolaMate</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-neutral-900">Tạo tài khoản</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Miễn phí — dành cho sinh viên Hòa Lạc</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-2.5 font-medium"
            onClick={signUpWithGoogle}
            disabled={googleLoading || isSubmitting}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Tiếp tục với Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-neutral-400 shrink-0">hoặc</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-sm font-medium text-neutral-700">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input id="full_name" type="text" autoComplete="name" placeholder="Nguyễn Văn A" className="pl-9 h-11" {...register('full_name')} />
              </div>
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9 h-11" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-neutral-700">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input id="password" type="password" autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" className="pl-9 h-11" {...register('password')} />
              </div>
              {errors.password
                ? <p className="text-xs text-red-500">{errors.password.message}</p>
                : <p className="text-xs text-neutral-400">Ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số</p>
              }
            </div>

            <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting || googleLoading}>
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang tạo tài khoản…</>
                : 'Tạo tài khoản'
              }
            </Button>
          </form>

          <p className="text-center text-xs text-neutral-400 leading-relaxed">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <button className="underline underline-offset-2 hover:text-neutral-600">Điều khoản dịch vụ</button>{' '}
            của HolaMate.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Đã có tài khoản?{' '}
          <Link href={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`} className="font-medium text-primary hover:underline underline-offset-4">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
