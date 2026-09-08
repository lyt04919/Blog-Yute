'use client'

import { motion } from 'motion/react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
const LogoUploadDialog = dynamic(() => import('./logo-upload-dialog'), { ssr: false })
const BookEditModal = dynamic(() => import('./book-edit-modal'), { ssr: false })
import type { LogoItem } from './logo-upload-dialog'
import BookDetailModal from './book-detail-modal'
import { Pin, CheckCircle2, Flame, BookOpen } from 'lucide-react'
import { GlitchText } from '@/components/magicui/glitch-text'

export interface Book {
	name: string
	cover: string
	author: string
	description: string
	tags: string[]
	stars: number
	recommendation?: string
	epubUrl?: string
	pdfUrl?: string
	doubanUrl?: string
	isPinned?: boolean
	isShow?: boolean
	isShowOnHome?: boolean
	status?: 'reading' | 'finished' | 'wishlist'
	progress?: number
	readDate?: string
	rating?: number
	myReview?: string
}

interface BookCardProps {
	book: Book
	categories?: string[]
	isEditMode?: boolean
	viewMode?: 'gallery' | 'list'
	onUpdate?: (book: Book, oldBook: Book, logoItem?: LogoItem) => void
	onDelete?: () => void
	onTogglePin?: (book: Book) => void
	onMarkRead?: (book: Book) => void
}

