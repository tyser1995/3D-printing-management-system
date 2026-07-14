'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateSessionId() {
  const key = 'kai3d_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

// Beacons the current page to /api/track. Only fires when the browser reports it's
// online; the API route itself no-ops when Supabase isn't configured, so this is a
// harmless fire-and-forget call in local/offline dev mode. Never blocks or disrupts
// navigation — all failures are swallowed.
export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return

    try {
      const sessionId = getOrCreateSessionId()

      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pathname,
          referrer: document.referrer || null,
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          session_id: sessionId,
        }),
      }).catch(() => {
        // silently fail — tracking should never break the UI
      })
    } catch {
      // sessionStorage/crypto can throw in restrictive environments — ignore
    }
  }, [pathname])

  return null
}
