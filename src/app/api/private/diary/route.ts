import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	try {
		if (!(await verifyAdminAuth(request))) {
			return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 })
		}
		
		const filePath = path.join(process.cwd(), 'src/data/private/diary.json')
		const data = await fs.readFile(filePath, 'utf-8')
		return NextResponse.json(JSON.parse(data))
	} catch (error) {
		console.error('Failed to read private diary data:', error)
		return NextResponse.json([])
	}
}
