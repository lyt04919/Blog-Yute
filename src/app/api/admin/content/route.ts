import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const getFilePath = (type: string) => {
  if (type === 'blogs') {
    return path.join(process.cwd(), 'public/blogs/index.json')
  }
  return path.join(process.cwd(), `src/data/${type}.json`)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 })
  }

  try {
    const filePath = getFilePath(type)
    const fileContent = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error reading ${type}:`, error)
    return NextResponse.json({ error: `Failed to read ${type}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const filePath = getFilePath(type)
    
    // In local development, we can just write back directly.
    await fs.writeFile(filePath, JSON.stringify(body, null, '\t') + '\n', 'utf8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error writing ${type}:`, error)
    return NextResponse.json({ error: `Failed to write ${type}` }, { status: 500 })
  }
}
