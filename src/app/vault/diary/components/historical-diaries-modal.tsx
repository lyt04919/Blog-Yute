'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { Diary } from '@/types/diary'
import dayjs from 'dayjs'
import Lightbox from '@/components/lightbox'
import { MOOD_MAP, WEATHER_MAP } from '../constants/meta'
import DiaryMarkdownViewer from './diary-markdown-viewer'

interface HistoricalDiariesModalProps {
	diaries: Diary[]
	onClose: () => void
}

export default function HistoricalDiariesModal({ diaries, onClose }: HistoricalDiariesModalProps) {
	const [lightboxMedia, setLightboxMedia] = useState<{ list: string[], index: number } | null>(null)

	return (
		<>
			<DialogModal open onClose={onClose} className='card max-w-2xl w-full max-h-[90vh] relative bg-white dark:bg-[#242427] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-black/5 dark:border-white/10'>
				<div className='absolute top-4 right-4 z-20'>
					<button 
						onClick={onClose} 
						className='p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors'
						aria-label="关闭"
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				<div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex-shrink-0 bg-white dark:bg-[#242427] z-10">
					<h2 className="text-xl font-serif font-bold tracking-tight text-[var(--color-primary)]">
						往年今日 · {dayjs().format('M月D日')}
					</h2>
					<p className="text-xs text-neutral-500 mt-1 font-medium">共 {diaries.length} 篇往昔回忆</p>
				</div>

				<div className='flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8'>
					{diaries.map((diary, index) => {
						const yearsAgo = dayjs().year() - dayjs(diary.date).year()
						const mediaList = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
						const isLast = index === diaries.length - 1
						
						const moodConfig = diary.mood ? MOOD_MAP.get(diary.mood) : null
						const weatherConfig = diary.weather ? WEATHER_MAP.get(diary.weather) : null

						return (
							<div key={diary.id} className="flex gap-4 md:gap-6 relative group">
								{/* Timeline connector */}
								{!isLast && (
									<div className="absolute left-[19px] md:left-[23px] top-[40px] bottom-[-40px] w-[2px] bg-neutral-200 dark:bg-neutral-800" />
								)}
								
								<div className="flex-shrink-0 flex flex-col items-center z-10 pt-1">
									<div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-serif font-bold text-sm md:text-base border border-brand/20 shadow-xs">
										{dayjs(diary.date).format('YY')}
									</div>
									<div className="text-[10px] md:text-xs font-bold text-neutral-400 mt-1.5">
										{yearsAgo > 0 ? `${yearsAgo}年前` : '今年'}
									</div>
								</div>
								
								<div className="flex-1 min-w-0 bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
									<div className="mb-3">
										<div className="text-lg font-bold text-[var(--color-primary)] font-serif">
											{dayjs(diary.date).format('YYYY年 M月D日')}
										</div>
										{(moodConfig || weatherConfig || diary.mood || diary.weather) && (
											<div className='flex flex-wrap gap-1.5 mt-2'>
												{moodConfig && (
													<span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 ${moodConfig.bgClass}`}>
														<span>{moodConfig.emoji}</span>
														<span>{moodConfig.label}</span>
													</span>
												)}
												{weatherConfig && (
													<span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 ${weatherConfig.bgClass}`}>
														<span>{weatherConfig.emoji}</span>
														<span>{weatherConfig.label}</span>
													</span>
												)}
											</div>
										)}
									</div>

									<div className='mb-4'>
										<DiaryMarkdownViewer content={diary.content} />
									</div>

									{mediaList.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-4">
											{mediaList.map((src, idx) => {
												const isVideo = src.endsWith('.mp4') || src.endsWith('.webm')
												const mediaSrc = isVideo ? `${src}#t=0.001` : src
												return (
													<div 
														key={idx} 
														className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
														onClick={() => setLightboxMedia({ list: mediaList, index: idx })}
													>
														{isVideo ? (
															<video src={mediaSrc} className="w-full h-full object-cover" />
														) : (
															<img src={mediaSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
														)}
													</div>
												)
											})}
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</DialogModal>

			{lightboxMedia && (
				<Lightbox 
					mediaList={lightboxMedia.list} 
					initialIndex={lightboxMedia.index} 
					onClose={() => setLightboxMedia(null)} 
				/>
			)}
		</>
	)
}
