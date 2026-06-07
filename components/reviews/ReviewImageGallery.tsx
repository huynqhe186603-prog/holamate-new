'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ReviewImage {
  id: string
  image_url: string
}

export function ReviewImageGallery({ images }: { images: ReviewImage[] }) {
  const [index, setIndex] = useState<number | null>(null)

  const close = useCallback(() => setIndex(null), [])
  const prev = useCallback(() => setIndex(i => i !== null ? (i - 1 + images.length) % images.length : null), [images.length])
  const next = useCallback(() => setIndex(i => i !== null ? (i + 1) % images.length : null), [images.length])

  useEffect(() => {
    if (index === null) { document.body.style.overflow = ''; return }
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [index, close, prev, next])

  const thumbnails = images.slice(0, 4)
  const extra = images.length - 4

  return (
    <>
      {/* Thumbnails */}
      <div className="flex gap-2 flex-wrap">
        {thumbnails.map((media, i) => (
          <button
            key={media.id}
            type="button"
            onClick={() => setIndex(i)}
            className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={media.image_url}
              alt={`Ảnh review ${i + 1}`}
              fill
              className="object-cover hover:opacity-85 transition-opacity"
              sizes="80px"
            />
          </button>
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={() => setIndex(4)}
            className="w-20 h-20 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <span className="text-sm font-semibold text-neutral-500">+{extra}</span>
          </button>
        )}
      </div>

      {/* Lightbox */}
      {index !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 animate-fade-in"
          onClick={close}
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums">
              {index + 1} / {images.length}
            </span>
          )}

          {/* Prev */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative rounded-lg overflow-hidden"
            style={{ width: '90vw', height: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[index].image_url}
              alt={`Ảnh review ${index + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
