'use client'

import { useState } from 'react'
import { X, Clock, BookOpen, MapPin, Tag } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { Diary } from '@/types/diary'
import Lightbox from '@/components/lightbox'
import { MOOD_MAP, WEATHER_MAP, calculateReadingStats } from '../constants/meta'
import DiaryMarkdownViewer from './diary-markdown-viewer'

interface DiaryDetailModalProps {
	diary: Diary
	onClose: () => void
}

export default function DiaryDetailModal({ diary, onClose }: DiaryDetailModalProps) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
	const mediaList = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
	const hasMedia = mediaList.length > 0

	const moodConfig = diary.mood ? MOOD_MAP.get(diary.mood) : null
	const weatherConfig = diary.weather ? WEATHER_MAP.get(diary.weather) : null
	const { wordCount, readingTime } = calculateReadingStats(diary.content)

	return (
		<>
			<DialogModal 
				open 
				onClose={onClose} 
				className='card max-w-4xl w-full max-h-[90vh] relative bg-white dark:bg-[#242427] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-black/5 dark:border-white/10'
			>
				{/* Close Button */}
				<div className='absolute top-4 right-4 md:top-6 md:right-6 z-30'>
					<button 
						onClick={onClose} 
						className='p-2 rounded-full bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors backdrop-blur-sm'
						aria-label="关闭"
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				{/* Modal Body: Flex column on mobile, Flex row on desktop */}
				<div className='flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden'>
					{/* Left / Top Media Section */}
					{hasMedia && (
						<div className='w-full md:w-64 shrink-0 p-5 md:p-8 md:border-r border-neutral-100 dark:border-neutral-800/80 flex md:flex-col gap-3.5 overflow-x-auto md:overflow-y-auto custom-scrollbar bg-neutral-50/50 dark:bg-neutral-900/30'>
							{mediaList.map((src, idx) => {
								const isVideo = src.endsWith('.mp4') || src.endsWith('.webm')
								const mediaSrc = isVideo ? `${src}#t=0.001` : src
								return (
									<div
										key={idx}
										className='relative w-28 h-28 md:w-full md:h-44 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 cursor-pointer group transition-transform duration-300 hover:scale-[1.02]'
										onClick={() => setLightboxIndex(idx)}
									>
										{isVideo ? (
											<video src={mediaSrc} className='w-full h-full object-cover pointer-events-none' playsInline preload="metadata" />
										) : (
											<img
												src={mediaSrc}
												alt={`Diary Media ${idx + 1}`}
												className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
												loading="lazy"
												decoding="async"
											/>
										)}
										<div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
									</div>
								)
							})}
						</div>
					)}

					{/* Right / Content Section */}
					<div className='flex-1 min-w-0 p-6 md:p-10 overflow-y-auto custom-scrollbar flex flex-col justify-between'>
						<div>
							{/* Date & Title */}
							<div className='mb-6 pr-8'>
								<h2 className='text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight font-serif mb-4 break-words'>
									{diary.date}
								</h2>

								{/* Meta Badges (Mood, Weather, Reading Time, Word Count) */}
								<div className='flex flex-wrap items-center gap-2 pt-1'>
									{moodConfig ? (
										<span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${moodConfig.bgClass}`}>
											<span>{moodConfig.emoji}</span>
											<span>{moodConfig.label}</span>
										</span>
									) : diary.mood ? (
										<span className='px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium'>
											{diary.mood}
										</span>
									) : null}

									{weatherConfig ? (
										<span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${weatherConfig.bgClass}`}>
											<span>{weatherConfig.emoji}</span>
											<span>{weatherConfig.label}</span>
										</span>
									) : diary.weather ? (
										<span className='px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium'>
											{diary.weather}
										</span>
									) : null}

									{/* Word Count & Reading Time */}
									<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium'>
										<BookOpen className='w-3 h-3' />
										<span>约 {wordCount} 字</span>
									</span>
									<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium'>
										<Clock className='w-3 h-3' />
										<span>{readingTime} 分钟阅读</span>
									</span>
								</div>
							</div>

							{/* Markdown Body Content */}
							<div className='mt-2'>
								<DiaryMarkdownViewer content={diary.content} />
							</div>
						</div>

						{/* Footer Meta (Location & Tags) */}
						{(diary.location || (diary.tags && diary.tags.length > 0)) && (
							<div className='mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center gap-2 text-xs text-neutral-500'>
								{diary.location && (
									<div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300'>
										<MapPin className='w-3.5 h-3.5 text-neutral-400' />
										<span>{diary.location}</span>
									</div>
								)}
								{diary.tags && diary.tags.map(tag => (
									<div key={tag} className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300'>
										<Tag className='w-3.5 h-3.5 text-neutral-400' />
										<span>{tag}</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogModal>

			{lightboxIndex !== null && (
				<Lightbox 
					mediaList={mediaList} 
					initialIndex={lightboxIndex} 
					onClose={() => setLightboxIndex(null)} 
				/>
			)}
		</>
	)
}
