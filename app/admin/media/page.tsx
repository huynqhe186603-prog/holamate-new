'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { logAdminAction } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { Check, EyeOff, Trash2 } from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Chờ duyệt', classes: 'bg-yellow-100 text-yellow-700' },
  visible: { label: 'Hiển thị',  classes: 'bg-emerald-100 text-emerald-700' },
  hidden:  { label: 'Đã ẩn',     classes: 'bg-neutral-100 text-neutral-600' },
  removed: { label: 'Đã xóa',    classes: 'bg-red-100 text-red-700' },
}

const FILTERS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'visible', label: 'Hiển thị'  },
  { value: 'hidden',  label: 'Đã ẩn'     },
]

export default function AdminMediaPage() {
  const supabase = createClient()
  const [adminId, setAdminId] = useState('')
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('review_media')
      .select('id, image_url, status, caption, created_at, review_id, uploaded_by, reviews(id, content, rating, vendor_id, vendors(name)), profiles(full_name, email)')
      .eq('status', filter as any)
      .order('created_at', { ascending: false })
      .limit(100)
    setMedia(data ?? [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const prev = media.find(m => m.id === id)?.status
    const { error } = await supabase.from('review_media').update({ status: status as any }).eq('id', id)
    if (!error) {
      setMedia(prev => prev.filter(m => m.id !== id))
      await logAdminAction(supabase, adminId, `media_${status}`, 'review_media', id, { previous_status: prev })
    } else alert(error.message)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Media — Kiểm duyệt ảnh</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Duyệt ảnh đính kèm review trước khi hiển thị.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : media.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 py-14 text-center">
          <p className="text-sm text-neutral-400">Không có ảnh nào trong nhóm này.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map(item => {
              const statusCfg = STATUS_CFG[item.status] ?? STATUS_CFG.pending
              const review = item.reviews as any
              const uploader = item.profiles as any
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-100 bg-white overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <Image
                      src={item.image_url}
                      alt="Review media"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <span className={cn('absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full', statusCfg.classes)}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 space-y-2">
                    {review && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-700">{review.vendors?.name ?? 'Quán không xác định'}</p>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {review.content || <span className="italic text-neutral-400">Review không có nội dung</span>}
                        </p>
                      </div>
                    )}
                    {item.caption && (
                      <p className="text-xs text-neutral-400 italic">&quot;{item.caption}&quot;</p>
                    )}
                    <p className="text-[10px] text-neutral-400">
                      {uploader?.full_name ?? uploader?.email ?? 'Ẩn danh'} ·{' '}
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-neutral-100 p-3 flex gap-2">
                    {item.status !== 'visible' && (
                      <Button
                        size="sm" variant="outline"
                        className="flex-1 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs"
                        onClick={() => updateStatus(item.id, 'visible')}
                      >
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </Button>
                    )}
                    {item.status !== 'hidden' && (
                      <Button
                        size="sm" variant="outline"
                        className="flex-1 gap-1 text-neutral-600 text-xs"
                        onClick={() => updateStatus(item.id, 'hidden')}
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Ẩn
                      </Button>
                    )}
                    <Button
                      size="sm" variant="outline"
                      className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                      onClick={() => updateStatus(item.id, 'removed')}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-neutral-400">{media.length} ảnh</p>
        </>
      )}
    </div>
  )
}
