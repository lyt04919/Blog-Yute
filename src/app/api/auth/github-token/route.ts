import { NextResponse } from 'next/server'
import { signAppJwt, getInstallationId, createInstallationToken } from '@/lib/github-client'
import { GITHUB_CONFIG } from '@/consts'
import { createAdminSessionToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from '@/lib/server-auth'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { password } = body

		// Check configured admin password
		const expectedPassword = process.env.ADMIN_PASSWORD || '111'
		if (password !== expectedPassword) {
			return NextResponse.json({ error: 'Unauthorized: Invalid password' }, { status: 401 })
		}

		// Create signed admin session token for Edge & Node middleware
		const sessionToken = await createAdminSessionToken()

		const setSessionCookie = (res: NextResponse) => {
			res.cookies.set({
				name: ADMIN_COOKIE_NAME,
				value: sessionToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/',
				maxAge: ADMIN_COOKIE_MAX_AGE
			})
			return res
		}

		// Check for private key in environment variable
		let privateKey = process.env.GITHUB_PRIVATE_KEY
		if (!privateKey) {
			// In local development or environment without private key, allow author unlock
			const res = NextResponse.json({
				success: true,
				token: 'local-author-token',
				sessionToken,
				isLocal: true
			})
			return setSessionCookie(res)
		}

		// In some environments, \n is passed as a literal string '\\n', we need to unescape it
		privateKey = privateKey.replace(/\\n/g, '\n')

		const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)
		const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)
		const token = await createInstallationToken(jwt, installationId)

		const res = NextResponse.json({ success: true, token, sessionToken })
		return setSessionCookie(res)
	} catch (error: any) {
		console.error('Failed to generate GitHub token:', error)
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
	}
}
