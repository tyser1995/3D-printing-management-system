import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin'

function parseUserAgent(ua: string) {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Other'

  const os = /Windows NT/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Other'

  const device = /Mobi|Android|iPhone/.test(ua)
    ? 'mobile'
    : /iPad|Tablet/.test(ua)
      ? 'tablet'
      : 'desktop'

  return { browser, os, device }
}

// Fire-and-forget analytics endpoint. This must never disrupt the caller: it always
// resolves (never throws past this handler) and degrades to a no-op whenever Supabase
// isn't configured/reachable — e.g. local SQLite-only dev mode — instead of failing
// the request.
export async function POST(req: NextRequest) {
  try {
    // Skip entirely when the app isn't connected to Supabase (offline/local dev mode).
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: true, skipped: 'supabase-not-configured' })
    }

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: true, skipped: 'supabase-not-configured' })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { page, referrer, screen_width, screen_height, session_id } = (body ?? {}) as {
      page?: unknown
      referrer?: unknown
      screen_width?: unknown
      screen_height?: unknown
      session_id?: unknown
    }

    if (typeof page !== 'string' || !page) {
      return NextResponse.json({ error: 'page is required' }, { status: 400 })
    }

    // x-forwarded-for / geo headers are set by Vercel; fall back gracefully elsewhere.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const country = req.headers.get('x-vercel-ip-country') || null
    const region = req.headers.get('x-vercel-ip-country-region') || null
    const city = req.headers.get('x-vercel-ip-city') || null

    const ua = req.headers.get('user-agent') || ''
    const { browser, os, device } = parseUserAgent(ua)

    const { error } = await supabaseAdmin.from('page_views').insert({
      page,
      ip_address: ip,
      country,
      region,
      city,
      user_agent: ua,
      browser,
      os,
      device_type: device,
      referrer: typeof referrer === 'string' ? referrer : null,
      screen_width: typeof screen_width === 'number' ? screen_width : null,
      screen_height: typeof screen_height === 'number' ? screen_height : null,
      session_id: typeof session_id === 'string' ? session_id : null,
    })

    if (error) {
      console.error('[POST /api/track]', error)
      // Swallow the Supabase error — tracking failures must not surface to the user.
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/track]', err)
    // Never let an unexpected failure here turn into a disruptive 500 for the client.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
