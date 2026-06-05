import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from './_components/CheckoutForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Đặt món' }

interface Props {
  params: { vendorId: string }
}

export default async function CheckoutPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/checkout/${params.vendorId}`)

  // Fetch vendor info
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, name, vendor_type, has_delivery, status')
    .eq('id', params.vendorId)
    .eq('status', 'active')
    .single()

  if (!vendor) notFound()

  // Pre-fill from user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  return (
    <CheckoutForm
      vendorId={vendor.id}
      vendorName={vendor.name}
      hasDelivery={vendor.has_delivery}
      initialName={profile?.full_name ?? null}
      initialPhone={profile?.phone ?? null}
    />
  )
}
