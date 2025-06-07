import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isIPBlacklisted } from './src/lib/auth'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/settings',
  '/content',
  '/analytics',
  '/users',
  '/roles',
  '/permissions'
]

// Define public routes that should redirect to dashboard if authenticated
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/users',
  '/roles',
  '/permissions',
  '/settings/system'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Get client IP address
  const clientIP = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown'

  try {
    // Check IP blacklist
    if (await isIPBlacklisted(clientIP)) {
      return new NextResponse('Access Denied', { status: 403 })
    }

    // Get current user
    const user = await getCurrentUser(request)

    // Handle protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      if (!user) {
        // Redirect to login with return URL
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check admin routes
      if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (user.role.name !== 'admin' && user.role.name !== 'super_admin') {
          return new NextResponse('Forbidden', { status: 403 })
        }
      }

      // Add user info to headers for server components
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-role', user.role.name)
    }

    // Handle auth routes (redirect if already authenticated)
    if (authRoutes.some(route => pathname.startsWith(route))) {
      if (user) {
        const returnUrl = request.nextUrl.searchParams.get('returnUrl')
        const redirectUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }

    // Handle root route
    if (pathname === '/') {
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    
    // If there's an error and it's a protected route, redirect to login
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}