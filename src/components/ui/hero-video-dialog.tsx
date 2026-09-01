'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'
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

export function getEmbedVideoUrl(url: string, autoplay = true): string {
	if (!url) return ''
	if (url.includes('/embed/')) {
		return autoplay && !url.includes('autoplay=') ? `${url}${url.includes('?') ? '&' : '?'}autoplay=1` : url
	}
	if (url.includes('youtube.com/watch')) {
		try {
			const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
			const v = parsed.searchParams.get('v')
			if (v) return `https://www.youtube.com/embed/${v}?autoplay=${autoplay ? '1' : '0'}&rel=0`
		} catch {}
	}
	if (url.includes('youtu.be/')) {
		const id = url.split('youtu.be/')[1]?.split('?')[0]
		if (id) return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? '1' : '0'}&rel=0`
	}
	if (url.includes('bilibili.com/video/')) {
		const bvid = url.match(/video\/(BV\w+)/)?.[1]
		if (bvid) return `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=${autoplay ? '1' : '0'}&page=1`
	}
	return url
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
	const selectedAnimation = animationVariants[animationStyle]
	const embedUrl = getEmbedVideoUrl(videoSrc, true)

	return (
		<AnimatePresence>
			{isOpen && (
				<div
					className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
					onClick={onClose}
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/80 backdrop-blur-md"
					/>
					<motion.div
						{...selectedAnimation}
						transition={{ type: 'spring', damping: 28, stiffness: 300 }}
						className="relative z-10 mx-auto aspect-video w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 bg-black"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={onClose}
							className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
							aria-label="关闭视频"
						>
							<X className="w-4 h-4" />
						</button>
						<iframe
							src={embedUrl}
							title="Hero Video Player"
							className="w-full h-full border-0"
							allowFullScreen
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						/>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
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
					className="w-full aspect-video object-cover rounded-2xl border border-black/10 dark:border-white/10 shadow-lg transition-all duration-300 ease-out group-hover:scale-104 group-hover:brightness-90"
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
				animationStyle={animationStyle}
			/>
		</div>
	)
}
