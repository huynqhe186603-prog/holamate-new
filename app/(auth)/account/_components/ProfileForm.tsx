'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const schema = z.object({
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  phone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ')
    .or(z.literal('')),
})
type FormData = z.infer<typeof schema>

interface ProfileFormProps {
  userId: string
  initialData: { full_name: string | null; phone: string | null }
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initialData.full_name ?? '',
      phone: initialData.phone ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, phone: data.phone || null })
      .eq('id', userId)

    if (error) { setServerError('Cập nhật thất bại. Thử lại.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name" className="text-sm font-medium text-neutral-700">Họ và tên *</Label>
        <Input
          id="full_name"
          placeholder="Nguyễn Văn A"
          className="h-11"
          {...register('full_name')}
        />
        {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm font-medium text-neutral-700">Số điện thoại</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="0912345678"
          className="h-11"
          {...register('phone')}
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        <p className="text-xs text-neutral-400">Dùng để liên hệ khi đặt món</p>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="h-10 px-5 font-medium gap-2"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Lưu thay đổi
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Đã lưu
          </span>
        )}
      </div>
    </form>
  )
}
