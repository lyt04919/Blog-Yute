'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { Pin, Play, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { FavoriteItemDetailModal } from './favorite-item-detail-modal'
import dynamic from 'next/dynamic'
const FavoriteItemEditModal = dynamic(() => import('./favorite-item-edit-modal').then(m => m.FavoriteItemEditModal), { ssr: false })
import type { LogoItem } from './logo-upload-dialog'

export interface FavoriteItem {
	name: string
	cover: string
	subtitle?: string // author, director, brand, publisher, Up主
	desc: string
	review?: string
	link?: string
	embedLink?: string // video iframe embed link or bilibili player url
	embedCode?: string // iframe embed code for music
	isPinned?: boolean
	isShow?: boolean
	isShowOnHome?: boolean
	stars?: number // rating for games/videos
	status?: string // status for games/videos (e.g. 已追完, 在追, 想看)
	category?: string
	playDate?: string
	releaseDate?: string
	rating?: number
	myReview?: string
	chapters?: Array<{
		time: string
		seconds: number
		title: string
	}>
}

export function getVideoPlatform(url?: string): { name: string; emoji: string; badgeClass: string } {
	if (!url) return { name: '视频', emoji: '🎬', badgeClass: 'bg-slate-900/60 backdrop-blur-md text-white border-white/20' }
	const lower = url.toLowerCase()
	if (lower.includes('bilibili.com') || lower.includes('b23.tv')) {
		return { name: 'Bilibili', emoji: '📺', badgeClass: 'bg-[#00AEEC]/90 backdrop-blur-md text-white border-sky-300/40' }
	}
	if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
		return { name: 'YouTube', emoji: '▶️', badgeClass: 'bg-[#FF0000]/90 backdrop-blur-md text-white border-red-300/40' }
	}
	if (lower.includes('netflix.com')) {
		return { name: 'Netflix', emoji: '🍿', badgeClass: 'bg-[#E50914]/90 backdrop-blur-md text-white border-rose-300/40' }
	}
	if (lower.includes('ted.com')) {
		return { name: 'TED', emoji: '🎙️', badgeClass: 'bg-[#E62B1E]/90 backdrop-blur-md text-white border-amber-300/40' }
	}
	if (lower.includes('apple.com')) {
		return { name: 'Apple', emoji: '🍎', badgeClass: 'bg-[#0071E3]/90 backdrop-blur-md text-white border-blue-300/40' }
	}
	if (lower.includes('vimeo.com')) {
		return { name: 'Vimeo', emoji: '🎥', badgeClass: 'bg-[#1AB7EA]/90 backdrop-blur-md text-white border-cyan-300/40' }
	}
	return { name: '精选视频', emoji: '🎬', badgeClass: 'bg-slate-900/60 backdrop-blur-md text-white border-white/20' }
}

export function getVideoEmbedUrl(item: FavoriteItem): string | null {
	if (item.embedLink) return item.embedLink
	if (item.embedCode && item.embedCode.includes('src="')) {
		const match = item.embedCode.match(/src=["']([^"']+)["']/)
		if (match && match[1]) return match[1]
	}
	if (!item.link) return null
	const url = item.link

	// Bilibili
	const bvMatch = url.match(/(BV[a-zA-Z0-9]{10})/i)
	if (bvMatch) {
		return `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&page=1&high_quality=1&as_wide=1`
	}
	const avMatch = url.match(/av(\d+)/i)
	if (avMatch) {
		return `https://player.bilibili.com/player.html?aid=${avMatch[1]}&page=1&high_quality=1&as_wide=1`
	}

	// YouTube
	const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
	const ytMatch = url.match(ytRegex)
	if (ytMatch && ytMatch[1]) {
		return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
	}

	return null
}

export function parseTimestampToSeconds(timeStr: string): number {
	if (!timeStr) return 0
	const parts = timeStr.trim().split(':').map(p => parseInt(p, 10))
	if (parts.some(isNaN)) return 0
	if (parts.length === 3) {
		return parts[0] * 3600 + parts[1] * 60 + parts[2]
	}
	if (parts.length === 2) {
		return parts[0] * 60 + parts[1]
	}
	if (parts.length === 1) {
		return parts[0]
	}
	return 0
}

