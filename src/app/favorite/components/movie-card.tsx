'use client'

import { motion } from 'motion/react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import EditableStarRating from '@/components/editable-star-rating'
import { useState, useEffect } from 'react'
import LogoUploadDialog, { type LogoItem } from './logo-upload-dialog'
import MovieDetailModal from './movie-detail-modal'
import MovieEditModal from './movie-edit-modal'
import { Pin } from 'lucide-react'
import { GlitchText } from '@/components/magicui/glitch-text'

export interface Movie {
	name: string
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
	recommendation?: string
	watchDate?: string
	releaseDate?: string
	rating?: number
	myReview?: string
}

interface MovieCardProps {
	movie: Movie
	isEditMode?: boolean
	viewMode?: 'gallery' | 'list'
	onUpdate?: (movie: Movie, oldMovie: Movie, logoItem?: LogoItem) => void
	onDelete?: () => void
	onTogglePin?: (movie: Movie) => void
}

export function MovieCard({ movie, isEditMode = false, viewMode = 'gallery', onUpdate, onDelete, onTogglePin }: MovieCardProps) {
	const [expanded, setExpanded] = useState(false)
	const { maxSM } = useSize()
	const [localMovie, setLocalMovie] = useState(movie)
	const [showLogoDialog, setShowLogoDialog] = useState(false)
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
							<span className="font-medium text-[var(--color-primary)] truncate max-w-[200px] sm:max-w-[300px]">
								{localMovie.name}
							</span>
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
						<div className="flex items-center justify-between">
							{localMovie.stars ? (
								<div className="flex text-yellow-400 text-[10px] tracking-widest">
									{'★'.repeat(localMovie.stars)}{'☆'.repeat(5 - localMovie.stars)}
								</div>
							) : (
								<span />
							)}
							
							<div className="flex gap-2">
								{isEditMode ? (
									<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} className='text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100'>编辑</button>
										<button onClick={(e) => { e.stopPropagation(); onDelete?.() }} className='text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100'>删除</button>
									</div>
								) : (
									<button
										onClick={(e) => { e.stopPropagation(); onTogglePin?.(localMovie) }}
										className={cn(
											'p-1.5 rounded transition-all duration-300',
											localMovie.isPinned ? 'bg-brand/10 text-brand' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
										)}
										title={localMovie.isPinned ? '取消置顶' : '置顶'}
									>
										<Pin className={cn('w-3.5 h-3.5', localMovie.isPinned ? 'fill-current' : '')} />
									</button>
								)}
							</div>
						</div>
					</td>
				</tr>

				{isDetailOpen && !isEditMode && <MovieDetailModal movie={localMovie} onClose={() => setIsDetailOpen(false)} />}
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
				{/* Root glow removed */}

				{/* Admin Controls (Edit Mode) */}
				{isEditMode && (
					<div className='absolute top-3 left-3 z-30 flex gap-2'>
						<button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} className='rounded-md px-2 py-1 text-xs font-medium bg-blue-600 text-white shadow-sm hover:bg-blue-500'>
							编辑
						</button>
						<button onClick={(e) => { e.stopPropagation(); onDelete?.() }} className='rounded-md px-2 py-1 text-xs font-medium bg-red-600 text-white shadow-sm hover:bg-red-500'>
							删除
						</button>
					</div>
				)}

				{!isEditMode && (
					<button 
						onClick={(e) => {
							e.stopPropagation()
							onTogglePin?.(localMovie)
						}}
						className={cn(
							'absolute top-3 left-3 z-30 p-1.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100',
							localMovie.isPinned ? 'bg-blue-500/80 text-white shadow-sm opacity-100' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white backdrop-blur-md'
						)}
						title={localMovie.isPinned ? '取消置顶' : '置顶到前面'}
					>
						<Pin className={cn('w-4 h-4', localMovie.isPinned ? 'fill-current' : '')} />
					</button>
				)}

				{/* Poster Section (Edge to Edge) */}
				<div className="relative w-full aspect-[2/3] overflow-hidden bg-[var(--color-bg)]">
					{/* Rating Badge (Top Right) */}
					{localMovie.stars > 0 && (
						<div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 shadow-lg">
							<span className="text-yellow-500 text-xs">★</span>
							<span className="text-white text-xs font-bold font-mono">{(localMovie.stars * 2).toFixed(1)}<span className="text-gray-400 font-normal">/10</span></span>
						</div>
					)}

					{/* 3D Poster Image wrapper */}
					<div className="w-full h-full perspective-1000 relative flex items-center justify-center bg-[var(--color-bg)]">
						{/* Ambient Shadow (Glow) */}
						{localMovie.poster && (
							<img
								src={localMovie.poster}
								alt=""
								className='ambient-shadow-movie absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0'
								style={{ filter: 'blur(30px)' }}
								aria-hidden="true"
							/>
						)}
						{/* Actual Poster */}
						{localMovie.poster ? (
							<img
								src={localMovie.poster}
								alt={localMovie.name}
								className='relative z-10 w-full h-full object-cover transition-all duration-500 ease-out transform-three-d poster-3d group-hover:scale-[0.93] group-hover:rounded-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-t-2xl'
							/>
						) : (
							<div className='flex h-full w-full items-center justify-center text-[var(--color-secondary)] relative z-10'>
								<span className='text-xs'>暂无海报</span>
							</div>
						)}
					</div>
				</div>

				{/* Info Section (Below Poster) */}
				<div className="flex flex-col p-4 z-20">
					{/* Title */}
					<h3 className='text-base font-bold leading-tight text-[var(--color-primary)] mb-2 line-clamp-1 group-hover:text-[var(--color-brand)] transition-colors'>
						{localMovie.name}
					</h3>
					
					{/* Tags & Date */}
					<div className='flex flex-wrap items-center justify-between gap-1 mb-3 min-h-[20px] overflow-hidden'>
						<div className='flex flex-wrap gap-2'>
							{localMovie.tags.slice(0, 3).map(tag => (
								<span key={tag} className='text-[11px] font-mono font-medium text-blue-500/90'>
									#{tag.replace(/\s+/g, '')}
								</span>
							))}
						</div>
						<div className='flex flex-col items-end gap-0.5'>
							{localMovie.releaseDate && (
								<span className='text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1 rounded'>
									🎬 {localMovie.releaseDate}
								</span>
							)}
							{localMovie.watchDate && (
								<span className='text-[9px] font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1 rounded'>
									✅ {localMovie.watchDate}
								</span>
							)}
						</div>
					</div>

					{/* Description */}
					<p className='text-xs text-[var(--color-secondary)] line-clamp-2 leading-relaxed'>
						{localMovie.description || '暂无简介...'}
					</p>
				</div>
				
				{/* Hover Glow Effect */}
				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] rounded-2xl" />
			</motion.div>

			{isDetailOpen && !isEditMode && <MovieDetailModal movie={localMovie} onClose={() => setIsDetailOpen(false)} />}
			{isEditing && <MovieEditModal movie={localMovie} onClose={() => setIsEditing(false)} onSave={handleSave} />}
		</>
	)
}
