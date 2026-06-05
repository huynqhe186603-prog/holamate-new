'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Store, UtensilsCrossed, ShoppingBag, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/seller/vendors',   label: 'Quán/G.hàng',  icon: Store,           exact: false },
  { href: '/seller/menu',      label: 'Menu',          icon: UtensilsCrossed, exact: false },
  { href: '/seller/orders',    label: 'Đơn hàng',      icon: ShoppingBag,     exact: false },
] as const

interface SellerNavProps {
  name: string | null
  avatarUrl: string | null
}

export function SellerNav({ name, avatarUrl }: SellerNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = name?.[0]?.toUpperCase() ?? 'S'

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden sm:flex flex-col w-52 shrink-0">
        {/* Seller profile */}
        <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-2xl bg-neutral-50 border border-neutral-100">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-primary/10 shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name ?? 'Seller'} fill className="object-cover" sizes="36px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-900 truncate">{name ?? 'Người bán'}</p>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">Seller</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : 'text-neutral-400')} />
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-2"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-neutral-200 flex items-center justify-around px-2 py-1.5 safe-area-inset-bottom">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors',
                active ? 'text-primary' : 'text-neutral-400 hover:text-neutral-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
