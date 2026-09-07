'use client'

import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Diary } from '@/types/diary'
import DiaryDetailModal from './diary-detail-modal'
import CreateDialog from './create-dialog'

interface DiaryCalendarProps {
	diaries: Diary[]
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: (diary: Diary) => void
	onAddForDate?: (dateStr: string) => void
}

export default function DiaryCalendar({ diaries, isEditMode, onUpdate, onDelete, onAddForDate }: DiaryCalendarProps) {
	const [currentDate, setCurrentDate] = useState(dayjs())
	const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null)
	const [editingDiary, setEditingDiary] = useState<Diary | null>(null)
	const [creatingDate, setCreatingDate] = useState<string | null>(null)
	const [multiDayDiaries, setMultiDayDiaries] = useState<{ date: string; list: Diary[] } | null>(null)

	const startOfMonth = currentDate.startOf('month')
	const endOfMonth = currentDate.endOf('month')
	const startDate = startOfMonth.startOf('week')
	const endDate = endOfMonth.endOf('week')

	const days = useMemo(() => {
		const result = []
		let day = startDate
		// Include the end date so the last day/week is never dropped
		while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
			result.push(day)
			day = day.add(1, 'day')
		}
		return result
	}, [startDate, endDate])

	const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'))
	const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'))
	const goToToday = () => setCurrentDate(dayjs())

	// Group diaries by normalized YYYY-MM-DD
	const diariesByDate = useMemo(() => {
		const map = new Map<string, Diary[]>()
		diaries.forEach(diary => {
			const dateStr = dayjs(diary.date).format('YYYY-MM-DD')
			const list = map.get(dateStr) || []
			list.push(diary)
			map.set(dateStr, list)
		})
		return map
	}, [diaries])

	const today = dayjs().format('YYYY-MM-DD')

	const handleDayClick = (dateStr: string, dayDiaries: Diary[] | undefined) => {
		if (dayDiaries && dayDiaries.length > 0) {
			if (isEditMode) {
				setEditingDiary(dayDiaries[0])
			} else if (dayDiaries.length === 1) {
				setSelectedDiary(dayDiaries[0])
			} else {
				// Multiple diaries on the same day
				setMultiDayDiaries({ date: dateStr, list: dayDiaries })
			}
		} else {
			// Click empty day to record
			if (onAddForDate) {
				onAddForDate(dateStr)
			} else {
				setCreatingDate(dateStr)
			}
		}
	}

	return (
		<div className='w-full bg-white dark:bg-[#27272a] rounded-3xl p-6 shadow-sm ring-1 ring-black/5 mt-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8 px-2 md:px-4'>
				<div className='flex items-center gap-3'>
					<h2 className='text-2xl font-serif font-medium text-[var(--color-primary)]'>
						{currentDate.format('YYYY年 M月')}
					</h2>
					<button
						onClick={goToToday}
						className='text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
						今天
					</button>
				</div>
				<div className='flex items-center gap-2'>
					<button onClick={prevMonth} className='p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors' aria-label="上一月">
						<ChevronLeft className='w-5 h-5 text-[var(--color-secondary)]' />
					</button>
					<button onClick={nextMonth} className='p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors' aria-label="下一月">
						<ChevronRight className='w-5 h-5 text-[var(--color-secondary)]' />
					</button>
				</div>
			</div>

			{/* Day of Week Headers */}
			<div className='grid grid-cols-7 gap-y-4'>
				{['日', '一', '二', '三', '四', '五', '六'].map(d => (
					<div key={d} className='text-center text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2'>
						周{d}
					</div>
				))}

				{days.map((d, i) => {
					const dateStr = d.format('YYYY-MM-DD')
					const isCurrentMonth = d.month() === currentDate.month()
					const isToday = dateStr === today
					const dayDiaries = diariesByDate.get(dateStr)
					const hasDiary = !!dayDiaries && dayDiaries.length > 0
					const diaryCount = dayDiaries ? dayDiaries.length : 0

					return (
						<div key={i} className='flex justify-center'>
							<motion.button
								whileHover={{ scale: 1.08 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => handleDayClick(dateStr, dayDiaries)}
								title={
									hasDiary
										? `${dateStr} (${diaryCount}篇回忆)`
										: `点击在 ${dateStr} 记录回忆`
								}
								className={`
									relative w-11 h-11 flex flex-col items-center justify-center rounded-2xl text-sm transition-all group
									${isToday 
										? 'bg-brand text-white font-bold shadow-md ring-2 ring-brand/30' 
										: hasDiary 
											? 'font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60' 
											: !isCurrentMonth 
												? 'text-neutral-300 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/40' 
												: 'text-[var(--color-primary)] hover:bg-neutral-100 dark:hover:bg-neutral-800'
									}
									cursor-pointer
								`}
							>
								<span>{d.date()}</span>

								{/* Multiple Count Badge */}
								{diaryCount > 1 && (
									<span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${isToday ? 'bg-white text-brand' : 'bg-emerald-600 text-white'}`}>
										{diaryCount}
									</span>
								)}

								{/* Indicator dot for single diary */}
								{diaryCount === 1 && (
									<div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`} />
								)}

								{/* Plus icon on hover for empty days */}
								{!hasDiary && (
									<Plus className='w-3 h-3 text-neutral-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1' />
								)}
							</motion.button>
						</div>
					)
				})}
			</div>

			{/* Single Detail Modal */}
			{selectedDiary && (
				<DiaryDetailModal diary={selectedDiary} onClose={() => setSelectedDiary(null)} />
			)}

			{/* Multi-diaries Picker Modal */}
			{multiDayDiaries && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm' onClick={() => setMultiDayDiaries(null)}>
					<div className='bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-100 dark:border-neutral-800 space-y-4' onClick={e => e.stopPropagation()}>
						<div className='flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3'>
							<h3 className='text-lg font-serif font-bold text-[var(--color-primary)]'>
								{multiDayDiaries.date} 的回忆 ({multiDayDiaries.list.length}篇)
							</h3>
							<button onClick={() => setMultiDayDiaries(null)} className='text-neutral-400 hover:text-neutral-700 text-sm'>
								关闭
							</button>
						</div>
						<div className='space-y-2 max-h-80 overflow-y-auto custom-scrollbar'>
							{multiDayDiaries.list.map((d, idx) => (
								<div
									key={d.id || idx}
									onClick={() => {
										setSelectedDiary(d)
										setMultiDayDiaries(null)
									}}
									className='p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors border border-neutral-100 dark:border-neutral-800/40'
								>
									<div className='flex items-center justify-between mb-1 text-xs text-neutral-500'>
										<span>第 {idx + 1} 篇</span>
										<span>{d.mood || ''} {d.weather || ''}</span>
									</div>
									<p className='text-sm text-[var(--color-primary)] line-clamp-2 font-light'>
										{d.content}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Edit Existing Diary */}
			{editingDiary && (
				<CreateDialog
					diary={editingDiary}
					onClose={() => setEditingDiary(null)}
					onSave={(updated) => {
						onUpdate?.(updated, editingDiary)
						setEditingDiary(null)
					}}
				/>
			)}

			{/* Quick Create For Empty Date */}
			{creatingDate && (
				<CreateDialog
					diary={{
						id: Date.now().toString(),
						date: creatingDate,
						content: ''
					}}
					onClose={() => setCreatingDate(null)}
					onSave={(newDiary) => {
						onUpdate?.(newDiary, newDiary)
						setCreatingDate(null)
					}}
				/>
			)}
		</div>
	)
}
