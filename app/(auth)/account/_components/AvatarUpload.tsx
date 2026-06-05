'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  name: string | null
}

export function AvatarUpload({ userId, avatarUrl, name }: AvatarUploadProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const initials = name?.[0]?.toUpperCase() ?? 'U'

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh tối đa 5MB')
      return
    }

    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const supabase = createClient()
    const path = `users/${userId}/avatar.jpg`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })

    if (uploadErr) {
      setError('Upload thất bại. Thử lại.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    // Add cache-bust so Next.js Image re-fetches
    const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`

    await supabase
      .from('profiles')
      .update({ avatar_url: freshUrl })
      .eq('id', userId)

    setUploading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative group w-20 h-20 rounded-full overflow-hidden ring-2 ring-neutral-200 ring-offset-2 hover:ring-primary/40 transition-all cursor-pointer"
      >
        {(preview ?? avatarUrl) ? (
          <Image
            src={preview ?? avatarUrl!}
            alt={name ?? 'Avatar'}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
        )}

        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
          uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {uploading
            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
            : <Camera className="w-5 h-5 text-white" />}
        </div>
      </button>

      <p className="text-xs text-neutral-400">Nhấp để thay ảnh</p>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
