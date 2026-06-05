import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { RatingSummary } from '@/components/reviews/RatingSummary'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { REVIEWS_SELECT, type ReviewWithRelations } from '@/lib/utils/reviews'
import { PenLine } from 'lucide-react'

interface ReviewSectionProps {
  vendorId: string
  vendorName: string
  limit?: number
}

export async function ReviewSection({ vendorId, vendorName, limit = 5 }: ReviewSectionProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(REVIEWS_SELECT)
    .eq('status', 'visible')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  const visible = (reviews ?? []) as ReviewWithRelations[]

  // Fetch user votes
  const voteMap: Record<string, number> = {}
  if (user && visible.length > 0) {
    const { data: votes } = await supabase
      .from('review_votes')
      .select('review_id, score')
      .eq('user_id', user.id)
      .in('review_id', visible.map(r => r.id))
    ;(votes ?? []).forEach((v: any) => { voteMap[v.review_id] = v.score })
  }

  return (
    <div>
      {/* Rating summary */}
      {visible.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
          <RatingSummary reviews={visible.map(r => ({ rating: r.rating }))} />
        </div>
      )}

      {/* Write review CTA */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">
          {visible.length > 0 ? `${visible.length} đánh giá gần nhất` : 'Chưa có đánh giá'}
        </p>
        <Link
          href={`/reviews/write?vendorId=${vendorId}`}
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1.5 h-8 text-xs')}
        >
          <PenLine className="w-3 h-3" />
          Viết review
        </Link>
      </div>

      {/* List */}
      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id ?? null}
              userVoteScore={voteMap[review.id] ?? null}
              showSubject={false}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center space-y-2">
          <p className="text-neutral-400 text-sm">Chưa có review nào cho {vendorName}</p>
          <Link
            href={`/reviews/write?vendorId=${vendorId}`}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 h-9')}
          >
            <PenLine className="w-3.5 h-3.5" />
            Viết review đầu tiên
          </Link>
        </div>
      )}
    </div>
  )
}
