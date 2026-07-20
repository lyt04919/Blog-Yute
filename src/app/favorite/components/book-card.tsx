'use client'

import { motion } from 'motion/react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import EditableStarRating from '@/components/editable-star-rating'
import { useState, useEffect } from 'react'
import LogoUploadDialog, { type LogoItem } from './logo-upload-dialog'
import BookDetailModal from './book-detail-modal'
import BookEditModal from './book-edit-modal'
import { Pin } from 'lucide-react'
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
}

export function BookCard({ book, categories = [], isEditMode = false, viewMode = 'gallery', onUpdate, onDelete, onTogglePin }: BookCardProps) {
	const { maxSM } = useSize()
	const [localBook, setLocalBook] = useState(book)
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

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
					className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
				>
					<td className="py-2.5 px-4">
						<div className="flex items-center gap-2">
							<span className="font-medium text-[var(--color-primary)] truncate max-w-[200px] sm:max-w-[300px]">
								{localBook.name}
							</span>
							<button className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-2 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded shrink-0">
								打开
							</button>
						</div>
					</td>
					<td className="py-2.5 px-4">
						{localBook.status && (
							<span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-800/50 inline-block">
								{localBook.status === 'finished' ? '已读完' : localBook.status === 'reading' ? '阅读中' : '打算看'}
							</span>
						)}
					</td>
					<td className="py-2.5 px-4">
						<div className="flex flex-wrap gap-1.5">
							{localBook.tags && localBook.tags.length > 0 && (
								<span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
									{localBook.tags[0]}
								</span>
							)}
						</div>
					</td>
					<td className="py-2.5 px-4">
						{localBook.readDate && (
							<span className="text-xs font-mono text-slate-500">
								{localBook.readDate}
							</span>
						)}
					</td>
					<td className="py-2.5 px-4">
						<div className="flex items-center justify-between">
							{localBook.stars ? (
								<div className="flex text-yellow-400 text-[10px] tracking-widest">
									{'★'.repeat(localBook.stars)}{'☆'.repeat(5 - localBook.stars)}
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
										onClick={(e) => { e.stopPropagation(); onTogglePin?.(localBook) }}
										className={cn(
											'p-1.5 rounded transition-all duration-300',
											localBook.isPinned ? 'bg-brand/10 text-brand' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
										)}
										title={localBook.isPinned ? '取消置顶' : '置顶'}
									>
										<Pin className={cn('w-3.5 h-3.5', localBook.isPinned ? 'fill-current' : '')} />
									</button>
								)}
							</div>
						</div>
					</td>
				</tr>

				{isDetailOpen && !isEditMode && <BookDetailModal book={localBook} onClose={() => setIsDetailOpen(false)} />}
				{isEditing && <BookEditModal book={localBook} onClose={() => setIsEditing(false)} onSave={handleSave} />}
			</>
		)
	}

	return (
		<>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
				className='relative flex flex-col group w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-lg cursor-pointer hover:z-50 bg-[var(--color-card)] border border-[var(--color-border)]'
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

				{!isEditMode && (
					<button 
						onClick={(e) => {
							e.stopPropagation()
							onTogglePin?.(localBook)
						}}
						className={cn(
							'absolute top-4 right-4 z-30 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100',
							localBook.isPinned ? 'bg-brand/20 text-brand shadow-sm' : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white backdrop-blur-md'
						)}
						title={localBook.isPinned ? '取消置顶' : '置顶到前面'}
					>
						<Pin className={cn('w-4 h-4', localBook.isPinned ? 'fill-current' : '')} />
					</button>
				)}

				{/* Book Display Section (Edge to Edge) */}
				<div className='relative w-full aspect-[2/3] transition-all duration-500 book-perspective z-10 cursor-pointer bg-[var(--color-bg)] rounded-t-2xl overflow-hidden'>
					
					{/* Rating Badge (Top Right) */}
					{localBook.stars > 0 && (
						<div className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/5 shadow-lg opacity-100 transition-opacity duration-300">
							<span className="text-yellow-500 text-xs">★</span>
							<span className="text-white text-xs font-bold font-mono">{(localBook.stars * 2).toFixed(1)}</span>
						</div>
					)}

					<div className="relative w-full h-full flex items-center justify-center">
						{/* Ambient Shadow (Blurred Clone) */}
						{localBook.cover && (
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
							{localBook.cover ? (
								<>
									<img
										src={localBook.cover}
										alt={localBook.name}
										className="w-full h-full object-cover transition-all duration-500 relative z-10 rounded-t-2xl lg:group-hover:rounded-l-lg lg:group-hover:rounded-r-sm lg:group-hover:rounded-t-sm shadow-2xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
									/>
									{/* Book Spine Illusion (Front View) */}
									<div className="absolute inset-0 transition-all duration-500 z-20 pointer-events-none shadow-[inset_8px_0_16px_rgba(0,0,0,0.35),_inset_1px_0_2px_rgba(255,255,255,0.8)] rounded-t-2xl lg:group-hover:rounded-l-lg lg:group-hover:rounded-r-sm lg:group-hover:rounded-t-sm" />
								</>
							) : (
								<div className='flex h-full w-full items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-secondary)] z-10 rounded-t-2xl'>
									<span className='text-[10px]'>暂无封面</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Info Section (Below Poster) */}
				<div className="flex flex-col px-5 pb-5 pt-4 z-20 mt-auto">
					<h3 className='text-base font-bold leading-tight text-[var(--color-primary)] mb-2 line-clamp-1 group-hover:text-[var(--color-brand)] transition-colors'>
						{localBook.name}
					</h3>

					<div className='flex flex-wrap items-center justify-between gap-1 mb-3 min-h-[20px] overflow-hidden'>
						<div className='flex flex-wrap gap-2'>
							{localBook.tags.slice(0, 3).map(tag => (
								<span key={tag} className='text-[11px] font-mono font-medium text-blue-500/90'>
									#{tag.replace(/\s+/g, '')}
								</span>
							))}
						</div>
						{localBook.readDate && (
							<span className='text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded'>
								🗓️ {localBook.readDate}
							</span>
						)}
					</div>

					<p className='text-xs text-[var(--color-secondary)] line-clamp-2 leading-relaxed'>
						{localBook.recommendation?.trim() || localBook.description?.trim() || '暂无简介...'}
					</p>
				</div>

				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] rounded-2xl" />
			</motion.div>

			{isDetailOpen && !isEditMode && <BookDetailModal book={localBook} onClose={() => setIsDetailOpen(false)} />}
			{isEditing && <BookEditModal book={localBook} onClose={() => setIsEditing(false)} onSave={handleSave} />}
		</>
	)
}
