import { motion, AnimatePresence } from 'motion/react'
import { X, Calendar, MapPin, Tag, Smile, CloudSun, Image as ImageIcon, Type, RefreshCcw } from 'lucide-react'
import type { Diary } from './diary-card'
import dayjs from 'dayjs'

export interface FilterState {
	year: string | null
	month: string | null
	tags: string[]
	locations: string[]
	moods: string[]
	weathers: string[]
	mediaType: 'all' | 'media-only' | 'text-only'
}

interface DiaryFilterPanelProps {
	isOpen: boolean
	onClose: () => void
	diaries: Diary[]
	filteredCount: number
	filters: FilterState
	setFilters: React.Dispatch<React.SetStateAction<FilterState>>
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

	const toggleArrayFilter = (key: keyof FilterState, value: string) => {
		setFilters(prev => {
			const arr = prev[key] as string[]
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
		filters.tags.length + 
		filters.locations.length + 
		filters.moods.length + 
		filters.weathers.length + 
		(filters.mediaType !== 'all' ? 1 : 0)

	const Pill = ({ active, onClick, icon: Icon, label, count }: any) => (
		<button
			onClick={onClick}
			className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
				active 
					? 'bg-[#18181b] text-white shadow-sm' 
					: 'bg-white border border-[#e4e4e7] text-[#52525b] hover:border-[#d4d4d8] hover:bg-[#fafafa]'
			}`}
		>
			{Icon && <Icon className="w-3.5 h-3.5" />}
			<span>{label}</span>
			{count !== undefined && <span className={`text-[11px] ${active ? 'text-white/70' : 'text-[#a1a1aa]'}`}>{count}</span>}
		</button>
	)

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
						className="fixed inset-0 bg-black/40"
						style={{ zIndex: 100 }}
					/>

					{/* Drawer */}
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#27272a] shadow-2xl flex flex-col overflow-hidden transform-gpu"
						style={{ zIndex: 110 }}
					>
						{/* Header */}
						<div className="flex items-center justify-between p-6 pb-4 border-b border-[#e4e4e7]/50">
							<div className="flex items-center gap-3">
								<h2 className="text-xl font-bold text-[#18181b]">高级筛选</h2>
								{activeFilterCount > 0 && (
									<span className="bg-[#18181b] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
										{activeFilterCount}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2">
								{activeFilterCount > 0 && (
									<button onClick={handleReset} className="p-2 text-[#71717a] hover:text-[#18181b] transition-colors" title="重置全部">
										<RefreshCcw size={18} />
									</button>
								)}
								<button onClick={onClose} className="p-2 text-[#71717a] hover:text-[#18181b] transition-colors bg-[#f4f4f5] rounded-full hover:bg-[#e4e4e7]">
									<X size={20} />
								</button>
							</div>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
							
							{/* Time Range */}
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm font-bold text-[#27272a]">
									<Calendar className="w-4 h-4 text-[#71717a]" />
									时间过滤
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
									<div className="flex flex-wrap gap-2 pt-2 border-t border-[#f4f4f5]">
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
								<div className="flex items-center gap-2 text-sm font-bold text-[#27272a]">
									内容类型
								</div>
								<div className="flex bg-[#f4f4f5]/50 p-1 rounded-xl border border-[#e4e4e7]/50">
									<button 
										onClick={() => setFilters(prev => ({ ...prev, mediaType: 'all' }))}
										className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-all ${filters.mediaType === 'all' ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#71717a] hover:text-[#3f3f46]'}`}
									>
										全部
									</button>
									<button 
										onClick={() => setFilters(prev => ({ ...prev, mediaType: 'media-only' }))}
										className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-lg transition-all ${filters.mediaType === 'media-only' ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#71717a] hover:text-[#3f3f46]'}`}
									>
										<ImageIcon className="w-3.5 h-3.5" /> 仅图文/视频
									</button>
									<button 
										onClick={() => setFilters(prev => ({ ...prev, mediaType: 'text-only' }))}
										className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-lg transition-all ${filters.mediaType === 'text-only' ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#71717a] hover:text-[#3f3f46]'}`}
									>
										<Type className="w-3.5 h-3.5" /> 仅纯文字
									</button>
								</div>
							</div>

							{/* Tags */}
							{sortedTags.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm font-bold text-[#27272a]">
										<Tag className="w-4 h-4 text-[#71717a]" />
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
									<div className="flex items-center gap-2 text-sm font-bold text-[#27272a]">
										<MapPin className="w-4 h-4 text-[#71717a]" />
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
									<div className="flex items-center gap-2 text-sm font-bold text-[#27272a]">
										<Smile className="w-4 h-4 text-[#71717a]" />
										情绪状态
									</div>
									<div className="flex flex-wrap gap-2">
										{sortedMoods.map(([mood, count]) => (
											<Pill 
												key={mood} 
												active={filters.moods.includes(mood)} 
												onClick={() => toggleArrayFilter('moods', mood)}
												label={mood}
												count={count}
											/>
										))}
									</div>
								</div>
							)}

							{/* Weathers */}
							{sortedWeathers.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm font-bold text-[#27272a]">
										<CloudSun className="w-4 h-4 text-[#71717a]" />
										天气状况
									</div>
									<div className="flex flex-wrap gap-2">
										{sortedWeathers.map(([weather, count]) => (
											<Pill 
												key={weather} 
												active={filters.weathers.includes(weather)} 
												onClick={() => toggleArrayFilter('weathers', weather)}
												label={weather}
												count={count}
											/>
										))}
									</div>
								</div>
							)}

						</div>

						{/* Footer */}
						<div className="p-6 border-t border-[#e4e4e7]/50 bg-[#fafafa]/50">
							<button 
								onClick={onClose}
								className="w-full py-3 bg-[#18181b] text-white rounded-xl font-bold hover:bg-[#27272a] transition-colors shadow-md"
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
