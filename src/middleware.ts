import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')

  if (isApiAuth) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|tutor|_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
