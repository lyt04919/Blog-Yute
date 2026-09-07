'use client'

import { motion } from 'motion/react'
import { useState, useRef } from 'react'
import { MapPin, Tag, Film, BookOpen } from 'lucide-react'
import type { Diary } from '@/types/diary'
import DiaryDetailModal from './diary-detail-modal'
import CreateDialog from './create-dialog'
import dayjs from 'dayjs'
import { MOOD_MAP, WEATHER_MAP, calculateReadingStats } from '../constants/meta'

interface DiaryCardProps {
	diary: Diary
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: () => void
}

const GRADIENTS = [
	'from-orange-100 via-rose-50 to-teal-50 text-rose-800 dark:from-orange-950/40 dark:via-rose-950/30 dark:to-teal-950/40 dark:text-rose-200',
	'from-blue-100 via-indigo-50 to-purple-100 text-indigo-800 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 dark:text-indigo-200',
	'from-emerald-100 via-teal-50 to-cyan-100 text-teal-800 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 dark:text-teal-200',
	'from-amber-100 via-orange-50 to-rose-100 text-orange-800 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/40 dark:text-orange-200',
	'from-slate-200 via-gray-50 to-zinc-200 text-slate-800 dark:from-slate-900/60 dark:via-neutral-900/50 dark:to-zinc-900/60 dark:text-slate-200'
]

