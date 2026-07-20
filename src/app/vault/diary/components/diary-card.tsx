'use client'

import { motion } from 'motion/react'
import { useSize } from '@/hooks/use-size'
import { useState, useRef } from 'react'
import { MapPin, Tag } from 'lucide-react'
import DiaryDetailModal from './diary-detail-modal'
import CreateDialog from './create-dialog'
import dayjs from 'dayjs'

export interface Diary {
	id: string
	date: string
	content: string
	image?: string // Legacy
	media?: string[] // New: Array of image/video URLs
	mood?: string
	weather?: string
	tags?: string[]
	location?: string
}

interface DiaryCardProps {
	diary: Diary
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: () => void
}

const GRADIENTS = [
	'from-orange-100 via-rose-50 to-teal-50 text-rose-800',
	'from-blue-100 via-indigo-50 to-purple-100 text-indigo-800',
	'from-emerald-100 via-teal-50 to-cyan-100 text-teal-800',
	'from-amber-100 via-orange-50 to-rose-100 text-orange-800',
	'from-slate-200 via-gray-50 to-zinc-200 text-slate-800'
]

export function DiaryCard({ diary, isEditMode = false, onUpdate, onDelete }: DiaryCardProps) {
	const { maxSM } = useSize()
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)

	const handleSave = (updated: Diary) => {
		onUpdate?.(updated, diary)
		setIsEditing(false)
	}

	const mediaArray = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
	const [currentIndex, setCurrentIndex] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	const handleScroll = () => {
		if (containerRef.current) {
			const scrollLeft = containerRef.current.scrollLeft
			const width = containerRef.current.clientWidth
			if (width > 0) {
				const newIndex = Math.round(scrollLeft / width)
				if (newIndex !== currentIndex) {
					setCurrentIndex(newIndex)
				}
			}
		}
	}
	
	// Deterministic gradient based on ID
	const gradientClass = GRADIENTS[diary.id.charCodeAt(diary.id.length - 1) % GRADIENTS.length]
	
	const dateObj = dayjs(diary.date)
	const dayStr = dateObj.format('DD')
	const monthYearStr = dateObj.format('MMM YYYY')

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				{...(maxSM ? { animate: { opacity: 1, y: 0 } } : { whileInView: { opacity: 1, y: 0 } })}
				className='group relative block w-full overflow-hidden rounded-[32px] bg-white dark:bg-[#27272a] shadow-sm ring-1 ring-black/5 transition-all hover:shadow-xl cursor-pointer'
				style={{ aspectRatio: '4/5' }}
				onClick={() => !isEditMode && setIsDetailOpen(true)}
			>
				{/* Background Layer: Images (Swipeable) */}
				<div 
					ref={containerRef}
					onScroll={handleScroll}
					className='absolute inset-0 w-full h-full flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden'
					style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
				>
					{mediaArray.length > 0 ? (
						mediaArray.map((mediaUrl, idx) => {
							const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')
							const src = isVideo ? `${mediaUrl}#t=0.001` : mediaUrl
							return (
								<div key={idx} className='relative w-full h-full shrink-0 snap-center overflow-hidden'>
									{isVideo ? (
										<video src={src} className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' autoPlay muted loop playsInline preload="metadata" />
									) : (
										<img src={src} alt={`Diary Media ${idx + 1}`} className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' loading="lazy" decoding="async" />
									)}
								</div>
							)
						})
					) : (
						<div className={`w-full h-full shrink-0 snap-center bg-gradient-to-br ${gradientClass} transition-transform duration-700 group-hover:scale-105 flex flex-col items-center justify-center p-8 text-center`}>
							<div className='font-serif text-8xl font-medium tracking-tighter opacity-80 mix-blend-multiply'>
								{dayStr}
							</div>
							<div className='font-sans text-sm font-bold tracking-widest uppercase opacity-50 mt-2 mix-blend-multiply'>
								{monthYearStr}
							</div>
							{(diary.mood || diary.weather) && (
								<div className='mt-8 text-3xl opacity-80 mix-blend-multiply filter grayscale drop-shadow-sm'>
									{diary.weather === '晴朗' ? '☀️' : diary.weather === '小雨' ? '🌧️' : ''} {diary.mood === '开心' ? '😄' : ''}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Hover Overlay Layer */}
				<div className='absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

				{/* Edit Mode Buttons */}
				{isEditMode && (
					<div className='absolute top-5 right-5 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
						<button 
							onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} 
							className='rounded-full bg-white/20 backdrop-blur-md shadow-sm ring-1 ring-white/20 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white dark:bg-[#27272a]/40'
						>
							编辑
						</button>
						<button 
							onClick={(e) => { e.stopPropagation(); onDelete?.() }} 
							className='rounded-full bg-red-500/80 backdrop-blur-md shadow-sm ring-1 ring-red-500/50 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600'
						>
							删除
						</button>
					</div>
				)}

				{/* Multi-image Indicator (Top Left) */}
				{mediaArray.length > 1 && (
					<div className='absolute top-5 left-5 z-10 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10 opacity-100 group-hover:opacity-0 transition-opacity duration-300'>
						{currentIndex + 1} / {mediaArray.length}
					</div>
				)}

				{/* Content Layer (Fades in and slides up on hover) */}
				<div className='absolute inset-0 p-8 flex flex-col justify-end translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-10'>
					
					{/* Header: Date, Mood, Weather */}
					<div className='flex items-center gap-3 flex-wrap mb-4'>
						<span className='font-serif text-lg font-medium text-white tracking-tight drop-shadow-md'>
							{diary.date}
						</span>
						
						{(diary.mood || diary.weather) && (
							<div className='flex gap-2 drop-shadow-md'>
								{diary.mood && <span className='text-lg'>{diary.mood}</span>}
								{diary.weather && <span className='text-lg'>{diary.weather}</span>}
							</div>
						)}
					</div>

					{/* Text Content */}
					<p className='text-[14px] leading-relaxed text-white/90 font-light whitespace-pre-wrap break-words line-clamp-6 drop-shadow-sm mb-5'>
						{diary.content}
					</p>

					{/* Meta: Tags and Location */}
					{(diary.tags?.length || diary.location) && (
						<div className='flex flex-wrap items-center gap-2 text-[11px] text-white/70'>
							{diary.location && (
								<div className='flex items-center gap-1.5 bg-white dark:bg-[#27272a]/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10'>
									<MapPin className='w-3 h-3' />
									<span>{diary.location}</span>
								</div>
							)}
							{diary.tags && diary.tags.length > 0 && (
								<div className='flex items-center gap-1.5 bg-white dark:bg-[#27272a]/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10'>
									<Tag className='w-3 h-3' />
									<span>{diary.tags.join(', ')}</span>
								</div>
							)}
						</div>
					)}
				</div>
			</motion.div>

			{isEditing && <CreateDialog diary={diary} onClose={() => setIsEditing(false)} onSave={handleSave} />}
			{isDetailOpen && !isEditMode && <DiaryDetailModal diary={diary} onClose={() => setIsDetailOpen(false)} />}
		</>
	)
}
