'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
export function useVendors(filters?: {
  vendor_type?: 'fixed_shop' | 'student_booth'
  has_delivery?: boolean
}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      let query = supabase
        .from('vendors')
        .select('*, vendor_media(image_url, media_type, is_primary)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (filters?.vendor_type) {
        query = query.eq('vendor_type', filters.vendor_type)
      }
      if (filters?.has_delivery !== undefined) {
        query = query.eq('has_delivery', filters.has_delivery)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useVendor(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_media(image_url, storage_path, media_type, caption, is_primary, sort_order),
          menu_items(*, menu_item_media(image_url, is_primary))
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (error) throw error
      return data
    },
  })
}