export function DiaryCard({ diary, isEditMode = false, onUpdate, onDelete }: DiaryCardProps) {
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

	const handleSave = (updated: Diary) => {
		onUpdate?.(updated, diary)
		setIsEditing(false)
	}

	const mediaArray = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
	const [currentIndex, setCurrentIndex] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const isScrollingRef = useRef(false)
	const touchStartXRef = useRef(0)

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

	const handleCardClick = () => {
		if (isScrollingRef.current) {
			isScrollingRef.current = false
			return
		}
		if (!isEditMode) {
			setIsDetailOpen(true)
		}
	}

	// Deterministic gradient based on ID
	const gradientClass = GRADIENTS[diary.id.charCodeAt(diary.id.length - 1) % GRADIENTS.length]

	const dateObj = dayjs(diary.date)
	const dayStr = dateObj.format('DD')
	const monthYearStr = dateObj.format('MMM YYYY')

	const moodConfig = diary.mood ? MOOD_MAP.get(diary.mood) : null
	const weatherConfig = diary.weather ? WEATHER_MAP.get(diary.weather) : null
	const { wordCount } = calculateReadingStats(diary.content)

	return (
		<>
			<div
				className='group relative block w-full overflow-hidden rounded-[32px] bg-white dark:bg-[#27272a] shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 hover:shadow-xl cursor-pointer select-none'
				style={{ aspectRatio: '4/5' }}
				onClick={handleCardClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX }}
				onTouchEnd={(e) => {
					if (Math.abs(e.changedTouches[0].clientX - touchStartXRef.current) > 10) {
						isScrollingRef.current = true
					}
				}}
			>
				{/* Background Layer: Images/Videos or Gradient */}
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
										<video 
											src={src} 
											className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105' 
											autoPlay={isHovered}
											muted 
											loop 
											playsInline 
											preload="metadata" 
										/>
									) : (
										<img 
											src={src} 
											alt={`Diary Media ${idx + 1}`} 
											className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105' 
											loading="lazy" 
											decoding="async" 
										/>
									)}
									{isVideo && !isHovered && (
										<div className='absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white'>
											<Film className='w-3.5 h-3.5' />
										</div>
									)}
								</div>
							)
						})
					) : (
						<div className={`w-full h-full shrink-0 snap-center bg-gradient-to-br ${gradientClass} transition-transform duration-700 group-hover:scale-105 flex flex-col items-center justify-center p-8 text-center`}>
							<div className='font-serif text-8xl font-medium tracking-tighter opacity-80 mix-blend-multiply dark:mix-blend-normal'>
								{dayStr}
							</div>
							<div className='font-sans text-sm font-bold tracking-widest uppercase opacity-50 mt-2 mix-blend-multiply dark:mix-blend-normal'>
								{monthYearStr}
							</div>
							{(moodConfig || weatherConfig) && (
								<div className='mt-8 flex items-center justify-center gap-2 text-3xl opacity-80 filter drop-shadow-sm'>
									{weatherConfig?.emoji || ''} {moodConfig?.emoji || ''}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Desktop Hover Overlay Layer */}
				<div className='absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:block' />

				{/* Edit Mode Buttons */}
				{isEditMode && (
					<div className='absolute top-4 right-4 z-20 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300'>
						<button 
							onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} 
							className='rounded-full bg-white/40 dark:bg-neutral-800/80 backdrop-blur-md shadow-sm ring-1 ring-white/20 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white hover:text-black'
						>
							编辑
						</button>
						<button 
							onClick={(e) => { e.stopPropagation(); onDelete?.() }} 
							className='rounded-full bg-red-500/80 backdrop-blur-md shadow-sm ring-1 ring-red-500/50 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600'
						>
							删除
						</button>
					</div>
				)}

				{/* Multi-image Indicator (Top Left) */}
				{mediaArray.length > 1 && (
					<div className='absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10 opacity-100 sm:group-hover:opacity-0 transition-opacity duration-300'>
						{currentIndex + 1} / {mediaArray.length}
					</div>
				)}

				{/* Mobile Persistent Bottom Glass Bar (Fix touch devices lack of hover) */}
				<div className='absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:hidden z-10 pointer-events-none flex flex-col justify-end'>
					<div className='flex items-center justify-between text-white/90 text-xs font-serif mb-1'>
						<span className='font-bold'>{diary.date}</span>
						<span>{weatherConfig?.emoji || ''} {moodConfig?.emoji || ''}</span>
					</div>
					<p className='text-white/85 text-xs line-clamp-2 font-light leading-relaxed'>
						{diary.content}
					</p>
				</div>

				{/* Desktop Content Layer (Fades in and slides up on hover) */}
				<div className='absolute inset-0 p-8 flex flex-col justify-end translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-10 hidden sm:flex'>
					{/* Header: Date, Mood, Weather */}
					<div className='flex items-center gap-3 flex-wrap mb-3'>
						<span className='font-serif text-lg font-medium text-white tracking-tight drop-shadow-md'>
							{diary.date}
						</span>
						
						{(moodConfig || weatherConfig) && (
							<div className='flex items-center gap-2 drop-shadow-md'>
								{weatherConfig && <span className='text-lg' title={weatherConfig.label}>{weatherConfig.emoji}</span>}
								{moodConfig && <span className='text-lg' title={moodConfig.label}>{moodConfig.emoji}</span>}
							</div>
						)}

						{wordCount > 0 && (
							<span className='ml-auto inline-flex items-center gap-1 text-[11px] text-white/70 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full'>
								<BookOpen className='w-3 h-3' />
								{wordCount} 字
							</span>
						)}
					</div>

					{/* Text Content Excerpt */}
					<p className='text-[14px] leading-relaxed text-white/90 font-light whitespace-pre-wrap break-words line-clamp-5 drop-shadow-sm mb-4'>
						{diary.content}
					</p>

					{/* Meta: Tags and Location */}
					{(diary.tags?.length || diary.location) && (
						<div className='flex flex-wrap items-center gap-2 text-[11px] text-white/80'>
							{diary.location && (
								<div className='flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 text-white'>
									<MapPin className='w-3 h-3' />
									<span>{diary.location}</span>
								</div>
							)}
							{diary.tags && diary.tags.length > 0 && (
								<div className='flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 text-white'>
									<Tag className='w-3 h-3' />
									<span>{diary.tags.join(', ')}</span>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{isEditing && <CreateDialog diary={diary} onClose={() => setIsEditing(false)} onSave={handleSave} />}
			{isDetailOpen && !isEditMode && <DiaryDetailModal diary={diary} onClose={() => setIsDetailOpen(false)} />}
		</>
	)
}
