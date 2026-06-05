import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  targetTable: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  await supabase.from('admin_logs').insert({
    admin_id: adminId,
    action,
    target_table: targetTable,
    target_id: targetId,
    details: details ?? null,
  })
}
