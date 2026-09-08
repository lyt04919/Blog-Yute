import { NextResponse } from 'next/server'
import path from 'path'
import { existsSync } from 'fs'
import { writeFile, readFile } from 'fs/promises'
import sharp from 'sharp'
import { verifyAdminAuth } from '@/lib/server-auth'

export async function POST(request: Request) {
	if (!(await verifyAdminAuth(request))) {
		return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 })
	}

	try {
		const body = await request.json()
		const { url, degrees = 90 } = body
		
		if (!url || typeof url !== 'string') {
			return NextResponse.json({ error: 'URL is required' }, { status: 400 })
		}

		// Strip query parameters if present and sanitize path
		const cleanUrl = url.split('?')[0]
		const rawRelativePath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl
		const cleanRelativePath = path.normalize(rawRelativePath).replace(/^(\.\.[\/\\])+/, '')
		
		const publicBase = path.join(process.cwd(), 'public')
		const filePath = path.join(publicBase, cleanRelativePath)

		if (!filePath.startsWith(publicBase) || !existsSync(filePath)) {
			return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
		}

		// Rotate image using sharp
		const rot = Number(degrees) || 90
		const fileBuffer = await readFile(filePath)
		const rotatedBuffer = await sharp(fileBuffer).rotate(rot).toBuffer()
		await writeFile(filePath, rotatedBuffer)

		// Return fresh cache-busted URL
		const timestamp = Date.now()
		const newUrl = `${cleanUrl}?v=${timestamp}`

		return NextResponse.json({ success: true, url: newUrl })
	} catch (e: any) {
		console.error('Rotate error:', e)
		return NextResponse.json({ error: e?.message || 'Rotate failed' }, { status: 500 })
	}
}
