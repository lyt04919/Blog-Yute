'use client'

import { motion } from 'motion/react'
import dayjs from 'dayjs'
import { MapPin, Tag, BookOpen } from 'lucide-react'
import type { Diary } from '@/types/diary'
import CreateDialog from './components/create-dialog'
import { useState } from 'react'
import { MOOD_MAP, WEATHER_MAP, calculateReadingStats } from './constants/meta'
import DiaryMarkdownViewer from './components/diary-markdown-viewer'
import Lightbox from '@/components/lightbox'

interface ChangelogViewProps {
	diaries: Diary[]
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: (diary: Diary) => void
}

export default function ChangelogView({ diaries, isEditMode, onUpdate, onDelete }: ChangelogViewProps) {
	const [editingDiary, setEditingDiary] = useState<Diary | null>(null)
	const [lightboxMedia, setLightboxMedia] = useState<{ list: string[]; index: number } | null>(null)

	const handleSave = (updated: Diary) => {
		if (editingDiary && onUpdate) {
			onUpdate(updated, editingDiary)
		}
		setEditingDiary(null)
	}

	return (
		<div className="mt-8">
			<div className="relative">
				{diaries.map((diary) => {
					const dateObj = dayjs(diary.date)
					const formattedDate = dateObj.format('YYYY年 M月D日')
					const mediaList = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
					const coverImage = mediaList[0]

					const moodConfig = diary.mood ? MOOD_MAP.get(diary.mood) : null
					const weatherConfig = diary.weather ? WEATHER_MAP.get(diary.weather) : null
					const { wordCount } = calculateReadingStats(diary.content)

					return (
						<motion.div 
							key={diary.id} 
							className="relative"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
						>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-8">
								{/* Left side - Date & Meta (25% width on desktop) */}
								<div className="md:col-span-1 flex-shrink-0">
									<div className="md:sticky md:top-24 pb-2 md:pb-10 pl-6 md:pl-0">
										<time className="text-sm font-serif font-bold text-[var(--color-primary)] block mb-2">
											{formattedDate}
										</time>

										<div className="flex flex-wrap items-center gap-1.5">
											{(moodConfig || weatherConfig) && (
												<div className="inline-flex items-center h-8 px-2.5 border border-black/5 dark:border-white/10 rounded-full text-base bg-white dark:bg-[#27272a]/70 backdrop-blur-sm shadow-xs gap-1.5">
													{weatherConfig && <span title={weatherConfig.label}>{weatherConfig.emoji}</span>}
													{moodConfig && <span title={moodConfig.label}>{moodConfig.emoji}</span>}
												</div>
											)}
											{wordCount > 0 && (
												<span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
													<BookOpen className="w-3 h-3" />
													{wordCount}字
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Right side - Content (75% width on desktop) */}
								<div className="md:col-span-3 relative pb-14 border-l-2 border-neutral-200 dark:border-neutral-800" style={{ paddingLeft: '2rem' }}>
									{/* Timeline dot */}
									<div 
										className="absolute top-1.5 size-3 bg-brand ring-4 ring-white dark:ring-[#18181b] rounded-full z-10" 
										style={{ left: '-7px' }}
									/>

									<div className="space-y-4">
										{/* Tags and Location */}
										{(diary.tags?.length || diary.location) && (
											<div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
												{diary.location && (
													<div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-600 dark:text-neutral-300">
														<MapPin className="w-3 h-3 text-neutral-400" />
														<span>{diary.location}</span>
													</div>
												)}
												{diary.tags && diary.tags.map((tag) => (
													<span
														key={tag}
														className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-600 dark:text-neutral-300"
													>
														<Tag className="w-3 h-3 text-neutral-400" />
														{tag}
													</span>
												))}
											</div>
										)}

										{/* Content with Markdown Parser */}
										<div className="bg-neutral-50/70 dark:bg-neutral-900/40 p-5 md:p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800/80">
											<DiaryMarkdownViewer content={diary.content} />
										</div>

										{/* Media Gallery with Lightbox Hookup */}
										{coverImage && (
											<div 
												className="mt-4 rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 shadow-xs cursor-pointer group" 
												style={{ maxWidth: '320px' }}
												onClick={() => setLightboxMedia({ list: mediaList, index: 0 })}
											>
												{coverImage.endsWith('.mp4') || coverImage.endsWith('.webm') ? (
													<video src={`${coverImage}#t=0.001`} className="w-full h-auto" controls playsInline preload="metadata" />
												) : (
													<img src={coverImage} alt="Diary media" className="w-full h-auto transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
												)}
											</div>
										)}

										{/* Additional media if present */}
										{mediaList.length > 1 && (
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5" style={{ maxWidth: '420px' }}>
												{mediaList.slice(1).map((src, i) => (
													<div 
														key={i} 
														className="aspect-square rounded-xl overflow-hidden border border-black/5 dark:border-white/10 shadow-xs cursor-pointer group"
														onClick={() => setLightboxMedia({ list: mediaList, index: i + 1 })}
													>
														{src.endsWith('.mp4') || src.endsWith('.webm') ? (
															<video src={`${src}#t=0.001`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
														) : (
															<img src={src} alt={`Diary media ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
														)}
													</div>
												))}
											</div>
										)}

										{/* Edit Mode Buttons */}
										{isEditMode && (
											<div className="flex gap-2 pt-2">
												<button 
													onClick={() => setEditingDiary(diary)} 
													className="rounded-full bg-white dark:bg-[#27272a] border border-neutral-200 dark:border-neutral-700 shadow-xs px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-100"
												>
													编辑
												</button>
												<button 
													onClick={() => onDelete?.(diary)} 
													className="rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 shadow-xs px-3.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100"
												>
													删除
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						</motion.div>
					)
				})}
			</div>

			{editingDiary && <CreateDialog diary={editingDiary} onClose={() => setEditingDiary(null)} onSave={handleSave} />}
			
			{lightboxMedia && (
				<Lightbox 
					mediaList={lightboxMedia.list} 
					initialIndex={lightboxMedia.index} 
					onClose={() => setLightboxMedia(null)} 
				/>
			)}
		</div>
	)
}
