'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const schema = z.object({
  student_email: z
    .string()
    .min(1, 'Nhập email sinh viên')
    .includes('@', { message: 'Email không hợp lệ' })
    .refine(v => v.endsWith('.edu.vn') || v.includes('sv.') || v.includes('student'), {
      message: 'Nên là email sinh viên (.edu.vn hoặc từ trường)',
    }),
})
type FormData = z.infer<typeof schema>

export function StudentVerifyForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.from('student_verifications').insert({
      user_id: userId,
      student_email: data.student_email,
      status: 'pending',
    })
    if (error) {
      setServerError('Gửi yêu cầu thất bại. Thử lại.')
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="student_email" className="text-sm font-medium text-neutral-700">
          Email sinh viên *
        </Label>
        <Input
          id="student_email"
          type="email"
          placeholder="sinhvien@sv.hust.edu.vn"
          className="h-11"
          {...register('student_email')}
        />
        {errors.student_email && (
          <p className="text-xs text-red-500">{errors.student_email.message}</p>
        )}
        <p className="text-xs text-neutral-400">Email được cấp từ trường đại học của bạn</p>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="h-10 gap-2 font-medium">
        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Gửi yêu cầu xác thực
      </Button>
    </form>
  )
}
