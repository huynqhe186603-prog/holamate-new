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
import { useEffect, useState } from 'react'

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
  const [newOrderCount, setNewOrderCount] = useState(0)

  // Fetch pending order count + subscribe to realtime
  useEffect(() => {
    const supabase = createClient()
    let channels: ReturnType<typeof supabase.channel>[] = []

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
      if (!seller) return
      const { data: roles } = await supabase.from('seller_vendor_roles').select('vendor_id').eq('seller_id', seller.id)
      const ids = (roles ?? []).map((r: any) => r.vendor_id as string)
      if (!ids.length) return

      // Initial count of submitted orders
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('vendor_id', ids)
        .eq('status', 'submitted')
      setNewOrderCount(count ?? 0)

      // Realtime: increment on new order, decrement when order leaves submitted status
      channels = ids.map(vid =>
        supabase
          .channel(`nav-orders-${vid}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vid}` }, () => {
            setNewOrderCount(prev => prev + 1)
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vid}` }, (payload) => {
            const updated = payload.new as any
            const old = payload.old as any
            if (old.status === 'submitted' && updated.status !== 'submitted') {
              setNewOrderCount(prev => Math.max(0, prev - 1))
            }
          })
          .subscribe()
      )
    }

    init()
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [])

  // Reset badge when user is on the orders page
  useEffect(() => {
    if (pathname.startsWith('/seller/orders')) {
      setNewOrderCount(0)
    }
  }, [pathname])

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
            const isOrders = href === '/seller/orders'
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
                {isOrders && newOrderCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                    {newOrderCount > 99 ? '99+' : newOrderCount}
                  </span>
                )}
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
          const isOrders = href === '/seller/orders'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative',
                active ? 'text-primary' : 'text-neutral-400 hover:text-neutral-700'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isOrders && newOrderCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
                    {newOrderCount > 9 ? '9+' : newOrderCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
