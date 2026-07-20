import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const query = searchParams.get('query')
	const appid = searchParams.get('appid')

	if (!query && !appid) {
		return NextResponse.json({ error: 'Query or appid is required' }, { status: 400 })
	}

	try {
		if (appid) {
			// Fetch game details from Steam Store API
			const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=zh-cn`
			const res = await fetch(url, {
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				}
			})

			if (!res.ok) {
				return NextResponse.json({ error: 'Failed to fetch game details from Steam' }, { status: res.status })
			}

			const data = await res.json()
			return NextResponse.json(data)
		} else {
			// Search games on Steam
			const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query!)}&l=zh-cn&cc=CN`
			const res = await fetch(url, {
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				}
			})

			if (!res.ok) {
				return NextResponse.json({ error: 'Failed to search games on Steam' }, { status: res.status })
			}

			const data = await res.json()
			return NextResponse.json(data)
		}
	} catch (error: any) {
		console.error('Steam API proxy error:', error)
		return NextResponse.json({ error: error.message || 'Steam API request failed' }, { status: 500 })
	}
}
