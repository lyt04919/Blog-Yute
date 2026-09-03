'use client'

import { useState } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { Check, ArrowRight, BookIcon, Clock } from 'lucide-react'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

export interface BlogGridCardProps {
	blog: BlogIndexItem
	editMode?: boolean
	isSelected?: boolean
	isRead?: boolean
	onToggleSelect?: (slug: string) => void
	onClick?: (e: React.MouseEvent, slug: string) => void
}

export function BlogGridCard({
	blog,
	editMode = false,
	isSelected = false,
	isRead = false,
	onToggleSelect,
	onClick
}: BlogGridCardProps) {
	const [imageLoaded, setImageLoaded] = useState(false)
	const [imageError, setImageError] = useState(false)

	const primaryTag = blog.category?.trim() || blog.tags?.[0]?.trim()
	const summaryText =
		blog.summary && blog.summary !== '暂无描述'
			? blog.summary
			: '点击阅读文章技术细节与深入探索...'

	// 预估阅读时间 (基于摘要长度与预设权重，通常 3~5 分钟)
	const estimatedMinutes = Math.max(2, Math.min(8, Math.round((summaryText.length) / 35) + 2))

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
		<div className={cn('group relative h-full', editMode && 'cursor-pointer')}>
			{/* 编辑模式多选勾选框 */}
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
						'absolute top-3.5 left-3.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border transition-all shadow-sm',
						isSelected
							? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)] ring-2 ring-[var(--color-primary)]/20'
							: 'border-[var(--color-border)] bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-transparent hover:border-[var(--color-primary)]'
					)}
				>
					<Check className="h-3.5 w-3.5 stroke-[2.5]" />
				</button>
			)}

			<Link
				href={`/blog/${blog.slug}`}
				onClick={handleCardClick}
				className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-2xl"
			>
				<article
					className={cn(
						'h-full flex flex-col overflow-hidden rounded-2xl border transition-all duration-300',
						'bg-[var(--color-card)] border-[var(--color-border)]',
						editMode && isSelected
							? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/15 shadow-sm'
							: 'hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.35)] hover:border-[var(--color-primary)]/25'
					)}
				>
					{/* 封面容器：微内衬底与画框边缘 */}
					<div className="overflow-hidden aspect-[16/10] relative bg-slate-100/80 dark:bg-zinc-800/60 border-b border-black/[0.04] dark:border-white/[0.05]">
						{blog.cover && !imageError ? (
							<>
								{!imageLoaded && (
									<div className="absolute inset-0 bg-slate-200/50 dark:bg-zinc-800 animate-pulse" />
								)}
								<img
									src={blog.cover}
									alt={blog.title || blog.slug}
									loading="lazy"
									onLoad={() => setImageLoaded(true)}
									onError={() => setImageError(true)}
									className={cn(
										'w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105',
										!imageLoaded && 'opacity-0'
									)}
								/>
							</>
						) : (
							<div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-secondary)]/40 gap-2">
								<BookIcon className="h-8 w-8 stroke-[1.5]" />
								<span className="text-[10px] tracking-wider uppercase font-mono">Article</span>
							</div>
						)}
					</div>

					{/* 内容排版区 */}
					<div className="p-5 flex flex-col flex-grow">
						{/* 元信息标签栏 */}
						<div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
							{/* 仅在草稿时显示草稿标签，已发布默认干净不干扰 */}
							{blog.status === 'draft' && (
								<span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
									草稿
								</span>
							)}

							{/* 分类 / 核心标签（过滤掉无意义的 Blog 占位） */}
							{primaryTag && primaryTag.toLowerCase() !== 'blog' && (
								<span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300">
									{primaryTag}
								</span>
							)}

							{/* 发布日期 */}
							<time className="text-[11px] text-[var(--color-secondary)]">
								{dayjs(blog.date).format('YYYY-MM-DD')}
							</time>

							{/* 已读状态指示 */}
							{isRead && (
								<span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 ml-auto bg-emerald-500/10 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20">
									<Check className="w-2.5 h-2.5" /> 已读
								</span>
							)}
						</div>

						{/* 标题：规范为精致现代无衬线体 (PingFang SC)，对齐 DESIGN.md */}
						<h3
							className={cn(
								'text-base sm:text-lg font-semibold tracking-tight leading-snug line-clamp-2 mb-2 transition-colors',
								isRead
									? 'text-slate-700 dark:text-zinc-300 group-hover:text-[var(--color-brand)]'
									: 'text-[var(--color-primary)] group-hover:text-[var(--color-brand)]'
							)}
						>
							{blog.title || blog.slug}
						</h3>

						{/* 摘要：统一高度节奏 */}
						<p className="text-xs sm:text-sm text-[var(--color-secondary)] line-clamp-2 leading-relaxed mb-3 min-h-[2.5rem]">
							{summaryText}
						</p>

						{/* 标签微标 */}
						{blog.tags && blog.tags.length > 0 && (
							<div className="flex items-center gap-1.5 mb-3 flex-wrap">
								{blog.tags.slice(0, 3).map(tag => (
									<span
										key={tag}
										className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border border-slate-200/40 dark:border-zinc-700/40"
									>
										#{tag}
									</span>
								))}
							</div>
						)}

						{/* 卡片底部操作与预估时长 */}
						<div className="mt-auto pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between text-xs text-[var(--color-secondary)]">
							<span className="inline-flex items-center gap-1.5 text-[11px] opacity-80">
								<Clock className="w-3 h-3" />
								{estimatedMinutes} 分钟阅读
							</span>

							<span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors">
								阅读全文
								<ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
							</span>
						</div>
					</div>
				</article>
			</Link>
		</div>
	)
}
