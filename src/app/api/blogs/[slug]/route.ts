import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'
import type { BlogConfig } from '@/app/blog/types'

export const dynamic = 'force-dynamic'

export async function GET(
	request: Request,
	context: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug: rawSlug } = await context.params
		const slug = decodeURIComponent(rawSlug || '').trim()

		if (!slug || slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
			return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
		}

		const blogDir = path.join(process.cwd(), 'public/blogs', slug)
		const configPath = path.join(blogDir, 'config.json')
		const mdPath = path.join(blogDir, 'index.md')

		let config: BlogConfig = {}
		let markdown = ''

		try {
			const mdContent = await fs.readFile(mdPath, 'utf-8')
			markdown = mdContent
		} catch {
			return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
		}

		try {
			const configContent = await fs.readFile(configPath, 'utf-8')
			config = JSON.parse(configContent)
		} catch {
			config = {}
		}

		// Check if article is draft or hidden
		const isRestricted = config.status === 'draft' || config.hidden === true

		if (isRestricted) {
			const isAuth = await verifyAdminAuth(request)
			if (!isAuth) {
				return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
			}
		}

		return NextResponse.json(
			{
				slug,
				config,
				markdown,
				cover: config.cover
			},
			{
				headers: {
					'Cache-Control': isRestricted
						? 'private, no-cache, no-store, must-revalidate'
						: 'public, s-maxage=60, stale-while-revalidate=300'
				}
			}
		)
	} catch (error: any) {
		console.error('Error fetching blog post:', error)
		return NextResponse.json({ error: error?.message || 'Failed to fetch blog post' }, { status: 500 })
	}
}