export function BookCard({ book, categories = [], isEditMode = false, viewMode = 'gallery', onUpdate, onDelete, onTogglePin, onMarkRead }: BookCardProps) {
	const { maxSM } = useSize()
	const [localBook, setLocalBook] = useState(book)
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isHovered, setIsHovered] = useState(false)
	const [isCoverLoaded, setIsCoverLoaded] = useState(false)
	const [coverError, setCoverError] = useState(false)

	useEffect(() => {
		setLocalBook(book)
	}, [book])

	const handleSave = (updatedBook: Book) => {
		onUpdate?.(updatedBook, book)
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
					className="group border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
				>
					<td className="py-3 px-4">
						<div className="flex items-center gap-3">
							{localBook.cover && (
								<img src={localBook.cover} alt={localBook.name} className="w-8 aspect-2/3 object-cover rounded-sm shrink-0 shadow-2xs" />
							)}
							<div className="flex flex-col min-w-0">
								<span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-[320px] group-hover:text-blue-500 transition-colors">
									{localBook.name}
								</span>
								{localBook.author && (
									<span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
										✍️ {localBook.author}
									</span>
								)}
							</div>
						</div>
					</td>
					<td className="py-3 px-4">
						{localBook.status && (
							<span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border inline-flex items-center gap-1 ${
								localBook.status === 'finished'
									? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
									: localBook.status === 'reading'
									? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
									: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'
							}`}>
								{localBook.status === 'finished' ? '✅ 已读完' : localBook.status === 'reading' ? `🔥 阅读中${localBook.progress ? ` · ${localBook.progress}%` : ''}` : '📌 打算看'}
							</span>
						)}
					</td>
					<td className="py-3 px-4">
						<div className="flex flex-wrap gap-1">
							{localBook.tags && localBook.tags.slice(0, 2).map(tag => (
								<span key={tag} className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
									#{tag}
								</span>
							))}
						</div>
					</td>
					<td className="py-3 px-4">
						{localBook.readDate ? (
							<span className="text-xs font-mono text-slate-600 dark:text-slate-400">
								🗓️ {localBook.readDate}
							</span>
						) : (
							<span className="text-xs text-slate-400 font-mono">-</span>
						)}
					</td>
					<td className="py-3 px-4">
						{localBook.stars > 0 ? (
							<div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-500">
								<span>★</span>
								<span>{(localBook.stars * 2).toFixed(1)}</span>
							</div>
						) : (
							<span className="text-xs text-slate-400">-</span>
						)}
					</td>

					{isEditMode ? (
						<td className="py-3 px-4 text-right">
							<div className="flex items-center justify-end gap-1.5 shrink-0">
								{localBook.status !== 'finished' && onMarkRead && (
									<button 
										type="button"
										onClick={(e) => { e.stopPropagation(); onMarkRead(localBook); }} 
										className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1"
										title="标记为已读"
									>
										<CheckCircle2 className="w-3 h-3" />
										<span>读完</span>
									</button>
								)}
								<button 
									type="button"
									onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
									className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-md hover:bg-blue-500 transition-all cursor-pointer"
								>
									编辑
								</button>
								{onDelete && (
									<button 
										type="button"
										onClick={(e) => { e.stopPropagation(); onDelete(); }} 
										className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold shadow-md hover:bg-red-500 transition-all cursor-pointer"
									>
										删除
									</button>
								)}
							</div>
						</td>
					) : (
						<td className="py-3 px-4 text-right">
							<div className="flex items-center justify-end gap-1.5">
								{localBook.status !== 'finished' && onMarkRead && (
									<button
										type="button"
										onClick={(e) => { e.stopPropagation(); onMarkRead(localBook); }}
										className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
										title="标记为已读"
									>
										<CheckCircle2 className="w-3 h-3" />
										<span>已读</span>
									</button>
								)}
								<button
									type="button"
									onClick={(e) => { e.stopPropagation(); onTogglePin?.(localBook); }}
									className={cn(
										'p-1.5 rounded-lg transition-all duration-300 cursor-pointer',
										localBook.isPinned ? 'bg-amber-500/20 text-amber-500' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
									)}
									title={localBook.isPinned ? '取消置顶' : '置顶'}
								>
									<Pin className={cn('w-3.5 h-3.5', localBook.isPinned ? 'fill-current' : '')} />
								</button>
							</div>
						</td>
					)}
				</tr>

				{isDetailOpen && !isEditMode && <BookDetailModal book={localBook} onClose={() => setIsDetailOpen(false)} onMarkRead={onMarkRead} />}
				{isEditing && <BookEditModal book={localBook} onClose={() => setIsEditing(false)} onSave={handleSave} />}
			</>
		)
	}

	return (
		<>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
				className='relative flex flex-col group w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer hover:z-50 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-blue-500/40'
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
				{isEditMode && (
					<div className='absolute top-3 right-3 z-30 flex gap-2'>
						<button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className='rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 shadow-sm'>
							编辑
						</button>
						<button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className='rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 transition-colors hover:bg-red-100 shadow-sm'>
							删除
						</button>
					</div>
				)}

				{/* Book Display Section (Edge to Edge) */}
				<div className='relative w-full aspect-[2/3] transition-all duration-500 book-perspective z-10 cursor-pointer bg-slate-100 dark:bg-slate-900 rounded-t-2xl overflow-hidden'>
					
					{/* Top Left Stack: Pin button + Status Badge + Quick Mark Read */}
					<div className="absolute top-3 left-3 z-40 flex items-center gap-1.5 pointer-events-none">
						{!isEditMode && onTogglePin && (
							<button 
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onTogglePin?.(localBook)
								}}
								className={cn(
									'p-1.5 rounded-full transition-all duration-300 pointer-events-auto shadow-md backdrop-blur-md cursor-pointer',
									localBook.isPinned 
										? 'bg-amber-500 text-white opacity-100 ring-2 ring-amber-300/80 shadow-amber-500/40 scale-105' 
										: 'bg-black/60 hover:bg-amber-500 text-white/90 hover:text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:scale-110'
								)}
								title={localBook.isPinned ? '取消置顶' : '置顶到前面'}
							>
								<Pin className={cn('w-3.5 h-3.5', localBook.isPinned ? 'fill-current' : '')} />
							</button>
						)}

						{localBook.status && (
							<div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg text-[10px] font-bold text-white">
								{localBook.status === 'finished' ? '✅ 已读完' : localBook.status === 'reading' ? `🔥 在读 ${localBook.progress ? `${localBook.progress}%` : ''}` : '📌 打算看'}
							</div>
						)}

						{/* Quick Mark Read on Hover for unread books */}
						{localBook.status !== 'finished' && onMarkRead && !isEditMode && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onMarkRead(localBook)
								}}
								className="opacity-0 group-hover:opacity-100 pointer-events-auto transition-all p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md backdrop-blur-md cursor-pointer hover:scale-110"
								title="标记读完与评星"
							>
								<CheckCircle2 className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Rating Badge (Top Right - Always Visible) */}
					{localBook.stars > 0 && (
						<div className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-amber-400/50 shadow-xl">
							<span className="text-amber-400 text-xs font-bold">★</span>
							<span className="text-white text-xs font-black font-mono">{(localBook.stars * 2).toFixed(1)}</span>
						</div>
					)}

					{/* Loading Skeleton */}
					{!isCoverLoaded && !coverError && localBook.cover && (
						<div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center z-0" />
					)}

					<div className="relative w-full h-full flex items-center justify-center">
						{/* Ambient Shadow (Blurred Clone) */}
						{localBook.cover && !coverError && (
							<img
								src={localBook.cover}
								alt=""
								className='ambient-shadow-book absolute inset-0 w-full h-full object-cover blur-3xl opacity-0 group-hover:opacity-80 pointer-events-none'
								aria-hidden="true"
							/>
						)}

						{/* 3D Book Cover Container */}
						<div
							className='relative transition-transform duration-500 ease-in-out transform-three-d book-3d w-full h-full flex items-center justify-center'
							style={{ '--book-height': '24px' } as React.CSSProperties}
						>
							{localBook.cover && !coverError ? (
								<>
									<img
										src={localBook.cover}
										alt={localBook.name}
										onLoad={() => setIsCoverLoaded(true)}
										onError={() => {
											setCoverError(true)
											setIsCoverLoaded(true)
										}}
										className={cn(
											"w-full h-full object-cover transition-all duration-500 relative z-10 rounded-t-2xl lg:group-hover:rounded-l-lg lg:group-hover:rounded-r-sm lg:group-hover:rounded-t-sm shadow-2xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]",
											isCoverLoaded ? 'opacity-100' : 'opacity-0'
										)}
									/>
									{/* Specular Sheen Sweep */}
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-20" />
									{/* Book Spine Illusion */}
									<div className="absolute inset-0 transition-all duration-500 z-20 pointer-events-none shadow-[inset_8px_0_16px_rgba(0,0,0,0.35),_inset_1px_0_2px_rgba(255,255,255,0.8)] rounded-t-2xl lg:group-hover:rounded-l-lg lg:group-hover:rounded-r-sm lg:group-hover:rounded-t-sm" />
								</>
							) : (
								/* Elegant Cloth-bound Fallback Cover */
								<div className='flex flex-col h-full w-full items-center justify-between border-b border-[var(--color-border)] bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 text-slate-200 z-10 rounded-t-2xl p-5 text-center select-none shadow-inner relative overflow-hidden'>
									{/* Gold Foil Accent Line */}
									<div className="absolute inset-x-4 top-4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
									<div className="absolute inset-x-4 bottom-4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

									<div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mt-2 border border-blue-500/20 shadow-xs">
										<BookOpen className="w-4 h-4" />
									</div>

									<div className="my-auto px-1">
										<span className='text-xs sm:text-sm font-bold line-clamp-3 text-white leading-snug font-serif'>
											{localBook.name}
										</span>
										{localBook.author && (
											<span className="text-[10px] text-slate-400 mt-1.5 block truncate max-w-[130px] mx-auto">
												✍️ {localBook.author}
											</span>
										)}
									</div>

									<div className="text-[9px] text-amber-400/80 font-mono tracking-widest uppercase">
										✦ CLASSIC ARCHIVE ✦
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Bottom Reading Progress Bar */}
					{localBook.status === 'reading' && (
						<div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 z-30">
							<div 
								className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(234,179,8,0.7)] transition-all duration-300"
								style={{ width: `${Math.min(100, Math.max(8, localBook.progress || 10))}%` }}
							/>
						</div>
					)}
				</div>

				{/* Info Section (Below Poster - Fixed Height Uniform Layout) */}
				<div className="flex flex-col p-4 z-20 h-[140px] justify-between shrink-0 bg-white dark:bg-[#0D1117]">
					<div className="flex-1 flex flex-col justify-start min-w-0">
						{/* Title */}
						<h3 className='text-sm sm:text-base font-bold leading-tight text-slate-900 dark:text-white mb-0.5 line-clamp-1 group-hover:text-blue-500 transition-colors'>
							{localBook.name}
						</h3>

						{/* Author */}
						<div className="h-4 mb-1 overflow-hidden">
							{localBook.author ? (
								<p className='text-xs text-slate-500 dark:text-slate-400 font-medium truncate'>
									✍️ {localBook.author}
								</p>
							) : null}
						</div>

						{/* Tags & Date */}
						<div className='flex items-center justify-between gap-1 mb-1.5 h-5 overflow-hidden'>
							<div className='flex items-center gap-1.5 overflow-hidden'>
								{localBook.tags.slice(0, 2).map(tag => (
									<span key={tag} className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0'>
										#{tag.replace(/\s+/g, '')}
									</span>
								))}
							</div>
							{localBook.readDate ? (
								<span className='text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0'>
									{localBook.readDate.split('-')[0]}
								</span>
							) : localBook.status === 'reading' && localBook.progress ? (
								<span className='text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0'>
									{localBook.progress}%
								</span>
							) : null}
						</div>

						{/* Recommendation / Description */}
						<p className='text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed italic h-8 overflow-hidden'>
							"{localBook.recommendation?.trim() || localBook.description?.trim() || '暂无简介...'}"
						</p>
					</div>
				</div>

				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] rounded-2xl" />
			</motion.div>

			{isDetailOpen && !isEditMode && (
				<BookDetailModal 
					book={localBook} 
					onClose={() => setIsDetailOpen(false)} 
					isEditMode={isEditMode} 
					onEdit={() => setIsEditing(true)} 
					onMarkRead={onMarkRead}
				/>
			)}
			{isEditing && <BookEditModal book={localBook} onClose={() => setIsEditing(false)} onSave={handleSave} />}
		</>
	)
}
