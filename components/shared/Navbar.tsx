import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutButton } from '@/components/shared/LogoutButton'
import { cn } from '@/lib/utils'
import { Utensils, MessageSquare, Sparkles, Store, User, ShoppingBag } from 'lucide-react'

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-xs leading-none">H</span>
          </div>
          <span className="font-semibold text-neutral-900 tracking-tight text-[15px]">
            HolaMate
          </span>
        </Link>

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
            href="/seller/dashboard"
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
              <Link
                href="/account/orders"
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Đơn hàng của tôi"
              >
                <ShoppingBag className="w-4 h-4" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center rounded-full hover:ring-2 hover:ring-primary/20 transition-all outline-none"
                  render={
                    <button aria-label="Menu tài khoản" />
                  }
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? 'Avatar'} />
                    <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52 mt-1">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-neutral-900 truncate">
                        {profile.full_name ?? 'Người dùng'}
                      </span>
                      <span className="text-xs text-neutral-500 truncate">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="p-0">
                    <Link href="/account" className="flex items-center gap-2 px-1.5 py-1 w-full">
                      <User className="w-4 h-4" />
                      Tài khoản
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/account/orders" className="flex items-center gap-2 px-1.5 py-1 w-full">
                      <ShoppingBag className="w-4 h-4" />
                      Đơn hàng của tôi
                    </Link>
                  </DropdownMenuItem>

                  {(profile.role === 'seller' || profile.role === 'admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="p-0">
                        <Link href="/seller/dashboard" className="flex items-center gap-2 px-1.5 py-1 w-full">
                          <Store className="w-4 h-4" />
                          Quản lý quán
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {profile.role === 'admin' && (
                    <DropdownMenuItem className="p-0">
                      <Link href="/admin/dashboard" className="flex items-center gap-2 px-1.5 py-1 w-full">
                        <Sparkles className="w-4 h-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <LogoutButton />
                </DropdownMenuContent>
              </DropdownMenu>
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
          href="/seller/dashboard"
          className="flex flex-col items-center gap-0.5 px-4 py-1 text-neutral-500 hover:text-primary transition-colors"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-medium">Người bán</span>
        </Link>
      </div>
    </header>
  )
}
