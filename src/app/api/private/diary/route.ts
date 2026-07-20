import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	try {
		// Enforce that the request has an authorization header to be safe, 
		// or check session cookie. Since client uses privateKey in localStorage,
		// we can pass it via Authorization header.
		const isLocalDev = process.env.NODE_ENV === 'development'
		const authHeader = request.headers.get('Authorization')
		if (!isLocalDev && (!authHeader || !authHeader.startsWith('Bearer '))) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		const filePath = path.join(process.cwd(), 'src/data/private/diary.json')
		const data = await fs.readFile(filePath, 'utf-8')
		return NextResponse.json(JSON.parse(data))
	} catch (error) {
		// If file doesn't exist or other error, return empty array
		console.error('Failed to read private diary data:', error)
		return NextResponse.json([])
	}
}
