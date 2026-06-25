'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Minus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { useCart } from '@/components/cart/CartContext'
import { formatVND, cartTotal } from '@/lib/cart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface CheckoutFormProps {
  vendorId: string
  vendorName: string
  hasDelivery: boolean
  initialName: string | null
  initialPhone: string | null
}

export function CheckoutForm({
  vendorId, vendorName, hasDelivery, initialName, initialPhone,
}: CheckoutFormProps) {
  const router = useRouter()
  const { cart, updateQuantity, clearCart } = useCart()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    buyer_name?: string
    buyer_phone?: string
    buyer_address?: string
  }>({})

  const [buyerName, setBuyerName] = useState(initialName ?? '')
  const [buyerPhone, setBuyerPhone] = useState(initialPhone ?? '')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [note, setNote] = useState('')
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'seller_delivery'>('pickup')

  // Redirect if cart is empty or wrong vendor
  useEffect(() => {
    if (cart === null) return
    if (cart.vendorId !== vendorId || cart.items.length === 0) {
      router.replace(`/explore/vendors/${vendorId}`)
    }
  }, [cart, vendorId, router])

  const items = cart?.vendorId === vendorId ? (cart?.items ?? []) : []
  const total = cartTotal(items)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!buyerName.trim() || buyerName.trim().length < 2)
      newErrors.buyer_name = 'Nhập họ tên (tối thiểu 2 ký tự)'
    if (!buyerPhone.trim() || !/^(0|\+84)[0-9]{8,9}$/.test(buyerPhone.trim()))
      newErrors.buyer_phone = 'Số điện thoại không hợp lệ (VD: 0912345678)'
    if (fulfillmentMethod === 'seller_delivery' && !buyerAddress.trim())
      newErrors.buyer_address = 'Vui lòng nhập địa chỉ giao hàng'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)
    setSubmitError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        vendor_id: vendorId,
        status: 'submitted',
        fulfillment_method: fulfillmentMethod,
        note: note.trim() || null,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: fulfillmentMethod === 'seller_delivery' ? buyerAddress.trim() : null,
        total_price: total,
      })
      .select('id')
      .single()

    if (orderErr || !order) { setSubmitError('Đặt món thất bại. Thử lại.'); setIsSubmitting(false); return }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }))
    )
    if (itemsErr) { setSubmitError('Lỗi khi lưu món. Thử lại.'); setIsSubmitting(false); return }

    trackEvent({
      event_type: 'checkout',
      event_data: {
        vendor_id: vendorId,
        vendor_name: vendorName,
        total_amount: total,
        item_count: items.length,
      },
    })
    clearCart()
    router.push(`/checkout/success?orderId=${order.id}`)
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>

      <h1 className="text-xl font-bold text-neutral-900 mb-1">Xác nhận đặt món</h1>
      <p className="text-sm text-neutral-500 mb-6">{vendorName}</p>

      {/* Cart items */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-800">Giỏ hàng ({items.length} món)</h2>
        </div>
        <div className="divide-y divide-neutral-50">
          {items.map(item => (
            <div key={item.menuItemId} className="flex items-center gap-3 px-4 py-3">
              {item.image_url && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                <p className="text-xs text-neutral-500">{formatVND(item.price)} / món</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQuantity(item.menuItemId, -1)}
                  className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-red-200 hover:text-red-400 transition-colors"
                >
                  {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                </button>
                <span className="text-sm font-bold text-neutral-900 w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, 1)}
                  className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold text-neutral-800 w-14 text-right">
                  {formatVND(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-t border-neutral-100">
          <span className="text-sm font-medium text-neutral-700">Tổng cộng</span>
          <span className="text-lg font-bold text-primary">{formatVND(total)}</span>
        </div>
      </div>

      {/* Fulfillment method — choose first to show/hide address */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3 mb-4">
        <h2 className="text-sm font-semibold text-neutral-800">Hình thức nhận món</h2>
        {[
          { value: 'pickup', label: 'Tự đến lấy', desc: 'Đến trực tiếp nhận tại quán/điểm hẹn' },
          ...(hasDelivery ? [{ value: 'seller_delivery', label: 'Quán/người bán giao', desc: 'Quán hoặc người bán tự giao tới bạn' }] : []),
        ].map(opt => (
          <label
            key={opt.value}
            className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              value={opt.value}
              checked={fulfillmentMethod === opt.value}
              onChange={() => setFulfillmentMethod(opt.value as 'pickup' | 'seller_delivery')}
              className="mt-0.5 accent-primary shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-neutral-800">{opt.label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Order form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-800">Thông tin liên hệ</h2>

          <div className="space-y-1.5">
            <Label htmlFor="buyer_name" className="text-sm font-medium text-neutral-700">Họ và tên *</Label>
            <Input id="buyer_name" type="text" placeholder="Nguyễn Văn A" className="h-11"
              value={buyerName} onChange={e => { setBuyerName(e.target.value); setErrors(v => ({ ...v, buyer_name: undefined })) }} />
            {errors.buyer_name && <p className="text-xs text-red-500">{errors.buyer_name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buyer_phone" className="text-sm font-medium text-neutral-700">Số điện thoại *</Label>
            <Input id="buyer_phone" type="text" placeholder="0912345678" className="h-11"
              value={buyerPhone} onChange={e => { setBuyerPhone(e.target.value); setErrors(v => ({ ...v, buyer_phone: undefined })) }} />
            {errors.buyer_phone && <p className="text-xs text-red-500">{errors.buyer_phone}</p>}
          </div>

          {/* Delivery address — only shown when seller_delivery */}
          {fulfillmentMethod === 'seller_delivery' && (
            <div className="space-y-1.5">
              <Label htmlFor="buyer_address" className="text-sm font-medium text-neutral-700">Địa chỉ giao hàng *</Label>
              <Input
                id="buyer_address"
                type="text"
                placeholder="VD: Phòng A3-412, KTX ĐHQG Hòa Lạc"
                className="h-11"
                value={buyerAddress}
                onChange={e => { setBuyerAddress(e.target.value); setErrors(v => ({ ...v, buyer_address: undefined })) }}
              />
              {errors.buyer_address && <p className="text-xs text-red-500">{errors.buyer_address}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-sm font-medium text-neutral-700">Ghi chú (tùy chọn)</Label>
            <textarea
              id="note"
              rows={3}
              placeholder="VD: không cay, thêm rau, giao tầng 2..."
              maxLength={500}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-neutral-400"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">{submitError}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Đang gửi…' : `Xác nhận đặt món · ${formatVND(total)}`}
        </Button>
      </form>
    </div>
  )
}
