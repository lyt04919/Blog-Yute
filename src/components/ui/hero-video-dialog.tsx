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
	className?: string
}

export function getEmbedVideoUrl(url: string, autoplay = true): { embedUrl: string; canEmbed: boolean } {
	if (!url) return { embedUrl: '', canEmbed: false }

	// 1. 已经包含 /embed/
	if (url.includes('/embed/')) {
		let embed = url
		if (autoplay && !embed.includes('autoplay=')) {
			embed = `${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`
		}
		if (!embed.includes('controls=')) {
			embed = `${embed}${embed.includes('?') ? '&' : '?'}controls=1`
		}
		return { embedUrl: embed, canEmbed: true }
	}

	// 2. YouTube watch URL (e.g. youtube.com/watch?v=...)
	if (url.includes('youtube.com/watch')) {
		try {
			const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
			const v = parsed.searchParams.get('v')
			if (v) {
				return {
					embedUrl: `https://www.youtube.com/embed/${v}?autoplay=${autoplay ? '1' : '0'}&controls=1&rel=0`,
					canEmbed: true,
				}
			}
		} catch {}
	}

	// 3. YouTube 短链 (e.g. youtu.be/...)
	if (url.includes('youtu.be/')) {
		const id = url.split('youtu.be/')[1]?.split('?')[0]
		if (id) {
			return {
				embedUrl: `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? '1' : '0'}&controls=1&rel=0`,
				canEmbed: true,
			}
		}
	}

	// 4. Bilibili BV 视频
	if (url.includes('bilibili.com/video/')) {
		const bvid = url.match(/video\/(BV\w+)/)?.[1]
		if (bvid) {
			return {
				embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=${autoplay ? '1' : '0'}&page=1&high_quality=1&danmaku=0`,
				canEmbed: true,
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

const animationVariants = {
	'from-bottom': {
		initial: { y: '100%', opacity: 0 },
		animate: { y: 0, opacity: 1 },
		exit: { y: '100%', opacity: 0 },
	},
	'from-center': {
		initial: { scale: 0.5, opacity: 0 },
		animate: { scale: 1, opacity: 1 },
		exit: { scale: 0.5, opacity: 0 },
	},
	'from-top': {
		initial: { y: '-100%', opacity: 0 },
		animate: { y: 0, opacity: 1 },
		exit: { y: '-100%', opacity: 0 },
	},
	'from-left': {
		initial: { x: '-100%', opacity: 0 },
		animate: { x: 0, opacity: 1 },
		exit: { x: '-100%', opacity: 0 },
	},
	'from-right': {
		initial: { x: '100%', opacity: 0 },
		animate: { x: 0, opacity: 1 },
		exit: { x: '100%', opacity: 0 },
	},
	fade: {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
	},
	'top-in-bottom-out': {
		initial: { y: '-100%', opacity: 0 },
		animate: { y: 0, opacity: 1 },
		exit: { y: '100%', opacity: 0 },
	},
	'left-in-right-out': {
		initial: { x: '-100%', opacity: 0 },
		animate: { x: 0, opacity: 1 },
		exit: { x: '100%', opacity: 0 },
	},
}

export function HeroVideoModal({
	isOpen,
	onClose,
	videoSrc,
	animationStyle = 'from-center',
}: {
	isOpen: boolean
	onClose: () => void
	videoSrc: string
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

	const selectedAnimation = animationVariants[animationStyle]
	const { embedUrl, canEmbed } = getEmbedVideoUrl(videoSrc, true)

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					style={{ zIndex: 999999 }}
					className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 pt-16 sm:pt-20"
					onClick={onClose}
				>
					<motion.div
						{...selectedAnimation}
						transition={{ type: 'spring', damping: 30, stiffness: 300 }}
						className="relative mx-auto aspect-video w-full max-w-4xl"
						onClick={(e) => e.stopPropagation()}
					>
						{/* 浮动在右上角的圆形关闭按钮 (Magic UI 官方原版结构) */}
						<motion.button
							type="button"
							onClick={onClose}
							className="absolute -top-12 sm:-top-14 right-0 rounded-full bg-neutral-900/70 p-2 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-neutral-900/90 cursor-pointer shadow-lg dark:bg-neutral-100/60 dark:text-black"
							aria-label="关闭视频"
						>
							<X className="size-5" />
						</motion.button>

						{/* 纯净 16:9 白边圆角全屏视频框 */}
						<div className="relative isolate z-1 size-full overflow-hidden rounded-2xl border-2 border-white shadow-2xl bg-black">
							{canEmbed ? (
								<iframe
									src={embedUrl}
									title="Hero Video player"
									className="mt-0 size-full rounded-2xl border-0"
									allowFullScreen
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
								/>
							) : (
								<div className="size-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-950">
									<p className="text-base text-zinc-200">
										该视频源（如专属版权站）限制直接内嵌，点击可前往官方播放
									</p>
									<a
										href={videoSrc}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xl"
									>
										<span>前往官方播放</span>
										<ExternalLink className="size-4" />
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
					className="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
				/>
				<div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
					<div className="bg-primary/10 flex size-28 items-center justify-center rounded-full backdrop-blur-md">
						<div
							className={`from-primary/30 to-primary relative flex size-20 scale-100 items-center justify-center rounded-full bg-gradient-to-b shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]`}
						>
							<Play
								className="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
								style={{
									filter:
										'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))',
								}}
							/>
						</div>
					</div>
				</div>
			</button>

			<HeroVideoModal
				isOpen={isVideoOpen}
				onClose={() => setIsVideoOpen(false)}
				videoSrc={videoSrc}
				animationStyle={animationStyle}
			/>
		</div>
	)
}


