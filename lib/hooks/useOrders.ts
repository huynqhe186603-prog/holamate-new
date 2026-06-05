'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export function useOrders() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), vendors(name, phone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateOrder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<OrderInsert, 'user_id'>
      items: Omit<OrderItemInsert, 'order_id'>[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Chưa đăng nhập')

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({ ...order, user_id: user.id })
        .select()
        .single()
      if (orderError) throw orderError

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items.map(i => ({ ...i, order_id: newOrder.id })))
      if (itemsError) throw itemsError

      return newOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
