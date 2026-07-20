import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const query = searchParams.get('query')
	const movieId = searchParams.get('movieId')

	if (!query && !movieId) {
		return NextResponse.json({ error: 'Query or movieId is required' }, { status: 400 })
	}

	const apiKey = process.env.TMDB_API_KEY
	if (!apiKey) {
		return NextResponse.json({ error: 'TMDB_API_KEY is not configured in environment variables' }, { status: 500 })
	}

	try {
		let url = ''
		if (movieId) {
			url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=zh-CN&append_to_response=credits`
		} else {
			url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query!)}&language=zh-CN`
		}

		const res = await fetch(url, {
			headers: {
				accept: 'application/json'
			}
		})
		
		if (!res.ok) {
			const errorData = await res.json()
			return NextResponse.json({ error: errorData.status_message || 'Failed to fetch from TMDB' }, { status: res.status })
		}
		
		const data = await res.json()
		return NextResponse.json(data, {
			headers: {
				'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=60',
				'CDN-Cache-Control': 'max-age=3600'
			}
		})
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
