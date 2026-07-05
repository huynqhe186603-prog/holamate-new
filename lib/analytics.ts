export type EventType =
  | 'page_view' | 'search' | 'view_vendor' | 'view_menu' | 'click_contact'
  | 'add_to_cart' | 'checkout' | 'write_review'
  | 'use_ai' | 'filter' | 'sign_up' | 'sign_in'
  | 'session_start' | 'session_heartbeat' | 'session_end'

export interface TrackEventPayload {
  event_type: EventType
  event_data?: Record<string, unknown>
  page_url?: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('hm_session_id')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('hm_session_id', sid)
  }
  return sid
}

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        session_id: getSessionId(),
        page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      }),
    })
  } catch {
    // Tracking never blocks UX
  }
}

export async function trackLogin(payload: {
  user_id: string
  event_type: 'sign_up' | 'sign_in' | 'sign_out'
  provider?: string
}): Promise<void> {
  try {
    await fetch('/api/analytics/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Tracking never blocks UX
  }
}
