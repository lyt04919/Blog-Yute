import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'

export async function POST(req: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ success: false, error: '仅在开发环境下支持本地删除' }, { status: 403 })
    }

    if (!(await verifyAdminAuth(req))) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 })
    }

    try {
        const { slug } = await req.json()
        if (!slug) return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 })

        const dirPath = path.join(process.cwd(), 'public/blogs', slug)
        
        try {
            await fs.rm(dirPath, { recursive: true, force: true })
        } catch (e) {
            console.log('Local folder may not exist or cannot be deleted', e)
        }

        // Update global index.json
        const indexPath = path.join(process.cwd(), 'public/blogs/index.json')
        let indexData: any[] = []
        try {
            const indexStr = await fs.readFile(indexPath, 'utf-8')
            indexData = JSON.parse(indexStr)
        } catch {
            // file might not exist or be empty
        }

        const newIndexData = indexData.filter((item: any) => item.slug !== slug)

        await fs.writeFile(indexPath, JSON.stringify(newIndexData, null, 2), 'utf-8')

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
