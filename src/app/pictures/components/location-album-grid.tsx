'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Calendar, Camera, X, Sparkles, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import initialFootprints from '@/data/footprints.json'
import Masonry, { type MasonryItem } from '@/components/masonry/Masonry'

interface LocationAlbumGridProps {
	isEditMode?: boolean
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'

export function LocationAlbumGrid({ isEditMode }: LocationAlbumGridProps) {
	const [activeLocation, setActiveLocation] = useState<any | null>(null)
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
	const [lightboxIndex, setLightboxIndex] = useState<number>(0)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])


	const masonryItems = useMemo<MasonryItem[]>(() => {
		if (!activeLocation) return []
		const heights = [360, 480, 400, 520, 320, 440]
		return activeLocation.photos.map((photo: string, idx: number) => ({
			id: `${activeLocation.id}-${idx}`,
			img: photo,
			height: heights[idx % heights.length]
		}))
	}, [activeLocation])

	// Group footprints into albums that have photos
	const albums = useMemo(() => {
		return initialFootprints
			.filter((fp: any) => fp.coverImage || (fp.images && fp.images.length > 0))
			.map((fp: any) => {
				const photos = fp.images && fp.images.length > 0 ? fp.images : [fp.coverImage]
				return {
					id: fp.id,
					city: fp.city,
					country: fp.country || '中国',
					date: fp.date || '2025',
					type: fp.type,
					notes: fp.notes,
					coverImage: fp.coverImage || photos[0] || FALLBACK_IMAGE,
					photos: photos,
					photoCount: photos.length
				}
			})
	}, [])

	const filteredAlbums = useMemo(() => {
		if (selectedCategory === 'all') return albums
		return albums.filter(a => a.type === selectedCategory)
	}, [albums, selectedCategory])

	const openLightbox = (album: any) => {
		setActiveLocation(album)
		setLightboxPhoto(null)
	}

	return (
		<div className="mx-auto max-w-7xl px-6 py-12 pt-6">
			{/* Lightbox Modal: Masonry Photo Wall Drawer */}
			{mounted && createPortal(
				<AnimatePresence>
					{activeLocation && (
						<motion.div 
							initial={{ opacity: 0, y: '10%' }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: '10%' }}
							className="fixed inset-0 z-[9999] bg-zinc-950/98 backdrop-blur-xl flex items-center justify-center"
						>
							<div className="w-full h-full flex flex-col p-6 md:p-12 max-w-7xl mx-auto overflow-hidden">
								
								{/* Panel Header */}
								<div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-zinc-800/80 pb-6 shrink-0">
									<div className="flex flex-col md:flex-row items-start gap-4">
										<button 
											onClick={() => setActiveLocation(null)}
											className="px-4 py-2 text-xs font-bold rounded-full border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-x-0.5 transition-all flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer"
										>
											<ChevronLeft className="w-4 h-4" /> 返回相册列表
										</button>
										<div className="text-white text-left">
											<h2 className="text-2xl md:text-4xl font-serif font-bold tracking-tight flex items-center gap-2">
												<MapPin className="w-5 h-5 text-orange-400" />
												<span>{activeLocation.city}</span>
												<span className="text-xs text-zinc-400 font-normal">({activeLocation.country})</span>
											</h2>
											{activeLocation.notes && (
												<p className="text-xs md:text-sm text-zinc-300 font-serif italic mt-3 max-w-3xl leading-relaxed border-l-2 border-orange-500/40 pl-3">
													"{activeLocation.notes}"
												</p>
											)}
										</div>
									</div>
									
									<div className="flex items-center gap-3 self-end md:self-start shrink-0 text-xs text-zinc-400 font-mono">
										<span className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
											{activeLocation.photoCount} 张照片
										</span>
										<span className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-1">
											<Calendar className="w-3.5 h-3.5 text-orange-500" /> {activeLocation.date}
										</span>
									</div>
								</div>

								{/* Masonry Image Grid */}
								<div className="w-full flex-1 overflow-y-auto mt-6 relative min-h-[60vh]">
									<Masonry 
										items={masonryItems} 
										onItemClick={(item) => {
											if (item.img) setLightboxPhoto(item.img)
											const pIndex = item.img ? activeLocation.photos.indexOf(item.img) : -1
											setLightboxIndex(pIndex !== -1 ? pIndex : 0)
										}} 
									/>
								</div>

							</div>

						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}

			{/* Full-Screen Zoom Lightbox Overlay */}
			{mounted && createPortal(
				<AnimatePresence>
					{lightboxPhoto && activeLocation && (
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setLightboxPhoto(null)}
							className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4"
						>
							<button 
								onClick={() => setLightboxPhoto(null)}
								className="absolute top-6 right-6 p-3 rounded-full bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors z-[10001] cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
							<div className="relative max-w-5xl w-full h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
								<img 
									src={lightboxPhoto} 
									alt={activeLocation.city} 
									className="max-w-full max-h-full object-contain select-none rounded-2xl shadow-2xl border border-zinc-800/40" 
									onError={(e) => {
										(e.target as HTMLImageElement).src = FALLBACK_IMAGE
									}}
								/>
								
								{activeLocation.photos.length > 1 && (
									<>
										<button 
											onClick={() => {
												const newIdx = lightboxIndex === 0 ? activeLocation.photos.length - 1 : lightboxIndex - 1
												setLightboxIndex(newIdx)
												setLightboxPhoto(activeLocation.photos[newIdx])
											}}
											className="absolute left-4 top-1/2 -translate-y-1/2 bg-zinc-900/80 hover:bg-zinc-900 text-white p-3 rounded-full border border-zinc-850 backdrop-blur-md transition-all shadow-lg cursor-pointer"
										>
											<ChevronLeft className="w-6 h-6" />
										</button>
										<button 
											onClick={() => {
												const newIdx = lightboxIndex === activeLocation.photos.length - 1 ? 0 : lightboxIndex + 1
												setLightboxIndex(newIdx)
												setLightboxPhoto(activeLocation.photos[newIdx])
											}}
											className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900/80 hover:bg-zinc-900 text-white p-3 rounded-full border border-zinc-850 backdrop-blur-md transition-all shadow-lg cursor-pointer"
										>
											<ChevronRight className="w-6 h-6" />
										</button>
									</>
								)}
							</div>
							
							<div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-zinc-900 text-zinc-400 text-xs font-mono border border-zinc-800">
								照片 {lightboxIndex + 1} / {activeLocation.photos.length}
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}

			{/* Page Header */}
			<div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-zinc-800 pb-8">
				<div>
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium mb-3">
						<Camera className="w-3.5 h-3.5" /> 足迹点位纪实相册 Location Albums
					</div>
					<h1 className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-primary)] tracking-tight">
						探索足迹与全量城市相册
					</h1>
					<p className="text-sm text-[var(--color-secondary)] mt-2 max-w-2xl">
						每个足迹点位均拥有专属影像记录库。点击地点大图即可展开该地点的全量高清相册与回忆。
					</p>
				</div>

				{/* Filter Tabs */}
				<div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-700/60 shrink-0">
					{[
						{ id: 'all', label: '全部点位' },
						{ id: 'travel', label: '✈️ 旅行' },
						{ id: 'live', label: '🏠 居住' },
						{ id: 'study', label: '📖 学习' }
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setSelectedCategory(tab.id)}
							className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
								selectedCategory === tab.id
									? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm font-bold'
									: 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Location Albums Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{filteredAlbums.map((album) => (
					<motion.div
						key={album.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						onClick={() => openLightbox(album)}
						className="group relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
						style={{ height: '390px', minHeight: '390px', maxHeight: '390px', flexShrink: 0, flexGrow: 0 }}
					>
						{/* Cover Photo Container (Strict 220px Height) */}
						<div className="relative overflow-hidden bg-zinc-900 w-full shrink-0" style={{ height: '220px', minHeight: '220px', maxHeight: '220px' }}>
							<img 
								src={album.coverImage} 
								alt={album.city} 
								className="group-hover:scale-105 transition-transform duration-700" 
								style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
								onError={(e) => {
									(e.target as HTMLImageElement).src = FALLBACK_IMAGE
								}}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
							
							{/* Photo Count Badge */}
							<div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/20 flex items-center gap-1.5">
								<Layers className="w-3.5 h-3.5 text-orange-400" />
								<span>{album.photoCount} 张照片</span>
							</div>

							<div className="absolute bottom-4 left-4 right-4 text-white">
								<div className="text-lg font-bold truncate flex items-center gap-2">
									<MapPin className="w-4 h-4 text-orange-400 shrink-0" /> {album.city}
								</div>
								<div className="text-xs text-zinc-300 mt-0.5">{album.country}</div>
							</div>
						</div>

						{/* Card Details Footer (Strict 170px Height) */}
						<div className="p-5 flex flex-col justify-between bg-white dark:bg-zinc-900 w-full shrink-0" style={{ height: '170px', minHeight: '170px', maxHeight: '170px' }}>
							<p className="text-xs text-[var(--color-secondary)] line-clamp-2 font-serif italic mb-2">
								{album.notes || '暂无点位手记描述...'}
							</p>

							<div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-[var(--color-secondary)] font-mono">
								<span className="flex items-center gap-1">
									<Calendar className="w-3.5 h-3.5 text-orange-500" /> {album.date}
								</span>
								<span className="text-orange-500 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
									进入相册 →
								</span>
							</div>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	)
}
