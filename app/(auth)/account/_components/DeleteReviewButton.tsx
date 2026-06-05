'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('reviews').delete().eq('id', reviewId)
    router.refresh()
  }

  if (confirming && !loading) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Huỷ
        </button>
        <button
          onClick={handleDelete}
          className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          Xác nhận xóa
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      Xóa
    </button>
  )
}
