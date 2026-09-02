import { NextResponse } from 'next/server'

// In-memory cache to prevent redundant fetches and eliminate server lag
interface CacheEntry {
	buffer: Buffer
	contentType: string
	expires: number
}

const memoryCache = new Map<string, CacheEntry>()
const MAX_CACHE_SIZE = 300
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getFromCache(key: string): CacheEntry | null {
	const entry = memoryCache.get(key)
	if (!entry) return null
	if (Date.now() > entry.expires) {
		memoryCache.delete(key)
		return null
	}
	return entry
}

function setToCache(key: string, buffer: Buffer, contentType: string) {
	if (memoryCache.size >= MAX_CACHE_SIZE) {
		// Prune oldest 20% entries
		const keysToDelete = Array.from(memoryCache.keys()).slice(0, 50)
		for (const k of keysToDelete) memoryCache.delete(k)
	}
	memoryCache.set(key, {
		buffer,
		contentType,
		expires: Date.now() + CACHE_TTL_MS
	})
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	let imageUrl = searchParams.get('url')?.trim()

	if (!imageUrl) {
		return NextResponse.json({ error: 'URL is required' }, { status: 400 })
	}

	// Decode URL if it was double encoded
	try {
		imageUrl = decodeURIComponent(imageUrl)
	} catch (e) {
		// keep original if decoding fails
	}

	// 1. Check memory cache first (instant < 0.1ms response)
	const cached = getFromCache(imageUrl)
	if (cached) {
		return new NextResponse(new Uint8Array(cached.buffer), {
			headers: {
				'Content-Type': cached.contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
				'X-Proxy-Cache': 'HIT'
			}
		})
	}

	try {
		const isDouban = imageUrl.includes('doubanio.com') || imageUrl.includes('douban.com')
		
		const fetchHeaders: Record<string, string> = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		}
		if (isDouban) {
			fetchHeaders['Referer'] = 'https://book.douban.com/'
		}

		let response: Response | null = null
		
		// Helper fetch with strict 2.5s timeout to prevent connection blocking
		const fetchWithTimeout = async (url: string) => {
			try {
				return await fetch(url, {
					headers: fetchHeaders,
					signal: AbortSignal.timeout(2500)
				})
			} catch {
				return null
			}
		}

		response = await fetchWithTimeout(imageUrl)

		// Fallback for Douban if large failed, try s_ratio_poster
		if ((!response || !response.ok) && isDouban && imageUrl.includes('/large/')) {
			const sRatioUrl = imageUrl.replace('/large/', '/s_ratio_poster/')
			const fallbackRes = await fetchWithTimeout(sRatioUrl)
			if (fallbackRes?.ok) {
				response = fallbackRes
			}
		}

		// Fallback for Douban CDN domain switching if img9/img3/img1 fails
		if ((!response || !response.ok) && isDouban) {
			const fallbackDomains = ['img1.doubanio.com', 'img2.doubanio.com', 'img3.doubanio.com', 'img9.doubanio.com']
			for (const domain of fallbackDomains) {
				const fallbackUrl = imageUrl.replace(/img\d+\.doubanio\.com/, domain)
				const fallbackRes = await fetchWithTimeout(fallbackUrl)
				if (fallbackRes?.ok) {
					response = fallbackRes
					break
				}
			}
		}

		// Fallback for TMDB / external CDN via wsrv.nl mirror if blocked
		if (!response || !response.ok) {
			const mirrorUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`
			try {
				const mirrorRes = await fetch(mirrorUrl, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
					},
					signal: AbortSignal.timeout(3000)
				})
				if (mirrorRes.ok) {
					response = mirrorRes
				}
			} catch {
				// ignore
			}
		}

		if (!response || !response.ok) {
			return NextResponse.json({ error: 'Failed to fetch image' }, { 
				status: 404,
				headers: { 'Cache-Control': 'public, max-age=60' }
			})
		}

		const contentType = response.headers.get('content-type') || 'image/jpeg'
		const arrayBuffer = await response.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Save to memory cache
		setToCache(imageUrl, buffer, contentType)

		return new NextResponse(new Uint8Array(buffer), {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
				'X-Proxy-Cache': 'MISS'
			}
		})
	} catch (error) {
		console.error('Image proxy error:', error)
		return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
	}
}
