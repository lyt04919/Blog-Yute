import type { MoodType, WeatherType } from '@/types/diary'

export interface MoodConfig {
	label: MoodType
	emoji: string
	color: string
	bgClass: string
}

export interface WeatherConfig {
	label: WeatherType
	emoji: string
	color: string
	bgClass: string
}

export const MOOD_LIST: MoodConfig[] = [
	{ label: '开心', emoji: '😄', color: '#ffedd5', bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
	{ label: '平静', emoji: '😐', color: '#ccfbf1', bgClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
	{ label: '难过', emoji: '😢', color: '#e2e8f0', bgClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
	{ label: '生气', emoji: '😡', color: '#fee2e2', bgClass: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
	{ label: '疲惫', emoji: '😫', color: '#f5f5f4', bgClass: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
	{ label: '活力', emoji: '✨', color: '#ffedd5', bgClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
	{ label: '焦虑', emoji: '😰', color: '#e2e8f0', bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
	{ label: '感动', emoji: '🥺', color: '#ccfbf1', bgClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
	{ label: '无聊', emoji: '🥱', color: '#f5f5f4', bgClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
	{ label: '得意', emoji: '😎', color: '#ffedd5', bgClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
	{ label: '崩溃', emoji: '🤯', color: '#e2e8f0', bgClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' }
]

export const WEATHER_LIST: WeatherConfig[] = [
	{ label: '晴朗', emoji: '☀️', color: '#fef3c7', bgClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
	{ label: '多云', emoji: '⛅', color: '#f1f5f9', bgClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
	{ label: '阴天', emoji: '☁️', color: '#f1f5f9', bgClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
	{ label: '小雨', emoji: '🌧️', color: '#dbeafe', bgClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
	{ label: '大雨', emoji: '⛈️', color: '#dbeafe', bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' },
	{ label: '雷雨', emoji: '🌩️', color: '#dbeafe', bgClass: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
	{ label: '下雪', emoji: '❄️', color: '#e0f2fe', bgClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400' },
	{ label: '大风', emoji: '💨', color: '#ccfbf1', bgClass: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },
	{ label: '雾霾', emoji: '🌫️', color: '#f1f5f9', bgClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' }
]

export const MOOD_MAP = new Map<string, MoodConfig>(MOOD_LIST.map(m => [m.label, m]))
export const WEATHER_MAP = new Map<string, WeatherConfig>(WEATHER_LIST.map(w => [w.label, w]))

export const TEMPLATES = [
	{ name: '空白页', content: '' },
	{ name: '感恩日记', content: '🌟 今天发生的三件好事：\n1. \n2. \n3. \n\n💭 我的感受：\n' },
	{ name: '每日复盘', content: '✅ 今日完成：\n\n❌ 待改进：\n\n🎯 明日计划：\n' },
]

/**
 * Calculate Chinese/English hybrid word count and estimated reading time
 */
export function calculateReadingStats(content: string = ''): { wordCount: number; readingTime: number } {
	if (!content || !content.trim()) return { wordCount: 0, readingTime: 1 }

	// Remove markdown links, images, and special symbols for counting
	const cleaned = content
		.replace(/!\[.*?\]\(.*?\)/g, '')
		.replace(/\[.*?\]\(.*?\)/g, '')
		.replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
		.replace(/#+\s/g, '')
		.trim()

	// Count Chinese characters
	const chineseMatches = cleaned.match(/[\u4e00-\u9fa5]/g)
	const chineseCount = chineseMatches ? chineseMatches.length : 0

	// Count English/alphanumeric words
	const nonChinese = cleaned.replace(/[\u4e00-\u9fa5]/g, ' ')
	const englishWords = nonChinese.split(/\s+/).filter(w => w.length > 0)
	const englishCount = englishWords.length

	const totalWords = chineseCount + englishCount
	// Average reading speed: ~350 chars/words per minute
	const readingTime = Math.max(1, Math.ceil(totalWords / 350))

	return { wordCount: totalWords, readingTime }
}
