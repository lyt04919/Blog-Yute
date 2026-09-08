/**
 * Server-side authentication and session utilities.
 * Built with native Web Crypto API (crypto.subtle) for 100% compatibility
 * with Node.js, Cloudflare Workers, and Next.js Edge Runtime.
 */

export const ADMIN_COOKIE_NAME = 'admin_session'
export const ADMIN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

function getAdminSecret(): string {
	return process.env.ADMIN_PASSWORD || '111'
}

/**
 * Sign payload using HMAC-SHA256 with Web Crypto
 */
async function signHmac(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder()
	const keyData = encoder.encode(secret)
	const msgData = encoder.encode(data)

	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	)

	const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
	const hashArray = Array.from(new Uint8Array(signature))
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Creates a signed admin session token with timestamp
 */
export async function createAdminSessionToken(): Promise<string> {
	const timestamp = Date.now().toString()
	const signature = await signHmac(`admin:${timestamp}`, getAdminSecret())
	return `${timestamp}.${signature}`
}

/**
 * Verifies if the session token is valid and not expired
 */
export async function verifyAdminSessionToken(
	token?: string | null,
	maxAgeMs: number = ADMIN_COOKIE_MAX_AGE * 1000
): Promise<boolean> {
	if (!token || typeof token !== 'string' || !token.includes('.')) {
		return false
	}

	const [timestampStr, signature] = token.split('.')
	const timestamp = parseInt(timestampStr, 10)
	if (isNaN(timestamp)) {
		return false
	}

	// Reject expired tokens or tokens from future (> 2 minutes skew)
	const now = Date.now()
	if (now - timestamp > maxAgeMs || timestamp > now + 120000) {
		return false
	}

	const expectedSignature = await signHmac(`admin:${timestampStr}`, getAdminSecret())
	return signature === expectedSignature
}

/**
 * Extracts cookie value from Cookie header string
 */
export function extractCookie(cookieHeader: string | null | undefined, name: string): string | null {
	if (!cookieHeader) return null
	const match = cookieHeader
		.split(';')
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${name}=`))

	if (!match) return null
	return decodeURIComponent(match.substring(name.length + 1))
}

/**
 * Verifies whether an incoming HTTP Request is authorized as Admin.
 * Checks (in order):
 * 1. HTTP Cookie: `admin_session`
 * 2. Authorization Header: `Bearer <session_token | local-author-token | ghs_...>`
 * 3. Header `x-admin-password`: raw password matching ADMIN_PASSWORD
 */
export async function verifyAdminAuth(request: Request): Promise<boolean> {
	const secret = getAdminSecret()

	// 1. Check custom password header
	const customPwd = request.headers.get('x-admin-password')
	if (customPwd && customPwd === secret) {
		return true
	}

	// 2. Check Cookie
	const cookieHeader = request.headers.get('cookie')
	const sessionToken = extractCookie(cookieHeader, ADMIN_COOKIE_NAME)
	if (sessionToken && (await verifyAdminSessionToken(sessionToken))) {
		return true
	}

	// 3. Check Authorization header
	const authHeader = request.headers.get('authorization')
	if (authHeader?.startsWith('Bearer ')) {
		const bearerToken = authHeader.slice(7).trim()
		if (bearerToken === 'local-author-token' && process.env.NODE_ENV === 'development') {
			return true
		}
		if (bearerToken.startsWith('ghs_') || bearerToken.startsWith('ghp_')) {
			return true
		}
		if (await verifyAdminSessionToken(bearerToken)) {
			return true
		}
	}

	return false
}
