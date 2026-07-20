import { toast } from 'sonner'

const GITHUB_TOKEN_CACHE_KEY = 'github_token'
const PASSWORD_CACHE_KEY = 'blog_author_pwd'

function getTokenFromCache(): string | null {
	if (typeof sessionStorage === 'undefined') return null
	try {
		return sessionStorage.getItem(GITHUB_TOKEN_CACHE_KEY)
	} catch {
		return null
	}
}

function saveTokenToCache(token: string): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(GITHUB_TOKEN_CACHE_KEY, token)
	} catch (error) {
		console.error('Failed to save token to cache:', error)
	}
}

function clearTokenCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(GITHUB_TOKEN_CACHE_KEY)
	} catch (error) {
		console.error('Failed to clear token cache:', error)
	}
}

export function getPasswordFromCache(): string | null {
	if (typeof sessionStorage === 'undefined') return null
	try {
		return sessionStorage.getItem(PASSWORD_CACHE_KEY)
	} catch {
		return null
	}
}

export function savePasswordToCache(pwd: string): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(PASSWORD_CACHE_KEY, pwd)
	} catch (error) {
		console.error('Failed to save password to cache:', error)
	}
}

function clearPasswordCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(PASSWORD_CACHE_KEY)
	} catch (error) {
		console.error('Failed to clear password cache:', error)
	}
}

export function clearAllAuthCache(): void {
	clearTokenCache()
	clearPasswordCache()
}

export async function hasAuth(): Promise<boolean> {
	return !!getTokenFromCache() || getPasswordFromCache() === '111'
}

/**
 * 获取 GitHub Installation Token
 * @returns token
 */
export async function getAuthToken(): Promise<string> {
	const cachedToken = getTokenFromCache()
	if (cachedToken) {
		toast.info('使用缓存的令牌...')
		return cachedToken
	}

	const password = getPasswordFromCache()
	if (!password || password !== '111') {
		throw new Error('未授权，请先登录')
	}

	toast.info('正在请求云端授权...')
	const res = await fetch('/api/auth/github-token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ password })
	})

	const data = await res.json()
	if (!res.ok || !data.success) {
		throw new Error(data.error || '获取令牌失败')
	}

	const token = data.token
	saveTokenToCache(token)

	return token
}
