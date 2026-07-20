import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	let query = searchParams.get('url')?.trim()

	if (!query) {
		return NextResponse.json({ error: 'URL or search query is required' }, { status: 400 })
	}
	
	const isUrl = /^https?:\/\//i.test(query) || (query.includes('.') && !query.includes(' '))

	if (!isUrl) {
		// --- Handle as Search Query ---
		try {
			const type = searchParams.get('type')?.trim();
			
			if (type === 'book') {
				// Special handling for books using Douban Suggest API
				const doubanRes = await fetch(`https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`);
				if (doubanRes.ok) {
					const doubanData = await doubanRes.json();
					if (Array.isArray(doubanData) && doubanData.length > 0) {
						// Filter for books (type === 'b') just in case
						const book = doubanData.find((item: any) => item.type === 'b') || doubanData[0];
						if (book) {
							// Douban returns pic as "s/public" (small). Change to "l/public" (large)
							const highResPic = book.pic ? book.pic.replace('/s/public/', '/l/public/') : '';
							const proxiedPic = highResPic ? `/api/image-proxy?url=${encodeURIComponent(highResPic)}` : '';
							return NextResponse.json({
								title: book.title || query,
								description: '',
								author: book.author_name ? `${book.author_name}${book.year ? ` (${book.year})` : ''}` : '',
								image: proxiedPic,
								icon: proxiedPic,
								siteName: 'Douban Books',
								url: book.url || ''
							});
						}
					}
				}
				// Fallback if Douban search fails
				return NextResponse.json({
					title: query,
					description: '',
					image: '',
					icon: '',
					siteName: '',
					url: ''
				});
			}

			const candidates: Array<{
				source: 'itunes-mac' | 'itunes-ios' | 'clearbit'
				title: string
				description: string
				image: string
				icon: string
				siteName: string
				url: string
				score: number
			}> = []

			// Helper functions for scoring
			const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const getSearchMatchScore = (q: string, t: string, src: string): number => {
				const queryLower = q.toLowerCase().trim()
				const titleLower = t.toLowerCase().trim()
				const normQ = queryLower.replace(/[^a-z0-9]/g, '')
				const normT = titleLower.replace(/[^a-z0-9]/g, '')

				let baseScore = 0

				if (normT === normQ) {
					baseScore = 100
				} else if (normT.startsWith(normQ)) {
					const wordRegex = new RegExp(`^${escapeRegExp(queryLower)}\\b`, 'i')
					if (wordRegex.test(titleLower)) {
						baseScore = 90
					} else {
						baseScore = 80
					}
				} else if (normT.includes(normQ)) {
					const wordRegex = new RegExp(`\\b${escapeRegExp(queryLower)}\\b`, 'i')
					if (wordRegex.test(titleLower)) {
						baseScore = 75
					} else {
						baseScore = 60
					}
				}

				if (baseScore === 0) return 0

				let finalScore = baseScore
				const lenDiff = Math.abs(titleLower.length - queryLower.length)
				finalScore -= lenDiff * 0.5

				if (src === 'clearbit' && normT !== normQ) {
					finalScore -= 30
				}

				return finalScore
			}

			// 1. Fetch from iTunes Mac Software
			try {
				const macRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=macSoftware&limit=5`)
				if (macRes.ok) {
					const macData = await macRes.json()
					if (macData.results) {
						for (const app of macData.results) {
							candidates.push({
								source: 'itunes-mac',
								title: app.trackName || query || '',
								description: app.description?.substring(0, 200) + '...' || '',
								image: app.artworkUrl512 || '',
								icon: app.artworkUrl512 || app.artworkUrl100 || '',
								siteName: 'App Store',
								url: app.trackViewUrl || '',
								score: 0
							})
						}
					}
				}
			} catch (e) {
				console.error('iTunes Mac API Search Error:', e)
			}

			// 2. Fetch from iTunes iOS Software
			try {
				const iosRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=5`)
				if (iosRes.ok) {
					const iosData = await iosRes.json()
					if (iosData.results) {
						for (const app of iosData.results) {
							candidates.push({
								source: 'itunes-ios',
								title: app.trackName || query || '',
								description: app.description?.substring(0, 200) + '...' || '',
								image: app.artworkUrl512 || '',
								icon: app.artworkUrl512 || app.artworkUrl100 || '',
								siteName: 'App Store',
								url: app.trackViewUrl || '',
								score: 0
							})
						}
					}
				}
			} catch (e) {
				console.error('iTunes iOS API Search Error:', e)
			}

			// 3. Fetch from Clearbit Autocomplete API
			try {
				const clearbitRes = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`)
				if (clearbitRes.ok) {
					const clearbitData = await clearbitRes.json()
					if (clearbitData) {
						for (const comp of clearbitData) {
							candidates.push({
								source: 'clearbit',
								title: comp.name || query || '',
								description: '',
								image: `https://logo.clearbit.com/${comp.domain}`,
								icon: `https://logo.clearbit.com/${comp.domain}`,
								siteName: comp.name || '',
								url: `https://${comp.domain}`,
								score: 0
							})
						}
					}
				}
			} catch (e) {
				console.error('Clearbit Autocomplete API Search Error:', e)
			}

			// Score and rank candidates
			if (candidates.length > 0) {
				for (const c of candidates) {
					c.score = getSearchMatchScore(query, c.title, c.source)
				}
				// Sort by score desc, then prefer clearbit in case of tie for nice domain urls
				candidates.sort((a, b) => {
					if (b.score !== a.score) {
						return b.score - a.score
					}
					if (a.source === 'clearbit' && b.source !== 'clearbit') return -1
					if (b.source === 'clearbit' && a.source !== 'clearbit') return 1
					return 0
				})

				const best = candidates[0]
				// Only return a candidate if it matches the query in some way (score > 0)
				// Or fallback to the first candidate if all fail to match keywords
				if (best.score > 0 || candidates.length > 0) {
					return NextResponse.json({
						title: best.title,
						description: best.description,
						image: best.image,
						icon: best.icon,
						siteName: best.siteName,
						url: best.url
					})
				}
			}

			// Fallback if no candidates found
			return NextResponse.json({
				title: query,
				description: '',
				image: '',
				icon: '',
				siteName: '',
				url: ''
			})
		} catch (error) {
			return NextResponse.json({
				title: query,
				description: '',
				image: '',
				icon: '',
				siteName: '',
				url: ''
			})
		}
	}

	// --- Handle as URL ---
	let url = query
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		url = 'https://' + url
	}

	try {
		// 1. Special handling for Apple App Store links
		const appStoreMatch = url.match(/apps\.apple\.com\/(?:[a-z]{2}\/)?app\/(?:[^\/]+\/)?id(\d+)/i)
		if (appStoreMatch && appStoreMatch[1]) {
			const appId = appStoreMatch[1]
			const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${appId}`)
			if (itunesRes.ok) {
				const itunesData = await itunesRes.json()
				if (itunesData.resultCount > 0) {
					const app = itunesData.results[0]
					return NextResponse.json({
						title: app.trackName || '',
						description: app.description?.substring(0, 200) + '...' || '',
						image: app.artworkUrl512 || '',
						icon: app.artworkUrl512 || app.artworkUrl100 || '',
						siteName: 'App Store',
						url: url
					})
				}
			}
		}

		// 2. Normal OG scraping
		let fetchUrl = url
		let fetchHeaders: Record<string, string> = {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
		}

		// Bypass Douban anti-bot by using mobile user-agent and mobile site
		if (url.includes('douban.com')) {
			fetchHeaders['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
			if (url.includes('movie.douban.com/subject/')) {
				fetchUrl = url.replace('movie.douban.com/subject/', 'm.douban.com/movie/subject/')
			} else if (url.includes('book.douban.com/subject/')) {
				fetchUrl = url.replace('book.douban.com/subject/', 'm.douban.com/book/subject/')
			}
		}

		const response = await fetch(fetchUrl, {
			headers: fetchHeaders,
		})

		if (!response.ok) {
			let fallbackTitle = url
			try { fallbackTitle = new URL(url).hostname } catch (e) {}
			return NextResponse.json({
				title: fallbackTitle,
				description: '',
				image: '',
				icon: '',
				siteName: '',
				url: url
			})
		}

		const html = await response.text()

		const getMetaContent = (html: string, property: string, name?: string) => {
			let match = html.match(new RegExp(`<meta(?:\\s+[^>]*?)?(?:property=["']${property}["']|name=["']${name || property}["'])[^>]*?content=["']([^"']*)["'][^>]*?>`, 'i'))
			if (!match) {
				match = html.match(new RegExp(`<meta[^>]*?content=["']([^"']*)["'][^>]*?(?:property=["']${property}["']|name=["']${name || property}["'])[^>]*?>`, 'i'))
			}
			return match ? match[1] : null
		}

		let title = getMetaContent(html, 'og:title')
		if (!title) {
			const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
			title = titleMatch ? titleMatch[1] : null
		}

		// Clean up Douban titles and ignore captcha page title
		if (title && url.includes('douban.com')) {
			title = title.replace(/ - 电影$/, '').replace(/ - 电视剧$/, '').replace(/ - 图书$/, '').replace(/ \(豆瓣\)$/, '').trim()
			if (title === '豆瓣') {
				title = null
			}
		}

		let description = getMetaContent(html, 'og:description', 'description')

		// Extract full description from Douban's mobile HTML instead of truncated og:description
		if (url.includes('douban.com')) {
			const introMatch = html.match(/<p[^>]*data-clamp=["']\d+["'][^>]*>([\s\S]*?)<\/p>/i)
			if (introMatch && introMatch[1]) {
				// Replace <br/> with newline and strip HTML
				description = introMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
			} else if (description) {
				// Fallback if data-clamp is not found: strip Douban's prefix like "绿皮书豆瓣评分：8.9 简介："
				description = description.replace(/^.*?简介[：:]\s*/, '').trim()
			}
		}

		let image = getMetaContent(html, 'og:image')
		
		let icon = null
		const appleTouchIconMatch = html.match(/<link[^>]*?rel=["']apple-touch-icon["'][^>]*?href=["']([^"']*)["'][^>]*?>/i)
		if (appleTouchIconMatch) icon = appleTouchIconMatch[1]
		if (!icon) {
			const iconMatch = html.match(/<link[^>]*?rel=["'](?:shortcut )?icon["'][^>]*?href=["']([^"']*)["'][^>]*?>/i)
			if (iconMatch) icon = iconMatch[1]
		}

		const resolveUrl = (urlToResolve: string | null) => {
			if (urlToResolve && !urlToResolve.startsWith('http')) {
				try {
					const baseUrl = new URL(url)
					return new URL(urlToResolve, baseUrl).toString()
				} catch (e) {
					return urlToResolve
				}
			}
			return urlToResolve
		}

		image = resolveUrl(image)
		icon = resolveUrl(icon)

		if (image && image.includes('doubanio.com')) {
			// Remove mobile crop/thumbnail query params to get the original high-res poster
			image = image.replace(/\?imageView2.*$/, '')
			// Qiniu mobile CDN (qnmobX) refuses to serve the uncropped image, so switch to the standard img9 domain
			if (image.includes('qnmob')) {
				image = image.replace(/qnmob\d*\.doubanio\.com/, 'img9.doubanio.com')
			}
			image = `/api/image-proxy?url=${encodeURIComponent(image)}`
		}
		if (icon && icon.includes('doubanio.com')) {
			icon = `/api/image-proxy?url=${encodeURIComponent(icon)}`
		}

		const siteName = getMetaContent(html, 'og:site_name')

		// Douban extra parsing
		let extraData: any = {}
		if (url.includes('douban.com')) {
			try {
				const idMatch = url.match(/subject\/(\d+)/)
				if (idMatch && idMatch[1]) {
					const doubanId = idMatch[1]
					const typeMatch = url.match(/(movie|tv|book|music)\.douban\.com/)
					let type = typeMatch ? typeMatch[1] : 'movie'
					const mTypeMatch = url.match(/m\.douban\.com\/(movie|tv|book|music)\//)
					if (mTypeMatch) type = mTypeMatch[1]

					const rexxarUrl = `https://m.douban.com/rexxar/api/v2/${type}/${doubanId}`
					const rexxarRes = await fetch(rexxarUrl, {
						headers: {
							'Referer': `https://m.douban.com/${type}/subject/${doubanId}/`,
							'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
						}
					})
					
					if (rexxarRes.ok) {
						const rxData = await rexxarRes.json()
						if (rxData && rxData.title) {
							if (rxData.directors && rxData.directors.length > 0) {
								extraData.director = rxData.directors.map((d: any) => d.name).join(', ')
							}
							if (rxData.pubdate && rxData.pubdate.length > 0) {
								const dateMatch = rxData.pubdate[0].match(/\d{4}-\d{2}-\d{2}/)
								if (dateMatch) extraData.releaseDate = dateMatch[0]
							} else if (rxData.year) {
								extraData.releaseDate = `${rxData.year}-01-01`
							}
							if (rxData.genres && rxData.genres.length > 0) {
								extraData.tags = rxData.genres
							}
						}
					}
				}
			} catch (err) {
				console.error('Rexxar API failed:', err)
			}

			// Fallback to sub-meta parsing for tags/date if Rexxar failed
			const subMetaMatch = html.match(/<div class="sub-meta">([\s\S]*?)<\/div>/i)
			if (subMetaMatch && subMetaMatch[1]) {
				const text = subMetaMatch[1].replace(/<[^>]+>/g, '').trim()
				const parts = text.split('/').map(s => s.trim())
				
				if (!extraData.releaseDate) {
					const datePart = parts.find(p => p.match(/\d{4}-\d{2}-\d{2}/) || p.includes('上映') || p.includes('首播'))
					if (datePart) {
						const dMatch = datePart.match(/\d{4}-\d{2}-\d{2}/)
						if (dMatch) extraData.releaseDate = dMatch[0]
					}
				}

				if (!extraData.tags) {
					const tags = parts.filter(p => !p.match(/\d/) && p.length <= 4 && !p.includes('分钟'))
					if (tags.length > 0) {
						extraData.tags = tags
					}
				}
			}
		}

		return NextResponse.json({
			title: title?.trim() || '',
			description: description?.trim() || '',
			image: image || '',
			icon: icon || '',
			siteName: siteName?.trim() || '',
			url: url,
			...extraData
		})

	} catch (error: any) {
		console.error('OG API Error:', error)
		let fallbackTitle = url
		try { fallbackTitle = new URL(url).hostname } catch (e) {}
		
		return NextResponse.json({
			title: fallbackTitle,
			description: '',
			image: '',
			icon: '',
			siteName: '',
			url: url
		})
	}
}
