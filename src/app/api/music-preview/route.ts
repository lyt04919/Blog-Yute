import { NextRequest, NextResponse } from 'next/server'

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
}

async function fetchFromApple(url: string) {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.results || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('term') || searchParams.get('name')
  const trackId = searchParams.get('trackId')
  const albumId = searchParams.get('albumId')

  if (!term && !trackId && !albumId) {
    return NextResponse.json({ error: 'Term, trackId or albumId is required' }, { status: 400 })
  }

  try {
    let match: any = null

    // 1. 优先通过精确 trackId 获取（最精准，100% 匹配目标音轨）
    if (trackId) {
      for (const countryParam of ['', '&country=TW', '&country=US']) {
        const results = await fetchFromApple(`https://itunes.apple.com/lookup?id=${trackId}${countryParam}`)
        match = results?.find((r: any) => r.previewUrl)
        if (match) break
      }
    }

    // 2. 其次通过专辑 albumId 检索专辑内的首选歌曲
    if (!match && albumId) {
      for (const countryParam of ['', '&country=TW', '&country=US']) {
        const results = await fetchFromApple(`https://itunes.apple.com/lookup?id=${albumId}&entity=song${countryParam}`)
        match = results?.find((r: any) => r.previewUrl)
        if (match) break
      }
    }

    // 3. 最后通过歌曲名 + 艺术家关键词智能多区域搜索（移除原先狭窄且限制严格的 country=CN）
    if (!match && term) {
      const encodedTerm = encodeURIComponent(term)
      for (const countryParam of ['', '&country=TW', '&country=HK', '&country=US']) {
        const results = await fetchFromApple(`https://itunes.apple.com/search?term=${encodedTerm}&media=music&entity=song&limit=5${countryParam}`)
        match = results?.find((r: any) => r.previewUrl)
        if (match) break
      }
    }

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

