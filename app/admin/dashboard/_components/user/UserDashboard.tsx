'use client'
import { UserGrowthCharts } from './UserGrowthCharts'
import { ActiveUserCharts } from './ActiveUserCharts'
import { RetentionCharts } from './RetentionCharts'
import type { UserDashboardData } from '../types'

export function UserDashboard({ data }: { data: UserDashboardData }) {
  return (
    <div className="space-y-8">
      <UserGrowthCharts
        signupsByDay={data.signupsByDay}
        cumulativeByDay={data.cumulativeByDay}
        month={data.month}
      />
      <ActiveUserCharts
        loginsByDay={data.loginsByDay}
        c2UsersByDay={data.c2UsersByDay}
        eventBreakdown={data.eventBreakdown}
        mauByDay={data.mauByDay}
        c1Count={data.c1Count}
        c2Count={data.c2Count}
        c3Count={data.c3Count}
        mauCount={data.mauCount}
        month={data.month}
      />
      <RetentionCharts
        returnLoginsByDay={data.returnLoginsByDay}
        loginFreqGroups={data.loginFreqGroups}
        month={data.month}
      />
    </div>
  )
}
