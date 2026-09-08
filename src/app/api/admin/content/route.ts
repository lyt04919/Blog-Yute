import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyAdminAuth } from '@/lib/server-auth'

const ALLOWED_TARGETS: Record<string, string> = {
  blogs: 'public/blogs/index.json',
  projects: 'src/data/projects.json',
  books: 'src/data/books.json',
  movies: 'src/data/movies.json',
  footprints: 'src/data/footprints.json',
  franchises: 'src/data/franchises.json',
  wishlist: 'src/data/wishlist.json',
}

const getFilePath = (type: string): string | null => {
  const relativePath = ALLOWED_TARGETS[type]
  if (!relativePath) return null
  return path.join(process.cwd(), relativePath)
}

export async function GET(request: Request) {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  if (!type || !ALLOWED_TARGETS[type]) {
    return NextResponse.json(
      { error: `Invalid type. Allowed types: ${Object.keys(ALLOWED_TARGETS).join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const filePath = getFilePath(type)
    if (!filePath) {
      return NextResponse.json({ error: 'Target not found' }, { status: 400 })
    }
    const fileContent = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error reading ${type}:`, error)
    return NextResponse.json({ error: `Failed to read ${type}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  if (!type || !ALLOWED_TARGETS[type]) {
    return NextResponse.json(
      { error: `Invalid type. Allowed types: ${Object.keys(ALLOWED_TARGETS).join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const filePath = getFilePath(type)
    if (!filePath) {
      return NextResponse.json({ error: 'Target not found' }, { status: 400 })
    }
    
    // In local development, write back formatted JSON
    await fs.writeFile(filePath, JSON.stringify(body, null, '\t') + '\n', 'utf8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error writing ${type}:`, error)
    return NextResponse.json({ error: `Failed to write ${type}` }, { status: 500 })
  }
}
