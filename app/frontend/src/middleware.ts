import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Remove walletConnected logic. Allow access to onboarding and landing page.
  // Optionally, add JWT/session check for /webapp/dashboard in the future.
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/webapp/:path*"],
};
