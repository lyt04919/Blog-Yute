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
 * Authentic, soft GitHub-style color palette.
 * Uses soft, natural outlines and balanced emerald greens to avoid harsh wireframe grids.
 */
export const HEATMAP_PALETTE = {
	light: [
		{ bg: '#ebedf0', border: 'rgba(27, 31, 35, 0.08)' }, // Level 0: Soft modern off-white tile
		{ bg: '#9be9a8', border: 'rgba(27, 31, 35, 0.12)' }, // Level 1: Soft spring green
		{ bg: '#40c463', border: 'rgba(27, 31, 35, 0.12)' }, // Level 2: Vibrant emerald green
		{ bg: '#30a14e', border: 'rgba(27, 31, 35, 0.15)' }, // Level 3: Deep rich green
		{ bg: '#216e39', border: 'rgba(27, 31, 35, 0.2)' },  // Level 4: Dark pine green
	],
	dark: [
		{ bg: '#161b22', border: 'rgba(255, 255, 255, 0.06)' }, // Level 0: GitHub dark tile
		{ bg: '#0e4429', border: 'rgba(255, 255, 255, 0.08)' }, // Level 1: Forest green
		{ bg: '#006d32', border: 'rgba(255, 255, 255, 0.08)' }, // Level 2: Medium dark
		{ bg: '#26a641', border: 'rgba(255, 255, 255, 0.1)' },  // Level 3: Bright green
		{ bg: '#39d353', border: 'rgba(255, 255, 255, 0.12)' }, // Level 4: Neon vibrant green
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
	const [hoveredDay, setHoveredDay] = useState<{
		dateStr: string
		count: number
		words: number
		x: number
		y: number
	} | null>(null)

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

	// Calculate month labels aligned precisely with the week column index
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

	const gridWidth = weeks.length * 14 - 3

	return (
		<div className="flex flex-col w-full select-none">
			{/* Header: Title, Stats & Year Tabs */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-4 w-full">
				<div className="flex items-center gap-2.5">
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40" />
						<span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 tracking-wider uppercase font-mono">
							Memory Heatmap
						</span>
					</div>
					<span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50">
						{rangeSummary}
					</span>
				</div>

				{/* Apple-style Year Switcher Tabs */}
				<div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs">
					<button
						type="button"
						onClick={() => setSelectedYear('recent')}
						className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium ${
							selectedYear === 'recent'
								? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
								: 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
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
								className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium ${
									selectedYear === year
										? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
										: 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
								}`}
							>
								{year} {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
							</button>
						)
					})}
				</div>
			</div>

			{/* Heatmap Grid Area */}
			<div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-none">
				<div className="inline-flex flex-col min-w-max">
					{/* Month Labels (Mathematically aligned with week columns) */}
					<div className="relative h-4 mb-2.5" style={{ marginLeft: 26, width: gridWidth }}>
						{monthLabels.map((m, i) => (
							<span
								key={i}
								className="absolute text-[10px] font-medium text-neutral-400 dark:text-neutral-500 select-none pointer-events-none"
								style={{ left: m.colIndex * 14 }}
							>
								{m.label}
							</span>
						))}
					</div>

					{/* Body: Weekday Labels + Grid */}
					<div className="flex items-start">
						{/* Weekday Labels (Mon, Wed, Fri aligned with rows) */}
						<div
							className="relative shrink-0 text-[9px] font-medium text-neutral-400 dark:text-neutral-500 select-none pointer-events-none"
							style={{ width: 22, marginRight: 4, height: 7 * 11 + 6 * 3 }}
						>
							<span className="absolute" style={{ top: 14, height: 11, lineHeight: '11px' }}>
								周一
							</span>
							<span className="absolute" style={{ top: 42, height: 11, lineHeight: '11px' }}>
								周三
							</span>
							<span className="absolute" style={{ top: 70, height: 11, lineHeight: '11px' }}>
								周五
							</span>
						</div>

						{/* Weeks Grid (Locked with shrink-0 so it never squishes) */}
						<div className="flex gap-[3px] shrink-0" style={{ width: gridWidth }}>
							{weeks.map((week, i) => (
								<div key={i} className="flex flex-col gap-[3px] shrink-0 w-[11px]">
									{week.map((day, j) =>
										day ? (
											<div
												key={day.dateStr}
												onClick={() => onSelectDate?.(day.dateStr)}
												onMouseEnter={e => {
													const rect = e.currentTarget.getBoundingClientRect()
													setHoveredDay({
														dateStr: day.dateStr,
														count: day.count,
														words: day.words,
														x: rect.left + rect.width / 2,
														y: rect.top,
													})
												}}
												onMouseLeave={() => setHoveredDay(null)}
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
											<div key={`empty-${j}`} className="shrink-0" style={{ width: 11, height: 11 }} />
										)
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Floating Interactive Hover Tooltip */}
			{hoveredDay && (
				<div
					className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 pointer-events-none px-2.5 py-1.5 rounded-lg bg-neutral-900/90 dark:bg-neutral-800/95 text-white text-[11px] font-medium shadow-xl backdrop-blur-xs flex flex-col items-center gap-0.5 whitespace-nowrap transition-all duration-75 border border-white/10"
					style={{
						left: hoveredDay.x,
						top: hoveredDay.y - 6,
					}}
				>
					<div className="font-semibold text-[11px] tracking-tight">
						{dayjs(hoveredDay.dateStr).format('YYYY年M月D日')}
					</div>
					<div className="text-[10px] text-neutral-300 dark:text-neutral-400">
						{hoveredDay.count > 0
							? `${hoveredDay.count} 篇回忆 · ${hoveredDay.words} 字`
							: '无回忆 · 点击可筛选'}
					</div>
					<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900/90 dark:border-t-neutral-800/95" />
				</div>
			)}

			{/* Footer: Selection Status & Color Legend */}
			<div className="flex items-center justify-between w-full mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
				<div className="flex items-center gap-2">
					{selectedDate ? (
						<div className="flex items-center gap-1.5 text-xs text-brand font-medium bg-brand/10 dark:bg-brand/20 px-2.5 py-1 rounded-lg border border-brand/20">
							<span>已选日期：{selectedDate}</span>
							<button
								type="button"
								onClick={() => onSelectDate?.(selectedDate)}
								className="hover:underline font-bold text-[11px] ml-1"
							>
								✕ 清除
							</button>
						</div>
					) : (
						<span className="text-[11px] text-neutral-400 dark:text-neutral-500">
							点击方格可聚焦当天回忆
						</span>
					)}
				</div>

				<div className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-mono tracking-wider">
					<span>Less</span>
					<div className="flex gap-1 mx-1 items-center">
						{([0, 1, 2, 3, 4] as const).map(level => {
							const palette = isDark ? HEATMAP_PALETTE.dark : HEATMAP_PALETTE.light
							const item = palette[level]
							return (
								<div
									key={level}
									className={`hm-cell hm-cell-${level} rounded-[2px]`}
									style={{
										width: 10,
										height: 10,
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
				.hm-cell-0 { background-color: #ebedf0 !important; border-color: rgba(27, 31, 35, 0.08) !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-1 { background-color: #9be9a8 !important; border-color: rgba(27, 31, 35, 0.12) !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-2 { background-color: #40c463 !important; border-color: rgba(27, 31, 35, 0.12) !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-3 { background-color: #30a14e !important; border-color: rgba(27, 31, 35, 0.15) !important; border-width: 1px !important; border-style: solid !important; }
				.hm-cell-4 { background-color: #216e39 !important; border-color: rgba(27, 31, 35, 0.2) !important; border-width: 1px !important; border-style: solid !important; }

				.dark .hm-cell-0 { background-color: #161b22 !important; border-color: rgba(255, 255, 255, 0.06) !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-1 { background-color: #0e4429 !important; border-color: rgba(255, 255, 255, 0.08) !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-2 { background-color: #006d32 !important; border-color: rgba(255, 255, 255, 0.08) !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-3 { background-color: #26a641 !important; border-color: rgba(255, 255, 255, 0.1) !important; border-width: 1px !important; border-style: solid !important; }
				.dark .hm-cell-4 { background-color: #39d353 !important; border-color: rgba(255, 255, 255, 0.12) !important; border-width: 1px !important; border-style: solid !important; }
			`}</style>
		</div>
	)
}


