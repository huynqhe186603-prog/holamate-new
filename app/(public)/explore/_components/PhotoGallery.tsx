'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Photo = {
  id: string
  image_url: string
  caption: string | null
  media_type: string
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  const prev = useCallback(() => setLightbox(i => (i !== null && i > 0 ? i - 1 : i)), [])
  const next = useCallback(
    () => setLightbox(i => (i !== null && i < photos.length - 1 ? i + 1 : i)),
    [photos.length],
  )

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  // Scroll active thumbnail into view
  useEffect(() => {
    if (lightbox === null || !thumbRef.current) return
    const active = thumbRef.current.children[lightbox] as HTMLElement | undefined
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [lightbox])

  if (photos.length === 0) return null

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx > 50) prev()
    else if (dx < -50) next()
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div
        className={cn(
          'grid gap-2',
          photos.length === 1 ? 'grid-cols-1' :
          photos.length === 2 ? 'grid-cols-2' :
          'grid-cols-3',
        )}
      >
        {photos.slice(0, 6).map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setLightbox(i)}
            className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 group"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption ?? 'Ảnh quán'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 33vw, 200px"
            />
            {i === 5 && photos.length > 6 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{photos.length - 6}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center select-none"
          onClick={() => setLightbox(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/50 text-white text-sm font-semibold tabular-nums pointer-events-none">
            {lightbox + 1} / {photos.length}
          </div>

          {/* Close */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(null) }}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            disabled={lightbox === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Main image */}
          <div
            className="relative w-[95vw] h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={photos[lightbox].image_url}
              alt={photos[lightbox].caption ?? 'Ảnh quán'}
              fill
              className="object-contain"
              sizes="95vw"
              priority
            />
          </div>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); next() }}
            disabled={lightbox === photos.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Thumbnail strip */}
          <div
            ref={thumbRef}
            className="absolute bottom-4 flex gap-2 overflow-x-auto max-w-[90vw] px-4 scrollbar-none"
            onClick={e => e.stopPropagation()}
          >
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(i)}
                className={cn(
                  'relative w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-150',
                  i === lightbox
                    ? 'border-2 border-white opacity-100 scale-110'
                    : 'border border-white/20 opacity-50 hover:opacity-90',
                )}
              >
                <Image
                  src={photo.image_url}
                  alt={photo.caption ?? ''}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>

          {/* Caption */}
          {photos[lightbox].caption && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 text-white/80 text-sm max-w-sm text-center pointer-events-none">
              {photos[lightbox].caption}
            </div>
          )}
        </div>
      )}
    </>
  )
}
