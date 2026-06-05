import { z } from 'zod'

export const reviewSchema = z.object({
  review_type: z.enum(['vendor', 'menu_item']),
  vendor_id: z.string().uuid().optional(),
  menu_item_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10, 'Nội dung review tối thiểu 10 ký tự').max(2000).optional(),
  is_anonymous: z.boolean().default(false),
})

export const orderSchema = z.object({
  vendor_id: z.string().uuid(),
  fulfillment_method: z.enum(['pickup', 'seller_delivery']),
  buyer_name: z.string().min(2, 'Nhập họ tên').max(100),
  buyer_phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ'),
  note: z.string().max(500).optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    item_name: z.string(),
    item_price: z.number().int().positive(),
    quantity: z.number().int().min(1).max(99),
    subtotal: z.number().int().positive(),
  })).min(1, 'Chọn ít nhất 1 món'),
})

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Nhập họ tên').max(100),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
})

export const studentVerificationSchema = z.object({
  student_email: z.string().email('Email không hợp lệ').endsWith('.edu.vn', 'Phải là email sinh viên (.edu.vn)'),
})

export type ReviewFormData = z.infer<typeof reviewSchema>
export type OrderFormData = z.infer<typeof orderSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type StudentVerificationFormData = z.infer<typeof studentVerificationSchema>
