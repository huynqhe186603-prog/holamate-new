'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logAdminAction } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { Search, AlertCircle, ShieldOff, Ban, X } from 'lucide-react'

const USER_STATUS_CFG: Record<string, { label: string; classes: string }> = {
  active:    { label: 'Hoạt động', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Tạm khóa',  classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  banned:    { label: 'Bị cấm',    classes: 'bg-red-100 text-red-700 border-red-200' },
  deleted:   { label: 'Đã xóa',    classes: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
}

const ROLE_CFG: Record<string, { label: string; classes: string }> = {
  user:   { label: 'User',   classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  seller: { label: 'Seller', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  admin:  { label: 'Admin',  classes: 'bg-red-100 text-red-700 border-red-200' },
}

const TABS = [
  { value: 'users',   label: 'Tất cả users'  },
  { value: 'reports', label: 'User bị report' },
] as const

export default function AdminUsersPage() {
  const supabase = createClient()
  const [adminId, setAdminId] = useState('')
  const [tab, setTab] = useState<'users' | 'reports'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionModal, setActionModal] = useState<{ userId: string; name: string } | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
    }
    init()
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: userData }, { data: reportData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, status, user_type, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('user_reports')
        .select('id, reason, description, status, created_at, reported_user_id, reporter_id, profiles!user_reports_reported_user_id_fkey(id, full_name, email, status, role), profiles!user_reports_reporter_id_fkey(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    setUsers(userData ?? [])
    setReports(reportData ?? [])
    setLoading(false)
  }

  const filteredUsers = users.filter(u => {
    if (u.role === 'admin') return false
    if (roleFilter && u.role !== roleFilter) return false
    if (statusFilter && u.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    }
    return true
  })

  const updateUserStatus = async (userId: string, status: string) => {
    const prev = users.find(u => u.id === userId)?.status
    const { error } = await supabase.from('profiles').update({ status: status as any }).eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
      await logAdminAction(supabase, adminId, `user_${status}`, 'profiles', userId, { previous_status: prev })
    } else alert(error.message)
  }

  const changeUserRole = async (userId: string, role: string) => {
    const prev = users.find(u => u.id === userId)?.role
    const { error } = await supabase.from('profiles').update({ role: role as any }).eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      await logAdminAction(supabase, adminId, 'user_role_changed', 'profiles', userId, { previous_role: prev, new_role: role })
    } else alert(error.message)
  }

  const warnUser = async () => {
    if (!actionModal) return
    await logAdminAction(supabase, adminId, 'user_warned', 'profiles', actionModal.userId, { note: noteText })
    setActionModal(null)
    setNoteText('')
  }

  const resolveReport = async (reportId: string, reportedUserId: string, action: 'dismiss' | 'suspend' | 'ban') => {
    const now = new Date().toISOString()
    if (action === 'suspend' || action === 'ban') {
      const status = action === 'suspend' ? 'suspended' : 'banned'
      await supabase.from('profiles').update({ status: status as any }).eq('id', reportedUserId)
      setUsers(prev => prev.map(u => u.id === reportedUserId ? { ...u, status } : u))
    }
    await supabase.from('user_reports').update({
      status: 'resolved',
      reviewed_at: now,
      reviewed_by: adminId,
    }).eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
    await logAdminAction(supabase, adminId, `user_report_${action}`, 'user_reports', reportId, { reported_user: reportedUserId, action })
  }

  return (
    <div className="space-y-6">
      {/* Warn modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setActionModal(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Cảnh báo: {actionModal.name}</h3>
              <button onClick={() => setActionModal(null)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Nội dung cảnh báo (ghi vào admin log)..."
              className="w-full min-h-[80px] rounded-xl border border-neutral-200 px-3 py-2 text-sm resize-none"
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={warnUser}>Ghi nhận cảnh báo</Button>
              <Button variant="outline" onClick={() => setActionModal(null)}>Hủy</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Users</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Quản lý người dùng và xử lý report.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {t.label}
            {t.value === 'reports' && reports.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{reports.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-neutral-500">Đang tải...</p> : (
        <>
          {/* Users tab */}
          {tab === 'users' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input placeholder="Tìm tên / email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                  <option value="">Tất cả role</option>
                  <option value="user">User</option>
                  <option value="seller">Seller</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                  <option value="">Tất cả status</option>
                  {Object.entries(USER_STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Họ tên / Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Loại TK</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Ngày tạo</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">Không tìm thấy user nào.</td></tr>
                    )}
                    {filteredUsers.map(user => {
                      const statusCfg = USER_STATUS_CFG[user.status] ?? USER_STATUS_CFG.active
                      const roleCfg = ROLE_CFG[user.role] ?? ROLE_CFG.user
                      return (
                        <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-neutral-900 truncate max-w-[180px]">{user.full_name ?? '—'}</p>
                            <p className="text-xs text-neutral-400 truncate max-w-[180px]">{user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold', roleCfg.classes)}>
                              {roleCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold', statusCfg.classes)}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell">
                            {user.user_type === 'student_user' ? '🎓 Sinh viên' : 'Bình thường'}
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell whitespace-nowrap">
                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-neutral-600"
                                onClick={() => { setActionModal({ userId: user.id, name: user.full_name ?? user.email }); setNoteText('') }}>
                                Cảnh báo
                              </Button>
                              {user.status === 'active' && (
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-yellow-600 border-yellow-200"
                                  onClick={() => updateUserStatus(user.id, 'suspended')}>
                                  <ShieldOff className="w-3.5 h-3.5" /> Tạm khóa
                                </Button>
                              )}
                              {user.status === 'suspended' && (
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-emerald-600 border-emerald-200"
                                  onClick={() => updateUserStatus(user.id, 'active')}>
                                  Mở khóa
                                </Button>
                              )}
                              {user.status !== 'banned' && user.status !== 'deleted' && (
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => updateUserStatus(user.id, 'banned')}>
                                  <Ban className="w-3.5 h-3.5" /> Ban
                                </Button>
                              )}
                              {user.role === 'seller' && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-neutral-500 text-xs"
                                  onClick={() => changeUserRole(user.id, 'user')}>
                                  Hạ xuống User
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400">{filteredUsers.length} users</p>
            </div>
          )}

          {/* Reports tab */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center">
                  <p className="text-sm text-neutral-400">Không có user report nào chờ xử lý.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">User bị report</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Lý do</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Người report</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Ngày</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {reports.map(report => {
                        const reported = (report as any)['profiles!user_reports_reported_user_id_fkey'] ?? {}
                        const reporter = (report as any)['profiles!user_reports_reporter_id_fkey'] ?? {}
                        return (
                          <tr key={report.id} className="hover:bg-neutral-50/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-neutral-900">{reported.full_name ?? '—'}</p>
                              <p className="text-xs text-neutral-400">{reported.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                {report.reason}
                              </span>
                              {report.description && (
                                <p className="text-xs text-neutral-400 mt-0.5 max-w-[200px] truncate">{report.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-neutral-600 text-xs hidden lg:table-cell">
                              {reporter.full_name ?? reporter.email ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell whitespace-nowrap">
                              {new Date(report.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-yellow-600 border-yellow-200"
                                  onClick={() => resolveReport(report.id, report.reported_user_id, 'suspend')}>
                                  <ShieldOff className="w-3.5 h-3.5" /> Tạm khóa
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-red-600 border-red-200"
                                  onClick={() => resolveReport(report.id, report.reported_user_id, 'ban')}>
                                  <Ban className="w-3.5 h-3.5" /> Ban
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-neutral-400"
                                  onClick={() => resolveReport(report.id, report.reported_user_id, 'dismiss')}>
                                  Bỏ qua
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
