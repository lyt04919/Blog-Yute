'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { Pin, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { FavoriteItemDetailModal } from './favorite-item-detail-modal'
import { FavoriteItemEditModal } from './favorite-item-edit-modal'
import type { LogoItem } from './logo-upload-dialog'

export interface FavoriteItem {
	name: string
	cover: string
	subtitle?: string // author, director, brand, publisher
	desc: string
	review?: string
	link?: string
	isPinned?: boolean
	isShow?: boolean
	isShowOnHome?: boolean
	stars?: number // rating for games
	status?: string // status for games (e.g. 已通关, 正在玩)
	embedCode?: string // iframe embed code for music
	category?: string
	playDate?: string
	releaseDate?: string
	rating?: number
	myReview?: string
}

interface FavoriteItemCardProps {
	item: FavoriteItem
	targetType: 'gears' | 'software' | 'music' | 'games' | 'videos'
	isEditMode?: boolean
	viewMode?: 'gallery' | 'list'
	onUpdate?: (updatedItem: FavoriteItem, oldItem: FavoriteItem, logoItem?: LogoItem) => void
	onDelete?: () => void
	onTogglePin?: (item: FavoriteItem) => void
}

export function FavoriteItemCard({
	item,
	targetType,
	isEditMode = false,
	viewMode = 'gallery',
	onUpdate,
	onDelete,
	onTogglePin
}: FavoriteItemCardProps) {
	const { maxSM } = useSize()
	const [localItem, setLocalItem] = useState(item)
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

	useEffect(() => {
		setLocalItem(item)
	}, [item])

	const handleSave = (updatedItem: FavoriteItem) => {
		setLocalItem(updatedItem)
		onUpdate?.(updatedItem, localItem)
		setIsEditing(false)
	}

	const handleCardClick = () => {
		if (isEditMode) {
			setIsEditing(true)
		} else {
			setIsDetailOpen(true)
		}
	}

	const aspectClass = cn(
		targetType === 'videos' && 'aspect-[16/9]',
		targetType === 'games' && 'aspect-[16/9]',
		(targetType === 'gears' || targetType === 'software') && 'aspect-[4/5]',
		targetType === 'music' && 'aspect-square'
	)

	if (viewMode === 'list') {
		return (
			<>
				<tr 
					onClick={handleCardClick}
					className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
				>
					<td className="py-2.5 px-4">
						<div className="flex items-center gap-2">
							<span className="font-medium text-[var(--color-primary)] truncate max-w-[200px] sm:max-w-[300px]">
								{localItem.name}
							</span>
							<button className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-2 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded shrink-0">
								打开
							</button>
						</div>
					</td>
					<td className="py-2.5 px-4">
						{localItem.status && (
							<span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-800/50 inline-block">
								{localItem.status}
							</span>
						)}
					</td>
					<td className="py-2.5 px-4">
						<div className="flex flex-wrap gap-1.5">
							{localItem.category && (
								<span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
									{localItem.category}
								</span>
							)}
						</div>
					</td>
					<td className="py-2.5 px-4">
						<div className="flex flex-col gap-0.5">
							{localItem.playDate && (
								<span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-500" title="体验/通关时间">
									✅ {localItem.playDate}
								</span>
							)}
						</div>
					</td>
					<td className="py-2.5 px-4">
						<div className="flex items-center justify-between">
							{localItem.stars ? (
								<div className="flex text-yellow-400 text-[10px] tracking-widest">
									{'★'.repeat(localItem.stars)}{'☆'.repeat(5 - localItem.stars)}
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
										onClick={(e) => { e.stopPropagation(); onTogglePin?.(localItem) }}
										className={cn(
											'p-1.5 rounded transition-all duration-300',
											localItem.isPinned ? 'bg-brand/10 text-brand' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
										)}
										title={localItem.isPinned ? '取消置顶' : '置顶'}
									>
										<Pin className={cn('w-3.5 h-3.5', localItem.isPinned ? 'fill-current' : '')} />
									</button>
								)}
							</div>
						</div>
					</td>
				</tr>

				{isDetailOpen && !isEditMode && (
					<FavoriteItemDetailModal
						item={localItem}
						targetType={targetType}
						onClose={() => setIsDetailOpen(false)}
						onEdit={() => {
							setIsDetailOpen(false)
							setIsEditing(true)
						}}
					/>
				)}
				{isEditing && (
					<FavoriteItemEditModal
						item={localItem}
						targetType={targetType}
						onClose={() => setIsEditing(false)}
						onSave={handleSave}
					/>
				)}
			</>
		)
	}

	return (
		<>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
				className='relative flex flex-col group w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-lg cursor-pointer hover:z-50 shrink-0 bg-[var(--color-card)] border border-[var(--color-border)]'
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={handleCardClick}
			>
				{/* Admin Controls */}
				{isEditMode && (
					<div className='absolute top-3 right-3 z-40 flex gap-2'>
						<button
							onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
							className='rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 shadow-sm'
						>
							编辑
						</button>
						<button
							onClick={(e) => { e.stopPropagation(); onDelete?.() }}
							className='rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 transition-colors hover:bg-red-100 shadow-sm'
						>
							删除
						</button>
					</div>
				)}

				{/* Pin Button for Users */}
				{!isEditMode && (
					<button
						onClick={(e) => { e.stopPropagation(); onTogglePin?.(localItem) }}
						className={cn(
							'absolute top-4 right-4 z-40 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100',
							localItem.isPinned ? 'bg-brand/20 text-brand shadow-sm' : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white backdrop-blur-md'
						)}
						title={localItem.isPinned ? '取消置顶' : '置顶'}
					>
						<Pin className={cn('w-4 h-4', localItem.isPinned ? 'fill-current' : '')} />
					</button>
				)}

				{/* Media Display Section (Top) */}
				<div className={cn('relative w-full overflow-hidden rounded-t-2xl bg-[var(--color-bg)]', aspectClass)}>
					{/* Game Status & Rating Badge (Top Left) */}
					{targetType === 'games' && (localItem.stars || localItem.status) && (
						<div className='absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none'>
							{localItem.status && (
								<span className='w-fit px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-medium shadow-sm'>
									{localItem.status}
								</span>
							)}
							{localItem.stars && (
								<div className='w-fit px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-sm transform scale-90 origin-left'>
									<StarRating stars={localItem.stars} />
								</div>
							)}
						</div>
					)}

					{/* Play Button Overlay for Videos */}
					{targetType === 'videos' && (
						<div className='absolute inset-0 flex items-center justify-center pointer-events-none z-30'>
							<div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-brand/90 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:bg-brand'>
								<Play className='h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5' />
							</div>
						</div>
					)}

					<div className="w-full h-full perspective-1000 relative flex items-center justify-center">
						{/* Ambient Shadow (Glow) */}
						{localItem.cover && (
							<img
								src={localItem.cover}
								alt=""
								className='ambient-shadow-movie absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0'
								style={{ filter: 'blur(30px)' }}
								aria-hidden="true"
							/>
						)}
						{/* Actual Media Image */}
						{localItem.cover ? (
							<img
								src={localItem.cover}
								alt={localItem.name}
								className='relative z-10 w-full h-full object-cover transition-all duration-500 ease-out transform-three-d poster-3d group-hover:scale-[0.93] group-hover:rounded-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-t-2xl'
								referrerPolicy='no-referrer'
							/>
						) : (
							<div className='flex h-full w-full items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-secondary)] z-10 rounded-t-2xl'>
								<span className='text-[10px] sm:text-xs'>暂无图片</span>
							</div>
						)}
					</div>
				</div>

				{/* Info Section (Below Media) */}
				<div className="flex flex-col px-5 pb-5 pt-4 z-20 mt-auto">
					<h3 className='text-base font-bold leading-tight text-[var(--color-primary)] mb-2 line-clamp-1 group-hover:text-[var(--color-brand)] transition-colors'>
						{localItem.name}
					</h3>

					<div className='flex flex-wrap items-center justify-between gap-1 mb-3 min-h-[20px] overflow-hidden'>
						{localItem.subtitle ? (
							<span className='text-[11px] font-mono font-medium text-blue-500/90 tracking-wide'>
								#{localItem.subtitle.replace(/\s+/g, '')}
							</span>
						) : <div />}
						<div className='flex flex-col items-end gap-0.5'>
							{localItem.releaseDate && (
								<span className='text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1 rounded'>
									🎬 {localItem.releaseDate}
								</span>
							)}
							{localItem.playDate && (
								<span className='text-[9px] font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1 rounded'>
									✅ {localItem.playDate}
								</span>
							)}
						</div>
					</div>

					<p className='text-xs text-[var(--color-secondary)] line-clamp-2 leading-relaxed'>
						{localItem.review?.trim() || localItem.desc?.trim() || '暂无简介...'}
					</p>
				</div>

				{/* Hover Blue Ring Overlay */}
				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] rounded-2xl" />
			</motion.div>

			{/* Detail and Edit Modals */}
			{isDetailOpen && !isEditMode && (
				<FavoriteItemDetailModal
					item={localItem}
					targetType={targetType}
					onClose={() => setIsDetailOpen(false)}
					onEdit={() => {
						setIsDetailOpen(false)
						setIsEditing(true)
					}}
				/>
			)}
			{isEditing && (
				<FavoriteItemEditModal
					item={localItem}
					targetType={targetType}
					onClose={() => setIsEditing(false)}
					onSave={handleSave}
				/>
			)}
		</>
	)
}
