'use client'
import { StoreFilter } from './StoreFilter'
import { StoreCharts } from './StoreCharts'
import type { StoreDashboardData } from '../types'

interface Props {
  data: StoreDashboardData
  vendorId: string
}

export function StoreDashboard({ data, vendorId }: Props) {
  return (
    <div className="space-y-4">
      <StoreFilter
        currentMonth={data.month}
        currentVendorId={vendorId}
        vendors={data.allVendors}
      />
      <StoreCharts
        totalActiveVendors={data.totalActiveVendors}
        partneredVendors={data.partneredVendors}
        ordersInMonth={data.ordersInMonth}
        ordersByDay={data.ordersByDay}
        topVendorsByViews={data.topVendorsByViews}
        topVendorsByOrders={data.topVendorsByOrders}
        reviewsByDay={data.reviewsByDay}
        vendorRatings={data.vendorRatings}
        month={data.month}
      />
    </div>
  )
}
