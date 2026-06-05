'use client'

import { useState } from 'react'
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

  if (photos.length === 0) return null

  const prev = () => setLightbox(i => (i !== null ? Math.max(0, i - 1) : null))
  const next = () => setLightbox(i => (i !== null ? Math.min(photos.length - 1, i + 1) : null))

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
            {/* Show +N if more photos */}
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={prev}
            disabled={lightbox === 0}
            className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-2xl aspect-[4/3]">
            <Image
              src={photos[lightbox].image_url}
              alt={photos[lightbox].caption ?? 'Ảnh quán'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>

          <button
            onClick={next}
            disabled={lightbox === photos.length - 1}
            className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}
