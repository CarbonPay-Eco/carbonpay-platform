import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const protectedPaths = [
    "/webapp/dashboard",
    "/webapp/assets",
    "/webapp/emissions",
    "/webapp/profile",
  ];
  const publicPaths = ["/webapp/login", "/webapp/onboard"];

  const path = request.nextUrl.pathname;

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
  );

  // Check if the current path is public
  const isPublicPath = publicPaths.some((publicPath) =>
    path.startsWith(publicPath)
  );

  // If accessing a protected path without token, redirect to login
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/webapp/login", request.url));
  }

  // If already authenticated and trying to access login/onboard, redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/webapp/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/webapp/dashboard/:path*",
    "/webapp/assets/:path*",
    "/webapp/emissions/:path*",
    "/webapp/profile/:path*",
    "/webapp/login",
    "/webapp/onboard",
  ],
};
