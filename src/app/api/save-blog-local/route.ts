import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'

export async function POST(req: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ success: false, error: '仅在开发环境下支持本地保存' }, { status: 403 })
    }

    if (!(await verifyAdminAuth(req))) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 })
    }

    try {
        const { slug, md, config, images } = await req.json()
        if (!slug) return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 })

        const dirPath = path.join(process.cwd(), 'public/blogs', slug)
        
        // Ensure dir exists
        await fs.mkdir(dirPath, { recursive: true })

        // Save local images
        let mdContent = md
        if (images && images.length > 0) {
            for (const img of images) {
                if (img.path && img.contentBase64) {
                    const imgPath = path.join(process.cwd(), img.path)
                    const imgDir = path.dirname(imgPath)
                    await fs.mkdir(imgDir, { recursive: true })
                    await fs.writeFile(imgPath, Buffer.from(img.contentBase64, 'base64'))
                }
            }
        }

        const mdPath = path.join(dirPath, 'index.md')
        await fs.writeFile(mdPath, mdContent, 'utf-8')

        const configPath = path.join(dirPath, 'config.json')
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')

        // Update global index.json
        const indexPath = path.join(process.cwd(), 'public/blogs/index.json')
        let indexData: any[] = []
        try {
            const indexStr = await fs.readFile(indexPath, 'utf-8')
            indexData = JSON.parse(indexStr)
        } catch {
            // file might not exist or be empty
        }

        const existingIndex = indexData.findIndex((item: any) => item.slug === slug)
        const newIndexItem = {
            slug,
            title: config.title,
            tags: config.tags || [],
            date: config.date,
            summary: config.summary || '',
            cover: config.cover || '',
            category: config.category || '',
            hidden: config.hidden || false,
            status: config.status || 'draft'
        }

        if (existingIndex >= 0) {
            // Keep order, replace item
            indexData[existingIndex] = { ...indexData[existingIndex], ...newIndexItem }
        } else {
            // Prepend new item
            indexData.unshift(newIndexItem)
        }

        await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8')

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
