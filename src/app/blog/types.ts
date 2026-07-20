export type BlogIndexItem = {
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

export type BlogConfig = {
	title?: string
	tags?: string[]
	date?: string
	summary?: string
	cover?: string
	hidden?: boolean
	category?: string
	projectUrl?: string
	projectName?: string
}

