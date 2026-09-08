import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'
import type { BlogIndexItem } from '@/app/blog/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	try {
		const indexPath = path.join(process.cwd(), 'public/blogs/index.json')
		let items: BlogIndexItem[] = []

		try {
			const content = await fs.readFile(indexPath, 'utf-8')
			items = JSON.parse(content)
		} catch {
			items = []
		}

		const isAuth = await verifyAdminAuth(request)

		if (isAuth) {
			return NextResponse.json(items, {
				headers: {
					'Cache-Control': 'private, no-cache, no-store, must-revalidate'
				}
			})
		}

		// Sanitize for visitors: strictly strip drafts and hidden items
		const publicItems = items.filter(
			(item) => !item.hidden && item.status !== 'draft'
		)

		return NextResponse.json(publicItems, {
			headers: {
				'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
			}
		})
	} catch (error: any) {
		console.error('Failed to fetch blog list:', error)
		return NextResponse.json({ error: error?.message || 'Failed to fetch blogs' }, { status: 500 })
	}
}
