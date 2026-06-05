import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { DeleteReviewButton } from '../_components/DeleteReviewButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { REVIEWS_SELECT, type ReviewWithRelations } from '@/lib/utils/reviews'
import { PenLine, MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Review của tôi' }

export default async function MyReviewsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/reviews')

  const { data: reviews } = await supabase
    .from('reviews')
    .select(REVIEWS_SELECT)
    .eq('user_id', user.id)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })
    .limit(30)

  const list = (reviews ?? []) as ReviewWithRelations[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Review của tôi</h1>
          <p className="text-sm text-neutral-500 mt-1">{list.length} review</p>
        </div>
        <Link href="/reviews/write" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 h-9 font-medium')}>
          <PenLine className="w-3.5 h-3.5" />
          Viết review
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-neutral-200">
          <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto" />
          <div>
            <p className="font-medium text-neutral-600">Chưa có review nào</p>
            <p className="text-sm text-neutral-400 mt-1">Chia sẻ trải nghiệm của bạn với cộng đồng!</p>
          </div>
          <Link href="/reviews/write" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 h-9')}>
            <PenLine className="w-3.5 h-3.5" />
            Viết review đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(review => (
            <div key={review.id} className="relative">
              <ReviewCard
                review={review}
                currentUserId={user.id}
                userVoteScore={null}
                showSubject={true}
              />
              {/* Delete button overlay */}
              {review.status !== 'removed' && (
                <div className="absolute top-4 right-4">
                  <DeleteReviewButton reviewId={review.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
