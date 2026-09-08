import type { BlogConfig } from '@/app/blog/types'

export type { BlogConfig } from '@/app/blog/types'

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

/**
 * Load blog data securely via /api/blogs/{slug}
 * Automatically enforces server-side draft access control
 */
export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) {
		throw new Error('Slug is required')
	}

	const encodedSlug = encodeURIComponent(slug)
	const res = await fetch(`/api/blogs/${encodedSlug}`, {
		cache: 'no-store'
	})

	if (!res.ok) {
		throw new Error('Blog not found')
	}

	const data = await res.json()
	return {
		slug: data.slug || slug,
		config: data.config || {},
		markdown: data.markdown || '',
		cover: data.cover || data.config?.cover
	}
}
