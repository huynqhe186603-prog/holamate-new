'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkX, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function UnsaveButton({ savedId, className }: { savedId: string; className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUnsave = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('saved_vendors').delete().eq('id', savedId)
    router.refresh()
  }

  return (
    <button
      onClick={handleUnsave}
      disabled={loading}
      title="Bỏ lưu"
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50 backdrop-blur-sm',
        className
      )}
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <BookmarkX className="w-3 h-3" />}
      Bỏ lưu
    </button>
  )
}
