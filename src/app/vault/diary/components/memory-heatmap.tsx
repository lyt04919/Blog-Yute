'use client'

import React, { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import type { Diary } from '@/types/diary'
import { useTheme } from '@/hooks/use-theme'
import { calculateReadingStats } from '../constants/meta'

interface MemoryHeatmapProps {
	diaries: Diary[]
	selectedDate?: string | null
	onSelectDate?: (dateStr: string) => void
}

/**
 * Standard GitHub-style color palette with guaranteed high-contrast borders.
 * Each empty tile and active tile is guaranteed to be sharply visible on any background.
 */
export const HEATMAP_PALETTE = {
	light: [
		{ bg: '#ebedf0', border: '#cbd5e1' }, // Level 0: Crisp light tile with defined border
		{ bg: '#9be9a8', border: '#40c463' }, // Level 1: Soft green
		{ bg: '#40c463', border: '#30a14e' }, // Level 2: Medium green
		{ bg: '#30a14e', border: '#216e39' }, // Level 3: Deep green
		{ bg: '#216e39', border: '#144620' }, // Level 4: Darkest emerald
	],
	dark: [
		{ bg: '#21262d', border: '#374151' }, // Level 0: Crisp dark tile with defined border
		{ bg: '#0e4429', border: '#006d32' }, // Level 1: Deep forest
		{ bg: '#006d32', border: '#26a641' }, // Level 2: Medium dark
		{ bg: '#26a641', border: '#39d353' }, // Level 3: Bright green
		{ bg: '#39d353', border: '#56e36c' }, // Level 4: Neon green
	],
}

/**
 * Calculate heatmap activity level (0-4) based on diary entry count and word count.
 * Guarantees that any day with at least 1 diary entry receives at least level 1.
 */
export function getHeatmapLevel(count: number, words: number): 0 | 1 | 2 | 3 | 4 {
	if (count === 0) return 0
	if (words >= 600 || count >= 3) return 4
	if (words >= 300 || count >= 2) return 3
	if (words >= 100) return 2
	return 1
}

export function getHeatmapCellStyle(count: number, words: number, isDark = false): React.CSSProperties {
	const level = getHeatmapLevel(count, words)
	const palette = isDark ? HEATMAP_PALETTE.dark : HEATMAP_PALETTE.light
	const item = palette[level]
	return {
		backgroundColor: item.bg,
		borderColor: item.border,
		borderWidth: '1px',
		borderStyle: 'solid',
		boxSizing: 'border-box',
	}
}

export default function MemoryHeatmap({ diaries, selectedDate, onSelectDate }: MemoryHeatmapProps) {
	const { resolvedTheme } = useTheme()
	const isDark = resolvedTheme === 'dark'
	const [selectedYear, setSelectedYear] = useState<string>('recent')

	// Distinct available years from diary dataset
	const availableYears = useMemo(() => {
		const years = new Set<string>()
		diaries.forEach(d => {
			if (d.date) {
				const y = dayjs(d.date).format('YYYY')
				if (/^\d{4}$/.test(y)) {
					years.add(y)
				}
			}
		})
		years.add(dayjs().format('YYYY'))
		return Array.from(years).sort((a, b) => b.localeCompare(a))
	}, [diaries])

	// Precomputed diary counts for badges
	const yearCounts = useMemo(() => {
		const counts: Record<string, number> = {}
		diaries.forEach(d => {
			if (d.date) {
				const y = dayjs(d.date).format('YYYY')
				counts[y] = (counts[y] || 0) + 1
			}
		})
		return counts
	}, [diaries])

	const recentCount = useMemo(() => {
		const recentStart = dayjs().subtract(364, 'day')
		return diaries.filter(d => {
			const date = dayjs(d.date)
			return (date.isAfter(recentStart) || date.isSame(recentStart, 'day')) && (date.isBefore(dayjs()) || date.isSame(dayjs(), 'day'))
		}).length
	}, [diaries])

	// Aggregate words & counts per date
	const heatmapData = useMemo(() => {
		const data = new Map<string, { words: number; count: number }>()
		diaries.forEach(d => {
			const dateStr = dayjs(d.date).format('YYYY-MM-DD')
			const { wordCount } = calculateReadingStats(d.content)
			const existing = data.get(dateStr) || { words: 0, count: 0 }
			data.set(dateStr, {
				words: existing.words + wordCount,
				count: existing.count + 1,
			})
		})
		return data
	}, [diaries])

	// Generate day items for either the last 364 days or the selected calendar year
	const days = useMemo(() => {
		const result = []
		let current: dayjs.Dayjs
		let end: dayjs.Dayjs

		if (selectedYear === 'recent') {
			current = dayjs().subtract(364, 'day')
			end = dayjs()
		} else {
			current = dayjs(`${selectedYear}-01-01`)
			end = dayjs(`${selectedYear}-12-31`)
		}

		while (current.isBefore(end) || current.isSame(end, 'day')) {
			const dateStr = current.format('YYYY-MM-DD')
			const item = heatmapData.get(dateStr)
			result.push({
				date: current.toDate(),
				dateStr,
				words: item?.words || 0,
				count: item?.count || 0,
			})
			current = current.add(1, 'day')
		}
		return result
	}, [heatmapData, selectedYear])

	// Group by weeks for the 7-row grid (starting Sunday)
	const weeks = useMemo(() => {
		if (days.length === 0) return []
		const w: (typeof days[0] | null)[][] = []
		let currentWeek: (typeof days[0] | null)[] = []

		// Pad first week with nulls to align with Sunday (day 0)
		const firstDay = dayjs(days[0].date).day()
		for (let i = 0; i < firstDay; i++) {
			currentWeek.push(null)
		}

		for (const day of days) {
			currentWeek.push(day)
			if (currentWeek.length === 7) {
				w.push(currentWeek)
				currentWeek = []
			}
		}

		// Pad last week with nulls to maintain consistent 7 rows
		if (currentWeek.length > 0) {
			while (currentWeek.length < 7) {
				currentWeek.push(null)
			}
			w.push(currentWeek)
		}
		return w
	}, [days])

	// Calculate month labels with at least 2 columns gap to avoid overcrowding
	const monthLabels = useMemo(() => {
		const labels: { label: string; colIndex: number }[] = []
		let currentMonth = -1

		weeks.forEach((week, i) => {
			const firstValidDay = week.find(d => d !== null)
			if (firstValidDay) {
				const month = dayjs(firstValidDay.date).month()
				if (month !== currentMonth) {
					const lastLabel = labels[labels.length - 1]
					if (!lastLabel || i - lastLabel.colIndex >= 2) {
						labels.push({
							label: dayjs(firstValidDay.date).format('MMM'),
							colIndex: i,
						})
						currentMonth = month
					}
				}
			}
		})
		return labels
	}, [weeks])

	// Range summary metrics
	const rangeSummary = useMemo(() => {
		const totalEntries = days.reduce((acc, d) => acc + d.count, 0)
		const totalWords = days.reduce((acc, d) => acc + d.words, 0)
		return `${totalEntries} 篇回忆 · ${totalWords.toLocaleString()} 字`
	}, [days])

	return (
		<div className="flex flex-col w-full select-none">
			{/* Header: Title, Stats & Year Tabs */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-3 w-full">
				<div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.16em] flex items-center gap-2">
					<div className="w-1.5 h-1.5 rounded-full bg-brand" />
					<span>Memory Heatmap</span>
					<span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500 normal-case tracking-normal">
						· {rangeSummary}
					</span>
				</div>

				{/* Year Switcher Tabs */}
				<div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800/60 p-0.5 rounded-xl text-xs font-medium border border-neutral-200/40 dark:border-neutral-700/40">
					<button
						type="button"
						onClick={() => setSelectedYear('recent')}
						className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
							selectedYear === 'recent'
								? 'bg-white dark:bg-neutral-900 text-[var(--color-primary)] shadow-xs font-semibold'
								: 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
						}`}
					>
						最近1年 {recentCount > 0 && <span className="opacity-60 text-[10px]">({recentCount})</span>}
					</button>
					{availableYears.map(year => {
						const count = yearCounts[year] || 0
						return (
							<button
								key={year}
								type="button"
								onClick={() => setSelectedYear(year)}
								className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
									selectedYear === year
										? 'bg-white dark:bg-neutral-900 text-[var(--color-primary)] shadow-xs font-semibold'
										: 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
								}`}
							>
								{year} {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
							</button>
						)
					})}
				</div>
			</div>

			{/* Heatmap Grid Area */}
			<div className="w-full overflow-x-auto pb-1 scrollbar-none">
				<div className="flex flex-col min-w-max relative pt-6 pl-6 pr-2">
					{/* Month Labels */}
					{monthLabels.map((m, i) => (
						<div
							key={i}
							className="absolute top-0 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium select-none pointer-events-none"
							style={{ left: 24 + m.colIndex * 14 }}
						>
							{m.label}
						</div>
					))}

					{/* Weekday Labels (Mon, Wed, Fri) */}
					<div className="absolute left-0 top-6 text-[9px] text-neutral-400 dark:text-neutral-500 font-medium select-none pointer-events-none w-5">
						<span className="absolute" style={{ top: 14, height: 11, lineHeight: '11px' }}>
							一
						</span>
						<span className="absolute" style={{ top: 42, height: 11, lineHeight: '11px' }}>
							三
						</span>
						<span className="absolute" style={{ top: 70, height: 11, lineHeight: '11px' }}>
							五
						</span>
					</div>

					{/* Weeks Grid */}
					<div className="flex gap-[3px]">
						{weeks.map((week, i) => (
							<div key={i} className="flex flex-col gap-[3px]">
								{week.map((day, j) =>
									day ? (
										<div
											key={day.dateStr}
											onClick={() => onSelectDate?.(day.dateStr)}
											title={`${day.dateStr}：${day.count > 0 ? `${day.count} 篇 (${day.words} 字)` : '无回忆 (点击筛选)'}`}
											className={`hm-cell hm-cell-${getHeatmapLevel(day.count, day.words)} rounded-[2.5px] cursor-pointer transition-all duration-150 ${
												selectedDate === day.dateStr
													? 'ring-2 ring-brand ring-offset-1 dark:ring-offset-neutral-900 scale-125 z-10'
													: 'hover:scale-125 hover:z-20'
											}`}
											style={{
												width: 11,
												height: 11,
												boxSizing: 'border-box',
												...getHeatmapCellStyle(day.count, day.words, isDark),
											}}
										/>
									) : (
										<div key={`empty-${j}`} style={{ width: 11, height: 11 }} />
									)
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Footer: Selection Status & Color Legend */}
			<div className="flex items-center justify-between w-full mt-3 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
				<div className="flex items-center gap-2">
					{selectedDate ? (
						<span className="text-brand font-semibold">已选择: {selectedDate}</span>
					) : (
						<span>点击任意日期可筛选当天回忆</span>
					)}
				</div>

				<div className="flex items-center gap-1.5 uppercase tracking-wider">
					<span>Less</span>
					<div className="flex gap-1 mx-1">
						{([0, 1, 2, 3, 4] as const).map(level => {
							const palette = isDark ? HEATMAP_PALETTE.dark : HEATMAP_PALETTE.light
							const item = palette[level]
							return (
								<div
									key={level}
									className={`hm-cell hm-cell-${level} rounded-[2px]`}
									style={{
										width: 9,
										height: 9,
										backgroundColor: item.bg,
										borderColor: item.border,
										borderWidth: '1px',
										borderStyle: 'solid',
										boxSizing: 'border-box',
									}}
								/>
							)
						})}
					</div>
					<span>More</span>
				</div>
			</div>

			{/* Guaranteed Local CSS Fallback */}
			<style>{`
				.hm-cell-0 { background-color: #ebedf0 !important; border-color: #cbd5e1 !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-1 { background-color: #9be9a8 !important; border-color: #40c463 !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-2 { background-color: #40c463 !important; border-color: #30a14e !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-3 { background-color: #30a14e !important; border-color: #216e39 !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-4 { background-color: #216e39 !important; border-color: #144620 !important; border-width: 1px !important; border-style: solid !important; }

				.dark .hm-cell-0 { background-color: #21262d !important; border-color: #374151 !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-1 { background-color: #0e4429 !important; border-color: #006d32 !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-2 { background-color: #006d32 !important; border-color: #26a641 !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-3 { background-color: #26a641 !important; border-color: #39d353 !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-4 { background-color: #39d353 !important; border-color: #56e36c !important; border-width: 1px !important; border-style: solid !important; }
			`}</style>
		</div>
	)
}

