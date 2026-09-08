'use client'

import { motion } from 'motion/react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
const LogoUploadDialog = dynamic(() => import('./logo-upload-dialog'), { ssr: false })
const MovieEditModal = dynamic(() => import('./movie-edit-modal'), { ssr: false })
import type { LogoItem } from './logo-upload-dialog'
import MovieDetailModal from './movie-detail-modal'
import { Pin, Edit3, Trash2, CheckCircle2, Bookmark, Film, RotateCw } from 'lucide-react'
import { GlitchText } from '@/components/magicui/glitch-text'

export interface WatchLog {
	id: string
	watchDate: string
	watchMethod?: 'cinema' | 'home' | 'online' | string
	notes?: string
	stars?: number
	cinemaPhotos?: string[]
	movieTickets?: string[]
}

export interface Movie {
	name: string
	englishName?: string
	poster: string
	director: string
	description: string
	tags: string[]
	stars: number
	isPinned?: boolean
	isShow?: boolean
	isShowOnHome?: boolean
	doubanUrl?: string
	status?: 'watched' | 'wishlist'
	expectation?: number
	wishlistReason?: string
	priority?: 'high' | 'medium' | 'low'
	recommendation?: string
	watchDate?: string
	releaseDate?: string
	rating?: number
	myReview?: string
	quote?: string
	doubanRating?: number
	imdbRating?: number
	imdbUrl?: string
	releaseYear?: string
	runtime?: number
	watchMethod?: 'cinema' | 'home' | 'online' | string
	cinemaPhotos?: string[]
	movieTickets?: string[]
	topRank?: number
	watchCount?: number
	isRewatching?: boolean
	watchLogs?: WatchLog[]
}

export function getNormalizedWatchLogs(movie: Movie): WatchLog[] {
	if (movie.watchLogs && movie.watchLogs.length > 0) {
		return movie.watchLogs
	}

	if (movie.status === 'watched' || movie.watchDate || (movie.stars && movie.stars > 0)) {
		return [
			{
				id: 'log-initial',
				watchDate: movie.watchDate || '',
				watchMethod: movie.watchMethod || 'home',
				stars: movie.stars,
				notes: movie.myReview || '',
				cinemaPhotos: movie.cinemaPhotos,
				movieTickets: movie.movieTickets
			}
		]
	}

	return []
}

export function getChineseWatchOrdinal(count: number): string {
	const ordinals = ['', '一刷', '二刷', '三刷', '四刷', '五刷', '六刷', '七刷', '八刷', '九刷', '十刷']
	if (count >= 1 && count < ordinals.length) {
		return ordinals[count]
	}
	return `${count}刷`
}

export function getWatchCount(movie: Movie): number {
	const logs = getNormalizedWatchLogs(movie)
	if (logs.length > 0) {
		return logs.length
	}
	return movie.watchCount || ((movie.status === 'watched' || movie.watchDate) ? 1 : 0)
}

export function getLatestWatchTimestamp(movie: Movie): number {
	const logs = getNormalizedWatchLogs(movie)
	if (logs.length > 0) {
		const sorted = [...logs].sort((a, b) => new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime())
		if (sorted[0] && sorted[0].watchDate) {
			const ts = new Date(sorted[0].watchDate).getTime()
			if (!isNaN(ts)) return ts
		}
	}
	return movie.watchDate ? new Date(movie.watchDate).getTime() : 0
}

export function getPosterUrl(url?: string): string {
	if (!url) return ''
	let cleanUrl = url.trim()
	if (cleanUrl.includes('/api/image-proxy?url=')) {
		try {
			cleanUrl = decodeURIComponent(cleanUrl.split('/api/image-proxy?url=')[1])
		} catch (e) {
			cleanUrl = url
		}
	}
	if (cleanUrl.includes('doubanio.com') || cleanUrl.includes('douban.com') || cleanUrl.includes('tmdb.org')) {
		return `/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`
	}
	return cleanUrl
}

export function getMovieRating(stars?: number): number {
	if (stars === undefined || stars === null || isNaN(Number(stars))) return 0
	const num = Number(stars)
	if (num > 0 && num <= 5 && Number.isInteger(num)) {
		return num * 2
	}
	return num
}

export function formatMovieRating(stars?: number): string {
	return getMovieRating(stars).toFixed(1)
}

