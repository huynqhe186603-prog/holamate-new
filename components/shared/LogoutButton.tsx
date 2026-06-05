'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={loading}
      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2"
    >
      <LogOut className="w-4 h-4" />
      {loading ? 'Đang đăng xuất…' : 'Đăng xuất'}
    </DropdownMenuItem>
  )
}
