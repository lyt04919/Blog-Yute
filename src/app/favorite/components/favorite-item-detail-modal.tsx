'use client'

import { X, ExternalLink, Pencil, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import StarRating from '@/components/star-rating'
import { DialogModal } from '@/components/dialog-modal'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'

import type { FavoriteItem } from './favorite-item-card'

interface FavoriteItemDetailModalProps {
	item: FavoriteItem
	targetType: 'gears' | 'software' | 'music' | 'games' | 'videos'
	onClose: () => void
	onEdit?: () => void
}

export function FavoriteItemDetailModal({ item, targetType, onClose, onEdit }: FavoriteItemDetailModalProps) {
	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleResourceClick = (url?: string) => {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer')
		} else {
			toast.error('暂无链接')
		}
	}

	const subtitleLabel = {
		gears: '品牌 / 厂商',
		software: '开发者 / 团队',
		music: '艺术家 / 栏目',
		games: '平台',
		videos: '作者 / Up主'
	}[targetType]

	const sectionTitle = {
		gears: '关于此装备',
		software: '关于此软件',
		music: '关于此音乐',
		games: '关于此游戏',
		videos: '关于此视频'
	}[targetType]

	const linkLabel = {
		gears: '官方链接',
		software: '官方链接',
		music: '前往收听',
		games: '前往商店',
		videos: '前往观看'
	}[targetType]

	const hasRating = targetType === 'games' && typeof item.stars === 'number'

	const coverAspect = (targetType === 'videos' || targetType === 'games')
		? 'aspect-video'
		: 'aspect-square'

	return (
		<DialogModal open onClose={onClose} className='max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 md:p-0 relative flex flex-col shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar'>
			{/* Sticky Top Nav within Modal */}
			<div className='sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800'>
				<div className='flex items-center gap-2'>
					<span className="text-blue-400 text-lg font-mono font-bold">&lt;{item.name}/&gt;</span>
				</div>
				<div className='flex items-center gap-2'>
					{!hideEditButton && isAuth && onEdit && (
						<button
							onClick={() => {
								onClose()
								onEdit()
							}}
							className='p-2 rounded-md bg-blue-900/50 hover:bg-blue-800/80 text-blue-400 hover:text-slate-900 dark:text-white transition-colors group'
							title='编辑'
						>
							<Pencil className='w-5 h-5 group-hover:scale-110 transition-transform' />
						</button>
					)}
					<button onClick={onClose} className='p-2 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors group'>
						<X className='w-5 h-5 group-hover:scale-110 transition-transform' />
					</button>
				</div>
			</div>

			<div className="px-6 sm:px-8 lg:px-12 py-8">
				{/* Content Layout: Left Sidebar + Right Main */}
				<div className="flex flex-col md:flex-row gap-8 lg:gap-12">
					
					{/* Left Sidebar: Cover + Metadata */}
					<div className="shrink-0 mx-auto md:mx-0 w-48 sm:w-56 md:w-60 space-y-6">
						<div className="relative group rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
							{item.cover ? (
								<>
									<div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
									<img
										src={item.cover}
										alt={item.name}
										className={`relative w-full ${coverAspect} object-cover transition-transform duration-500 group-hover:scale-[1.03] z-10`}
										referrerPolicy="no-referrer"
									/>
								</>
							) : (
								<div className={`w-full ${coverAspect} bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm`}>
									暂无图片
								</div>
							)}
						</div>

						{/* Properties / Metadata List */}
						<div className="space-y-4 pt-2">
							<h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
								Properties
							</h3>
							
							<div className="space-y-3 text-sm">
								{item.category && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🏷️</span> Category</span>
										<span className="font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded w-fit">{item.category}</span>
									</div>
								)}

								{item.status && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🎯</span> Status</span>
										<span className="font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded w-fit">{item.status}</span>
									</div>
								)}

								{item.playDate && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🗓️</span> Date</span>
										<span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.playDate}</span>
									</div>
								)}

								{hasRating && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">⭐</span> Rating</span>
										<div className="scale-90 origin-left">
											<StarRating stars={item.stars || 5} />
										</div>
									</div>
								)}
								
								{item.rating && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🌟</span> Personal Score</span>
										<span className="font-mono font-bold text-amber-500">{item.rating} / 5.0</span>
									</div>
								)}
							</div>
						</div>

						{item.link && (
							<button
								onClick={() => handleResourceClick(item.link)}
								className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm mt-6"
							>
								<ExternalLink className="w-4 h-4" />
								{linkLabel}
							</button>
						)}
					</div>

					{/* Right Main Content */}
					<div className="flex-1 min-w-0">
						<div className="mb-8">
							<h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white">
								{item.name}
							</h1>
							
							{item.subtitle && (
								<p className="text-lg text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
									<span className="text-blue-500">#</span> {item.subtitle}
								</p>
							)}
						</div>

						{/* Overview Section */}
						<div className="prose prose-slate dark:prose-invert max-w-none mb-10">
							{item.review && (
								<blockquote className="text-lg text-blue-600 dark:text-blue-400 font-medium italic border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 py-3 px-5 rounded-r-lg mb-6">
									"{item.review}"
								</blockquote>
							)}
							
							<div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
								{item.desc || '暂无简介'}
							</div>
						</div>

						{/* Personal Review Section */}
						{item.myReview && (
							<div className="mt-8 mb-10">
								<h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
									<Sparkles className="w-5 h-5 text-amber-500" />
									随想笔记
								</h3>
								<div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
									<p className="text-[15px] text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap font-serif">
										{item.myReview}
									</p>
								</div>
							</div>
						)}

						{/* Music Embed */}
						{targetType === 'music' && item.embedCode && (
							<div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
								<h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Apple Music</h3>
								<div
									className='w-full max-w-xl overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl'
									dangerouslySetInnerHTML={{ __html: item.embedCode }}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</DialogModal>
	)
}
