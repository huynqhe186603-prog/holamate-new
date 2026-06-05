import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { SellerNav } from './_components/SellerNav'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/seller/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'seller' && profile?.role !== 'admin') {
    redirect('/')
  }

  // Get seller avatar
  const { data: seller } = await supabase
    .from('sellers')
    .select('avatar_url, display_name')
    .eq('user_id', user.id)
    .single()

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-24 sm:pb-6">
        <div className="flex gap-8">
          <SellerNav
            name={seller?.display_name ?? profile?.full_name ?? null}
            avatarUrl={seller?.avatar_url ?? null}
          />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  )
}
