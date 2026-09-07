'use client'

import { DiaryCard } from './components/diary-card'
import type { Diary } from '@/types/diary'
import { motion } from 'motion/react'

interface TimelineViewProps {
	diaries: Diary[]
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: (diary: Diary) => void
}

export default function TimelineView({ diaries, isEditMode, onUpdate, onDelete }: TimelineViewProps) {
	return (
		<div className='relative mt-8'>
			{/* Grid Layout */}
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start'>
				{diaries.map((diary) => (
					<motion.div
						key={diary.id}
						initial={{ opacity: 0, y: 25 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-40px" }}
						transition={{ duration: 0.4 }}
						className='relative w-full'
					>
						<DiaryCard diary={diary} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(diary)} />
					</motion.div>
				))}
			</div>
		</div>
	)
}
