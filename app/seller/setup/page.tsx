import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetupForm from './SetupForm'

export default async function SellerSetupPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/seller/setup')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileRes = (await supabase.from('profiles').select('role, is_temp_account').eq('id', user.id).single()) as any
  const profile = profileRes.data as { role: string; is_temp_account: boolean } | null

  if (profile?.role !== 'seller') redirect('/')
  if (!profile?.is_temp_account) redirect('/seller/dashboard')

  return <SetupForm />
}
