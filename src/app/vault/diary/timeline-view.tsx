import { DiaryCard, type Diary } from './components/diary-card'
import { motion } from 'motion/react'

interface TimelineViewProps {
	diaries: Diary[]
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: (diary: Diary) => void
}

export default function TimelineView({ diaries, isEditMode, onUpdate, onDelete }: TimelineViewProps) {
	return (
		<div className='relative mt-12'>
			{/* Grid Layout: strictly enforces column widths even if there's only 1 item */}
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start'>
				{diaries.map((diary, index) => (
					<motion.div
						key={diary.id}
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-50px" }}
						className='relative w-full'
					>
						<DiaryCard diary={diary} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(diary)} />
					</motion.div>
				))}
			</div>
		</div>
	)
}
