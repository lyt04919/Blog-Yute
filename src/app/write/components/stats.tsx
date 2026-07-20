import { useWriteStore } from '../stores/write-store'
import { useEffect, useState } from 'react'

export function WriteStats() {
	const { form, isZenMode, isSplitMode } = useWriteStore()
	const [wordCount, setWordCount] = useState(0)
	const [readTime, setReadTime] = useState(0)

	useEffect(() => {
		const text = form.md.trim()
		if (!text) {
			setWordCount(0)
			setReadTime(0)
			return
		}

		// Calculate word count (Chinese characters + English words)
		// A simple regex to count words properly
		const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
		const englishWords = text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || []
		
		const totalWords = chineseChars.length + englishWords.length
		setWordCount(totalWords)

		// Estimate read time (assuming 300 words per minute)
		const minutes = Math.max(1, Math.ceil(totalWords / 300))
		setReadTime(minutes)
	}, [form.md])

	if (!wordCount) return null

	return (
		<div className={`absolute bottom-4 right-6 z-10 flex items-center gap-3 rounded-full border border-white/20 bg-white/40 px-4 py-2 text-xs text-[#52525b] shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md dark:border-white/10 dark:bg-black/40 dark:text-[#a1a1aa] ${isZenMode ? 'bottom-0 right-0' : ''}`}>
			<div className="flex items-center gap-1.5">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
				<span>{wordCount.toLocaleString()} 字</span>
			</div>
			<div className="h-3 w-[1px] bg-[#d4d4d8] dark:bg-[#52525b]" />
			<div className="flex items-center gap-1.5">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				<span>约 {readTime} 分钟</span>
			</div>
		</div>
	)
}
