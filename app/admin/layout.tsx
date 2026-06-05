import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { AdminNav } from './_components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <AdminNav
            name={profile?.full_name ?? null}
            avatarUrl={(profile as any)?.avatar_url ?? null}
          />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  )
}
