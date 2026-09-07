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
 * Authentic GitHub Contribution Palette (Light & Dark).
 * Exactly matches GitHub's color standards and contrast.
 */
export const HEATMAP_PALETTE = {
	light: [
		{ bg: '#ebedf0', border: 'rgba(27, 31, 35, 0.06)' }, // Level 0: GitHub light tile
		{ bg: '#9be9a8', border: 'rgba(27, 31, 35, 0.08)' }, // Level 1: Soft spring green
		{ bg: '#40c463', border: 'rgba(27, 31, 35, 0.08)' }, // Level 2: Vibrant emerald green
		{ bg: '#30a14e', border: 'rgba(27, 31, 35, 0.08)' }, // Level 3: Deep rich green
		{ bg: '#216e39', border: 'rgba(27, 31, 35, 0.08)' }, // Level 4: Dark forest green
	],
	dark: [
		{ bg: '#161b22', border: 'rgba(255, 255, 255, 0.05)' }, // Level 0: GitHub dark tile
		{ bg: '#0e4429', border: 'rgba(255, 255, 255, 0.05)' }, // Level 1: Deep green
		{ bg: '#006d32', border: 'rgba(255, 255, 255, 0.05)' }, // Level 2: Medium green
		{ bg: '#26a641', border: 'rgba(255, 255, 255, 0.05)' }, // Level 3: Bright green
		{ bg: '#39d353', border: 'rgba(255, 255, 255, 0.05)' }, // Level 4: Vibrant neon green
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

// Layout Constants for GitHub SVG Grid
const CELL_SIZE = 10
const CELL_GAP = 3
const STEP = CELL_SIZE + CELL_GAP // 13px pitch
const LABEL_WIDTH = 28 // Space for 'Mon', 'Wed', 'Fri'
const HEADER_HEIGHT = 18 // Space for month labels
const GRID_HEIGHT = 7 * STEP - CELL_GAP // 88px
const SVG_HEIGHT = HEADER_HEIGHT + GRID_HEIGHT // 106px

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

	// Compute weeks and days strictly aligned to Sunday-Saturday columns (53 weeks)
	const { weeks, recentCount } = useMemo(() => {
		const today = dayjs()
		let computedRecentCount = 0

		if (selectedYear === 'recent') {
			// GitHub 'last year': 52 weeks back from the current week's Sunday
			const currentWeekSunday = today.subtract(today.day(), 'day')
			const startSunday = currentWeekSunday.subtract(52, 'week')

			const wList: ({
				dateStr: string
				dayOfWeek: number
				count: number
				words: number
				isFuture: boolean
			} | null)[][] = []

			for (let w = 0; w < 53; w++) {
				const weekDays: (typeof wList[0][0])[] = []
				for (let d = 0; d < 7; d++) {
					const curDate = startSunday.add(w * 7 + d, 'day')
					const isFuture = curDate.isAfter(today, 'day')
					const dateStr = curDate.format('YYYY-MM-DD')
					const data = heatmapData.get(dateStr)
					const count = isFuture ? 0 : data?.count || 0
					const words = isFuture ? 0 : data?.words || 0

					if (!isFuture && count > 0) {
						computedRecentCount += count
					}

					weekDays.push({
						dateStr,
						dayOfWeek: d,
						count,
						words,
						isFuture,
					})
				}
				wList.push(weekDays)
			}

			return { weeks: wList, recentCount: computedRecentCount }
		} else {
			// Specific calendar year (Jan 1 to Dec 31)
			const startOfYear = dayjs(`${selectedYear}-01-01`)
			const endOfYear = dayjs(`${selectedYear}-12-31`)
			const startDayOfWeek = startOfYear.day()
			const calendarStartSunday = startOfYear.subtract(startDayOfWeek, 'day')

			const wList: ({
				dateStr: string
				dayOfWeek: number
				count: number
				words: number
				isFuture: boolean
			} | null)[][] = []

			for (let w = 0; w < 53; w++) {
				const weekDays: (typeof wList[0][0])[] = []
				for (let d = 0; d < 7; d++) {
					const curDate = calendarStartSunday.add(w * 7 + d, 'day')
					const isBeforeYear = curDate.isBefore(startOfYear, 'day')
					const isAfterYear = curDate.isAfter(endOfYear, 'day')
					const isFuture = curDate.isAfter(today, 'day')

					if (isBeforeYear || isAfterYear) {
						weekDays.push(null)
					} else {
						const dateStr = curDate.format('YYYY-MM-DD')
						const data = heatmapData.get(dateStr)
						weekDays.push({
							dateStr,
							dayOfWeek: d,
							count: isFuture ? 0 : data?.count || 0,
							words: isFuture ? 0 : data?.words || 0,
							isFuture,
						})
					}
				}
				wList.push(weekDays)
			}

			return { weeks: wList, recentCount: computedRecentCount }
		}
	}, [selectedYear, heatmapData])

	// Month labels placed precisely at the column where the month starts (or col 0)
	const monthLabels = useMemo(() => {
		const labels: { label: string; colIndex: number }[] = []
		let lastMonth = -1
		let lastCol = -10

		weeks.forEach((week, colIndex) => {
			const firstValidDay = week.find(d => d !== null)
			if (firstValidDay) {
				const curMonth = dayjs(firstValidDay.dateStr).month()
				if (curMonth !== lastMonth) {
					if (colIndex - lastCol >= 2) {
						labels.push({
							label: dayjs(firstValidDay.dateStr).format('MMM'),
							colIndex,
						})
						lastMonth = curMonth
						lastCol = colIndex
					}
				}
			}
		})
		return labels
	}, [weeks])

	// Summary count for the currently active tab
	const currentTabCount = useMemo(() => {
		if (selectedYear === 'recent') {
			return recentCount
		}
		return yearCounts[selectedYear] || 0
	}, [selectedYear, recentCount, yearCounts])

	const currentTabLabel = useMemo(() => {
		if (selectedYear === 'recent') {
			return '最近 1 年'
		}
		return `${selectedYear} 年`
	}, [selectedYear])

	const palette = isDark ? HEATMAP_PALETTE.dark : HEATMAP_PALETTE.light
	const svgWidth = LABEL_WIDTH + weeks.length * STEP - CELL_GAP

	return (
		<div className="w-full flex flex-col select-none font-sans">
			{/* GitHub-style Header: Contributions count on left, Year navigation on right */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
				<h3 className="text-sm sm:text-[15px] font-normal text-neutral-800 dark:text-neutral-200 tracking-tight">
					<span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentTabCount}</span> 篇回忆在 {currentTabLabel}
				</h3>

				{/* GitHub-style Clean Year Switcher */}
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setSelectedYear('recent')}
						className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
							selectedYear === 'recent'
								? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-200/90 dark:border-neutral-700/80 shadow-2xs'
								: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
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
								className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
									selectedYear === year
										? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-200/90 dark:border-neutral-700/80 shadow-2xs'
										: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
								}`}
							>
								{year} {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
							</button>
						)
					})}
				</div>
			</div>

			{/* GitHub-style Bordered Card Container */}
			<div className="w-full bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-4 sm:p-5 shadow-2xs overflow-x-auto scrollbar-none">
				<div className="min-w-max flex flex-col items-start">
					{/* GitHub-style Scalable SVG Contribution Calendar */}
					<svg
						width={svgWidth}
						height={SVG_HEIGHT}
						className="overflow-visible select-none"
					>
						{/* Month Labels */}
						<g className="month-labels" transform={`translate(${LABEL_WIDTH}, 11)`}>
							{monthLabels.map(m => (
								<text
									key={m.colIndex}
									x={m.colIndex * STEP}
									y={0}
									className="text-[10px] font-sans fill-[#57606a] dark:fill-[#7d8590]"
								>
									{m.label}
								</text>
							))}
						</g>

						{/* Weekday Labels (Only Mon, Wed, Fri like GitHub) */}
						<g className="weekday-labels" transform={`translate(0, ${HEADER_HEIGHT})`}>
							<text
								x={LABEL_WIDTH - 6}
								y={1 * STEP + 8}
								textAnchor="end"
								className="text-[9px] font-sans fill-[#57606a] dark:fill-[#7d8590]"
							>
								Mon
							</text>
							<text
								x={LABEL_WIDTH - 6}
								y={3 * STEP + 8}
								textAnchor="end"
								className="text-[9px] font-sans fill-[#57606a] dark:fill-[#7d8590]"
							>
								Wed
							</text>
							<text
								x={LABEL_WIDTH - 6}
								y={5 * STEP + 8}
								textAnchor="end"
								className="text-[9px] font-sans fill-[#57606a] dark:fill-[#7d8590]"
							>
								Fri
							</text>
						</g>

						{/* 53-Week Days Grid */}
						<g className="weeks-grid" transform={`translate(${LABEL_WIDTH}, ${HEADER_HEIGHT})`}>
							{weeks.map((week, colIndex) => (
								<g key={colIndex} transform={`translate(${colIndex * STEP}, 0)`}>
									{week.map((day, rowIndex) => {
										if (!day) return null
										if (day.isFuture) {
											return (
												<rect
													key={`future-${rowIndex}`}
													x={0}
													y={rowIndex * STEP}
													width={CELL_SIZE}
													height={CELL_SIZE}
													rx={2}
													ry={2}
													fill="transparent"
												/>
											)
										}

										const isSelected = selectedDate === day.dateStr
										const level = getHeatmapLevel(day.count, day.words)
										const cellColor = palette[level]

										return (
											<rect
												key={day.dateStr}
												x={0}
												y={rowIndex * STEP}
												width={CELL_SIZE}
												height={CELL_SIZE}
												rx={2}
												ry={2}
												fill={cellColor.bg}
												stroke={isSelected ? '#10b981' : cellColor.border}
												strokeWidth={isSelected ? 1.5 : 1}
												className={`cursor-pointer transition-opacity duration-150 ${
													isSelected
														? 'filter drop-shadow-xs'
														: 'hover:opacity-80'
												}`}
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
											/>
										)
									})}
								</g>
							))}
						</g>
					</svg>

					{/* GitHub-style Footer: Left status / rules, Right legend */}
					<div
						className="flex items-center justify-between text-[11px] text-[#57606a] dark:text-[#7d8590] mt-3 pt-2 w-full"
						style={{ width: svgWidth }}
					>
						<div>
							{selectedDate ? (
								<div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
									<span>已选日期：{selectedDate}</span>
									<button
										type="button"
										onClick={() => onSelectDate?.(selectedDate)}
										className="hover:underline font-bold ml-1 cursor-pointer"
									>
										✕ 清除
									</button>
								</div>
							) : (
								<span className="text-[11px] text-[#57606a] dark:text-[#7d8590]">
									点击方格筛选当天回忆
								</span>
							)}
						</div>

						{/* GitHub-standard Legend: Less [0][1][2][3][4] More */}
						<div className="flex items-center gap-1 text-[11px]">
							<span>Less</span>
							<div className="flex items-center gap-[3px] mx-1">
								{([0, 1, 2, 3, 4] as const).map(lvl => (
									<span
										key={lvl}
										className="inline-block rounded-[2px]"
										style={{
											width: CELL_SIZE,
											height: CELL_SIZE,
											backgroundColor: palette[lvl].bg,
											borderColor: palette[lvl].border,
											borderWidth: '1px',
											borderStyle: 'solid',
											boxSizing: 'border-box',
										}}
									/>
								))}
							</div>
							<span>More</span>
						</div>
					</div>
				</div>
			</div>

			{/* GitHub-style Interactive Tooltip */}
			{hoveredDay && (
				<div
					className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 pointer-events-none px-2.5 py-1.5 rounded-md bg-[#24292f] text-white text-[11px] font-sans shadow-xl flex flex-col items-center gap-0.5 whitespace-nowrap transition-all duration-75"
					style={{
						left: hoveredDay.x,
						top: hoveredDay.y - 4,
					}}
				>
					<div className="font-semibold text-[11px]">
						{hoveredDay.count > 0
							? `${hoveredDay.count} 篇回忆 · ${hoveredDay.words} 字`
							: '暂无回忆'}
					</div>
					<div className="text-[10px] text-neutral-300">
						{dayjs(hoveredDay.dateStr).format('YYYY年M月D日 dddd')}
					</div>
					<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#24292f]" />
				</div>
			)}
		</div>
	)
}
