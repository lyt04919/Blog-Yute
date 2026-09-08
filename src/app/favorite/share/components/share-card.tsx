'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Pin, Copy, Check, ExternalLink, Globe, Sparkles, Star } from 'lucide-react'
import { toast } from 'sonner'
import StarRating from '@/components/star-rating'
import dynamic from 'next/dynamic'
const ShareEditModal = dynamic(() => import('./share-edit-modal'), { ssr: false })
import ShareDetailModal from './share-detail-modal'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'

export interface Share {
	name: string
	url: string
	description: string
	logo: string
	tags: string[]
	stars: number
	isShow?: boolean
	isShowOnHome?: boolean
	isPinned?: boolean
}

interface ShareCardProps {
	share: Share
	isEditMode?: boolean
	viewMode?: 'gallery' | 'list'
	onUpdate?: (share: Share, oldShare: Share) => void
	onDelete?: () => void
}

export function getBookmarkTagStyle(tag: string): { label: string; className: string; emoji: string } {
	const t = tag.trim()
	if (/ai|人工智能|大模型|gpt/i.test(t)) {
		return { label: t, emoji: '✨', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
	}
	if (/开发|编程|代码|dev|github|api/i.test(t)) {
		return { label: t, emoji: '💻', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
	}
	if (/设计|ui|ux|图标|配色|画|3d/i.test(t)) {
		return { label: t, emoji: '🎨', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
	}
	if (/工具|效率|生产力|转换|下载|tool/i.test(t)) {
		return { label: t, emoji: '⚡', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
	}
	if (/灵感|创意|酷站|展示|showcase/i.test(t)) {
		return { label: t, emoji: '💡', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
	}
	if (/社区|论坛|交流|博客|资讯/i.test(t)) {
		return { label: t, emoji: '🌐', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' }
	}
	if (/资源|素材|壁纸|字体|音效/i.test(t)) {
		return { label: t, emoji: '📦', className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' }
	}
	return { label: t, emoji: '🏷️', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' }
}

function getFaviconFallback(url: string): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
		return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`
	} catch {
		return ''
	}
}

function getDomainName(url: string): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
		return parsed.hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

export function ShareCard({ share, isEditMode = false, viewMode = 'gallery', onUpdate, onDelete }: ShareCardProps) {
	const [localShare, setLocalShare] = useState(share)
	const { maxSM } = useSize()
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [logoError, setLogoError] = useState(false)
	const [isCopied, setIsCopied] = useState(false)

	const handleSave = (updatedShare: Share) => {
		setLocalShare(updatedShare)
		onUpdate?.(updatedShare, share)
		setIsEditing(false)
	}

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (localShare.url) {
			navigator.clipboard.writeText(localShare.url)
			setIsCopied(true)
			toast.success('已复制网址到剪贴板 🚀')
			setTimeout(() => setIsCopied(false), 2000)
		}
	}

	const handleVisit = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (localShare.url) {
			window.open(localShare.url, '_blank', 'noopener,noreferrer')
		}
	}

	const handleCardClick = () => {
		if (isEditMode) {
			setIsEditing(true)
		} else {
			setIsDetailOpen(true)
		}
	}

	const logoSrc = (!logoError && localShare.logo) ? localShare.logo : getFaviconFallback(localShare.url)
	const domain = getDomainName(localShare.url)

	// List View
	if (viewMode === 'list') {
		return (
			<>
				<tr
					onClick={handleCardClick}
					className="group border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
				>
					<td className="py-3 px-4">
						<div className="flex items-center gap-3 min-w-0">
							<div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center p-1 relative shadow-xs">
								{logoSrc ? (
									<img
										src={logoSrc}
										alt={localShare.name}
										onError={() => setLogoError(true)}
										className="w-full h-full object-contain rounded-lg"
									/>
								) : (
									<Globe className="w-5 h-5 text-slate-400" />
								)}
							</div>
							<div className="flex flex-col min-w-0">
								<div className="flex items-center gap-2">
									<span className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
										{localShare.name}
									</span>
									{localShare.isPinned && (
										<span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
											📌 置顶
										</span>
									)}
								</div>
								<span className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">
									{domain}
								</span>
							</div>
						</div>
					</td>

					<td className="py-3 px-4">
						<div className="flex flex-wrap gap-1.5 max-w-[200px]">
							{localShare.tags.slice(0, 2).map(tag => {
								const tagStyle = getBookmarkTagStyle(tag)
								return (
									<span key={tag} className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1', tagStyle.className)}>
										<span>{tagStyle.emoji}</span>
										<span>{tag}</span>
									</span>
								)
							})}
						</div>
					</td>

					<td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-[320px] truncate">
						{localShare.description || '暂无简介...'}
					</td>

					<td className="py-3 px-4">
						{localShare.stars ? (
							<div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-500">
								<span>★</span>
								<span>{(localShare.stars * 2).toFixed(1)}</span>
							</div>
						) : (
							<span className="text-xs text-slate-400">-</span>
						)}
					</td>

					<td className="py-3 px-4 text-right">
						<div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
							<button
								onClick={handleCopy}
								className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
								title="复制网址"
							>
								{isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
							</button>
							<button
								onClick={handleVisit}
								className="p-1.5 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
								title="在新窗口打开"
							>
								<ExternalLink className="w-4 h-4" />
							</button>
							{isEditMode && (
								<>
									<button
										onClick={() => setIsEditing(true)}
										className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
									>
										编辑
									</button>
									<button
										onClick={onDelete}
										className="px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100"
									>
										删除
									</button>
								</>
							)}
						</div>
					</td>
				</tr>
				{isEditing && <ShareEditModal share={localShare} onClose={() => setIsEditing(false)} onSave={handleSave} />}
				{isDetailOpen && !isEditMode && <ShareDetailModal share={localShare} onClose={() => setIsDetailOpen(false)} />}
			</>
		)
	}

	// Gallery View (Next-Gen Bento / Glass Card)
	return (
		<>
			<motion.div
				initial={{ opacity: 0, scale: 0.96 }}
				{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
				onClick={handleCardClick}
				className="group relative flex flex-col justify-between h-full rounded-2xl overflow-hidden bg-white dark:bg-[#0D1117] border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer p-5 sm:p-6"
			>
				{/* Top Actions: Pin + Copy + Edit Controls */}
				<div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
					{!isEditMode ? (
						<>
							<button
								type="button"
								onClick={handleCopy}
								className="p-1.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm backdrop-blur-md cursor-pointer hover:scale-110"
								title="复制网址"
							>
								{isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									if (onUpdate) onUpdate({ ...localShare, isPinned: !localShare.isPinned }, localShare)
								}}
								className={cn(
									'p-1.5 rounded-full transition-all duration-300 pointer-events-auto shadow-md backdrop-blur-md cursor-pointer',
									localShare.isPinned
										? 'bg-amber-500 text-white opacity-100 ring-2 ring-amber-300/80 shadow-amber-500/40 scale-105'
										: 'bg-black/60 hover:bg-amber-500 text-white/90 hover:text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:scale-110'
								)}
								title={localShare.isPinned ? '取消置顶' : '置顶'}
							>
								<Pin className={cn('w-3.5 h-3.5', localShare.isPinned ? 'fill-current' : '')} />
							</button>
						</>
					) : (
						<div className="flex gap-1.5">
							<button
								onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
								className="rounded-lg px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 shadow-xs hover:bg-blue-100 transition-colors"
							>
								编辑
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); onDelete?.() }}
								className="rounded-lg px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 shadow-xs hover:bg-red-100 transition-colors"
							>
								删除
							</button>
						</div>
					)}
				</div>

				{/* Card Body */}
				<div className="flex flex-col flex-1 min-w-0">
					{/* Header: Logo + Title + Domain Pill */}
					<div className="flex items-start gap-4 mb-4 pr-16">
						{/* 3D App Icon / Logo Box */}
						<div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-500">
							{/* Logo Ambient Glow */}
							{logoSrc && (
								<img
									src={logoSrc}
									alt=""
									className="absolute inset-0 w-full h-full object-cover blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
									aria-hidden="true"
								/>
							)}
							{logoSrc ? (
								<img
									src={logoSrc}
									alt={localShare.name}
									onError={() => setLogoError(true)}
									className="relative z-10 w-full h-full object-contain rounded-xl"
								/>
							) : (
								<div className="relative z-10 w-full h-full flex items-center justify-center text-blue-500 font-black text-xl">
									{localShare.name.slice(0, 1).toUpperCase()}
								</div>
							)}
						</div>

						{/* Title & Domain */}
						<div className="flex-1 min-w-0 pt-0.5">
							<h3 className="text-base sm:text-lg font-black leading-snug text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
								{localShare.name}
							</h3>
							<div className="flex items-center gap-1 mt-1 text-xs font-mono text-slate-400 dark:text-slate-500 truncate">
								<Globe className="w-3 h-3 shrink-0 opacity-60" />
								<span className="truncate">{domain}</span>
							</div>
						</div>
					</div>

					{/* Rating Badge + Tags Bar */}
					<div className="flex items-center justify-between gap-2 mb-3 min-h-[22px] overflow-hidden">
						<div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
							{localShare.tags.slice(0, 3).map(tag => {
								const tagStyle = getBookmarkTagStyle(tag)
								return (
									<span
										key={tag}
										className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border truncate shrink-0 flex items-center gap-1', tagStyle.className)}
									>
										<span>{tagStyle.emoji}</span>
										<span>{tag}</span>
									</span>
								)
							})}
						</div>
						{localShare.stars ? (
							<div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px] shrink-0">
								<span>★</span>
								<span>{(localShare.stars * 2).toFixed(1)}</span>
							</div>
						) : null}
					</div>

					{/* Description */}
					<p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 flex-1">
						{localShare.description || '暂无详细介绍...'}
					</p>
				</div>

				{/* Card Bottom Footer: Details Link & Direct Visit Button */}
				<div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
					<span className="text-xs font-medium text-slate-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
						<Sparkles className="w-3.5 h-3.5" />
						查看详情
					</span>
					<button
						type="button"
						onClick={handleVisit}
						className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-xs hover:shadow-md cursor-pointer group/btn"
						title="在新标签页直达"
					>
						<span>直达网站</span>
						<ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
					</button>
				</div>

				{/* Specular Sheen Sweep on Hover */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-20" />

				{/* Hover Glow Ring Overlay */}
				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 ring-1 ring-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.08)] rounded-2xl" />
			</motion.div>

			{/* Edit & Detail Modals */}
			{isEditing && <ShareEditModal share={localShare} onClose={() => setIsEditing(false)} onSave={handleSave} />}
			{isDetailOpen && !isEditMode && <ShareDetailModal share={localShare} onClose={() => setIsDetailOpen(false)} />}
		</>
	)
}
