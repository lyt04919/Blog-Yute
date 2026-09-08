import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/server-auth'
import blogIndex from '@/../public/blogs/index.json'

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

// Pre-compute set of draft or hidden blog slugs for fast edge matching
const RESTRICTED_BLOG_SLUGS = new Set<string>(
	(blogIndex as Array<{ slug: string; status?: string; hidden?: boolean }>)
		.filter((b) => b.status === 'draft' || b.hidden === true)
		.map((b) => b.slug)
)

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// 1. Rewrite static /blogs/index.json to sanitized /api/blogs endpoint
	if (pathname === '/blogs/index.json') {
		const rewriteUrl = request.nextUrl.clone()
		rewriteUrl.pathname = '/api/blogs'
		return NextResponse.rewrite(rewriteUrl)
	}

	// 2. Protect static files of draft/hidden blogs from public crawling/direct download
	if (pathname.startsWith('/blogs/')) {
		const parts = pathname.split('/')
		// /blogs/:slug/...
		const slug = parts[2]
		if (slug && RESTRICTED_BLOG_SLUGS.has(slug)) {
			const isAuthorized = await verifyAdminAuth(request)
			if (!isAuthorized) {
				return NextResponse.json({ error: 'Not found' }, { status: 404 })
			}
		}
	}

	// 3. Protected admin/write pages and sensitive APIs
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
		'/blogs/:path*',
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
