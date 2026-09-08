import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { target, data } = body;

    if (!target || data === undefined || data === null) {
      return NextResponse.json({ error: 'Invalid request body. Expected { target: "movies"|"books"|"book-categories", data: [...] }' }, { status: 400 });
    }

    // blog-categories data is an object, not an array
    const isValidData = target === 'blog-categories' ? typeof data === 'object' : Array.isArray(data);
    if (!isValidData) {
      return NextResponse.json({ error: 'Invalid data format for target.' }, { status: 400 });
    }

    let targetPath = '';
    if (target === 'movies') {
      targetPath = path.join(process.cwd(), 'src/data/movies.json');
    } else if (target === 'books') {
      targetPath = path.join(process.cwd(), 'src/data/books.json');
    } else if (target === 'book-categories') {
      targetPath = path.join(process.cwd(), 'src/app/favorite/categories.json');
    } else if (target === 'share') {
      targetPath = path.join(process.cwd(), 'src/app/favorite/share/list.json');
    } else if (target === 'gears') {
      targetPath = path.join(process.cwd(), 'src/app/about/gears.json');
    } else if (target === 'software') {
      targetPath = path.join(process.cwd(), 'src/app/about/software.json');
    } else if (target === 'music') {
      targetPath = path.join(process.cwd(), 'src/app/favorite/music.json');
    } else if (target === 'games') {
      targetPath = path.join(process.cwd(), 'src/app/favorite/games.json');
    } else if (target === 'videos') {
      targetPath = path.join(process.cwd(), 'src/app/favorite/videos.json');
    } else if (target === 'blog-index') {
      targetPath = path.join(process.cwd(), 'public/blogs/index.json');
    } else if (target === 'blog-categories') {
      targetPath = path.join(process.cwd(), 'public/blogs/categories.json');
    } else if (target === 'projects') {
      targetPath = path.join(process.cwd(), 'src/data/projects.json');
    } else if (target === 'footprints') {
      targetPath = path.join(process.cwd(), 'src/data/footprints.json');
    } else if (target === 'wishlist') {
      targetPath = path.join(process.cwd(), 'src/data/wishlist.json');
    } else if (target === 'franchises') {
      targetPath = path.join(process.cwd(), 'src/data/franchises.json');
    } else if (target === 'custom-playlists') {
      targetPath = path.join(process.cwd(), 'src/data/custom-playlists.json');
    } else {
      return NextResponse.json({ error: 'Invalid target. Only "movies", "books", "book-categories", "share", "gears", "software", "music", "games", "videos", "blog-index", "blog-categories", "projects", "footprints", "wishlist", "franchises", or "custom-playlists" are allowed.' }, { status: 400 });
    }

    // Write the formatted JSON back to the local file
    fs.writeFileSync(targetPath, JSON.stringify(data, null, '\t'), 'utf8');

    return NextResponse.json({ success: true, message: `Successfully saved ${data.length} items to ${target}.` });
  } catch (error: any) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: error.message || 'Failed to save data' }, { status: 500 });
  }
}
