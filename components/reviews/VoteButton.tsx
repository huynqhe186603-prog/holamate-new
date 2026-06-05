'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { StarPicker } from '@/components/reviews/StarPicker'

interface VoteButtonProps {
  reviewId: string
  reviewUserId: string
  currentUserId: string | null
  avgScore: number | null
  voteCount: number
  userVoteScore: number | null  // null = not voted yet
}

export function VoteButton({
  reviewId,
  reviewUserId,
  currentUserId,
  avgScore,
  voteCount,
  userVoteScore: initialVote,
}: VoteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userVote, setUserVote] = useState(initialVote)
  const [localAvg, setLocalAvg] = useState(avgScore)
  const [localCount, setLocalCount] = useState(voteCount)

  const isOwnReview = currentUserId === reviewUserId

  const handleOpen = () => {
    if (!currentUserId) { router.push('/login'); return }
    if (isOwnReview || userVote) return
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!picked || !currentUserId) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('review_votes').insert({
      review_id: reviewId,
      user_id: currentUserId,
      score: picked,
    })
    if (!error) {
      // Optimistic update
      const newCount = localCount + 1
      const newAvg = localAvg
        ? ((localAvg * localCount) + picked) / newCount
        : picked
      setLocalAvg(Math.round(newAvg * 10) / 10)
      setLocalCount(newCount)
      setUserVote(picked)
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isOwnReview}
        title={
          isOwnReview ? 'Không thể vote review của mình'
          : userVote ? `Bạn đã vote ${userVote} sao`
          : 'Vote mức độ hữu ích'
        }
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
          userVote
            ? 'border-amber-300 bg-amber-50 text-amber-700 font-semibold'
            : isOwnReview
            ? 'border-neutral-100 text-neutral-300 cursor-not-allowed'
            : 'border-neutral-200 text-neutral-500 hover:border-primary/40 hover:text-primary cursor-pointer'
        )}
      >
        <ThumbsUp className="w-3 h-3" />
        {localAvg ? (
          <span>{localAvg.toFixed(1)} ({localCount})</span>
        ) : (
          <span>{localCount > 0 ? `${localCount} vote` : 'Vote hữu ích'}</span>
        )}
        {userVote && <span>· {userVote}★</span>}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-semibold text-neutral-900 mb-1">Vote mức độ hữu ích</h3>
            <p className="text-sm text-neutral-500 mb-5">Đánh giá review này hữu ích như thế nào?</p>

            <div className="flex justify-center mb-6">
              <StarPicker value={picked} onChange={setPicked} size="lg" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-10 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={!picked || loading}
                className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
