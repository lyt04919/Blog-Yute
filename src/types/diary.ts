export type MoodType =
	| '开心'
	| '平静'
	| '难过'
	| '生气'
	| '疲惫'
	| '活力'
	| '焦虑'
	| '感动'
	| '无聊'
	| '得意'
	| '崩溃'

export type WeatherType =
	| '晴朗'
	| '多云'
	| '阴天'
	| '小雨'
	| '大雨'
	| '雷雨'
	| '下雪'
	| '大风'
	| '雾霾'

export interface Diary {
	id: string
	/** Standard format: YYYY-MM-DD */
	date: string
	content: string
	/** Array of media URLs (images, videos) */
	media?: string[]
	/** Legacy single image URL */
	image?: string
	mood?: MoodType | string
	weather?: WeatherType | string
	tags?: string[]
	location?: string
	/** Derived/cached statistics */
	wordCount?: number
	readingTime?: number
}

export interface FilterState {
	year: string | null
	month: string | null
	date?: string | null
	tags: string[]
	locations: string[]
	moods: string[]
	weathers: string[]
	mediaType: 'all' | 'media-only' | 'text-only'
}

export type DiaryViewMode = 'grid' | 'calendar' | 'changelog'
