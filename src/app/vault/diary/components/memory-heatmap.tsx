import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import type { Diary } from './diary-card'

interface MemoryHeatmapProps {
	diaries: Diary[]
}

export default function MemoryHeatmap({ diaries }: MemoryHeatmapProps) {
	const heatmapData = useMemo(() => {
		const data = new Map<string, number>()
		diaries.forEach(d => {
			const dateStr = dayjs(d.date).format('YYYY-MM-DD')
			const count = d.content?.length || 0
			data.set(dateStr, (data.get(dateStr) || 0) + count)
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
			result.push({
				date: current.toDate(),
				dateStr,
				count: heatmapData.get(dateStr) || 0
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

	const getColorHex = (count: number) => {
		if (count === 0) return '#f5f5f5' // light gray
		if (count < 50) return '#9be9a8' // light green
		if (count < 200) return '#40c463' // medium green
		if (count < 500) return '#30a14e' // dark green
		return '#216e39' // very dark green
	}

	return (
		<div className="flex flex-col items-end w-full">
			<div className="text-[10px] font-bold text-neutral-400 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
				<div className="w-1.5 h-1.5 rounded-full bg-neutral-500"></div>
				Memory Heatmap
			</div>
			
			<div className="w-full overflow-x-auto pb-1 scrollbar-none flex md:justify-end">
				<div className="flex flex-col min-w-max relative pt-5">
					{monthLabels.map((m, i) => (
						<div 
							key={i} 
							className="absolute top-0 text-[10px] text-neutral-400 font-medium"
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
										title={`${day.dateStr}: ${day.count} 字`}
										className="rounded-[3px] transition-all hover:scale-150 hover:z-10 hover:shadow-md cursor-crosshair"
										style={{ width: 10, height: 10, backgroundColor: getColorHex(day.count) }}
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
			
			<div className="flex items-center gap-1.5 mt-2 text-[9px] text-neutral-400 font-medium uppercase tracking-wider">
				<span>Less</span>
				<div className="flex gap-0.5 mx-1">
					<div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: '#f5f5f5' }} />
					<div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: '#9be9a8' }} />
					<div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: '#40c463' }} />
					<div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: '#30a14e' }} />
					<div className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: '#216e39' }} />
				</div>
				<span>More</span>
			</div>
		</div>
	)
}
