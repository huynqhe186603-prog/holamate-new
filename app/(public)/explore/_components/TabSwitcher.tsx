'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Store, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'fixed_shop', label: 'Quán ăn', icon: Store },
  { key: 'student_booth', label: 'Gian hàng SV', icon: GraduationCap },
] as const

export function TabSwitcher({ activeType }: { activeType: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const switchTab = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', type)
    ;['category', 'open_now', 'has_delivery', 'max_price', 'page'].forEach(k => params.delete(k))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex bg-neutral-100 rounded-xl p-1 gap-1">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => switchTab(key)}
          disabled={isPending}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
            activeType === key
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
