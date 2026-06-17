'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Shield } from 'lucide-react'

export default function SecurityPage() {
  const supabase = createClient()
  const [isGoogleUser, setIsGoogleUser] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [show, setShow] = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setIsGoogleUser(user.app_metadata?.provider === 'google')
      setUserEmail(user.email ?? null)
    })
  }, [supabase])

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!form.currentPassword) errs.currentPassword = 'Nhập mật khẩu hiện tại'
    if (form.newPassword.length < 6) errs.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự'
    if (form.confirmPassword !== form.newPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)

    // Verify current password via re-auth before updating
    const { data: { user } } = await supabase.auth.getUser()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: form.currentPassword,
    })
    if (authError) {
      setErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: form.newPassword })
    setLoading(false)
    if (error) {
      setErrors({ newPassword: error.message })
    } else {
      showToast('Đổi mật khẩu thành công')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
  }

  if (isGoogleUser === null) {
    return <div className="py-16 text-center text-sm text-neutral-400">Đang tải...</div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Bảo mật tài khoản</h1>
        <p className="text-sm text-neutral-500 mt-1">Quản lý mật khẩu và phương thức đăng nhập</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
        {isGoogleUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Đăng nhập bằng Google</p>
                <p className="text-xs text-neutral-500">{userEmail}</p>
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-blue-800">
                Bạn đang dùng đăng nhập Google. Không cần mật khẩu cho HolaMate — mật khẩu được quản lý bởi tài khoản Google của bạn.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <h2 className="text-base font-semibold text-neutral-900">Đổi mật khẩu</h2>
            </div>

            <div className="space-y-4 max-w-sm">
              <div className="space-y-1">
                <label className="text-sm text-neutral-700">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Input
                    type={show.current ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
                    className={`pr-10 ${errors.currentPassword ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-neutral-700">Mật khẩu mới</label>
                <div className="relative">
                  <Input
                    type={show.new ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                    className={`pr-10 ${errors.newPassword ? 'border-red-400' : ''}`}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-neutral-700">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Input
                    type={show.confirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
