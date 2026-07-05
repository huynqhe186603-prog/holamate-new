'use client'

import { trackEvent } from '@/lib/analytics'

interface Props {
  href: string
  vendorId: string
  vendorName: string
  contactType: 'phone' | 'zalo'
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

export function ContactLink({ href, vendorId, vendorName, contactType, children, className, target, rel }: Props) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() =>
        trackEvent({
          event_type: 'click_contact',
          event_data: { vendor_id: vendorId, vendor_name: vendorName, contact_type: contactType },
        })
      }
    >
      {children}
    </a>
  )
}