export function getLatestMovieStars(movie: Movie): number {
	if (movie.watchLogs && movie.watchLogs.length > 0) {
		const sorted = [...movie.watchLogs].sort((a, b) => new Date(a.watchDate).getTime() - new Date(b.watchDate).getTime())
		for (let i = sorted.length - 1; i >= 0; i--) {
			if (sorted[i].stars !== undefined && sorted[i].stars !== null && !isNaN(Number(sorted[i].stars))) {
				return Number(sorted[i].stars)
			}
		}
	}
	return movie.stars || 0
}

export function formatLatestMovieRating(movie: Movie): string {
	return formatMovieRating(getLatestMovieStars(movie))
}

interface MovieCardProps {
	movie: Movie
	listIndex?: number
	isEditMode?: boolean
	viewMode?: 'gallery' | 'list'
	onUpdate?: (movie: Movie, oldMovie: Movie, logoItem?: LogoItem) => void
	onDelete?: () => void
	onTogglePin?: (movie: Movie) => void
	onMarkWatched?: (movie: Movie) => void
}

export function MovieCard({ movie, listIndex, isEditMode = false, viewMode = 'gallery', onUpdate, onDelete, onTogglePin, onMarkWatched }: MovieCardProps) {
	const [expanded, setExpanded] = useState(false)
	const { maxSM } = useSize()
	const [localMovie, setLocalMovie] = useState(movie)
	const [showLogoDialog, setShowLogoDialog] = useState(false)
	const [posterError, setPosterError] = useState(false)
	const [isImageLoaded, setIsImageLoaded] = useState(false)
	const posterSrc = getPosterUrl(localMovie.poster)
	const [logoItem, setLogoItem] = useState<LogoItem | null>(null)
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

	useEffect(() => {
		setLocalMovie(movie)
	}, [movie])

	const handleFieldChange = (field: keyof Movie, value: any) => {
		const updated = { ...localMovie, [field]: value }
		setLocalMovie(updated)
		onUpdate?.(updated, movie, logoItem || undefined)
	}

	const handleCoverSubmit = (logo: LogoItem) => {
		setLogoItem(logo)
		const logoUrl = logo.type === 'url' ? logo.url : logo.previewUrl
		const updated = { ...localMovie, poster: logoUrl }
		setLocalMovie(updated)
		onUpdate?.(updated, movie, logo)
	}

	const handleTagsChange = (tagsStr: string) => {
		const tags = tagsStr
			.split(',')
			.map(t => t.trim())
			.filter(t => t)
		handleFieldChange('tags', tags)
	}

	const [isEditing, setIsEditing] = useState(false)

	const handleSave = (updatedMovie: Movie) => {
		setLocalMovie(updatedMovie)
		onUpdate?.(updatedMovie, localMovie)
		setIsEditing(false)
	}

	if (viewMode === 'list') {
		return (
			<>
				<tr 
					onClick={() => {
						if (isEditMode) {
							setIsEditing(true)
						} else {
							setIsDetailOpen(true)
						}
					}}
					className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
				>
					<td className="py-2.5 px-4">
						<div className="flex items-center gap-2">
							{localMovie.topRank && localMovie.topRank > 0 && localMovie.topRank <= 10 && (
								<span 
									style={{
										backgroundColor: localMovie.topRank === 1 ? '#F59E0B' : localMovie.topRank === 2 ? '#E2E8F0' : localMovie.topRank === 3 ? '#B45309' : '#2563EB',
										color: localMovie.topRank === 1 || localMovie.topRank === 2 ? '#000000' : '#FFFFFF',
										borderColor: localMovie.topRank === 1 ? '#FDE68A' : localMovie.topRank === 2 ? '#FFFFFF' : localMovie.topRank === 3 ? '#F59E0B' : '#93C5FD',
										fontWeight: 900
									}}
									className="px-2 py-0.5 text-[10px] rounded border shrink-0"
								>
									第 {localMovie.topRank} 名
								</span>
							)}
							<div className="flex flex-col min-w-0">
								<span className="font-medium text-[var(--color-primary)] truncate max-w-[200px] sm:max-w-[300px]">
									{localMovie.name}
								</span>
								{localMovie.englishName && (
									<span className="text-[11px] text-slate-400 dark:text-slate-400 truncate max-w-[200px] sm:max-w-[300px] italic font-sans">
										{localMovie.englishName}
									</span>
								)}
							</div>
							<button className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-2 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded shrink-0">
								打开
							</button>
						</div>
					</td>
					<td className="py-2.5 px-4">
						{localMovie.status && (
							<span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-800/50 inline-block">
								{localMovie.status === 'watched' ? '已观看' : '打算看'}
							</span>
						)}
					</td>
					<td className="py-2.5 px-4">
						<div className="flex flex-wrap gap-1.5">
							{localMovie.tags && localMovie.tags.length > 0 && (
								<span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
									{localMovie.tags[0]}
								</span>
							)}
						</div>
					</td>
					<td className="py-2.5 px-4">
						<div className="flex flex-col gap-0.5">
							{localMovie.watchDate && (
								<span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-500" title="观影时间">
									✅ {localMovie.watchDate}
								</span>
							)}
						</div>
					</td>
					<td className="py-2.5 px-4">
						{localMovie.stars ? (
							<div className="flex items-center gap-1 font-mono font-black text-xs text-amber-600 dark:text-amber-400">
								<span>★</span>
								<span>{formatMovieRating(localMovie.stars)}</span>
							</div>
						) : (
							<span />
						)}
					</td>

					{isEditMode ? (
						<td className="py-2.5 px-4 text-right">
							<div className="flex items-center justify-end gap-1.5 shrink-0">
								<button 
									type="button"
									onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} 
									className="p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
									title="编辑电影"
								>
									<Edit3 className="w-3.5 h-3.5" />
								</button>
								{onTogglePin && (
									<button
										type="button"
										onClick={(e) => { e.stopPropagation(); onTogglePin(localMovie) }}
										className={`p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer ${
											localMovie.isPinned ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950'
										}`}
										title={localMovie.isPinned ? '取消置顶' : '置顶电影'}
									>
										<Pin className="w-3.5 h-3.5" />
									</button>
								)}
								{onDelete && (
									<button 
										type="button"
										onClick={(e) => { e.stopPropagation(); onDelete() }} 
										className="p-1.5 rounded-xl bg-red-600 text-white shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
										title="删除电影"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</td>
					) : (
						<td className="py-2.5 px-4 text-right">
							<button
								type="button"
								onClick={(e) => { e.stopPropagation(); onTogglePin?.(localMovie) }}
								className={cn(
									'p-1.5 rounded transition-all duration-300',
									localMovie.isPinned ? 'bg-brand/10 text-brand' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
								)}
								title={localMovie.isPinned ? '取消置顶' : '置顶'}
							>
								<Pin className={cn('w-3.5 h-3.5', localMovie.isPinned ? 'fill-current' : '')} />
							</button>
						</td>
					)}
				</tr>

				{isDetailOpen && !isEditMode && (
					<MovieDetailModal
						movie={localMovie}
						isEditMode={isEditMode}
						onClose={() => setIsDetailOpen(false)}
						onUpdateMovie={(updated) => {
							if (!isEditMode) return
							setLocalMovie(updated)
							onUpdate?.(updated, localMovie)
						}}
					/>
				)}
				{isEditing && <MovieEditModal movie={localMovie} onClose={() => setIsEditing(false)} onSave={handleSave} />}
			</>
		)
	}

	return (
		<>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
				className='relative flex flex-col group w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-lg cursor-pointer bg-[var(--color-card)] border border-[var(--color-border)]'
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={() => {
					if (isEditMode) {
						setIsEditing(true)
					} else {
						setIsDetailOpen(true)
					}
				}}
			>
				{/* Poster Section (Edge to Edge) */}
				<div className="relative w-full aspect-[2/3] overflow-hidden bg-[var(--color-bg)]">
					{/* Top Left Stack: Pin button (non-edit) + Top 10 Rank Badge */}
					<div className="absolute top-3 left-3 z-50 flex items-center gap-2 pointer-events-none">
						{!isEditMode && onTogglePin && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onTogglePin(localMovie)
								}}
								className={cn(
									'p-1.5 rounded-full transition-all duration-300 pointer-events-auto shadow-md backdrop-blur-md cursor-pointer',
									localMovie.isPinned 
										? 'bg-amber-500 text-white opacity-100 ring-2 ring-amber-300/80 shadow-amber-500/40 scale-105' 
										: 'bg-black/60 hover:bg-amber-500 text-white/90 hover:text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:scale-110'
								)}
								title={localMovie.isPinned ? '取消精选置顶' : '精选置顶'}
							>
								<Pin className={cn('w-3.5 h-3.5', localMovie.isPinned ? 'fill-current' : '')} />
							</button>
						)}

						{localMovie.topRank && localMovie.topRank > 0 && localMovie.topRank <= 10 && (
							<div 
								style={{
									backgroundColor: localMovie.topRank === 1 ? '#F59E0B' : localMovie.topRank === 2 ? '#E2E8F0' : localMovie.topRank === 3 ? '#B45309' : '#2563EB',
									color: localMovie.topRank === 1 || localMovie.topRank === 2 ? '#000000' : '#FFFFFF',
									borderColor: localMovie.topRank === 1 ? '#FDE68A' : localMovie.topRank === 2 ? '#FFFFFF' : localMovie.topRank === 3 ? '#F59E0B' : '#93C5FD',
									fontWeight: 900
								}}
								className="px-3 py-1 rounded-full shadow-xl border text-[11px] flex items-center gap-1.5 pointer-events-auto"
							>
								<span>{localMovie.topRank === 1 ? '🥇' : localMovie.topRank === 2 ? '🥈' : localMovie.topRank === 3 ? '🥉' : '🏆'}</span>
								<span>第 {localMovie.topRank} 名</span>
							</div>
						)}
					</div>

					{/* Top Right Score & Status Badges (Multi-stack: High contrast & non-overlapping) */}
					{!isEditMode && (
						<div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
							{/* 1. Rating Badge (ALWAYS SHOWN IF RATED/WATCHED) */}
							{(localMovie.stars > 0 || (localMovie.watchLogs && localMovie.watchLogs.length > 0)) ? (
								<div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-amber-400/50 shadow-xl" suppressHydrationWarning>
									<span className="text-amber-400 text-xs font-bold">★</span>
									<span className="text-white text-xs font-black font-mono" suppressHydrationWarning>
										{formatLatestMovieRating(localMovie)}
										<span className="text-slate-400 font-normal text-[10px]">/10</span>
									</span>
									{getWatchCount(localMovie) > 1 && (
										<span className="ml-1 pl-1 border-l border-slate-700 text-amber-300 font-black text-[10px] font-mono" suppressHydrationWarning>
											{getWatchCount(localMovie)}刷
										</span>
									)}
								</div>
							) : localMovie.expectation ? (
								<div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-amber-400/50 shadow-xl" suppressHydrationWarning>
									<span className="text-amber-400 text-xs font-bold">★</span>
									<span className="text-white text-xs font-black font-mono" suppressHydrationWarning>
										{Number(localMovie.expectation).toFixed(1)}
									</span>
								</div>
							) : null}

							{/* 2. Re-watch Plan / Wishlist Badge (Exact 1:1 match with 📌 想看 style: Solid Amber Fill + Black Text) */}
							{localMovie.isRewatching ? (
								<div className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1 pointer-events-none">
									<span>🔄 {getChineseWatchOrdinal(getWatchCount(localMovie) + 1)}</span>
								</div>
							) : localMovie.status === 'wishlist' ? (
								<div className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-lg pointer-events-none">
									<span>📌 想看</span>
								</div>
							) : null}
						</div>
					)}

					{/* Unified Admin Action Bar in Grid Mode */}
					{isEditMode && (
						<div 
							onClick={(e) => e.stopPropagation()} 
							className="absolute top-2 right-2 flex items-center gap-1.5 z-30 pointer-events-auto"
						>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									setIsEditing(true)
								}}
								className="p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
								title="编辑电影"
							>
								<Edit3 className="w-3.5 h-3.5" />
							</button>

							{onTogglePin && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										onTogglePin(localMovie)
									}}
									className={`p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-lg cursor-pointer ${
										localMovie.isPinned ? 'bg-amber-400 text-slate-950' : 'bg-black/70 text-white hover:bg-amber-500 hover:text-slate-950'
									}`}
									title={localMovie.isPinned ? '取消置顶' : '置顶电影'}
								>
									<Pin className="w-3.5 h-3.5" />
								</button>
							)}

							{onDelete && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										onDelete()
									}}
									className="p-1.5 rounded-xl bg-red-600 text-white shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
									title="删除电影"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					)}

					{/* 3D Poster Image wrapper */}
					<div className="w-full h-full perspective-1000 relative flex items-center justify-center bg-[var(--color-bg)] overflow-hidden">
						{/* Image Loading Skeleton */}
						{!isImageLoaded && !posterError && (
							<div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center z-0">
								<Film className="w-8 h-8 text-slate-300 dark:text-slate-700 animate-bounce" />
							</div>
						)}

						{/* Ambient Shadow (Glow) */}
						{!posterError && posterSrc && (
							<img
								src={posterSrc}
								alt=""
								referrerPolicy="no-referrer"
								suppressHydrationWarning
								className='ambient-shadow-movie absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0'
								style={{ filter: 'blur(30px)' }}
								aria-hidden="true"
							/>
						)}
						{/* Actual Poster */}
						{!posterError && posterSrc ? (
							<>
								<img
									src={posterSrc}
									alt={localMovie.name}
									referrerPolicy="no-referrer"
									suppressHydrationWarning
									onLoad={() => setIsImageLoaded(true)}
									onError={() => {
										setPosterError(true)
										setIsImageLoaded(true)
									}}
									className={cn(
										'relative z-10 w-full h-full object-cover transition-all duration-500 ease-out transform-three-d poster-3d group-hover:scale-[0.93] group-hover:rounded-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-t-2xl',
										isImageLoaded ? 'opacity-100' : 'opacity-0'
									)}
								/>
								{/* Specular Sheen Sweep on Hover */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-20" />
							</>
						) : (
							<div className='flex flex-col items-center justify-center p-4 text-center h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 relative z-10 border-b border-slate-800'>
								<Film className="w-10 h-10 text-amber-500/70 mb-2" />
								<span className='text-xs font-bold text-slate-200 line-clamp-2'>{localMovie.name}</span>
								{localMovie.englishName && <span className="text-[10px] text-slate-400 italic line-clamp-1 mt-1">{localMovie.englishName}</span>}
							</div>
						)}
					</div>
				</div>

				{/* Info Section (Below Poster - Fixed Height Uniform Layout) */}
				<div className="flex flex-col p-3.5 z-20 h-[175px] justify-between shrink-0 bg-white dark:bg-[#0D1117]">
					<div className="flex-1 flex flex-col justify-start">
						{/* Title */}
						<h3 className='text-base font-black leading-tight text-slate-900 dark:text-white mb-0.5 line-clamp-1 group-hover:text-amber-500 transition-colors'>
							{localMovie.name}
						</h3>
						{/* English Subtitle */}
						<div className="h-4 mb-1 overflow-hidden">
							{localMovie.englishName ? (
								<p className='text-xs font-semibold text-slate-400 dark:text-slate-400 line-clamp-1 italic font-sans'>
									{localMovie.englishName}
								</p>
							) : null}
						</div>
						
						{/* Tags & Date */}
						<div className='flex items-center justify-between gap-1 mb-1.5 h-5 overflow-hidden'>
							<div className='flex items-center gap-1.5 overflow-hidden'>
								{localMovie.tags.slice(0, 2).map(tag => (
									<span key={tag} className='text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0 border border-amber-500/20'>
										#{tag.replace(/\s+/g, '')}
									</span>
								))}
							</div>
							{localMovie.releaseDate && (
								<span className='text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0'>
									🎬 {localMovie.releaseDate.split('-')[0]}
								</span>
							)}
						</div>

						{/* Description / Wishlist Reason */}
						<p className='text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed h-8 overflow-hidden'>
							{localMovie.status === 'wishlist' && localMovie.wishlistReason
								? `💡 ${localMovie.wishlistReason}`
								: (localMovie.description || '暂无简介...')}
						</p>
					</div>

					{/* Fixed Height Bottom Action / Status Slot (h-9) */}
					<div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 h-9 flex items-center justify-between shrink-0">
						{onMarkWatched && (localMovie.status === 'wishlist' || localMovie.isRewatching) ? (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onMarkWatched(localMovie)
								}}
								className="w-full h-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
							>
								<CheckCircle2 className="w-3.5 h-3.5" />
								<span>{localMovie.isRewatching ? `🎬 完成 ${getWatchCount(localMovie) + 1} 刷打卡` : '🎬 标记为已看'}</span>
							</button>
						) : (
							<div className="w-full h-full flex items-center justify-between text-xs text-slate-400 dark:text-slate-400">
								<span className="font-mono text-[11px]">
									{localMovie.watchDate ? `🗓️ ${localMovie.watchDate}` : (localMovie.stars ? `★ ${formatLatestMovieRating(localMovie)}` : '查看详情')}
								</span>
								<span className="text-amber-500 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
									详情 →
								</span>
							</div>
						)}
					</div>
				</div>
				
				{/* Hover Glow Effect */}
				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] rounded-2xl" />
			</motion.div>

			{isDetailOpen && !isEditMode && (
				<MovieDetailModal
					movie={localMovie}
					isEditMode={isEditMode}
					onClose={() => setIsDetailOpen(false)}
					onUpdateMovie={(updated) => {
						if (!isEditMode) return
						setLocalMovie(updated)
						onUpdate?.(updated, localMovie)
					}}
				/>
			)}
			{isEditing && <MovieEditModal movie={localMovie} onClose={() => setIsEditing(false)} onSave={handleSave} />}
		</>
	)
}
