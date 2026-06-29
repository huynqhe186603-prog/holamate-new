'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'

export default function SetupForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ email, password })
      if (updateErr) {
        if (updateErr.message.toLowerCase().includes('email')) {
          setError('Email này đã được sử dụng hoặc không hợp lệ. Vui lòng thử email khác.')
        } else {
          setError(updateErr.message)
        }
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('profiles').update({ is_temp_account: false } as any).eq('id', user.id)
      }

      setSuccess(true)
      setTimeout(() => router.push('/seller/dashboard'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 mb-4">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Thiết lập tài khoản</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Đổi email và mật khẩu tạm thời để bảo mật tài khoản của bạn.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
            <p className="font-semibold text-green-700">Cập nhật thành công!</p>
            <p className="text-sm text-green-600 mt-1">Đang chuyển về dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email mới
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90 disabled:opacity-60 transition mt-2"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
