import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Production URL constant
const PRODUCTION_URL = 'https://tesepro.com.br'

// Get the correct origin for redirects
// In production behind a proxy, request.url may contain localhost
async function getRedirectOrigin(request: Request): Promise<string> {
  // Check for forwarded host header (set by proxy/load balancer)
  const headersList = await headers()
  const forwardedHost = headersList.get('x-forwarded-host')
  const forwardedProto = headersList.get('x-forwarded-proto') || 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  // Check host header
  const host = headersList.get('host')
  if (host && !host.includes('localhost')) {
    return `https://${host}`
  }

  // Fallback: if we detect localhost in request but we know we're in production
  const { origin } = new URL(request.url)
  if (origin.includes('localhost')) {
    // Hardcode production URL as last resort
    return PRODUCTION_URL
  }

  return origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Get the correct origin (handles proxy scenarios)
  const origin = await getRedirectOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
