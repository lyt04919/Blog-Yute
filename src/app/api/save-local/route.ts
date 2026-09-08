import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'

export async function POST(req: Request) {
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json({ error: '仅在开发环境下支持本地保存' }, { status: 403 })
	}

	if (!(await verifyAdminAuth(req))) {
		return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 })
	}

	try {
		const body = await req.json()
		const { siteContent, cardStyles, files, deletedFiles } = body

		if (siteContent) {
			await fs.writeFile(path.join(process.cwd(), 'src/config/site-content.json'), JSON.stringify(siteContent, null, '\t'))
		}

		if (cardStyles) {
			await fs.writeFile(path.join(process.cwd(), 'src/config/card-styles.json'), JSON.stringify(cardStyles, null, '\t'))
		}

		if (files && files.length > 0) {
			for (const file of files) {
				const filePath = path.join(process.cwd(), file.path)
				const dir = path.dirname(filePath)
				await fs.mkdir(dir, { recursive: true })
				await fs.writeFile(filePath, Buffer.from(file.contentBase64, 'base64'))
			}
		}

		if (deletedFiles && deletedFiles.length > 0) {
			for (const p of deletedFiles) {
				const filePath = path.join(process.cwd(), p)
				try {
					await fs.rm(filePath, { recursive: true, force: true })
				} catch (e) {
					console.error('Failed to delete', p, e)
				}
			}
		}

		return NextResponse.json({ ok: true })
	} catch (error: any) {
		console.error('save-local error', error)
		return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
	}
}
