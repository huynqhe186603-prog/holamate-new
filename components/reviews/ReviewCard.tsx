import Image from 'next/image'
import Link from 'next/link'
import { Store, GraduationCap, UtensilsCrossed } from 'lucide-react'
import { StarRating } from '@/components/explore/StarRating'
import { VoteButton } from '@/components/reviews/VoteButton'
import { ReportButton } from '@/components/reviews/ReportButton'
import {
  getReviewerName,
  getReviewSubject,
  formatRelativeTime,
  type ReviewWithRelations,
} from '@/lib/utils/reviews'

interface ReviewCardProps {
  review: ReviewWithRelations
  currentUserId: string | null
  userVoteScore: number | null
  showSubject?: boolean
}

export function ReviewCard({
  review,
  currentUserId,
  userVoteScore,
  showSubject = true,
}: ReviewCardProps) {
  const name = getReviewerName(review)
  const subject = getReviewSubject(review)
  const visibleMedia = review.review_media.filter(m => m.status === 'visible')
  const initials = name[0]?.toUpperCase() ?? 'U'

  const vendorHref = review.vendors
    ? review.vendors.vendor_type === 'student_booth'
      ? `/explore/booths/${review.vendors.id}`
      : `/explore/vendors/${review.vendors.id}`
    : null

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 space-y-3.5 hover:border-neutral-300 transition-colors">
      {/* Reviewer + meta */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {!review.is_anonymous && review.profiles?.avatar_url ? (
            <div className="relative w-9 h-9 rounded-full overflow-hidden">
              <Image
                src={review.profiles.avatar_url}
                alt={name}
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{initials}</span>
            </div>
          )}
        </div>

        {/* Name + time + subject */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900">{name}</span>
            {review.is_anonymous && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-medium">
                Ẩn danh
              </span>
            )}
            <span className="text-xs text-neutral-400">{formatRelativeTime(review.created_at)}</span>
          </div>

          {showSubject && vendorHref && (
            <Link
              href={vendorHref}
              className="flex items-center gap-1 mt-0.5 text-xs text-neutral-500 hover:text-primary transition-colors"
            >
              {review.review_type === 'menu_item' ? (
                <UtensilsCrossed className="w-3 h-3 shrink-0" />
              ) : review.vendors?.vendor_type === 'student_booth' ? (
                <GraduationCap className="w-3 h-3 shrink-0" />
              ) : (
                <Store className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{subject}</span>
            </Link>
          )}
        </div>

        {/* Rating */}
        <StarRating rating={review.rating} size="sm" className="shrink-0" />
      </div>

      {/* Content */}
      {review.content && (
        <p className="text-sm text-neutral-700 leading-relaxed">{review.content}</p>
      )}

      {/* Media */}
      {visibleMedia.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {visibleMedia.slice(0, 4).map(media => (
            <div key={media.id} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
              <Image
                src={media.image_url}
                alt="Ảnh review"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
          {visibleMedia.length > 4 && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-neutral-500">+{visibleMedia.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1 border-t border-neutral-50">
        <VoteButton
          reviewId={review.id}
          reviewUserId={review.user_id}
          currentUserId={currentUserId}
          avgScore={review.avg_vote_score}
          voteCount={review.vote_count}
          userVoteScore={userVoteScore}
        />
        <div className="flex-1" />
        <ReportButton reviewId={review.id} currentUserId={currentUserId} />
      </div>
    </div>
  )
}

export function ReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-neutral-200 rounded w-28" />
          <div className="h-3 bg-neutral-100 rounded w-40" />
        </div>
        <div className="h-3 bg-neutral-100 rounded w-16" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-neutral-100 rounded w-full" />
        <div className="h-3 bg-neutral-100 rounded w-3/4" />
      </div>
      <div className="h-3 bg-neutral-50 rounded w-24 pt-1 border-t border-neutral-50" />
    </div>
  )
}
