'use client'

import { Suspense, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store, GraduationCap, UtensilsCrossed, ArrowLeft, ArrowRight,
  Search, X, Upload, Loader2, CheckCircle2, Eye, EyeOff,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarPicker } from '@/components/reviews/StarPicker'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type ReviewType = 'vendor' | 'menu_item'
type VendorResult = { id: string; name: string; vendor_type: string; cover_image_url: string | null }
type MenuItemResult = { id: string; name: string; price: number; item_type: string }

// ─── Main component (inner — uses useSearchParams) ───────────────────────────

function WriteReviewForm() {
  const router = useRouter()
  useSearchParams() // retained for future pre-fill via ?vendorId
  const supabase = createClient()

  // ─── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [reviewType, setReviewType] = useState<ReviewType | null>(null)
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([])
  const [vendorLoading, setVendorLoading] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<VendorResult | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemResult[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItemResult | null>(null)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const totalSteps = 5
  const displayTotal = reviewType === 'menu_item' ? 5 : 4
  const displayStep = reviewType !== 'menu_item' && step > 2 ? step - 1 : step

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const searchVendors = useCallback(async (q: string) => {
    if (q.length < 2) { setVendorResults([]); return }
    setVendorLoading(true)
    const { data } = await supabase
      .from('vendors')
      .select('id, name, vendor_type, cover_image_url')
      .eq('status', 'active')
      .ilike('name', `%${q}%`)
      .limit(8)
    setVendorResults((data ?? []) as VendorResult[])
    setVendorLoading(false)
  }, [supabase])

  const fetchMenuItems = useCallback(async (vendorId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, price, item_type')
      .eq('vendor_id', vendorId)
      .eq('is_available', true)
      .or(`selling_date.is.null,selling_date.eq.${today}`)
      .order('sort_order')
      .limit(30)
    setMenuItems((data ?? []) as MenuItemResult[])
  }, [supabase])

  const addImages = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - images.length)
    const newPreviews = newFiles.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...newFiles])
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx])
    setImages(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 2 && reviewType !== 'menu_item') {
      setStep(4) // Skip step 3 for vendor reviews
    } else {
      setStep(s => Math.min(s + 1, totalSteps))
    }
  }

  const goPrev = () => {
    if (step === 4 && reviewType !== 'menu_item') {
      setStep(2)
    } else {
      setStep(s => Math.max(s - 1, 1))
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedVendor || !rating) return
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 1. Insert review
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        review_type: reviewType ?? 'vendor',
        vendor_id: selectedVendor.id,
        menu_item_id: reviewType === 'menu_item' ? selectedItem?.id ?? null : null,
        rating,
        content: content.trim() || null,
        is_anonymous: isAnonymous,
      })
      .select('id')
      .single()

    if (reviewErr || !review) {
      setError('Không thể gửi review. Vui lòng thử lại.')
      setSubmitting(false)
      return
    }

    // 2. Upload images (if any)
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `reviews/${review.id}/photo_${i + 1}.${ext}`

      const { data: upload } = await supabase.storage
        .from('review-images')
        .upload(path, file, { cacheControl: '31536000', upsert: false })

      if (upload) {
        const { data: urlData } = supabase.storage
          .from('review-images')
          .getPublicUrl(path)
        await supabase.from('review_media').insert({
          review_id: review.id,
          image_url: urlData.publicUrl,
          storage_path: path,
          uploaded_by: user.id,
          status: 'pending',
        })
      }
    }

    setSuccess(true)
    setSubmitting(false)
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="text-center py-10 px-4 animate-fade-in">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Review đã được gửi!</h2>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed max-w-xs mx-auto">
          Cảm ơn bạn đã đóng góp cho cộng đồng HolaMate.
          {images.length > 0 && ' Ảnh sẽ được duyệt trước khi hiển thị.'}
        </p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Link href="/reviews" className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center hover:bg-primary/90 transition-colors">
            Xem review cộng đồng
          </Link>
          {selectedVendor && (
            <Link
              href={selectedVendor.vendor_type === 'student_booth' ? `/explore/booths/${selectedVendor.id}` : `/explore/vendors/${selectedVendor.id}`}
              className="w-full h-11 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 flex items-center justify-center hover:bg-neutral-50 transition-colors"
            >
              Xem trang quán
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ─── Progress bar ─────────────────────────────────────────────────────────

  const progress = displayTotal > 1 ? ((displayStep - 1) / (displayTotal - 1)) * 100 : 0

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step === 1 ? router.back() : goPrev()}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-neutral-900">Viết review</h1>
          <p className="text-xs text-neutral-400">Bước {displayStep}/{displayTotal}: {
            step === 1 ? 'Loại review' :
            step === 2 ? 'Chọn quán/gian hàng' :
            step === 3 ? 'Chọn món' :
            step === 4 ? 'Đánh giá' : 'Xem lại'
          }</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-100 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Step 1: Review type ── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-base font-medium text-neutral-800 mb-4">Bạn muốn review gì?</p>
          {[
            { type: 'vendor' as ReviewType, icon: Store, title: 'Review quán / gian hàng', desc: 'Đánh giá tổng thể về quán ăn hoặc gian hàng sinh viên' },
            { type: 'menu_item' as ReviewType, icon: UtensilsCrossed, title: 'Review món ăn / sản phẩm', desc: 'Đánh giá một món cụ thể trong menu' },
          ].map(({ type, icon: Icon, title, desc }) => (
            <button
              key={type}
              onClick={() => { setReviewType(type); setStep(2) }}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all',
                reviewType === type
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-neutral-200 hover:border-primary/40 hover:bg-neutral-50'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">{title}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2: Vendor search ── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-base font-medium text-neutral-800 mb-1">
            {reviewType === 'menu_item' ? 'Chọn quán có món bạn muốn review' : 'Chọn quán hoặc gian hàng'}
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm tên quán, gian hàng..."
              value={vendorSearch}
              onChange={e => { setVendorSearch(e.target.value); searchVendors(e.target.value) }}
              autoFocus
              className="w-full pl-9 pr-4 h-11 rounded-xl border border-neutral-200 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
            />
            {vendorLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
            )}
          </div>

          {/* Selected */}
          {selectedVendor && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-emerald-800 flex-1">{selectedVendor.name}</span>
              <button onClick={() => { setSelectedVendor(null); setSelectedItem(null) }}>
                <X className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          )}

          {/* Results */}
          {vendorResults.length > 0 && !selectedVendor && (
            <div className="rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
              {vendorResults.map(v => (
                <button
                  key={v.id}
                  onClick={async () => {
                    setSelectedVendor(v)
                    setVendorSearch(v.name)
                    setVendorResults([])
                    if (reviewType === 'menu_item') await fetchMenuItems(v.id)
                  }}
                  className="flex items-center gap-3 w-full p-3 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                    {v.cover_image_url ? (
                      <Image src={v.cover_image_url} alt={v.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {v.vendor_type === 'student_booth'
                          ? <GraduationCap className="w-4 h-4 text-neutral-300" />
                          : <Store className="w-4 h-4 text-neutral-300" />}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{v.name}</p>
                    <p className="text-xs text-neutral-400">
                      {v.vendor_type === 'student_booth' ? 'Gian hàng sinh viên' : 'Quán ăn'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {vendorSearch.length >= 2 && vendorResults.length === 0 && !vendorLoading && !selectedVendor && (
            <p className="text-sm text-neutral-400 text-center py-3">Không tìm thấy quán nào</p>
          )}

          {selectedVendor && (
            <button
              onClick={goNext}
              className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Tiếp theo <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Menu item (only for menu_item reviews) ── */}
      {step === 3 && reviewType === 'menu_item' && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-base font-medium text-neutral-800 mb-1">Chọn món bạn muốn review</p>

          {selectedItem && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-emerald-800 flex-1">{selectedItem.name}</span>
              <button onClick={() => setSelectedItem(null)}>
                <X className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors',
                  selectedItem?.id === item.id
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 hover:border-primary/30'
                )}
              >
                <span className="text-sm font-medium text-neutral-800">{item.name}</span>
                <span className="text-xs text-neutral-500 shrink-0 ml-2">
                  {item.price >= 1000 ? `${Math.round(item.price / 1000)}k` : `${item.price}đ`}
                </span>
              </button>
            ))}
            {menuItems.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-4">Không có món nào hôm nay</p>
            )}
          </div>

          {selectedItem && (
            <button
              onClick={goNext}
              className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Tiếp theo <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Step 4: Rating + content + images ── */}
      {step === 4 && (
        <div className="space-y-5 animate-fade-in">
          {/* Rating */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3">Chấm điểm *</p>
            <div className="flex justify-center">
              <StarPicker value={rating} onChange={setRating} size="lg" />
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">Nội dung review</p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn... Món ngon không? Phục vụ như thế nào? Giá có hợp lý không?"
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-3 text-sm resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-neutral-400"
            />
            <p className="text-xs text-neutral-400 mt-1 text-right">{content.length}/2000</p>
          </div>

          {/* Image upload */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">Ảnh đính kèm (tùy chọn)</p>
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:border-primary/40 hover:text-primary transition-colors shrink-0"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px]">Thêm ảnh</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => addImages(e.target.files)}
            />
            <p className="text-xs text-neutral-400 mt-1">Tối đa 5 ảnh · JPG, PNG, WebP · 10MB/ảnh</p>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200">
            <div>
              <p className="text-sm font-medium text-neutral-800">Ẩn danh</p>
              <p className="text-xs text-neutral-400 mt-0.5">Hiển thị &quot;Người dùng ẩn danh&quot; thay vì tên bạn</p>
            </div>
            <button
              onClick={() => setIsAnonymous(v => !v)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                isAnonymous ? 'bg-primary' : 'bg-neutral-200'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                isAnonymous ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>

          {rating > 0 && (
            <button
              onClick={goNext}
              className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Xem lại review <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Step 5: Review summary ── */}
      {step === 5 && (
        <div className="space-y-5 animate-fade-in">
          <p className="text-base font-medium text-neutral-800">Xem lại trước khi gửi</p>

          {/* Summary card */}
          <div className="rounded-2xl border border-neutral-200 p-4 space-y-3">
            {/* Reviewer */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {isAnonymous ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  {isAnonymous ? 'Người dùng ẩn danh' : 'Bạn (công khai)'}
                </p>
                <p className="text-xs text-neutral-400">
                  {reviewType === 'menu_item' && selectedItem ? `${selectedItem.name} · ` : ''}
                  {selectedVendor?.name}
                </p>
              </div>
              <div className="ml-auto">
                <StarPicker value={rating} onChange={() => {}} readOnly size="sm" />
              </div>
            </div>

            {content && (
              <p className="text-sm text-neutral-700 leading-relaxed">{content}</p>
            )}

            {imagePreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={goPrev}
              className="flex-1 h-11 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Sửa lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Đang gửi…' : 'Gửi review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page wrapper with Suspense ───────────────────────────────────────────────

export default function WriteReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    }>
      <WriteReviewForm />
    </Suspense>
  )
}
