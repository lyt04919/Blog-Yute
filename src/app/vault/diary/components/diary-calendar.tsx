'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Diary } from './diary-card'
import DiaryDetailModal from './diary-detail-modal'
import CreateDialog from './create-dialog'

interface DiaryCalendarProps {
	diaries: Diary[]
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: (diary: Diary) => void
}

export default function DiaryCalendar({ diaries, isEditMode, onUpdate, onDelete }: DiaryCalendarProps) {
	const [currentDate, setCurrentDate] = useState(dayjs())
	const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null)
	const [editingDiary, setEditingDiary] = useState<Diary | null>(null)

	const startOfMonth = currentDate.startOf('month')
	const endOfMonth = currentDate.endOf('month')
	const startDate = startOfMonth.startOf('week')
	const endDate = endOfMonth.endOf('week')

	const days = []
	let day = startDate
	while (day.isBefore(endDate)) {
		days.push(day)
		day = day.add(1, 'day')
	}

	const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'))
	const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'))

	const diariesByDate = diaries.reduce((acc, diary) => {
		acc[diary.date] = diary
		return acc
	}, {} as Record<string, Diary>)

	const today = dayjs().format('YYYY-MM-DD')

	return (
		<div className='w-full bg-white dark:bg-[#27272a] rounded-3xl p-6 shadow-sm ring-1 ring-black/5 mt-12'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8 px-4'>
				<h2 className='text-2xl font-serif font-medium text-[#18181b]'>
					{currentDate.format('MMMM YYYY')}
				</h2>
				<div className='flex gap-2'>
					<button onClick={prevMonth} className='p-2 rounded-full hover:bg-[#f4f4f5] transition-colors'>
						<ChevronLeft className='w-5 h-5 text-[#52525b]' />
					</button>
					<button onClick={nextMonth} className='p-2 rounded-full hover:bg-[#f4f4f5] transition-colors'>
						<ChevronRight className='w-5 h-5 text-[#52525b]' />
					</button>
				</div>
			</div>

			{/* Grid */}
			<div className='grid grid-cols-7 gap-y-6'>
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
					<div key={d} className='text-center text-xs font-medium text-[#a1a1aa] mb-2'>
						{d}
					</div>
				))}
				
				{days.map((d, i) => {
					const dateStr = d.format('YYYY-MM-DD')
					const isCurrentMonth = d.month() === currentDate.month()
					const isToday = dateStr === today
					const diary = diariesByDate[dateStr]
					
					return (
						<div key={i} className='flex justify-center'>
							<motion.button
								whileHover={{ scale: diary ? 1.05 : 1 }}
								whileTap={{ scale: diary ? 0.95 : 1 }}
								onClick={() => {
									if (diary) {
										if (isEditMode) {
											setEditingDiary(diary)
										} else {
											setSelectedDiary(diary)
										}
									}
								}}
								className={`
									relative w-10 h-10 flex items-center justify-center rounded-full text-sm transition-all
									${isToday ? 'bg-[#18181b] text-white font-bold shadow-md scale-110 z-10 hover:bg-[#27272a]' : 
										diary ? 'font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shadow-sm hover:bg-emerald-100' : 
										!isCurrentMonth ? 'text-[#d4d4d8] hover:bg-[#fafafa]' : 
										'text-[#3f3f46] hover:bg-[#fafafa]'
									}
									${diary ? 'cursor-pointer' : ''}
								`}
							>
								{d.date()}
								
								{/* Dot indicator if diary exists */}
								{diary && (
									<div className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500`} />
								)}
							</motion.button>
						</div>
					)
				})}
			</div>

			{selectedDiary && (
				<DiaryDetailModal diary={selectedDiary} onClose={() => setSelectedDiary(null)} />
			)}
			
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
		</div>
	)
}
