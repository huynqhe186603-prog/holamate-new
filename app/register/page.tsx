'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.')
      return
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email.')
      return
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already')) {
        setError('Email này đã được đăng ký. Bạn thử đăng nhập nhé.')
      } else if (signUpError.message.includes('invalid')) {
        setError('Email không hợp lệ.')
      } else if (signUpError.message.includes('weak')) {
        setError('Mật khẩu quá yếu. Vui lòng dùng mật khẩu mạnh hơn.')
      } else if (signUpError.message.includes('rate')) {
        setError('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.')
      }
    } else if (data.session) {
      router.push('/')
      router.refresh()
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  async function signInWithGoogle() {
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError('Không thể đăng nhập với Google.')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-xl font-semibold">Kiểm tra email của bạn</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Chúng tôi đã gửi link xác nhận đến {email}
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push('/login')}>
            Về trang đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-base">H</span>
            </div>
            <span className="text-xl font-semibold text-neutral-900">HolaMate</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-neutral-900">Tạo tài khoản</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Miễn phí — dành cho sinh viên Hòa Lạc</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-2.5 font-medium"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Tiếp tục với Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-neutral-400">hoặc</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="pl-9 h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="you@example.com"
                  className="pl-9 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-medium" disabled={loading || googleLoading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang tạo tài khoản…</>
                : 'Tạo tài khoản'}
            </Button>
          </form>

          <p className="text-center text-xs text-neutral-400">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <Link href="/terms" className="underline hover:text-neutral-600">
              Điều khoản dịch vụ
            </Link>{' '}
            của HolaMate.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
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
