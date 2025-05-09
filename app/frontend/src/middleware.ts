import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const walletConnected = request.cookies.get('walletConnected')?.value === 'true'
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/webapp')
  const isLandingPage = request.nextUrl.pathname === '/'

  // Redirect to landing page if trying to access protected routes without wallet
  if (isProtectedRoute && !walletConnected) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect to dashboard if trying to access landing page with wallet
  if (isLandingPage && walletConnected) {
    return NextResponse.redirect(new URL('/webapp/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/webapp/:path*']
} 