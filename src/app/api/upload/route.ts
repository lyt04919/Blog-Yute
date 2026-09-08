import { NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { verifyAdminAuth } from '@/lib/server-auth'

const execFileAsync = promisify(execFile)

async function convertHeicToJpg(buffer: Buffer, destJpgPath: string): Promise<boolean> {
	// 1. Try sharp
	try {
		await sharp(buffer).jpeg({ quality: 90 }).toFile(destJpgPath)
		return true
	} catch (err: any) {
		console.warn('Sharp HEIC conversion failed, attempting sips fallback:', err.message)
	}

	// 2. On macOS, use native sips tool which handles Apple iOS 17/18 multi-ref HEIC perfectly
	if (process.platform === 'darwin') {
		const tempHeicPath = `${destJpgPath}.temp.heic`
		try {
			await writeFile(tempHeicPath, buffer)
			await execFileAsync('/usr/bin/sips', ['-s', 'format', 'jpeg', tempHeicPath, '--out', destJpgPath])
			await unlink(tempHeicPath).catch(() => {})
			return true
		} catch (sipsErr: any) {
			console.error('sips conversion failed:', sipsErr)
			await unlink(tempHeicPath).catch(() => {})
		}
	}

	return false
}

export async function POST(request: Request) {
	if (!(await verifyAdminAuth(request))) {
		return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 })
	}

	try {
		const formData = await request.formData()
		const file = formData.get('file') as File | null
		
		if (!file) {
			return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
		}

		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		const rawExt = path.extname(file.name) || '.png'
		const isHeic = rawExt.toLowerCase() === '.heic' || rawExt.toLowerCase() === '.heif' || file.type.includes('heic') || file.type.includes('heif')

		const hash = crypto.randomBytes(8).toString('hex')
		const rawFolder = (formData.get('folder') as string) || 'images/uploads'
		
		// Sanitize folder path to prevent path traversal
		const cleanFolder = path.normalize(rawFolder).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '')
		const publicBase = path.join(process.cwd(), 'public')
		const uploadDir = path.join(publicBase, cleanFolder)

		if (!uploadDir.startsWith(publicBase)) {
			return NextResponse.json({ error: 'Invalid upload destination' }, { status: 400 })
		}

		await mkdir(uploadDir, { recursive: true })

		if (isHeic) {
			const jpgFileName = `${hash}.jpg`
			const jpgFilePath = path.join(uploadDir, jpgFileName)

			const converted = await convertHeicToJpg(buffer, jpgFilePath)
			if (converted) {
				return NextResponse.json({ url: `/${cleanFolder}/${jpgFileName}` })
			}

			// Fallback: save original if conversion completely failed
			const fileName = `${hash}${rawExt}`
			const filePath = path.join(uploadDir, fileName)
			await writeFile(filePath, buffer)
			return NextResponse.json({ url: `/${cleanFolder}/${fileName}` })
		}

		const fileName = `${hash}${rawExt}`
		const filePath = path.join(uploadDir, fileName)
		await writeFile(filePath, buffer)

		return NextResponse.json({ url: `/${cleanFolder}/${fileName}` })
	} catch (e) {
		console.error('Upload error:', e)
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
	}
}
