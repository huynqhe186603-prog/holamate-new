'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useReviews(filters?: { vendor_id?: string; menu_item_id?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles(full_name, avatar_url),
          review_media(image_url, status)
        `)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })

      if (filters?.vendor_id) query = query.eq('vendor_id', filters.vendor_id)
      if (filters?.menu_item_id) query = query.eq('menu_item_id', filters.menu_item_id)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useVoteReview() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ review_id, score }: { review_id: string; score: number }) => {
      const { error } = await supabase
        .from('review_votes')
        .upsert({ review_id, score, user_id: (await supabase.auth.getUser()).data.user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}
