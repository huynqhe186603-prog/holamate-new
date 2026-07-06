'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const MONTH_LABELS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
]

export function MonthFilter({ currentMonth }: { currentMonth: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(month: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', month)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={currentMonth}
      onChange={e => handleChange(e.target.value)}
      className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white text-neutral-700
                 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
    >
      {MONTH_LABELS.map((label, i) => (
        <option key={i + 1} value={i + 1}>{label}</option>
      ))}
    </select>
  )
}
