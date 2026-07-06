export type DayCount   = { day: number; count: number }
export type DayRevenue = { day: number; count: number; revenue: number }
export type NameValue  = { name: string; value: number }
export type EventCount = { event_type: string; count: number; uniqueUsers: number }
export type FreqGroup  = { group: string; count: number }

export interface UserDashboardData {
  month: number
  year: number
  signupsByDay: DayCount[]
  cumulativeByDay: DayCount[]
  loginsByDay: DayCount[]
  c2UsersByDay: DayCount[]
  eventBreakdown: EventCount[]
  mauByDay: DayCount[]
  c1Count: number
  c2Count: number
  c3Count: number
  mauCount: number
  returnLoginsByDay: DayCount[]
  loginFreqGroups: FreqGroup[]
}

export interface StoreDashboardData {
  month: number
  year: number
  totalActiveVendors: number
  partneredVendors: number
  ordersInMonth: number
  ordersByDay: DayRevenue[]
  topVendorsByViews: NameValue[]
  topVendorsByOrders: NameValue[]
  allVendors: { id: string; name: string }[]
}