export function extractChaptersFromText(text: string): Array<{ time: string; seconds: number; title: string }> {
	if (!text) return []
	
	// Normalize escaped characters & linebreaks
	const normalized = text
		.replace(/\\r\\n/g, '\n')
		.replace(/\\n/g, '\n')
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.replace(/\\"/g, '"')
		.replace(/\\u0026/g, '&')
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')

	const lines = normalized.split('\n')
	const results: Array<{ time: string; seconds: number; title: string }> = []
	const seenTimes = new Set<string>()

	// Line regex: e.g. "0:00 intro", "0:08 Verbs 1-10", "04:15 - Chapter Title", "[1:15:00] Great talk"
	const lineRegex = /^\s*(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\))?\s*[-–—:|]*\s*(.+)$/

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed) continue

		const match = trimmed.match(lineRegex)
		if (match) {
			const timeStr = match[1]
			let rawTitle = match[2]?.trim() || '高光章节'
			rawTitle = rawTitle.replace(/^[-–—:|#\s]+/, '').replace(/["'<>\\]+$/, '').trim()
			if (rawTitle && !seenTimes.has(timeStr)) {
				seenTimes.add(timeStr)
				const seconds = parseTimestampToSeconds(timeStr)
				results.push({
					time: timeStr,
					seconds,
					title: rawTitle
				})
			}
		}
	}

	// Fallback global search if line-by-line found nothing
	if (results.length === 0) {
		const globalRegex = /(?:^|[\n\s])(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\))?\s*[-–—:|]*\s*([^\r\n"\\<]+)/g
		let gMatch: RegExpExecArray | null
		while ((gMatch = globalRegex.exec(normalized)) !== null) {
			const timeStr = gMatch[1]
			let rawTitle = gMatch[2]?.trim() || '高光章节'
			rawTitle = rawTitle.replace(/^[-–—:|#\s]+/, '').replace(/["'<>\\]+$/, '').trim()
			if (rawTitle && !seenTimes.has(timeStr) && rawTitle.length < 80) {
				seenTimes.add(timeStr)
				const seconds = parseTimestampToSeconds(timeStr)
				results.push({
					time: timeStr,
					seconds,
					title: rawTitle
				})
			}
		}
	}

	return results.sort((a, b) => a.seconds - b.seconds)
}

export function getMusicItemType(item: { embedCode?: string; link?: string; status?: string; category?: string; desc?: string; name?: string }): 'album' | 'song' | 'podcast' {
	if (item.category === '播客' || item.link?.includes('/podcast/') || item.embedCode?.includes('/podcast/')) {
		return 'podcast'
	}
	// 1. Explicit status / category / desc keywords
	if (item.status?.includes('单曲') || item.category?.includes('单曲') || item.desc?.includes('单曲')) {
		return 'song'
	}
	if (item.status?.includes('专辑') || item.category?.includes('专辑') || item.status?.includes('唱片') || item.category?.includes('唱片')) {
		return 'album'
	}
	// 2. Apple Music track parameters: ?i= or &i= or /song/ explicitly marks a specific single track/song
	if (
		item.link?.includes('?i=') || 
		item.embedCode?.includes('?i=') || 
		item.link?.includes('&i=') || 
		item.embedCode?.includes('&i=') || 
		item.link?.includes('/song/') || 
		item.embedCode?.includes('/song/')
	) {
		return 'song'
	}
	// 3. Apple Music album without single track parameter
	if (item.link?.includes('/album/') || item.embedCode?.includes('/album/')) {
		return 'album'
	}
	return 'song'
}

interface FavoriteItemCardProps {
	item: FavoriteItem
	targetType: 'gears' | 'software' | 'music' | 'games' | 'videos'
	isEditMode?: boolean
	viewMode?: 'gallery' | 'list'
	onPlayTrack?: (item: FavoriteItem) => void
	onUpdate?: (updatedItem: FavoriteItem, oldItem: FavoriteItem, logoItem?: LogoItem) => void
	onDelete?: () => void
	onTogglePin?: (item: FavoriteItem) => void
}

export function FavoriteItemCard({
	item,
	targetType,
	isEditMode = false,
	viewMode = 'gallery',
	onPlayTrack,
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
					className="group border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
				>
					<td className="py-3 px-4">
						<div className="flex items-center gap-3">
							{localItem.cover && (
								<img 
									src={localItem.cover} 
									alt={localItem.name} 
									className="w-10 h-7 object-cover rounded-md shrink-0 shadow-2xs" 
								/>
							)}
							<div className="flex flex-col min-w-0">
								<span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-[320px] group-hover:text-blue-500 transition-colors">
									{localItem.name}
								</span>
								{localItem.subtitle && (
									<span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
										{localItem.subtitle}
									</span>
								)}
							</div>
						</div>
					</td>
					<td className="py-3 px-4">
						{localItem.status && (
							<span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border inline-flex items-center gap-1 ${
								localItem.status.includes('通关') || localItem.status.includes('已追完') || localItem.status === 'finished'
									? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
									: localItem.status.includes('正在') || localItem.status.includes('在追') || localItem.status === 'playing'
									? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
									: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'
							}`}>
								{localItem.status}
							</span>
						)}
					</td>
					<td className="py-3 px-4">
						<div className="flex flex-wrap gap-1">
							{localItem.category && (
								<span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
									#{localItem.category}
								</span>
							)}
						</div>
					</td>
					<td className="py-3 px-4">
						<div className="flex flex-col gap-0.5">
							{localItem.playDate ? (
								<span className="text-xs font-mono text-slate-600 dark:text-slate-400" title="体验时间">
									🗓️ {localItem.playDate}
								</span>
							) : (
								<span className="text-xs text-slate-400 font-mono">-</span>
							)}
						</div>
					</td>
					<td className="py-3 px-4">
						{localItem.stars ? (
							<div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-500">
								<span>★</span>
								<span>{(localItem.stars * 2).toFixed(1)}</span>
							</div>
						) : (
							<span className="text-xs text-slate-400">-</span>
						)}
					</td>

					{isEditMode ? (
						<td className="py-3 px-4 text-right">
							<div className="flex items-center justify-end gap-1.5 shrink-0">
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
							<button
								type="button"
								onClick={(e) => { e.stopPropagation(); onTogglePin?.(localItem); }}
								className={cn(
									'p-1.5 rounded-lg transition-all duration-300',
									localItem.isPinned ? 'bg-amber-500/20 text-amber-500' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
								)}
								title={localItem.isPinned ? '取消置顶' : '置顶'}
							>
								<Pin className={cn('w-3.5 h-3.5', localItem.isPinned ? 'fill-current' : '')} />
							</button>
						</td>
					)}
				</tr>

				{isDetailOpen && !isEditing && (
					<FavoriteItemDetailModal
						item={localItem}
						targetType={targetType}
						onClose={() => setIsDetailOpen(false)}
						isEditMode={isEditMode}
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
				className='relative flex flex-col justify-between group w-full h-full rounded-2xl overflow-hidden transition-all duration-300 shadow-lg cursor-pointer hover:z-50 shrink-0 bg-[var(--color-card)] border border-[var(--color-border)]'
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

				{/* Pin Button for Non-Music Types */}
				{targetType !== 'music' && !isEditMode && onTogglePin && (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); onTogglePin?.(localItem) }}
						className={cn(
							'absolute top-2.5 right-2.5 z-40 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center gap-1 shadow-md backdrop-blur-md',
							localItem.isPinned 
								? 'px-2 py-0.5 rounded-full bg-amber-500/90 text-white border border-amber-300/40 text-[10px] font-bold opacity-100' 
								: 'p-1.5 rounded-full bg-black/45 hover:bg-amber-500 text-white/90 hover:text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:scale-110'
						)}
						title={localItem.isPinned ? '取消置顶' : '置顶'}
					>
						<Pin className="w-3 h-3 fill-current" />
						{localItem.isPinned && <span className="pr-0.5">置顶</span>}
					</button>
				)}

				{/* Media Display Section (Top) */}
				<div className={cn('relative w-full overflow-hidden rounded-t-2xl bg-[var(--color-bg)]', aspectClass)}>
					{/* Status Badges for Games */}
					{targetType === 'games' && (localItem.stars || localItem.status) && (
						<div className="absolute top-2.5 left-2.5 z-30 flex flex-col gap-1.5 pointer-events-none">
							{localItem.status && (
								<span className="w-fit px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-sm">
									{localItem.status}
								</span>
							)}
							{localItem.stars && (
								<div className="w-fit px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md transform scale-90 origin-left">
									<StarRating stars={localItem.stars} />
								</div>
							)}
						</div>
					)}

					{/* Music Default Badges (Top Left & Top Right - Visible by Default, Fades on Hover) */}
					{targetType === 'music' && (() => {
						const musicType = getMusicItemType(localItem)
						const isSong = musicType === 'song'
						return (
							<>
								{/* Top-Left: Type & Audio Equalizer */}
								<div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
									<span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
										{isSong ? (
											<span className="flex items-end gap-0.5 h-2.5">
												<span className="w-0.5 bg-rose-400 rounded-full eq-bar-1" />
												<span className="w-0.5 bg-rose-400 rounded-full eq-bar-2" />
												<span className="w-0.5 bg-rose-400 rounded-full eq-bar-3" />
												<span className="w-0.5 bg-rose-400 rounded-full eq-bar-4" />
											</span>
										) : (
											<span className="text-[11px] leading-none">💽</span>
										)}
										<span>{isSong ? '单曲' : '专辑'}</span>
									</span>
								</div>

								{/* Top-Right: Pinned Gold Badge (Only if pinned, High-Contrast Frosted Gold) */}
								{localItem.isPinned && (
									<div className="absolute top-2.5 right-2.5 z-20 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
										<span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/60 text-amber-400 text-[10px] font-bold flex items-center gap-1 shadow-md tracking-wider">
											<Pin className="w-3 h-3 fill-current text-amber-400" />
											<span>置顶</span>
										</span>
									</div>
								)}
							</>
						)
					})()}

					{/* Badges for Videos (Platform, Status, Rating) */}
					{targetType === 'videos' && (() => {
						const platform = getVideoPlatform(localItem.link)
						return (
							<>
								{/* Top-Left: Platform & Status Badges */}
								<div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none flex-wrap">
									<span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow-xs flex items-center gap-1', platform.badgeClass)}>
										<span>{platform.emoji}</span>
										<span>{platform.name}</span>
									</span>
									{localItem.status && (
										<span className={cn(
											'px-2 py-0.5 rounded-lg text-[10px] font-bold border backdrop-blur-md shadow-xs flex items-center gap-1',
											localItem.status === '已追完' || localItem.status === 'finished'
												? 'bg-emerald-500/80 text-white border-emerald-300/40'
												: localItem.status === '在追' || localItem.status === 'playing'
												? 'bg-amber-500/80 text-white border-amber-300/40'
												: 'bg-purple-500/80 text-white border-purple-300/40'
										)}>
											<span>{localItem.status}</span>
										</span>
									)}
								</div>

								{/* Top-Right: Rating Badge (if not pinned, pinned handles itself) */}
								{localItem.stars && !localItem.isPinned && (
									<div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
										<span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-amber-400/50 text-amber-400 text-[10px] font-bold font-mono shadow-xs flex items-center gap-0.5">
											★ {(localItem.stars * 2).toFixed(1)}
										</span>
									</div>
								)}

								{/* Glowing Cinema Center Play Button */}
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
									<div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-red-600/90 text-white shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:scale-115 group-hover:bg-red-600 group-hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] border border-white/20">
										<Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
									</div>
								</div>
							</>
						)
					})()}

					{/* Play Button Overlay for Videos */}
					{targetType !== 'videos' && targetType !== 'music' && targetType !== 'games' && null}

					<div className="w-full h-full perspective-1000 relative flex items-center justify-center overflow-hidden">
						{/* Ambient Shadow (Glow) */}
						{localItem.cover && (
							<img
								src={localItem.cover}
								alt=""
								suppressHydrationWarning
								className="ambient-shadow-movie absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
								style={{ filter: 'blur(30px)' }}
								aria-hidden="true"
							/>
						)}

						{/* Actual Media Image */}
						{localItem.cover ? (
							<>
								<img
									src={localItem.cover}
									alt={localItem.name}
									suppressHydrationWarning
									className="relative z-10 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 rounded-t-2xl"
									referrerPolicy="no-referrer"
								/>
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-20" />
							</>
						) : (
							<div className="flex h-full w-full items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-secondary)] z-10 rounded-t-2xl">
								<span className="text-[10px] sm:text-xs">暂无图片</span>
							</div>
						)}
					</div>

					{/* 🌟 方案 A 专属：Music Hover Frosted Glass Discovery Overlay (Zero Collision) */}
					{targetType === 'music' && (() => {
						const musicType = getMusicItemType(localItem)
						const isSong = musicType === 'song'
						return (
							<div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
								{/* Top Header: Left (Type+Status) & Right (Rating + Pin Toggle) */}
								<div className="flex items-center justify-between gap-2 w-full">
									{/* Left: Type & Audio Equalizer */}
									<div className="flex items-center gap-1.5 min-w-0">
										<span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
											{isSong ? (
												<span className="flex items-end gap-0.5 h-2.5">
													<span className="w-0.5 bg-rose-400 rounded-full eq-bar-1" />
													<span className="w-0.5 bg-rose-400 rounded-full eq-bar-2" />
													<span className="w-0.5 bg-rose-400 rounded-full eq-bar-3" />
													<span className="w-0.5 bg-rose-400 rounded-full eq-bar-4" />
												</span>
											) : (
												<span className="text-[11px] leading-none">💽</span>
											)}
											<span>{localItem.status || (isSong ? '单曲' : '专辑')}</span>
										</span>
									</div>

									{/* Right: Star Rating + Interactive Pin Toggle in Same Flow */}
									<div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
										{localItem.stars ? (
											<span className="text-[11px] font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
												★ {localItem.stars}.0
											</span>
										) : null}

										{!isEditMode && onTogglePin && (
											<button
												type="button"
												onClick={(e) => { e.stopPropagation(); onTogglePin?.(localItem) }}
												className={cn(
													'px-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 shadow-sm text-[10px]',
													localItem.isPinned 
														? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold border border-amber-300' 
														: 'bg-white/15 hover:bg-amber-400 text-white hover:text-slate-950 border border-white/20 font-bold'
												)}
												title={localItem.isPinned ? '取消置顶' : '置顶'}
											>
												<Pin className="w-2.5 h-2.5 fill-current" />
												<span>{localItem.isPinned ? '已置顶' : '置顶'}</span>
											</button>
										)}
									</div>
								</div>

								{/* Center: Play Icon + Review / Vibe Quote */}
								<div className="flex flex-col items-center justify-center my-auto py-1 text-center">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											onPlayTrack ? onPlayTrack(localItem) : setIsDetailOpen(true)
										}}
										style={{ backgroundColor: '#FA243C', color: '#FFFFFF' }}
										className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#FA243C] hover:bg-[#E01E35] text-white flex items-center justify-center shadow-2xl mb-2 group-hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
										title="在全局底栏试听"
									>
										<Play className="h-5 w-5 fill-white ml-0.5 text-white" />
									</button>
									<p className="text-xs text-slate-200 line-clamp-3 leading-relaxed italic px-2 drop-shadow-sm font-normal">
										{localItem.review ? `“${localItem.review}”` : (localItem.desc || 'Apple Music 官方精选收录，点击查看详情与在线试听。')}
									</p>
								</div>

								{/* Bottom: Action CTA */}
								<div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
									<span className="text-[11px] text-slate-400 font-mono">
										{localItem.category || '音乐'}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											onPlayTrack ? onPlayTrack(localItem) : setIsDetailOpen(true)
										}}
										className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5 pointer-events-auto cursor-pointer"
									>
										{isSong ? '底栏试听 ↗' : '试听专辑 ↗'}
									</button>
								</div>
							</div>
						)
					})()}
				</div>

				{/* Info Section (Below Media) */}
				{targetType === 'music' ? (
					<div className="flex flex-col px-4 py-3.5 z-20 h-[68px] justify-center shrink-0 bg-white dark:bg-[#0D1117] border-t border-slate-100 dark:border-slate-800/80">
						<h3 
							className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors"
							title={localItem.name}
						>
							{localItem.name}
						</h3>
						<div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1">
							<span className="font-medium truncate max-w-[75%] text-slate-600 dark:text-slate-300">
								{localItem.subtitle || 'Apple Music'}
							</span>
							{(localItem.playDate || localItem.releaseDate) && (
								<span className="font-mono text-xs text-slate-400 shrink-0">
									{(localItem.playDate || localItem.releaseDate)?.split('-')[0]}
								</span>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col p-4 z-20 h-[180px] max-h-[180px] justify-between shrink-0 bg-white dark:bg-[#0D1117] overflow-hidden border-t border-slate-100 dark:border-slate-800/80">
						<div className="flex-1 flex flex-col justify-start min-w-0">
							{/* Title (Always takes exact 2-line height so 1-line and 2-line titles are identical) */}
							<div className="h-11 mb-1.5 flex items-start overflow-hidden">
								<h3 
									className="text-sm sm:text-base font-bold leading-snug text-slate-900 dark:text-white line-clamp-2 transition-colors group-hover:text-blue-500"
									title={localItem.name}
								>
									{localItem.name}
								</h3>
							</div>

							{/* Subtitle & Category Row (Fixed height) */}
							<div className="flex items-center justify-between gap-1.5 mb-2 min-w-0 h-5 overflow-hidden">
								<div className="flex items-center gap-1.5 overflow-hidden min-w-0">
									{localItem.subtitle && (
										<span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
											{localItem.subtitle}
										</span>
									)}
									{localItem.category && (
										<span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md truncate shrink-0">
											{localItem.category}
										</span>
									)}
								</div>
								{(localItem.playDate || localItem.releaseDate) && (
									<span className="text-[10px] font-mono text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-1.5 py-0.5 rounded shrink-0">
										{(localItem.playDate || localItem.releaseDate)?.split('-')[0]}
									</span>
								)}
							</div>

							{/* Description / Review Quote (Fixed height) */}
							<div className="h-8 overflow-hidden">
								<p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
									{localItem.review?.trim() || localItem.desc?.trim() || '暂无详细介绍...'}
								</p>
							</div>
						</div>

						{/* Bottom Date & Action Bar */}
						<div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 h-7 flex items-center justify-between shrink-0">
							<span className="font-mono text-[11px] text-slate-400 truncate max-w-[70%]">
								{localItem.playDate ? `🗓️ ${localItem.playDate}` : (localItem.releaseDate ? `🎬 ${localItem.releaseDate}` : '精选推荐')}
							</span>
							<span className="font-bold text-[11px] text-blue-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
								详情 →
							</span>
						</div>
					</div>
				)}

				{/* Hover Blue Ring Overlay */}
				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] rounded-2xl" />
			</motion.div>

			{/* Detail and Edit Modals */}
			{isDetailOpen && !isEditing && (
				<FavoriteItemDetailModal
					item={localItem}
					targetType={targetType}
					onClose={() => setIsDetailOpen(false)}
					isEditMode={isEditMode}
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
