'use client'

import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, X, Copy, Check, Download, Calendar, Link2, Clock, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'

interface ShareCardProps {
	title: string
	date: string
	tags: string[]
	slug: string
	cover?: string
	summary?: string
	author?: string
	readingTime?: string
	className?: string
}

export function ShareCard({ title, date, tags, slug, cover, summary, author = 'YYsuni', readingTime, className }: ShareCardProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [copied, setCopied] = useState(false)
	const [generating, setGenerating] = useState(false)
	const cardRef = useRef<HTMLDivElement>(null)
	const { resolvedTheme } = useTheme()
	const isDark = resolvedTheme === 'dark'

	const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : ''

	const handleCopyLink = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shareUrl)
			setCopied(true)
			toast.success('链接已复制')
			setTimeout(() => setCopied(false), 2000)
		} catch {
			toast.error('复制失败')
		}
	}, [shareUrl])

	const handleGenerateCard = useCallback(async () => {
		if (!cardRef.current) return
		setGenerating(true)
		try {
			const canvas = document.createElement('canvas')
			const ctx = canvas.getContext('2d')
			if (!ctx) return

			const W = 1200
			const H = 630
			canvas.width = W
			canvas.height = H

			// Helper: load image
			const loadImage = (src: string): Promise<HTMLImageElement> => {
				return new Promise((resolve, reject) => {
					const img = new Image()
					img.crossOrigin = 'anonymous'
					img.onload = () => resolve(img)
					img.onerror = reject
					img.src = src
				})
			}

			// 1. Background - subtle gradient
			const bgGradient = ctx.createLinearGradient(0, 0, W, H)
			bgGradient.addColorStop(0, isDark ? '#121212' : '#fafbfc')
			bgGradient.addColorStop(1, isDark ? '#1e1e1e' : '#f0f2f5')
			ctx.fillStyle = bgGradient
			ctx.fillRect(0, 0, W, H)

			// 2. Decorative geometric shapes
			// Top-left large circle
			ctx.beginPath()
			ctx.arc(-80, -80, 280, 0, Math.PI * 2)
			ctx.fillStyle = isDark ? 'rgba(53, 191, 171, 0.1)' : 'rgba(53, 191, 171, 0.06)'
			ctx.fill()

			// Bottom-right circle
			ctx.beginPath()
			ctx.arc(W + 60, H + 60, 320, 0, Math.PI * 2)
			ctx.fillStyle = isDark ? 'rgba(31, 201, 231, 0.08)' : 'rgba(31, 201, 231, 0.05)'
			ctx.fill()

			// Middle-right small circle
			ctx.beginPath()
			ctx.arc(W - 200, H / 2, 100, 0, Math.PI * 2)
			ctx.fillStyle = isDark ? 'rgba(53, 191, 171, 0.06)' : 'rgba(53, 191, 171, 0.04)'
			ctx.fill()

			// 3. Left accent bar
			ctx.fillStyle = '#35bfab'
			ctx.fillRect(0, 0, 6, H)

			// 4. Card container background
			const cardX = 50
			const cardY = 50
			const cardW = W - 100
			const cardH = H - 100
			
			// Card shadow
			ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)'
			ctx.shadowBlur = 40
			ctx.shadowOffsetX = 0
			ctx.shadowOffsetY = 8
			
			// Card bg
			ctx.fillStyle = isDark ? '#27272a' : '#ffffff'
			ctx.beginPath()
			ctx.roundRect(cardX, cardY, cardW, cardH, 16)
			ctx.fill()
			
			// Reset shadow
			ctx.shadowColor = 'transparent'
			ctx.shadowBlur = 0
			ctx.shadowOffsetX = 0
			ctx.shadowOffsetY = 0

			// 5. Cover image area (top half)
			const coverH = cover ? 220 : 0
			if (cover) {
				try {
					const img = await loadImage(cover)
					// Clip to rounded top
					ctx.save()
					ctx.beginPath()
					ctx.roundRect(cardX, cardY, cardW, coverH, [16, 16, 0, 0])
					ctx.clip()
					
					// Draw image covering the area
					const scale = Math.max(cardW / img.width, coverH / img.height)
					const dw = img.width * scale
					const dh = img.height * scale
					const dx = cardX + (cardW - dw) / 2
					const dy = cardY + (coverH - dh) / 2
					ctx.drawImage(img, dx, dy, dw, dh)
					
					// Gradient overlay at bottom of cover
					const coverGradient = ctx.createLinearGradient(0, cardY + coverH - 80, 0, cardY + coverH)
					coverGradient.addColorStop(0, isDark ? 'rgba(39,39,42,0)' : 'rgba(255,255,255,0)')
					coverGradient.addColorStop(1, isDark ? 'rgba(39,39,42,0.9)' : 'rgba(255,255,255,0.9)')
					ctx.fillStyle = coverGradient
					ctx.fillRect(cardX, cardY + coverH - 80, cardW, 80)
					
					ctx.restore()
				} catch {
					// If image fails to load, use gradient placeholder
					const placeholderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + coverH)
					placeholderGrad.addColorStop(0, isDark ? '#2a3331' : '#e8f5f2')
					placeholderGrad.addColorStop(1, isDark ? '#242a29' : '#d4ede8')
					ctx.fillStyle = placeholderGrad
					ctx.beginPath()
					ctx.roundRect(cardX, cardY, cardW, coverH, [16, 16, 0, 0])
					ctx.fill()
				}
			}

			// 6. Content area
			const contentY = cardY + coverH + (cover ? 0 : 30)
			const contentX = cardX + 40
			const contentW = cardW - 80
			let currentY = contentY + 30

			// Author & Date pill
			ctx.fillStyle = isDark ? '#3f3f46' : '#f5f5f5'
			ctx.beginPath()
			ctx.roundRect(contentX, currentY, 280, 32, 16)
			ctx.fill()

			ctx.fillStyle = isDark ? '#a1a1aa' : '#666'
			ctx.font = '14px "PingFang SC", -apple-system, sans-serif'
			ctx.textBaseline = 'middle'
			ctx.fillText(`${author}  ·  ${date}`, contentX + 16, currentY + 16)
			currentY += 56

			// Title
			ctx.fillStyle = isDark ? '#f4f4f5' : '#1a1a1a'
			ctx.font = 'bold 44px "PingFang SC", -apple-system, sans-serif'
			ctx.textBaseline = 'alphabetic'
			
			const titleMaxWidth = contentW
			const titleChars = title.split('')
			let titleLine = ''
			let titleLines = 0
			const maxTitleLines = 2
			
			for (let i = 0; i < titleChars.length && titleLines < maxTitleLines; i++) {
				const testLine = titleLine + titleChars[i]
				const metrics = ctx.measureText(testLine)
				if (metrics.width > titleMaxWidth && i > 0) {
					ctx.fillText(titleLine, contentX, currentY)
					titleLine = titleChars[i]
					currentY += 58
					titleLines++
				} else {
					titleLine = testLine
				}
			}
			if (titleLine && titleLines < maxTitleLines) {
				ctx.fillText(titleLine, contentX, currentY)
				currentY += 58
			}
			currentY += 10

			// Tags
			if (tags.length > 0) {
				ctx.fillStyle = '#35bfab'
				ctx.font = '18px "PingFang SC", -apple-system, sans-serif'
				const tagText = tags.slice(0, 4).map(t => `#${t}`).join('   ')
				ctx.fillText(tagText, contentX, currentY)
				currentY += 40
			}

			// Summary
			if (summary) {
				ctx.fillStyle = isDark ? '#a1a1aa' : '#555'
				ctx.font = '20px "PingFang SC", -apple-system, sans-serif'
				const summaryChars = summary.slice(0, 100).split('')
				let summaryLine = ''
				let summaryLines = 0
				const maxSummaryLines = 2
				
				for (let i = 0; i < summaryChars.length && summaryLines < maxSummaryLines; i++) {
					const testLine = summaryLine + summaryChars[i]
					const metrics = ctx.measureText(testLine)
					if (metrics.width > titleMaxWidth && i > 0) {
						ctx.fillText(summaryLine, contentX, currentY)
						summaryLine = summaryChars[i]
						currentY += 34
						summaryLines++
					} else {
						summaryLine = testLine
					}
				}
				if (summaryLine && summaryLines < maxSummaryLines) {
					ctx.fillText(summaryLine, contentX, currentY)
					currentY += 34
				}
				currentY += 16
			}

			// Bottom section - URL bar
			const urlBarY = cardY + cardH - 70
			ctx.fillStyle = isDark ? '#3f3f46' : '#f8fafa'
			ctx.beginPath()
			ctx.roundRect(contentX, urlBarY, contentW, 44, 12)
			ctx.fill()

			// URL icon (small circle)
			ctx.beginPath()
			ctx.arc(contentX + 22, urlBarY + 22, 6, 0, Math.PI * 2)
			ctx.fillStyle = '#35bfab'
			ctx.fill()

			// URL text
			ctx.fillStyle = isDark ? '#d4d4d8' : '#35bfab'
			ctx.font = '16px "PingFang SC", -apple-system, sans-serif'
			ctx.textBaseline = 'middle'
			ctx.fillText(shareUrl, contentX + 40, urlBarY + 22)

			// Website brand at bottom-right
			ctx.fillStyle = isDark ? '#71717a' : '#ccc'
			ctx.font = '14px "PingFang SC", -apple-system, sans-serif'
			ctx.textAlign = 'right'
			ctx.fillText('YYsuni Blog', cardX + cardW - 30, cardY + cardH - 25)
			ctx.textAlign = 'left'

			// Download
			const link = document.createElement('a')
			link.download = `${slug}-share-card.png`
			link.href = canvas.toDataURL('image/png')
			link.click()

			toast.success('分享卡片已生成')
		} catch (e) {
			console.error(e)
			toast.error('生成失败')
		} finally {
			setGenerating(false)
		}
	}, [title, date, tags, slug, shareUrl, summary, author, readingTime, cover, isDark])

	return (
		<>
			<motion.button
				
				onClick={() => setIsOpen(true)}
				className={cn(
					'flex items-center gap-2 rounded-xl border bg-white/60 dark:bg-[#27272a]/60 px-4 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-[#3f3f46]',
					className
				)}
			>
				<Share2 className='h-4 w-4' />
				分享
			</motion.button>

			{typeof document !== 'undefined' && createPortal(
				<AnimatePresence>
					{isOpen && (
						<motion.div
							key="backdrop"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
							style={{ zIndex: 9998 }}
							onClick={() => setIsOpen(false)}
						/>
					)}
					{isOpen && (
						<motion.div
							key="modal"
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4"
							style={{ zIndex: 9999 }}
						>
							<div className="bg-[var(--color-bg)] dark:bg-[var(--color-card)] backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden">
								{/* Header */}
								<div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center">
											<Share2 className="w-4 h-4 text-[var(--color-brand)]" />
										</div>
										<h3 className="text-lg font-semibold text-[var(--color-primary)]">分享文章</h3>
									</div>
									<button
										onClick={() => setIsOpen(false)}
										className="p-2 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-secondary)] transition-colors"
									>
										<X className="w-4 h-4" />
									</button>
								</div>

								{/* Preview Card */}
								<div className="p-6">
									<div
										ref={cardRef}
										className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-lg relative"
									>
										{/* Left accent bar */}
										<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-brand)]" />

										{/* Cover Image */}
										{cover && (
											<div className="relative h-48 overflow-hidden">
												<img
													src={cover}
													alt=""
													className="w-full h-full object-cover"
												/>
												<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
												{/* Title overlay on image */}
												<div className="absolute bottom-0 left-0 right-0 p-5">
													<h4 className="text-2xl font-bold text-white drop-shadow-lg line-clamp-2">
														{title}
													</h4>
												</div>
											</div>
										)}

										{/* Content */}
										<div className="p-5 pl-6">
											{/* No cover - show title here */}
											{!cover && (
												<h4 className="text-xl font-bold text-[var(--color-primary)] mb-3 line-clamp-2">
													{title}
												</h4>
											)}

											{/* Meta Info Pill */}
											<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-border)]/50 text-xs text-[var(--color-secondary)] mb-4">
											<span className="font-medium text-[var(--color-primary)]">{author}</span>
											<span className="w-1 h-1 rounded-full bg-[var(--color-secondary)]" />
												<span className="flex items-center gap-1">
													<Calendar className="w-3 h-3" />
													{date}
												</span>
												{readingTime && (
													<>
														<span className="w-1 h-1 rounded-full bg-[var(--color-secondary)]" />
														<span className="flex items-center gap-1">
															<Clock className="w-3 h-3" />
															{readingTime}
														</span>
													</>
												)}
											</div>

											{/* Tags */}
											{tags.length > 0 && (
												<div className="flex flex-wrap gap-2 mb-4">
													{tags.map(tag => (
														<span
															key={tag}
															className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-medium"
														>
															#{tag}
														</span>
													))}
												</div>
											)}

											{/* Summary */}
											{summary && (
												<p className="text-sm text-[var(--color-secondary)] mb-5 line-clamp-3 leading-relaxed">
													{summary}
												</p>
											)}

											{/* URL Bar */}
											<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-border)]/30 border border-[var(--color-border)]">
												<div className="w-2 h-2 rounded-full bg-[var(--color-brand)] shrink-0" />
												<Link2 className="w-3.5 h-3.5 text-[var(--color-secondary)] shrink-0" />
												<span className="text-sm text-[var(--color-brand)] truncate flex-1">{shareUrl}</span>
												<ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-secondary)] shrink-0" />
											</div>
										</div>

										{/* Footer brand */}
										<div className="px-5 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
											<span className="text-xs text-[var(--color-secondary)]">YYsuni Blog</span>
											<div className="flex items-center gap-1">
												<div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
												<div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-secondary)]" />
											</div>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-3 px-6 pb-6">
									<button
										onClick={handleCopyLink}
										className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-border)]/50 text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
									>
										{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
										{copied ? '已复制' : '复制链接'}
									</button>
									<button
										onClick={handleGenerateCard}
										disabled={generating}
										className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
									>
										<Download className="w-4 h-4" />
										{generating ? '生成中...' : '下载卡片'}
									</button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}
		</>
	)
}
