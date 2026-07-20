'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { Diary } from './diary-card'
import dayjs from 'dayjs'
import Lightbox from '@/components/lightbox'

interface HistoricalDiariesModalProps {
	diaries: Diary[]
	onClose: () => void
}

export default function HistoricalDiariesModal({ diaries, onClose }: HistoricalDiariesModalProps) {
	const [lightboxMedia, setLightboxMedia] = useState<{ list: string[], index: number } | null>(null)

	return (
		<>
			<DialogModal open onClose={onClose} className='card max-w-2xl w-full max-h-[90vh] relative bg-white dark:bg-[#27272a] flex flex-col shadow-2xl overflow-hidden'>
				<div className='absolute top-4 right-4 z-20 bg-white/80 dark:bg-neutral-800/80 rounded-full backdrop-blur-sm'>
					<button onClick={onClose} className='p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors'>
						<X className='w-5 h-5' />
					</button>
				</div>

				<div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0 bg-white dark:bg-[#27272a] z-10">
					<h2 className="text-xl font-bold tracking-tight">往年今日 · {dayjs().format('MM月DD日')}</h2>
					<p className="text-xs text-neutral-500 mt-1 font-medium">共 {diaries.length} 篇回忆</p>
				</div>

				<div className='flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8'>
					{diaries.map((diary, index) => {
						const yearsAgo = dayjs().year() - dayjs(diary.date).year()
						const mediaList = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
						const isLast = index === diaries.length - 1
						
						return (
							<div key={diary.id} className="flex gap-4 md:gap-6 relative group">
								{/* Timeline connector */}
								{!isLast && (
									<div className="absolute left-[19px] md:left-[23px] top-[40px] bottom-[-40px] w-[2px] bg-neutral-100 dark:bg-neutral-800/50" />
								)}
								
								<div className="flex-shrink-0 flex flex-col items-center z-10 pt-1">
									<div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm md:text-base border-2 border-white dark:border-[#27272a] shadow-sm">
										{dayjs(diary.date).format('YY')}
									</div>
									<div className="text-[10px] md:text-xs font-bold text-neutral-400 mt-2">
										{yearsAgo}年前
									</div>
								</div>
								
								<div className="flex-1 min-w-0 bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
									<div className="mb-3">
										<div className="text-lg font-bold text-neutral-800 dark:text-neutral-200 font-serif">{dayjs(diary.date).format('YYYY年')}</div>
										{(diary.mood || diary.weather) && (
											<div className='flex flex-wrap gap-2 mt-2'>
												{diary.mood && (
													<span className='px-2.5 py-1 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-transparent text-neutral-600 dark:text-neutral-300 text-[11px] font-medium shadow-sm'>
														{diary.mood}
													</span>
												)}
												{diary.weather && (
													<span className='px-2.5 py-1 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200/60 dark:border-transparent text-neutral-600 dark:text-neutral-300 text-[11px] font-medium shadow-sm'>
														{diary.weather}
													</span>
												)}
											</div>
										)}
									</div>

									<div className='prose prose-sm md:prose-base max-w-none text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap mb-4'>
										{diary.content}
									</div>

									{mediaList.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-4">
											{mediaList.map((src, idx) => {
												const isVideo = src.endsWith('.mp4') || src.endsWith('.webm')
												const mediaSrc = isVideo ? `${src}#t=0.001` : src
												return (
													<div 
														key={idx} 
														className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
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
