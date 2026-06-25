'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  vendorId: string
  vendorName: string
}

export function ViewVendorTracker({ vendorId, vendorName }: Props) {
  useEffect(() => {
    trackEvent({
      event_type: 'view_vendor',
      event_data: { vendor_id: vendorId, vendor_name: vendorName },
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
