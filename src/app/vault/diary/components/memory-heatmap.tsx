'use client'

import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import type { Diary } from '@/types/diary'
import { calculateReadingStats } from '../constants/meta'

interface MemoryHeatmapProps {
	diaries: Diary[]
	selectedDate?: string | null
	onSelectDate?: (dateStr: string) => void
}

export default function MemoryHeatmap({ diaries, selectedDate, onSelectDate }: MemoryHeatmapProps) {
	const heatmapData = useMemo(() => {
		const data = new Map<string, { words: number; count: number }>()
		diaries.forEach(d => {
			const dateStr = dayjs(d.date).format('YYYY-MM-DD')
			const { wordCount } = calculateReadingStats(d.content)
			const existing = data.get(dateStr) || { words: 0, count: 0 }
			data.set(dateStr, {
				words: existing.words + wordCount,
				count: existing.count + 1
			})
		})
		return data
	}, [diaries])

	// Generate last 364 days to make it exactly 52 weeks
	const days = useMemo(() => {
		const result = []
		let current = dayjs().subtract(364, 'day')
		const end = dayjs()
		
		while (current.isBefore(end) || current.isSame(end, 'day')) {
			const dateStr = current.format('YYYY-MM-DD')
			const item = heatmapData.get(dateStr)
			result.push({
				date: current.toDate(),
				dateStr,
				words: item?.words || 0,
				count: item?.count || 0
			})
			current = current.add(1, 'day')
		}
		return result
	}, [heatmapData])

	// Group by weeks for the grid
	const weeks = useMemo(() => {
		const w = []
		let currentWeek = []
		
		// Fill empty days for the first week to align with Sunday
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
		if (currentWeek.length > 0) {
			w.push(currentWeek)
		}
		return w
	}, [days])

	const monthLabels = useMemo(() => {
		const labels: { label: string, colIndex: number }[] = []
		let currentMonth = -1

		weeks.forEach((week, i) => {
			const firstValidDay = week.find(d => d !== null)
			if (firstValidDay) {
				const month = dayjs(firstValidDay.date).month()
				if (month !== currentMonth) {
					labels.push({
						label: dayjs(firstValidDay.date).format('MMM'),
						colIndex: i
					})
					currentMonth = month
				}
			}
		})
		return labels
	}, [weeks])

	const getCellClass = (words: number, isSelected: boolean) => {
		const base = "rounded-[3px] transition-all hover:scale-150 hover:z-20 cursor-pointer "
		const selectedRing = isSelected ? "ring-2 ring-brand ring-offset-1 dark:ring-offset-neutral-900 scale-125 z-10 " : ""

		if (words === 0) {
			return `${base} ${selectedRing} bg-neutral-200/70 dark:bg-neutral-800/80 hover:bg-neutral-300 dark:hover:bg-neutral-700`
		}
		if (words < 50) {
			return `${base} ${selectedRing} bg-emerald-200 dark:bg-emerald-900/60`
		}
		if (words < 200) {
			return `${base} ${selectedRing} bg-emerald-400 dark:bg-emerald-700/80`
		}
		if (words < 500) {
			return `${base} ${selectedRing} bg-emerald-500 dark:bg-emerald-600`
		}
		return `${base} ${selectedRing} bg-emerald-600 dark:bg-emerald-500`
	}

	return (
		<div className="flex flex-col items-end w-full select-none">
			<div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
				<div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
				Memory Heatmap
			</div>
			
			<div className="w-full overflow-x-auto pb-1 scrollbar-none flex md:justify-end">
				<div className="flex flex-col min-w-max relative pt-5">
					{monthLabels.map((m, i) => (
						<div 
							key={i} 
							className="absolute top-0 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium"
							style={{ left: m.colIndex * 14 }}
						>
							{m.label}
						</div>
					))}
					<div className="flex gap-1">
						{weeks.map((week, i) => (
							<div key={i} className="flex flex-col gap-1">
								{week.map((day, j) => (
									day ? (
										<div 
											key={day.dateStr}
											onClick={() => onSelectDate?.(day.dateStr)}
											title={`${day.dateStr}：${day.count > 0 ? `${day.count} 篇 (${day.words} 字)` : '无回忆 (点击筛选)'}`}
											className={getCellClass(day.words, selectedDate === day.dateStr)}
											style={{ width: 10, height: 10 }}
										/>
									) : (
										<div key={`empty-${j}`} style={{ width: 10, height: 10 }} />
									)
								))}
							</div>
						))}
					</div>
				</div>
			</div>
			
			<div className="flex items-center gap-1.5 mt-2 text-[9px] text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider">
				<span>Less</span>
				<div className="flex gap-0.5 mx-1">
					<div className="rounded-[2px] bg-neutral-200/70 dark:bg-neutral-800/80" style={{ width: 8, height: 8 }} />
					<div className="rounded-[2px] bg-emerald-200 dark:bg-emerald-900/60" style={{ width: 8, height: 8 }} />
					<div className="rounded-[2px] bg-emerald-400 dark:bg-emerald-700/80" style={{ width: 8, height: 8 }} />
					<div className="rounded-[2px] bg-emerald-500 dark:bg-emerald-600" style={{ width: 8, height: 8 }} />
					<div className="rounded-[2px] bg-emerald-600 dark:bg-emerald-500" style={{ width: 8, height: 8 }} />
				</div>
				<span>More</span>
			</div>
		</div>
	)
}
