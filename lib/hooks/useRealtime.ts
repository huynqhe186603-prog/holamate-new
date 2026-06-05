'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']

export function useRealtimeOrders(
  vendorId: string,
  onNewOrder: (order: Order) => void
) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`orders-vendor-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          onNewOrder(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId, onNewOrder, supabase])
}

export function useRealtimeOrderStatus(
  orderId: string,
  onStatusChange: (order: Order) => void
) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onStatusChange(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, onStatusChange, supabase])
}
