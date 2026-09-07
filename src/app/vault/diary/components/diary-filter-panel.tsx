'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Calendar, MapPin, Tag, Smile, CloudSun, Image as ImageIcon, Type, RefreshCcw } from 'lucide-react'
import type { Diary, FilterState } from '@/types/diary'
import dayjs from 'dayjs'
import { MOOD_LIST, WEATHER_LIST } from '../constants/meta'

interface DiaryFilterPanelProps {
	isOpen: boolean
	onClose: () => void
	diaries: Diary[]
	filteredCount: number
	filters: FilterState
	setFilters: React.Dispatch<React.SetStateAction<FilterState>>
}

interface PillProps {
	active: boolean
	onClick: () => void
	icon?: React.ComponentType<{ className?: string }>
	emoji?: string
	label: string
	count?: number
}

function Pill({ active, onClick, icon: Icon, emoji, label, count }: PillProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
				active 
					? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900' 
					: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-750'
			}`}
		>
			{Icon && <Icon className="w-3.5 h-3.5" />}
			{emoji && <span className="text-sm leading-none">{emoji}</span>}
			<span>{label}</span>
			{count !== undefined && (
				<span className={`text-[11px] ${active ? 'text-white/70 dark:text-neutral-900/70' : 'text-neutral-400'}`}>
					{count}
				</span>
			)}
		</button>
	)
}

export default function DiaryFilterPanel({ isOpen, onClose, diaries, filteredCount, filters, setFilters }: DiaryFilterPanelProps) {
	// Calculate available options and their counts
	const years = new Map<string, number>()
	const months = new Map<string, number>() // Format: "MM"
	const tags = new Map<string, number>()
	const locations = new Map<string, number>()
	const moods = new Map<string, number>()
	const weathers = new Map<string, number>()

	diaries.forEach(d => {
		const date = dayjs(d.date)
		const y = date.format('YYYY')
		const m = date.format('MM')
		
		years.set(y, (years.get(y) || 0) + 1)
		if (!filters.year || filters.year === y) {
			months.set(m, (months.get(m) || 0) + 1)
		}

		if (d.tags) d.tags.forEach(t => tags.set(t, (tags.get(t) || 0) + 1))
		if (d.location) locations.set(d.location, (locations.get(d.location) || 0) + 1)
		if (d.mood) moods.set(d.mood, (moods.get(d.mood) || 0) + 1)
		if (d.weather) weathers.set(d.weather, (weathers.get(d.weather) || 0) + 1)
	})

	const sortedYears = Array.from(years.entries()).sort((a, b) => b[0].localeCompare(a[0]))
	const sortedMonths = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]))
	const sortedTags = Array.from(tags.entries()).sort((a, b) => b[1] - a[1])
	const sortedLocations = Array.from(locations.entries()).sort((a, b) => b[1] - a[1])
	const sortedMoods = Array.from(moods.entries()).sort((a, b) => b[1] - a[1])
	const sortedWeathers = Array.from(weathers.entries()).sort((a, b) => b[1] - a[1])

	const toggleArrayFilter = (key: 'tags' | 'locations' | 'moods' | 'weathers', value: string) => {
		setFilters(prev => {
			const arr = prev[key]
			if (arr.includes(value)) {
				return { ...prev, [key]: arr.filter(v => v !== value) }
			} else {
				return { ...prev, [key]: [...arr, value] }
			}
		})
	}

	const handleReset = () => {
		setFilters({
			year: null,
			month: null,
			date: null,
			tags: [],
			locations: [],
			moods: [],
			weathers: [],
			mediaType: 'all'
		})
	}

	const activeFilterCount = 
		(filters.year ? 1 : 0) + 
		(filters.month ? 1 : 0) + 
		(filters.date ? 1 : 0) +
		filters.tags.length + 
		filters.locations.length + 
		filters.moods.length + 
		filters.weathers.length + 
		(filters.mediaType !== 'all' ? 1 : 0)

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100]"
					/>

					{/* Drawer */}
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 26, stiffness: 220 }}
						className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1e1e21] shadow-2xl flex flex-col overflow-hidden z-[110] border-l border-neutral-100 dark:border-neutral-800"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
							<div className="flex items-center gap-3">
								<h2 className="text-xl font-serif font-bold text-[var(--color-primary)]">高级筛选</h2>
								{activeFilterCount > 0 && (
									<span className="bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
										{activeFilterCount}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2">
								{activeFilterCount > 0 && (
									<button onClick={handleReset} className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" title="重置全部筛选">
										<RefreshCcw size={16} />
									</button>
								)}
								<button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors bg-neutral-100 dark:bg-neutral-800 rounded-full">
									<X size={18} />
								</button>
							</div>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
							{/* Current Specific Date (if set by Heatmap) */}
							{filters.date && (
								<div className="p-3.5 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-between">
									<span className="text-xs font-medium text-brand">
										当前筛选特定日期：{filters.date}
									</span>
									<button 
										onClick={() => setFilters(prev => ({ ...prev, date: null }))}
										className="text-xs font-bold text-brand hover:underline"
									>
										清除
									</button>
								</div>
							)}

							{/* Time Range */}
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
									<Calendar className="w-4 h-4 text-neutral-400" />
									时间范围
								</div>
								<div className="flex flex-wrap gap-2">
									{sortedYears.map(([y, count]) => (
										<Pill 
											key={y} 
											active={filters.year === y} 
											onClick={() => setFilters(prev => ({ ...prev, year: prev.year === y ? null : y, month: null }))}
											label={`${y}年`}
											count={count}
										/>
									))}
								</div>
								{filters.year && (
									<div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
										{sortedMonths.map(([m, count]) => (
											<Pill 
												key={m} 
												active={filters.month === m} 
												onClick={() => setFilters(prev => ({ ...prev, month: prev.month === m ? null : m }))}
												label={`${parseInt(m)}月`}
												count={count}
											/>
										))}
									</div>
								)}
							</div>

							{/* Media Type */}
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
									内容类型
								</div>
								<div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
									<button 
										onClick={() => setFilters(prev => ({ ...prev, mediaType: 'all' }))}
										className={`flex-1 py-2 text-[13px] font-medium rounded-xl transition-all ${filters.mediaType === 'all' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
									>
										全部
									</button>
									<button 
										onClick={() => setFilters(prev => ({ ...prev, mediaType: 'media-only' }))}
										className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-xl transition-all ${filters.mediaType === 'media-only' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
									>
										<ImageIcon className="w-3.5 h-3.5" /> 仅媒体
									</button>
									<button 
										onClick={() => setFilters(prev => ({ ...prev, mediaType: 'text-only' }))}
										className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-xl transition-all ${filters.mediaType === 'text-only' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
									>
										<Type className="w-3.5 h-3.5" /> 仅纯文字
									</button>
								</div>
							</div>

							{/* Tags */}
							{sortedTags.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
										<Tag className="w-4 h-4 text-neutral-400" />
										日记标签
									</div>
									<div className="flex flex-wrap gap-2">
										{sortedTags.map(([tag, count]) => (
											<Pill 
												key={tag} 
												active={filters.tags.includes(tag)} 
												onClick={() => toggleArrayFilter('tags', tag)}
												label={tag}
												count={count}
											/>
										))}
									</div>
								</div>
							)}

							{/* Locations */}
							{sortedLocations.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
										<MapPin className="w-4 h-4 text-neutral-400" />
										足迹地点
									</div>
									<div className="flex flex-wrap gap-2">
										{sortedLocations.map(([loc, count]) => (
											<Pill 
												key={loc} 
												active={filters.locations.includes(loc)} 
												onClick={() => toggleArrayFilter('locations', loc)}
												label={loc}
												count={count}
											/>
										))}
									</div>
								</div>
							)}

							{/* Moods */}
							{sortedMoods.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
										<Smile className="w-4 h-4 text-neutral-400" />
										情绪状态
									</div>
									<div className="flex flex-wrap gap-2">
										{sortedMoods.map(([mood, count]) => {
											const config = MOOD_LIST.find(m => m.label === mood)
											return (
												<Pill 
													key={mood} 
													active={filters.moods.includes(mood)} 
													onClick={() => toggleArrayFilter('moods', mood)}
													emoji={config?.emoji}
													label={mood}
													count={count}
												/>
											)
										})}
									</div>
								</div>
							)}

							{/* Weathers */}
							{sortedWeathers.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
										<CloudSun className="w-4 h-4 text-neutral-400" />
										天气状况
									</div>
									<div className="flex flex-wrap gap-2">
										{sortedWeathers.map(([weather, count]) => {
											const config = WEATHER_LIST.find(w => w.label === weather)
											return (
												<Pill 
													key={weather} 
													active={filters.weathers.includes(weather)} 
													onClick={() => toggleArrayFilter('weathers', weather)}
													emoji={config?.emoji}
													label={weather}
													count={count}
												/>
											)
										})}
									</div>
								</div>
							)}

						</div>

						{/* Footer */}
						<div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
							<button 
								onClick={onClose} 
								className="w-full py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-md text-sm"
							>
								查看 {filteredCount} 篇日记
							</button>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
