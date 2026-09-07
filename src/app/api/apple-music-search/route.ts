import { NextRequest, NextResponse } from 'next/server'

/**
 * Apple Music Catalog Search API
 * Uses iTunes Search API (public, no auth required) as a proxy for Apple Music catalog data
 * https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('term')
  const type = searchParams.get('type') || 'album' // album, song, artist, podcast

  if (!term || term.trim().length === 0) {
    return NextResponse.json({ error: 'Search term is required' }, { status: 400 })
  }

  try {
    // Map our types to iTunes entity types
    // Reference: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
    const entityMap: Record<string, string> = {
      album: 'album',
      song: 'song',
      artist: 'musicArtist',
      podcast: 'podcast'
    }

    const mediaMap: Record<string, string> = {
      album: 'music',
      song: 'music',
      artist: 'music',
      podcast: 'podcast'
    }

    const entity = entityMap[type] || 'album'
    const media = mediaMap[type] || 'music'

    // 多区域智能检索（若 CN 区受限无结果，自动漫游至 Global / TW / HK / US，确保能搜出任意歌曲）
    const regions = ['', 'TW', 'HK', 'US', 'CN']
    let data: any = { results: [], resultCount: 0 }

    for (const region of regions) {
      const url = new URL('https://itunes.apple.com/search')
      url.searchParams.set('term', term.trim())
      url.searchParams.set('media', media)
      url.searchParams.set('entity', entity)
      url.searchParams.set('limit', '20')
      if (region) {
        url.searchParams.set('country', region)
      }

      try {
        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const resJson = await response.json()
          if (resJson.results && resJson.results.length > 0) {
            data = resJson
            break
          }
        }
      } catch {}
    }

    // Transform iTunes results to our format
    const results = data.results.map((item: any) => {
      // Different field names for songs vs albums
      const isSong = type === 'song'
      const id = isSong ? (item.trackId || item.collectionId) : (item.collectionId || item.trackId)
      const name = isSong ? (item.trackName || item.collectionName) : (item.collectionName || item.trackName)
      const link = isSong ? (item.trackViewUrl || item.collectionViewUrl) : (item.collectionViewUrl || item.trackViewUrl)

      // Canonical Apple Music Embed URL
      let embedSrc = ''
      if (isSong) {
        if (item.collectionId && item.trackId) {
          embedSrc = `https://embed.music.apple.com/cn/album/${item.collectionId}?i=${item.trackId}`
        } else if (id) {
          embedSrc = `https://embed.music.apple.com/cn/song/${id}`
        }
      } else {
        embedSrc = id ? `https://embed.music.apple.com/cn/album/${id}` : ''
      }

      const playerHeight = isSong ? 175 : 450

      return {
        id,
        name,
        artist: item.artistName || '',
        cover: item.artworkUrl100
          ? item.artworkUrl100.replace('100x100', '600x600')
          : '',
        coverSmall: item.artworkUrl100 || '',
        link,
        type: type,
        genre: item.primaryGenreName || '',
        releaseDate: item.releaseDate || '',
        trackCount: item.trackCount || 0,
        previewUrl: item.previewUrl || '',
        // Generate Apple Music embed code if available
        embedCode: embedSrc
          ? `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="${playerHeight}" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${embedSrc}"></iframe>`
          : ''
      }
    })

    return NextResponse.json({
      success: true,
      results,
      count: data.resultCount
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=3600'
      }
    })
  } catch (error: any) {
    console.error('Apple Music search error:', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
