import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('term') || searchParams.get('name')
  const trackId = searchParams.get('trackId')

  if (!term && !trackId) {
    return NextResponse.json({ error: 'Term or trackId is required' }, { status: 400 })
  }

  try {
    const url = new URL(trackId ? 'https://itunes.apple.com/lookup' : 'https://itunes.apple.com/search')
    if (trackId) {
      url.searchParams.set('id', trackId)
    } else if (term) {
      url.searchParams.set('term', term)
      url.searchParams.set('media', 'music')
      url.searchParams.set('entity', 'song')
      url.searchParams.set('limit', '5')
      url.searchParams.set('country', 'CN')
    }

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }
    })

    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
    }

    if (!res.ok) {
      return NextResponse.json({ previewUrl: '' }, { headers: cacheHeaders })
    }

    const data = await res.json()
    const match = data.results?.find((r: any) => r.previewUrl) || data.results?.[0]
    return NextResponse.json({
      previewUrl: match?.previewUrl || '',
      trackName: match?.trackName || '',
      artistName: match?.artistName || ''
    }, {
      headers: cacheHeaders
    })
  } catch {
    return NextResponse.json({ previewUrl: '' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600'
      }
    })
  }
}
