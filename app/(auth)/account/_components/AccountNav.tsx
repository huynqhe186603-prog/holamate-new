'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bookmark, GraduationCap, MessageSquare, Shield, ShoppingBag, Store, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE_NAV = [
  { href: '/account', label: 'Hồ sơ', icon: User, exact: true },
  { href: '/account/security', label: 'Bảo mật', icon: Shield, exact: false },
  { href: '/account/verify-student', label: 'Xác thực SV', icon: GraduationCap, exact: false },
  { href: '/account/orders', label: 'Đơn hàng', icon: ShoppingBag, exact: false },
  { href: '/account/reviews', label: 'Review của tôi', icon: MessageSquare, exact: false },
  { href: '/account/saved', label: 'Đã lưu', icon: Bookmark, exact: false },
]

interface AccountNavProps {
  name: string | null
  avatarUrl: string | null
  isStudent: boolean
  role: string | null
}

export function AccountNav({ name, avatarUrl, isStudent, role }: AccountNavProps) {
  const pathname = usePathname()
  const initials = name?.[0]?.toUpperCase() ?? 'U'

  const showBecomeSeller = role !== 'seller' && role !== 'admin'
  const navItems = showBecomeSeller
    ? [...BASE_NAV, { href: '/account/become-seller', label: 'Đăng ký bán hàng', icon: Store, exact: false }]
    : BASE_NAV

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="space-y-1">
      {/* User card — desktop only */}
      <div className="hidden sm:flex items-center gap-3 px-3 py-3 mb-3 rounded-2xl bg-neutral-50 border border-neutral-100">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/10 shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name ?? 'Avatar'} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{initials}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{name ?? 'Người dùng'}</p>
          {isStudent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 mt-0.5">
              <GraduationCap className="w-2.5 h-2.5" />
              Sinh viên
            </span>
          )}
        </div>
      </div>

      {/* Mobile: horizontal scroll tabs */}
      <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none mb-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary/40'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden sm:flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
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
      </div>
    </nav>
  )
}
