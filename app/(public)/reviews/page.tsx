import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewCard, ReviewCardSkeleton } from '@/components/reviews/ReviewCard'
import { ReviewTabs } from './_components/ReviewTabs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { REVIEWS_SELECT, type ReviewWithRelations } from '@/lib/utils/reviews'
import { PenLine } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Review cộng đồng',
  description: 'Đánh giá thật từ sinh viên Hòa Lạc — quán ăn, gian hàng sinh viên và từng món.',
}

const PAGE_SIZE = 10

interface ReviewsPageProps {
  searchParams: {
    tab?: string
    page?: string
  }
}

async function ReviewList({ searchParams }: ReviewsPageProps) {
  const supabase = createClient()
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  const { data: { user } } = await supabase.auth.getUser()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(REVIEWS_SELECT)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error || !reviews) {
    return <p className="text-center text-sm text-neutral-400 py-10">Không thể tải dữ liệu.</p>
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-5xl">💬</div>
        <p className="font-medium text-neutral-700">Chưa có review nào</p>
        <p className="text-sm text-neutral-400">Hãy là người đầu tiên viết review!</p>
      </div>
    )
  }

  const voteMap: Record<string, number> = {}
  if (user) {
    const reviewIds = reviews.map((r: any) => r.id)
    const { data: votes } = await supabase
      .from('review_votes')
      .select('review_id, score')
      .eq('user_id', user.id)
      .in('review_id', reviewIds)
    ;(votes ?? []).forEach((v: any) => { voteMap[v.review_id] = v.score })
  }

  const hasMore = reviews.length === PAGE_SIZE

  return (
    <div className="space-y-4">
      {(reviews as ReviewWithRelations[]).map(review => (
        <ReviewCard
          key={review.id}
          review={review}
          currentUserId={user?.id ?? null}
          userVoteScore={voteMap[review.id] ?? null}
          showSubject={true}
        />
      ))}

      {(hasMore || page > 1) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {page > 1 && (
            <Link
              href={`/reviews?page=${page - 1}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              ← Trang trước
            </Link>
          )}
          {hasMore && (
            <Link
              href={`/reviews?page=${page + 1}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Xem thêm →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <ReviewCardSkeleton key={i} />)}
    </div>
  )
}

export default function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const tab = searchParams.tab ?? 'latest'

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Review cộng đồng</h1>
          <p className="mt-1 text-sm text-neutral-500">Đánh giá thật từ sinh viên Hòa Lạc</p>
        </div>
        <Link
          href="/reviews/write"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-2 font-medium h-9')}
        >
          <PenLine className="w-3.5 h-3.5" />
          Viết review
        </Link>
      </div>

      {/* Tabs + grouped content (vendor/menu_item handled inside ReviewTabs) */}
      <Suspense>
        <ReviewTabs activeTab={tab} />
      </Suspense>

      {/* Latest review list — only for 'latest' tab */}
      {tab === 'latest' && (
        <div className="mt-6">
          <Suspense fallback={<ReviewListSkeleton />}>
            <ReviewList searchParams={searchParams} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
