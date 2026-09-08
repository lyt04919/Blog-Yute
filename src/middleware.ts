import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/server-auth'

const PROTECTED_PAGE_PREFIXES = ['/admin', '/write']
const PROTECTED_API_PREFIXES = [
	'/api/admin',
	'/api/save-data',
	'/api/save-local',
	'/api/save-blog-local',
	'/api/delete-blog-local',
	'/api/upload',
	'/api/rotate-image',
	'/api/private'
]

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	)
	const isProtectedApi = PROTECTED_API_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	)

	if (!isProtectedPage && !isProtectedApi) {
		return NextResponse.next()
	}

	const isAuthorized = await verifyAdminAuth(request)

	if (isAuthorized) {
		return NextResponse.next()
	}

	// Unauthorized handling
	if (isProtectedApi) {
		return NextResponse.json(
			{ error: 'Unauthorized: Admin privileges required' },
			{ status: 401 }
		)
	}

	// For protected page routes, redirect to home with auth required query
	const redirectUrl = request.nextUrl.clone()
	redirectUrl.pathname = '/'
	redirectUrl.searchParams.set('auth', 'required')
	redirectUrl.searchParams.set('from', pathname)
	return NextResponse.redirect(redirectUrl)
}

export const config = {
	matcher: [
		'/admin/:path*',
		'/write/:path*',
		'/api/admin/:path*',
		'/api/save-data',
		'/api/save-local',
		'/api/save-blog-local',
		'/api/delete-blog-local',
		'/api/upload',
		'/api/rotate-image',
		'/api/private/:path*'
	]
}
