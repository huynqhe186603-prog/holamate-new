import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { LogoutButton } from '@/components/shared/LogoutButton'
import { LogoBrand } from '@/components/shared/LogoBrand'
import { cn } from '@/lib/utils'
import { Utensils, MessageSquare, Sparkles, Store, ShoppingBag } from 'lucide-react'
import { NotificationBell } from '@/components/shared/NotificationBell'

const NAV_LINKS = [
  { href: '/explore', label: 'Khám phá', icon: Utensils },
  { href: '/reviews', label: 'Review', icon: MessageSquare },
  { href: '/ai', label: 'Trợ lý AI', icon: Sparkles },
]

export async function Navbar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const sellerHref = !user
    ? '/login?redirect=/account/become-seller'
    : profile?.role === 'admin'
      ? '/admin/dashboard'
      : profile?.role === 'seller'
        ? '/seller/dashboard'
        : '/account/become-seller'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <LogoBrand size={40} />

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
          <Link
            href={sellerHref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            Người bán
          </Link>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-2">
          {user && profile ? (
            <>
              <NotificationBell userId={user.id} />

              <Link
                href="/account/orders"
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Đơn hàng của tôi"
              >
                <ShoppingBag className="w-4 h-4" />
              </Link>

              <Link
                href="/account"
                className="flex items-center rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                aria-label="Tài khoản của tôi"
              >
                <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </span>
              </Link>

              <LogoutButton />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 px-3 text-sm')}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'sm' }), 'h-8 px-3 text-sm font-medium')}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="sm:hidden flex items-center justify-around border-t border-neutral-100 py-2 bg-white">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-neutral-500 hover:text-primary transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
        <Link
          href={sellerHref}
          className="flex flex-col items-center gap-0.5 px-4 py-1 text-neutral-500 hover:text-primary transition-colors"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium">Người bán</span>
        </Link>
      </div>
    </header>
  )
}
