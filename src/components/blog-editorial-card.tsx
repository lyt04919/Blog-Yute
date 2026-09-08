'use client'

import { useState } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { Check, ArrowRight, BookIcon, Clock, Sparkles, Tag } from 'lucide-react'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

export interface BlogEditorialCardProps {
	blog: BlogIndexItem
	isHero?: boolean
	editMode?: boolean
	isSelected?: boolean
	isRead?: boolean
	onToggleSelect?: (slug: string) => void
	onClick?: (e: React.MouseEvent, slug: string) => void
	className?: string
}

export function BlogEditorialCard({
	blog,
	isHero = false,
	editMode = false,
	isSelected = false,
	isRead = false,
	onToggleSelect,
	onClick,
	className
}: BlogEditorialCardProps) {
	const [imageLoaded, setImageLoaded] = useState(false)
	const [imageError, setImageError] = useState(false)

	const primaryTag = blog.category?.trim() || blog.tags?.[0]?.trim()
	const allTags = blog.tags || []
	const summaryText =
		blog.summary && blog.summary !== '暂无描述'
			? blog.summary
			: '深入探索技术细节、架构设计与工程实践方案...'

	// 预估阅读时间
	const estimatedMinutes = Math.max(2, Math.min(10, Math.round(summaryText.length / 28) + 2))

	const handleCardClick = (e: React.MouseEvent) => {
		if (editMode) {
			e.preventDefault()
			e.stopPropagation()
			onToggleSelect?.(blog.slug)
		} else {
			onClick?.(e, blog.slug)
		}
	}

	return (
		<div className={cn('group relative w-full', editMode && 'cursor-pointer', className)}>
			{/* 编辑模式勾选按钮 */}
			{editMode && (
				<button
					type="button"
					onClick={e => {
						e.preventDefault()
						e.stopPropagation()
						onToggleSelect?.(blog.slug)
					}}
					aria-label={isSelected ? '取消选择' : '选择文章'}
					className={cn(
						'absolute top-4 left-4 z-30 flex h-6 w-6 items-center justify-center rounded-full border transition-all shadow-md',
						isSelected
							? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)] ring-2 ring-[var(--color-primary)]/20'
							: 'border-[var(--color-border)] bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm text-transparent hover:border-[var(--color-primary)]'
					)}
				>
					<Check className="h-3.5 w-3.5 stroke-[2.5]" />
				</button>
			)}

			<Link
				href={`/blog/${blog.slug}`}
				onClick={handleCardClick}
				className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-3xl"
			>
				<article
					className={cn(
						'w-full flex flex-col md:flex-row items-stretch overflow-hidden rounded-3xl border transition-all duration-300',
						'bg-[var(--color-card)] border-[var(--color-border)]',
						isHero
							? 'shadow-[0_16px_36px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.45)] hover:border-[var(--color-primary)]/30 hover:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.12)]'
							: 'hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.35)] hover:border-[var(--color-primary)]/25',
						editMode && isSelected && 'ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)]'
					)}
				>
					{/* 左侧封面大图容器 */}
					<div
						className={cn(
							'relative overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-800/80 w-full md:w-72 lg:w-80 h-48 sm:h-56 md:h-auto min-h-[180px]'
						)}
					>
						{blog.cover && !imageError ? (
							<>
								{!imageLoaded && (
									<div className="absolute inset-0 bg-slate-200/60 dark:bg-zinc-800 animate-pulse" />
								)}
								<img
									src={blog.cover}
									alt={blog.title || blog.slug}
									loading="lazy"
									onLoad={() => setImageLoaded(true)}
									onError={() => setImageError(true)}
									className={cn(
										'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105',
										!imageLoaded && 'opacity-0'
									)}
								/>
							</>
						) : (
							<div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-secondary)]/40 gap-3 p-8">
								<BookIcon className="h-10 w-10 stroke-[1.2]" />
								<span className="text-xs tracking-widest uppercase font-mono">Editorial Essay</span>
							</div>
						)}

						{/* 微渐变内阴影，增加大图相框质感 */}
						<div className="absolute inset-0 pointer-events-none border-b md:border-b-0 md:border-r border-black/[0.04] dark:border-white/[0.05]" />

						{/* 头条精选角标 */}
						{isHero && (
							<div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 dark:bg-white/90 text-white dark:text-slate-950 backdrop-blur-md text-[11px] font-semibold tracking-wide shadow-md">
								<Sparkles className="w-3 h-3 text-amber-400 dark:text-amber-500 fill-amber-400 dark:fill-amber-500" />
								<span>精选头条 · FEATURED</span>
							</div>
						)}
					</div>

					{/* 右侧深度导读内容区 */}
					<div
						className={cn(
							'flex flex-col justify-between flex-grow min-w-0',
							isHero ? 'p-5 sm:p-6 lg:p-7' : 'p-4 sm:p-5 lg:p-6'
						)}
					>
						<div>
							{/* 元信息标签栏 */}
							<div className="flex items-center gap-2 mb-2.5 flex-wrap text-xs">
								{/* 草稿标识 */}
								{blog.status === 'draft' && (
									<span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
										草稿
									</span>
								)}

								{/* 主分类胶囊 */}
								{primaryTag && primaryTag.toLowerCase() !== 'blog' && (
									<span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
										{primaryTag}
									</span>
								)}

								{/* 发布日期 */}
								<time className="text-xs text-[var(--color-secondary)] font-medium">
									{dayjs(blog.date).format('YYYY-MM-DD')}
								</time>

								{/* 阅读时间预估 */}
								<span className="inline-flex items-center gap-1 text-xs text-[var(--color-secondary)]/80">
									<Clock className="w-3 h-3" />
									{estimatedMinutes} 分钟阅读
								</span>

								{/* 已读状态指示 */}
								{isRead && (
									<span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 ml-auto bg-emerald-500/10 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-500/20">
										<Check className="w-3 h-3" /> 已读
									</span>
								)}
							</div>

							{/* 标题 */}
							<h3
								className={cn(
									'font-semibold tracking-tight transition-colors mb-2 leading-snug',
									isHero
										? 'text-lg sm:text-xl lg:text-2xl line-clamp-2'
										: 'text-base sm:text-lg line-clamp-2',
									isRead
										? 'text-slate-700 dark:text-zinc-300 group-hover:text-[var(--color-brand)]'
										: 'text-[var(--color-primary)] group-hover:text-[var(--color-brand)]'
								)}
							>
								{blog.title || blog.slug}
							</h3>

							{/* 摘要导读 */}
							<p
								className={cn(
									'text-[var(--color-secondary)] leading-relaxed mb-4 text-xs sm:text-sm',
									isHero
										? 'line-clamp-2 sm:line-clamp-3'
										: 'line-clamp-2'
								)}
							>
								{summaryText}
							</p>
						</div>

						{/* 底部：标签云与阅读动作 */}
						<div className="pt-3 border-t border-[var(--color-border)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							{/* 标签组 */}
							<div className="flex items-center gap-1.5 flex-wrap">
								{allTags.slice(0, 3).map(tag => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-700/50"
									>
										#{tag}
									</span>
								))}
							</div>

							{/* 阅读动作 CTA */}
							<div className="self-end sm:self-auto">
								{isHero ? (
									<span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm group-hover:bg-[var(--color-brand)] transition-colors">
										开始阅读
										<ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
									</span>
								) : (
									<span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors">
										阅读全文
										<ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
									</span>
								)}
							</div>
						</div>
					</div>
				</article>
			</Link>
		</div>
	)
}
