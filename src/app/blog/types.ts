export type PublicBlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	category?: string
	status: 'published'
	isFeatured?: boolean
	projectUrl?: string
	projectName?: string
}

export type AdminBlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	hidden?: boolean
	category?: string
	status?: 'draft' | 'published'
	isFeatured?: boolean
	projectUrl?: string
	projectName?: string
}

export type BlogIndexItem = AdminBlogIndexItem

export type BlogConfig = {
	title?: string
	tags?: string[]
	date?: string
	summary?: string
	cover?: string
	hidden?: boolean
	status?: 'draft' | 'published'
	category?: string
	projectUrl?: string
	projectName?: string
}
