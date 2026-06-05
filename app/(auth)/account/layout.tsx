import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountNav } from './_components/AccountNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, user_type')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
        {/* Sidebar — desktop */}
        <aside className="w-full sm:w-56 shrink-0">
          <AccountNav
            name={profile?.full_name ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            isStudent={profile?.user_type === 'student_user'}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
