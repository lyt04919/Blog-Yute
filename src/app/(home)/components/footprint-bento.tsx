'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import ScrollFloat from '@/components/scroll-float/ScrollFloat'
import { ArrowRight, MapPin, Settings, Compass, Sparkles, Globe, Plane, Navigation, CheckCircle2, Camera, X, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { useAuthStore } from '@/hooks/use-auth'
import initialFootprints from '@/data/footprints.json'
import StarBadge from '@/components/ui/star-badge'
import SpaceMapSettingsDialog from './space-map-settings-dialog'
import { useConfigStore } from '@/app/(home)/stores/config-store'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'

// Dynamically load BentoMap to prevent SSR leaflet errors
const BentoMap = dynamic(
	() => import('./bento-map'),
	{
		ssr: false,
		loading: () => (
			<div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-400 text-xs">
				<div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mr-2" />
				加载地图中...
			</div>
		)
	}
)

export default function FootprintBento() {
	const { siteContent } = useConfigStore()
	const { isAuth } = useAuthStore()
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [activePhoto, setActivePhoto] = useState<any | null>(null)
	const [activePhotoIndex, setActivePhotoIndex] = useState(0)
	const [mounted, setMounted] = useState(false)
	const scrollContainerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setMounted(true)
	}, [])

	const currentCity = initialFootprints.find((fp: any) => fp.isCurrent) || { city: 'Suzhou', country: 'China' }
	const currentCityText = `${currentCity.city}${currentCity.country ? `, ${currentCity.country}` : ''}`
	
	// Calculate stats dynamically including total days
	const stats = useMemo(() => {
		const totalCities = initialFootprints.length || 7
		const countriesSet = new Set<string>()
		let totalDays = 0
		initialFootprints.forEach((fp: any) => {
			if (fp.country) countriesSet.add(fp.country)
			totalDays += (fp.days || 1)
		})
		const totalCountries = countriesSet.size || 2
		return {
			totalCities,
			totalCountries,
			totalContinents: 2,
			totalDays: totalDays || 380
		}
	}, [])

	// Dynamic City Cover Photos linked directly from Footprint Location Albums
	const locationPhotos = useMemo(() => {
		return initialFootprints
			.filter((fp: any) => fp.showOnHome !== false && (fp.coverImage || (Array.isArray(fp.images) && fp.images.length > 0)))
			.map((fp: any) => {
				const photos = Array.isArray(fp.images) && fp.images.length > 0 
					? fp.images 
					: (fp.coverImage ? [fp.coverImage] : [FALLBACK_IMAGE])
				return {
					city: `${fp.city}${fp.country ? ` · ${fp.country}` : ''}`,
					rawCity: fp.city,
					year: fp.date ? fp.date.split('-')[0] : '2025',
					img: fp.coverImage || photos[0] || FALLBACK_IMAGE,
					notes: fp.notes,
					allImages: photos
				}
			})
	}, [])

	const handleOpenLightbox = (photo: any) => {
		if (!photo) return
		setActivePhoto(photo)
		setActivePhotoIndex(0)
	}

	const handlePrevPhoto = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!activePhoto || !Array.isArray(activePhoto.allImages) || activePhoto.allImages.length === 0) return
		setActivePhotoIndex(prev => (prev === 0 ? activePhoto.allImages.length - 1 : prev - 1))
	}

	const handleNextPhoto = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!activePhoto || !Array.isArray(activePhoto.allImages) || activePhoto.allImages.length === 0) return
		setActivePhotoIndex(prev => (prev === activePhoto.allImages.length - 1 ? 0 : prev + 1))
	}

	const scroll = (direction: 'left' | 'right') => {
		if (scrollContainerRef.current) {
			const { scrollLeft, clientWidth } = scrollContainerRef.current
			const scrollAmount = clientWidth * 0.75
			scrollContainerRef.current.scrollTo({
				left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
				behavior: 'smooth'
			})
		}
	}

	if (!mounted) return null

	return (
		<section className="mx-auto w-full max-w-5xl px-4 md:px-6 py-6 md:py-10 relative z-20">
			{/* Lightbox Portal for Photo Previews */}
			<AnimatePresence>
				{activePhoto && createPortal(
					<motion.div 
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setActivePhoto(null)}
						className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none"
					>
						{/* Close button */}
						<button 
							onClick={() => setActivePhoto(null)}
							className="absolute top-4 right-4 z-50 p-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full border border-white/10"
						>
							<X className="w-5 h-5" />
						</button>

						{/* Lightbox Slider */}
						<div className="relative w-full max-w-4xl max-h-[85vh] flex items-center justify-center">
							{/* Prev photo */}
							{activePhoto.allImages.length > 1 && (
								<button 
									onClick={handlePrevPhoto}
									className="absolute left-2 md:left-4 z-50 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full border border-white/10"
								>
									<ChevronLeft className="w-6 h-6" />
								</button>
							)}

							<div className="relative flex flex-col items-center">
								{/* Cover Image inside Lightbox */}
								<img 
									src={activePhoto.allImages[activePhotoIndex]} 
									alt="gallery preview" 
									className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/5" 
									onClick={(e) => e.stopPropagation()}
									onError={(e) => {
										(e.target as HTMLImageElement).src = FALLBACK_IMAGE
									}}
								/>
								
								{/* Info Overlay */}
								<div 
									onClick={(e) => e.stopPropagation()}
									className="mt-4 px-6 py-3 bg-zinc-900/90 rounded-2xl border border-white/10 text-white text-center max-w-md"
								>
									<div className="flex items-center justify-center gap-1.5 font-bold text-sm">
										<MapPin className="w-4 h-4 text-orange-400" />
										<span>{activePhoto.city}</span>
										<span className="text-zinc-500 font-normal">({activePhoto.year})</span>
									</div>
									{activePhoto.notes && (
										<p className="text-xs text-zinc-400 mt-1 leading-relaxed">{activePhoto.notes}</p>
									)}
									{activePhoto.allImages.length > 1 && (
										<span className="text-[10px] font-mono text-orange-400 mt-2 block font-bold">
											{activePhotoIndex + 1} / {activePhoto.allImages.length}
										</span>
									)}
								</div>
							</div>

							{/* Next photo */}
							{activePhoto.allImages.length > 1 && (
								<button 
									onClick={handleNextPhoto}
									className="absolute right-2 md:right-4 z-50 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full border border-white/10"
								>
									<ChevronRight className="w-6 h-6" />
								</button>
							)}
						</div>
					</motion.div>,
					document.body
				)}
			</AnimatePresence>

			{/* Footprint Settings Dialog */}
			{isAuth && (
				<SpaceMapSettingsDialog 
					open={isSettingsOpen} 
					onClose={() => setIsSettingsOpen(false)} 
				/>
			)}

			<div className="mb-8 flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto">
				<div className="flex justify-center mb-3">
					<StarBadge text="★ FOOTPRINTS" />
				</div>
				<h2 className="text-3xl md:text-4xl font-serif text-[var(--color-primary)] tracking-tight mb-2">
					Digital Footprints Hub
				</h2>
				<p className="text-xs md:text-sm text-[var(--color-secondary)] max-w-md mx-auto">
					数字化足迹纪实。记录我的旅居据点、游历城市与空间轨迹。
				</p>
			</div>

			{/* Bento Style Container Dashboard Grid */}
			<div className="relative rounded-[40px] border border-[var(--color-border)] p-6 md:p-8 bg-[var(--color-card)]/50 backdrop-blur-md shadow-sm hover:shadow-xl hover:border-[var(--color-brand)]/20 transition-all duration-500 overflow-hidden mb-6">
				<div className="flex flex-col gap-8 md:gap-10 relative z-10">
					
					{/* Top: Nomad Footprints Summary (Horizontal layout) */}
					<motion.div 
						initial={{ opacity: 0, y: -20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-50px" }}
						transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
						className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
					>
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-3">
								<Globe className="w-5 h-5 text-orange-500" />
								<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Travel Log Stats</span>
							</div>
							
							<div className="mt-4 flex flex-row gap-8 text-xs text-[var(--color-primary)] font-semibold">
								<div className="flex flex-col">
									<span className="text-2xl font-extrabold font-mono tracking-tight text-orange-500">{stats.totalCountries}</span>
									<span className="text-[10px] text-[var(--color-secondary)] mt-1">探索国家与地区 Visited</span>
								</div>
								<div className="flex flex-col">
									<span className="text-2xl font-extrabold font-mono tracking-tight text-blue-500">{stats.totalCities}</span>
									<span className="text-[10px] text-[var(--color-secondary)] mt-1">打卡游历城市 Explored</span>
								</div>
							</div>
						</div>

						<div className="flex-1 flex flex-col justify-center gap-3.5 pt-6 lg:pt-0 lg:border-t-0 border-t border-zinc-150 dark:border-zinc-800/80 lg:border-l lg:border-zinc-200 lg:dark:border-zinc-800 lg:pl-8">
							<div className="flex items-center gap-2.5 text-xs">
								<div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shrink-0">
									<MapPin className="w-3 h-3" />
								</div>
								<span className="text-[11px] font-medium">当前常驻地: <strong className="font-bold text-[var(--color-primary)]">{currentCityText}</strong></span>
							</div>
							<div className="flex items-center gap-2.5 text-xs">
								<div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
									<Plane className="w-3 h-3" />
								</div>
								<span className="text-[11px] font-medium text-[var(--color-secondary)]">旅居累积天数: <strong className="font-bold text-[var(--color-primary)]">{stats.totalDays} 天</strong></span>
							</div>
							<div className="flex items-center gap-2.5 text-xs">
								<div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
									<Globe className="w-3 h-3" />
								</div>
								<span className="text-[11px] font-medium text-[var(--color-secondary)]">当前探索板块: <strong className="font-bold text-[var(--color-primary)]">{stats.totalContinents} 大洲 (亚洲 / 大洋洲)</strong></span>
							</div>
						</div>
					</motion.div>

					{/* Bottom: Leaflet Interactive Map Widget */}
					<motion.div 
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-50px" }}
						transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
						className="flex flex-col relative w-full"
					>
						<div className="mb-3 flex items-end justify-between">
							<div>
								<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Map</span>
								<h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-1 uppercase">Global Footprints Map</h4>
							</div>
							
							{/* Settings button */}
							{isAuth && (
								<button 
									onClick={() => setIsSettingsOpen(true)}
									className="p-2 mb-1 bg-white/85 dark:bg-zinc-800/85 rounded-full shadow-sm hover:bg-zinc-100 text-zinc-500 border border-zinc-200/80 cursor-pointer transition-all"
									title="地图设置"
								>
									<Settings className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						<Link 
							href="/space"
							className="group/maplink w-full rounded-2xl overflow-hidden relative border border-zinc-100 dark:border-zinc-800 shadow-inner block cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-xl"
							style={{ height: '480px', minHeight: '480px' }}
						>
							<div className="absolute inset-0 z-20 bg-black/0 group-hover/maplink:bg-black/5 dark:group-hover/maplink:bg-white/5 transition-colors flex items-center justify-center">
								<div className="px-5 py-2.5 bg-zinc-900/80 backdrop-blur-md rounded-full text-white text-xs font-bold opacity-0 group-hover/maplink:opacity-100 transition-all transform translate-y-2 group-hover/maplink:translate-y-0 shadow-lg border border-white/10 flex items-center gap-2">
									<span>🌍</span> 点击探索全量 3D 轨迹与旅行故事
								</div>
							</div>
							<div 
								id="home-bento-map-container"
								className="w-full h-full pointer-events-none"
							>
								<BentoMap />
							</div>
						</Link>
					</motion.div>
				</div>
				
				<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none rounded-[40px]" />
			</div>

			{/* Footprint Location Albums Photo Wall with Horizontal ScrollBar */}
			<motion.div 
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-50px" }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
				className="card border border-[var(--color-border)] bg-[var(--color-card)]/50 backdrop-blur-sm rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:border-[var(--color-brand)]/20 transition-all duration-500 relative group"
			>
				<div className="flex items-center justify-between mb-5 flex-wrap gap-2">
					<div className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
						<Camera className="w-4 h-4 text-orange-500" />
						<span>足迹纪实摄影展廊 (左右滑动，点击预览)</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1">
							<button 
								onClick={() => scroll('left')}
								className="p-1.5 rounded-full border border-[var(--color-border)] hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-colors"
								title="向左滑动"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<button 
								onClick={() => scroll('right')}
								className="p-1.5 rounded-full border border-[var(--color-border)] hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-colors"
								title="向右滑动"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
						<Link href="/pictures" className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
							进入全量相册展厅 <ArrowRight className="w-3.5 h-3.5" />
						</Link>
					</div>
				</div>

				{/* Horizontal ScrollBar Container (Asymmetric Photo Reel) */}
				<div 
					ref={scrollContainerRef}
					className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none items-center"
				>
					{locationPhotos.map((photo, i) => {
						const cardWidth = i % 3 === 0 ? '380px' : i % 3 === 1 ? '270px' : '320px'
						return (
							<div 
								key={i}
								onClick={() => handleOpenLightbox(photo)}
								className="group/card relative rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl border border-[var(--color-border)] hover:border-orange-500/40 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer snap-start bg-[var(--color-card)]/50 flex flex-col justify-between"
								style={{ 
									width: cardWidth, 
									minWidth: cardWidth, 
									maxWidth: cardWidth, 
									height: '290px', 
									minHeight: '290px', 
									maxHeight: '290px', 
									flexShrink: 0, 
									flexGrow: 0 
								}}
							>
								{/* Strict Photo Box */}
								<div className="relative overflow-hidden bg-zinc-950 w-full shrink-0 flex-1">
									<img 
										src={photo.img} 
										alt={photo.city} 
										className="group-hover/card:scale-105 transition-transform duration-700 w-full h-full object-cover"
										onError={(e) => {
											(e.target as HTMLImageElement).src = FALLBACK_IMAGE
										}}
									/>
									{/* Top Right Discreet Badge */}
									<div className="absolute top-3 right-3 z-10">
										<span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5 shadow-sm">
											<Layers className="w-3.5 h-3.5 text-orange-400" /> {photo.allImages.length}
										</span>
									</div>
								</div>

								{/* Strict Clean Location Info Bar Below Photo */}
								<div className="px-5 flex items-center justify-between gap-2 bg-transparent text-[var(--color-primary)] w-full shrink-0 h-16">
									<div className="flex items-center gap-1.5 font-bold text-sm min-w-0">
										<MapPin className="w-4 h-4 text-orange-500 shrink-0" /> 
										<span className="truncate">{photo.city}</span>
									</div>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-secondary)] shrink-0">
										<span>{photo.year}</span>
										<span>·</span>
										<span className="text-orange-500 group-hover/card:underline font-bold text-[11px]">
											相册 →
										</span>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</motion.div>
		</section>
	)
}

function CircleDotIcon(props: any) {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10"/>
			<circle cx="12" cy="12" r="1"/>
		</svg>
	)
}
