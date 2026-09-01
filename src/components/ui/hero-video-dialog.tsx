'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Play, X, ExternalLink } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type AnimationStyle =
	| 'from-bottom'
	| 'from-center'
	| 'from-top'
	| 'from-left'
	| 'from-right'
	| 'fade'
	| 'top-in-bottom-out'
	| 'left-in-right-out'

export interface HeroVideoProps {
	animationStyle?: AnimationStyle
	videoSrc: string
	thumbnailSrc: string
	thumbnailAlt?: string
	title?: string
	className?: string
}

export function getEmbedVideoUrl(url: string, autoplay = true): { embedUrl: string; canEmbed: boolean } {
	if (!url) return { embedUrl: '', canEmbed: false }

	// 1. 已经包含 /embed/
	if (url.includes('/embed/')) {
		const embed = autoplay && !url.includes('autoplay=') 
			? `${url}${url.includes('?') ? '&' : '?'}autoplay=1` 
			: url
		return { embedUrl: embed, canEmbed: true }
	}

	// 2. YouTube watch URL (e.g. youtube.com/watch?v=...)
	if (url.includes('youtube.com/watch')) {
		try {
			const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
			const v = parsed.searchParams.get('v')
			if (v) {
				return {
					embedUrl: `https://www.youtube.com/embed/${v}?autoplay=${autoplay ? '1' : '0'}&rel=0`,
					canEmbed: true
				}
			}
		} catch {}
	}

	// 3. YouTube 短链 (e.g. youtu.be/...)
	if (url.includes('youtu.be/')) {
		const id = url.split('youtu.be/')[1]?.split('?')[0]
		if (id) {
			return {
				embedUrl: `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? '1' : '0'}&rel=0`,
				canEmbed: true
			}
		}
	}

	// 4. Bilibili BV 视频
	if (url.includes('bilibili.com/video/')) {
		const bvid = url.match(/video\/(BV\w+)/)?.[1]
		if (bvid) {
			return {
				embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=${autoplay ? '1' : '0'}&page=1&high_quality=1&danmaku=0`,
				canEmbed: true
			}
		}
	}

	// 5. 原生 MP4/WebM 视频直链
	if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) {
		return { embedUrl: url, canEmbed: true }
	}

	// 非内嵌支持站点（如 Netflix 等）
	return { embedUrl: url, canEmbed: false }
}

export function HeroVideoModal({
	isOpen,
	onClose,
	videoSrc,
	title,
}: {
	isOpen: boolean
	onClose: () => void
	videoSrc: string
	title?: string
	animationStyle?: AnimationStyle
}) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!isOpen) return
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			document.body.style.overflow = previousOverflow
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	if (!mounted) return null

	const { embedUrl, canEmbed } = getEmbedVideoUrl(videoSrc, true)

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					style={{ zIndex: 999999 }}
					className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.92, opacity: 0, y: 15 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.92, opacity: 0, y: 15 }}
						transition={{ type: 'spring', damping: 26, stiffness: 320 }}
						style={{ width: '100%', maxWidth: '960px', backgroundColor: '#09090b' }}
						className="relative mx-auto rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						{/* 顶栏控制条 */}
						<div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-zinc-900">
							<div className="flex items-center gap-2.5 min-w-0 pr-4">
								<span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
								<h4 className="text-xs sm:text-sm font-medium text-zinc-100 truncate font-serif">
									{title || '视听视野 · 原地高清影院'}
								</h4>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{videoSrc && (
									<a
										href={videoSrc}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium text-zinc-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
										title="在新标签页中打开源站"
									>
										<span>前往源站</span>
										<ExternalLink className="w-3 h-3" />
									</a>
								)}
								<button
									type="button"
									onClick={onClose}
									className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
									aria-label="关闭视频"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* 16:9 视频播放区 */}
						<div 
							style={{ width: '100%', aspectRatio: '16 / 9' }} 
							className="relative w-full bg-black flex items-center justify-center overflow-hidden"
						>
							{canEmbed ? (
								<iframe
									src={embedUrl}
									title={title || 'Hero Video Player'}
									style={{ width: '100%', height: '100%', border: 0 }}
									allowFullScreen
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
								/>
							) : (
								<div className="p-8 text-center flex flex-col items-center justify-center gap-3">
									<p className="text-sm text-zinc-300">
										该视频源站点（如 Netflix 等）限制直接网页内嵌，支持一键前往官方源站观看。
									</p>
									<a
										href={videoSrc}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg transition-all"
									>
										<span>前往官方源站观看</span>
										<ExternalLink className="w-3.5 h-3.5" />
									</a>
								</div>
							)}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	)
}

export function HeroVideoDialog({
	animationStyle = 'from-center',
	videoSrc,
	thumbnailSrc,
	thumbnailAlt = 'Video thumbnail',
	title,
	className,
}: HeroVideoProps) {
	const [isVideoOpen, setIsVideoOpen] = useState(false)

	return (
		<div className={cn('relative', className)}>
			<button
				type="button"
				aria-label="Play video"
				className="group relative w-full cursor-pointer border-0 bg-transparent p-0 overflow-hidden rounded-2xl"
				onClick={() => setIsVideoOpen(true)}
			>
				<img
					src={thumbnailSrc}
					alt={thumbnailAlt}
					style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
					className="w-full rounded-2xl border border-black/10 dark:border-white/10 shadow-lg transition-all duration-300 ease-out group-hover:scale-104 group-hover:brightness-90"
				/>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="flex size-14 sm:size-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/25 shadow-xl transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-black/60">
						<Play className="size-6 fill-white text-white translate-x-0.5" />
					</div>
				</div>
			</button>

			<HeroVideoModal
				isOpen={isVideoOpen}
				onClose={() => setIsVideoOpen(false)}
				videoSrc={videoSrc}
				title={title}
				animationStyle={animationStyle}
			/>
		</div>
	)
}

