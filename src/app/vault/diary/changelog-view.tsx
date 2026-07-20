'use client'

import { motion } from 'motion/react'
import dayjs from 'dayjs'
import { MapPin, Tag } from 'lucide-react'
import { type Diary } from './components/diary-card'
import CreateDialog from './components/create-dialog'
import { useState } from 'react'

export const MOOD_EMOJIS: Record<string, string> = {
	'开心': '😄', '平静': '😐', '难过': '😢', '生气': '😡', '疲惫': '😫', 
	'活力': '✨', '焦虑': '😰', '感动': '🥺', '无聊': '🥱', '得意': '😎', '崩溃': '🤯'
}

export const WEATHER_EMOJIS: Record<string, string> = {
	'晴朗': '☀️', '多云': '⛅', '阴天': '☁️', '小雨': '🌧️', '大雨': '⛈️', 
	'雷雨': '🌩️', '下雪': '❄️', '大风': '💨', '雾霾': '🌫️'
}

interface ChangelogViewProps {
	diaries: Diary[]
	isEditMode?: boolean
	onUpdate?: (diary: Diary, oldDiary: Diary, imageItem?: any) => void
	onDelete?: (diary: Diary) => void
}

export default function ChangelogView({ diaries, isEditMode, onUpdate, onDelete }: ChangelogViewProps) {
	// Sort diaries by date descending just to be safe
	const sortedDiaries = [...diaries].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

	const [editingDiary, setEditingDiary] = useState<Diary | null>(null)

	const handleSave = (updated: Diary) => {
		if (editingDiary && onUpdate) {
			onUpdate(updated, editingDiary)
		}
		setEditingDiary(null)
	}

	return (
		<div className="mt-12">
			<div className="relative">
				{sortedDiaries.map((diary) => {
					const dateObj = dayjs(diary.date)
					const formattedDate = dateObj.format('MMMM D, YYYY')
					const coverImage = (diary.media && diary.media.length > 0) ? diary.media[0] : diary.image

					return (
						<motion.div 
							key={diary.id} 
							className="relative"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
						>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
								{/* Left side - Date & Meta (25% width on desktop) */}
								<div className="md:col-span-1 flex-shrink-0">
									<div className="md:sticky md:top-24 pb-4 md:pb-10">
										<time className="text-sm font-medium text-[#71717a] block mb-3 pl-6 md:pl-0">
											{formattedDate}
										</time>

										{(diary.mood || diary.weather) && (
											<div className="inline-flex relative z-10 items-center justify-center h-10 px-3 text-[#3f3f46] border border-[#e4e4e7] rounded-lg text-lg bg-white dark:bg-[#27272a]/50 backdrop-blur-sm shadow-sm gap-2 ml-6 md:ml-0">
												{diary.weather && <span>{WEATHER_EMOJIS[diary.weather] || diary.weather}</span>}
												{diary.mood && <span>{MOOD_EMOJIS[diary.mood] || diary.mood}</span>}
											</div>
										)}
									</div>
								</div>

								{/* Right side - Content (75% width on desktop) */}
								<div className="md:col-span-3 relative pb-16 border-l-2 border-[#e4e4e7]" style={{ paddingLeft: '2.5rem' }}>
									{/* Timeline dot */}
									<div 
										className="absolute top-1.5 size-3 bg-[#27272a] rounded-full z-10" 
										style={{ left: '-7px' }}
									/>

									<div className="space-y-6">
										<div className="relative z-10 flex flex-col gap-3">
											{/* Tags and Location */}
											{(diary.tags?.length || diary.location) && (
												<div className="flex flex-wrap items-center gap-2 text-xs text-[#71717a]">
													{diary.location && (
														<div className="flex items-center gap-1.5 bg-[#f4f4f5] px-2.5 py-1 rounded-full">
															<MapPin className="w-3 h-3" />
															<span>{diary.location}</span>
														</div>
													)}
													{diary.tags && diary.tags.length > 0 && (
														<div className="flex flex-wrap gap-2">
															{diary.tags.map((tag) => (
																<span
																	key={tag}
																	className="flex items-center gap-1.5 bg-[#f4f4f5] px-2.5 py-1 rounded-full"
																>
																	<Tag className="w-3 h-3" />
																	{tag}
																</span>
															))}
														</div>
													)}
												</div>
											)}
										</div>

										{/* Content */}
										<div className="prose prose-neutral max-w-none text-[#3f3f46] leading-relaxed whitespace-pre-wrap break-words">
											{diary.content}
										</div>

										{/* Media / Images (Restricted max size, preserved aspect ratio) */}
										{coverImage && (
											<div className="mt-6 rounded-xl overflow-hidden border border-[#f4f4f5] shadow-sm" style={{ maxWidth: '280px' }}>
												{coverImage.endsWith('.mp4') || coverImage.endsWith('.webm') ? (
													<video src={`${coverImage}#t=0.001`} className="w-full h-auto" controls playsInline preload="metadata" />
												) : (
													<img src={coverImage} alt="Diary media" className="w-full h-auto" loading="lazy" decoding="async" />
												)}
											</div>
										)}

										{/* Additional media if present */}
										{diary.media && diary.media.length > 1 && (
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3" style={{ maxWidth: '400px' }}>
												{diary.media.slice(1).map((src, i) => (
													<div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#f4f4f5] shadow-sm">
														{src.endsWith('.mp4') || src.endsWith('.webm') ? (
															<video src={`${src}#t=0.001`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
														) : (
															<img src={src} alt={`Diary media ${i+2}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
														)}
													</div>
												))}
											</div>
										)}

										{/* Edit Mode Buttons */}
										{isEditMode && (
											<div className="flex gap-2 pt-4">
												<button 
													onClick={() => setEditingDiary(diary)} 
													className="rounded-full bg-white dark:bg-[#27272a] border border-[#e4e4e7] shadow-sm px-4 py-1.5 text-xs font-medium text-[#52525b] transition-colors hover:bg-[#fafafa] hover:text-[#18181b]"
												>
													编辑
												</button>
												<button 
													onClick={() => onDelete?.(diary)} 
													className="rounded-full bg-red-50 border border-red-100 shadow-sm px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
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
		</div>
	)
}
