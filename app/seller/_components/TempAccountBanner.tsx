'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

const STORAGE_KEY = 'hide_temp_banner'

export function TempAccountBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hidden = sessionStorage.getItem(STORAGE_KEY) === 'true'
    setVisible(!hidden)
  }, [])

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="mx-auto max-w-6xl flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="flex-1 text-sm text-amber-800">
          Bạn đang dùng{' '}
          <span className="font-semibold">tài khoản tạm thời</span>.
          Vui lòng đổi email và mật khẩu để bảo mật tài khoản.
        </p>
        <Link
          href="/seller/setup"
          className="shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          Đổi ngay →
        </Link>
        <button
          onClick={dismiss}
          className="shrink-0 text-amber-500 hover:text-amber-700 transition ml-1"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
