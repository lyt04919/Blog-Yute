'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import initialFootprints from '@/data/footprints.json'

interface Footprint {
	id: string
	city: string
	country: string
	coordinates: [number, number]
	date: string
	days: number
	type: 'travel' | 'live' | 'work' | 'study'
	notes: string
	images: string[]
	coverImage?: string
	showOnHome?: boolean
	isCurrent?: boolean
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'

export function PicturesTimeline() {
	// Parse and sort footprints chronologically descending (newest first)
	const timelineEvents = useMemo(() => {
		return (initialFootprints as Footprint[])
			.filter(fp => fp.coverImage || (fp.images && fp.images.length > 0))
			.map(fp => {
				const photos = fp.images && fp.images.length > 0 ? fp.images : [fp.coverImage || FALLBACK_IMAGE]
				return {
					...fp,
					photos
				}
			})
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	}, [])

	// Carousel index per footprint card (keyed by footprint ID)
	const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({})
	
	// Full screen lightbox states
	const [lightboxImage, setLightboxImage] = useState<string | null>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const getCarouselIndex = (id: string) => carouselIndices[id] ?? 0

	const handlePrevPhoto = (e: React.MouseEvent, id: string, photoCount: number) => {
		e.stopPropagation()
		setCarouselIndices(prev => {
			const current = prev[id] ?? 0
			const nextIdx = current === 0 ? photoCount - 1 : current - 1
			return { ...prev, [id]: nextIdx }
		})
	}

	const handleNextPhoto = (e: React.MouseEvent, id: string, photoCount: number) => {
		e.stopPropagation()
		setCarouselIndices(prev => {
			const current = prev[id] ?? 0
			const nextIdx = current === photoCount - 1 ? 0 : current + 1
			return { ...prev, [id]: nextIdx }
		})
	}

	return (
		<div className="mx-auto max-w-5xl px-6 py-12 pt-6 relative">
			{/* Lightbox Overlay */}
			{mounted && createPortal(
				<AnimatePresence>
					{lightboxImage && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setLightboxImage(null)}
							className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
						>
							<button 
								onClick={() => setLightboxImage(null)}
								className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
							<div className="relative max-w-4xl w-full h-[80vh] flex items-center justify-center">
								<img
									src={lightboxImage}
									alt="Full Preview"
									className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
								/>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}

			{/* Timeline Heading */}
			<div className="text-center mb-16">
				<h2 className="text-3xl md:text-4xl font-serif text-[var(--color-primary)] tracking-tight mb-3">
					时间足迹纪实 (Timeline Chronicles)
				</h2>
				<p className="text-xs md:text-sm text-[var(--color-secondary)] max-w-md mx-auto">
					按时间顺序探索我的每一场空间跃迁、游历生活与瞬间纪实。
				</p>
			</div>

			{/* Timeline Stream */}
			<div className="relative w-full">
				{/* Central Line (Desktop Only) */}
				<div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[2px] bg-gradient-to-b from-orange-500/80 via-blue-500/40 to-zinc-200 dark:to-zinc-800 hidden md:block" />

				{timelineEvents.length === 0 ? (
					<div className="text-center text-xs text-[var(--color-secondary)] py-16 border border-dashed border-[var(--color-border)] rounded-3xl">
						暂无带相册照片的足迹记录。
					</div>
				) : (
					<div className="flex flex-col gap-12 md:gap-16 relative">
						{timelineEvents.map((item, idx) => {
							const isLeft = idx % 2 === 0
							const photoCount = item.photos.length
							const currentIdx = getCarouselIndex(item.id)
							const activePhoto = item.photos[currentIdx]

							// Color schemes
							let typeTagClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
							let typeDotClass = "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
							if (item.type === 'live') {
								typeTagClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
								typeDotClass = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
							} else if (item.type === 'work') {
								typeTagClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
								typeDotClass = "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
							} else if (item.type === 'study') {
								typeTagClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
								typeDotClass = "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
							}

							return (
								<div 
									key={item.id} 
									className="flex flex-col md:flex-row relative items-start md:items-center justify-between w-full"
								>
									{/* central node dot indicator */}
									<div className={`absolute left-0 md:left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-zinc-950 z-20 hidden md:block ${typeDotClass}`} />

									{/* Left spacing/content container */}
									<div className={`w-full md:w-[45%] flex ${isLeft ? 'md:justify-end' : 'md:justify-start md:order-last'}`}>
										<motion.div
											initial={{ opacity: 0, y: 30 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true, margin: "-50px" }}
											transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
											whileHover={{ scale: 1.015, rotate: isLeft ? -0.5 : 0.5 }}
											onClick={() => setLightboxImage(activePhoto)}
											className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 pb-6 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col gap-4 select-none"
										>
											{/* Polaroid Photo Frame */}
											<div className="relative w-full aspect-[4/3] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-850 group">
												<img
													src={activePhoto}
													alt={item.city}
													className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
													onError={(e) => {
														(e.target as HTMLImageElement).src = FALLBACK_IMAGE
													}}
												/>
												{/* Cinema glass overlay */}
												<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 mix-blend-overlay pointer-events-none" />

												{/* Photo Counter Overlay */}
												{photoCount > 1 && (
													<div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-white border border-white/10">
														{currentIdx + 1} / {photoCount}
													</div>
												)}

												{/* Carousel Controls */}
												{photoCount > 1 && (
													<>
														<button
															onClick={(e) => handlePrevPhoto(e, item.id, photoCount)}
															className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 cursor-pointer z-10"
														>
															<ChevronLeft className="w-3.5 h-3.5" />
														</button>
														<button
															onClick={(e) => handleNextPhoto(e, item.id, photoCount)}
															className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 cursor-pointer z-10"
														>
															<ChevronRight className="w-3.5 h-3.5" />
														</button>
													</>
												)}
											</div>

											{/* Captions */}
											<div className="flex flex-col gap-3 px-1">
												<div className="flex items-center justify-between font-serif flex-wrap gap-2">
													<div className="flex items-center gap-1.5 font-bold text-base text-zinc-900 dark:text-zinc-100">
														<MapPin className="w-4 h-4 text-orange-500 shrink-0" />
														<span>{item.city}</span>
														{item.country && <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs">({item.country})</span>}
													</div>
													<div className="flex items-center gap-2">
														<span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${typeTagClass}`}>
															{item.type === 'travel' ? '✈️ 旅行' : item.type === 'live' ? '🏠 居住' : item.type === 'work' ? '💼 工作' : '📖 学习'}
														</span>
													</div>
												</div>

												{/* Duration and Date info bar */}
												<div className="flex items-center gap-4 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold border-b border-zinc-100 dark:border-zinc-800 pb-2">
													<div className="flex items-center gap-1">
														<Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
														<span>{item.date}</span>
													</div>
													<div className="flex items-center gap-1">
														<Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
														<span>{item.days} 天</span>
													</div>
												</div>

												{/* Travel logs description */}
												{item.notes ? (
													<p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-serif italic whitespace-pre-line bg-zinc-50/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-100/50 dark:border-zinc-800/40 mt-1 font-medium">
														"{item.notes}"
													</p>
												) : (
													<p className="text-[11px] text-zinc-300 dark:text-zinc-600 leading-relaxed font-serif italic mt-1 pl-1">
														这次旅途还没有写下感悟手记。
													</p>
												)}
											</div>
										</motion.div>
									</div>

									{/* Right side empty placeholder or desktop layout balance */}
									<div className={`w-full md:w-[45%] hidden md:flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}>
										<div className="px-6 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 max-w-xs shadow-inner">
											<span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">Chronicle Event #{idx + 1}</span>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
