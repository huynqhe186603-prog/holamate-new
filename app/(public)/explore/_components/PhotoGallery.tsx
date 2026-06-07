'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const prev = useCallback(() => setLightbox(i => (i !== null && i > 0 ? i - 1 : i)), [])
  const next = useCallback(() => setLightbox(i => (i !== null && i < photos.length - 1 ? i + 1 : i)), [photos.length])

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

  if (photos.length === 0) return null

  return (
    <>
      <div className={cn(
        'grid gap-2',
        photos.length === 1 ? 'grid-cols-1' :
        photos.length === 2 ? 'grid-cols-2' :
        'grid-cols-3'
      )}>
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
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm font-semibold tabular-nums">
            {lightbox + 1} / {photos.length}
          </div>

          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            disabled={lightbox === 0}
            className="absolute left-3 sm:left-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Image */}
          <div
            className="relative w-full max-w-5xl max-h-[90vh] mx-16 sm:mx-24"
            style={{ height: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={photos[lightbox].image_url}
              alt={photos[lightbox].caption ?? 'Ảnh quán'}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); next() }}
            disabled={lightbox === photos.length - 1}
            className="absolute right-3 sm:right-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Caption */}
          {photos[lightbox].caption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 text-white/80 text-sm max-w-sm text-center">
              {photos[lightbox].caption}
            </div>
          )}
        </div>
      )}
    </>
  )
}
