'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import Link from 'next/link'
import dayjs from 'dayjs'
import Fuse from 'fuse.js'

interface BlogSearchProps {
	items: BlogIndexItem[]
	className?: string
}

export function BlogSearch({ items, className }: BlogSearchProps) {
	const [query, setQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const fuse = useMemo(() => {
		return new Fuse(items, {
			keys: [
				{ name: 'title', weight: 1.0 },
				{ name: 'slug', weight: 0.8 },
				{ name: 'tags', weight: 0.7 },
				{ name: 'category', weight: 0.5 },
				{ name: 'summary', weight: 0.5 }
			],
			threshold: 0.4,
			ignoreLocation: true,
			useExtendedSearch: true
		})
	}, [items])

	const filteredItems = useMemo(() => {
		if (!query.trim()) return []
		return fuse.search(query).map(result => result.item).slice(0, 8)
	}, [query, fuse])

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		// Escape to close
		if (e.key === 'Escape') {
			setIsOpen(false)
			setQuery('')
		}

		if (!isOpen) return

		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActiveIndex(prev => (prev + 1) % filteredItems.length)
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
		}
		if (e.key === 'Enter' && filteredItems.length > 0) {
			e.preventDefault()
			const item = filteredItems[activeIndex]
			if (item) {
				window.location.href = `/blog/${item.slug}`
			}
		}
	}, [isOpen, filteredItems, activeIndex])

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])

	useEffect(() => {
		setActiveIndex(0)
	}, [query])

	// Click outside to close
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	return (
		<div ref={containerRef} className={cn('relative', className)}>
			{/* Search Trigger Button */}
			<button
				onClick={() => {
					setIsOpen(true)
					setTimeout(() => inputRef.current?.focus(), 100)
				}}
				className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors w-full md:w-56"
			>
				<Search className="w-3.5 h-3.5 text-slate-400" />
				<span className="flex-1 text-left">搜索文章...</span>
			</button>

			{/* Search Modal */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
							onClick={() => setIsOpen(false)}
						/>

						{/* Search Panel */}
						<motion.div
							initial={{ opacity: 0, y: -20, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -20, scale: 0.95 }}
							transition={{ duration: 0.2 }}
							className="fixed left-1/2 top-[20vh] -translate-x-1/2 w-full max-w-xl z-50 px-4"
						>
							<div className="bg-white dark:bg-[#27272a]/90 dark:bg-[#18181b]/90 backdrop-blur-xl rounded-2xl border border-[#e4e4e7] dark:border-[#3f3f46] shadow-2xl overflow-hidden">
								{/* Search Input */}
								<div className="flex items-center gap-3 px-4 py-3 border-b border-[#f4f4f5] dark:border-[#27272a]">
									<Search className="w-5 h-5 text-[#a1a1aa]" />
									<input
										ref={inputRef}
										type="text"
										value={query}
										onChange={e => setQuery(e.target.value)}
										placeholder="搜索文章标题、标签..."
										className="flex-1 bg-transparent outline-none text-[#18181b] dark:text-[#f4f4f5] placeholder:text-[#a1a1aa] text-base"
									/>
									{query && (
										<button
											onClick={() => {
												setQuery('')
												inputRef.current?.focus()
											}}
											className="p-1 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] text-[#a1a1aa]"
										>
											<X className="w-4 h-4" />
										</button>
									)}
									<kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded bg-[#f4f4f5] dark:bg-[#27272a] text-[10px] font-mono text-[#71717a] dark:text-[#a1a1aa]">
										ESC
									</kbd>
								</div>

								{/* Results */}
								<div className="max-h-[400px] overflow-y-auto">
									{query.trim() && filteredItems.length === 0 && (
										<div className="px-4 py-8 text-center text-[#a1a1aa] dark:text-[#71717a] text-sm">
											未找到相关文章
										</div>
									)}

									{filteredItems.map((item, index) => (
										<Link
											key={item.slug}
											href={`/blog/${item.slug}`}
											onClick={() => {
												setIsOpen(false)
												setQuery('')
											}}
											className={cn(
												'flex items-center gap-3 px-4 py-3 transition-colors',
												index === activeIndex
													? 'bg-[#f4f4f5] dark:bg-[#27272a]'
													: 'hover:bg-[#fafafa] dark:hover:bg-[#27272a]/50'
											)}
											onMouseEnter={() => setActiveIndex(index)}
										>
											{item.cover && (
												<img
													src={item.cover}
													alt=""
													className="w-10 h-10 rounded-lg object-cover shrink-0"
												/>
											)}
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-[#18181b] dark:text-[#f4f4f5] truncate">
													{item.title || item.slug}
												</div>
												<div className="flex items-center gap-2 mt-0.5">
													<span className="text-xs text-[#a1a1aa] dark:text-[#71717a]">
														{dayjs(item.date).format('YYYY-MM-DD')}
													</span>
													{item.tags && item.tags.length > 0 && (
														<div className="flex items-center gap-1">
															{item.tags.slice(0, 3).map(tag => (
																<span
																	key={tag}
																	className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f4f4f5] dark:bg-[#27272a] text-[#71717a] dark:text-[#a1a1aa]"
																>
																	{tag}
																</span>
															))}
														</div>
													)}
												</div>
											</div>
											{index === activeIndex && (
												<kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-[#f4f4f5] dark:bg-[#27272a] text-[10px] font-mono text-[#a1a1aa]">
													↵
												</kbd>
											)}
										</Link>
									))}
								</div>

								{/* Footer */}
								<div className="flex items-center justify-between px-4 py-2 border-t border-[#f4f4f5] dark:border-[#27272a] text-[10px] text-[#a1a1aa] dark:text-[#71717a]">
									<div className="flex items-center gap-3">
										<span className="flex items-center gap-1">
											<kbd className="px-1 rounded bg-[#f4f4f5] dark:bg-[#27272a]">↑↓</kbd>
											导航
										</span>
										<span className="flex items-center gap-1">
											<kbd className="px-1 rounded bg-[#f4f4f5] dark:bg-[#27272a]">↵</kbd>
											选择
										</span>
									</div>
									<span>{filteredItems.length} 个结果</span>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	)
}
