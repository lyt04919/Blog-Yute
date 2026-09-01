'use client'

import { useState } from 'react'
import { 
	BarChart3, 
	BookOpen, 
	Star, 
	Sparkles, 
	Tag, 
	Bookmark, 
	ChevronUp
} from 'lucide-react'
import type { Book } from './book-card'
import dynamic from 'next/dynamic'
const BookReportModal = dynamic(() => import('./book-report-modal'), { ssr: false })
import BookHeatmapCalendar from './book-heatmap-calendar'
import BookRadarChart from './book-radar-chart'

interface BookStatsPanelProps {
	books: Book[]
	selectedYear?: string
	isOpen: boolean
	onClose: () => void
	onOpenYearlyView?: () => void
	onSelectBook?: (book: Book) => void
	onSelectTag?: (tag: string) => void
}

export default function BookStatsPanel({ 
	books, 
	selectedYear, 
	isOpen, 
	onClose, 
	onOpenYearlyView, 
	onSelectBook,
	onSelectTag 
}: BookStatsPanelProps) {
	const [isReportModalOpen, setIsReportModalOpen] = useState(false)

	if (!isOpen || !books || books.length === 0) return null

	const isYearFiltered = Boolean(selectedYear && selectedYear !== 'all')

	// 1. Total & Finished vs Reading vs Wishlist
	const totalCount = books.length
	const finishedBooks = books.filter(b => b.status === 'finished' || (!b.status && b.readDate))
	const readingBooks = books.filter(b => b.status === 'reading')
	const wishlistBooks = books.filter(b => b.status === 'wishlist')

	const finishedCount = finishedBooks.length
	const readingCount = readingBooks.length
	const wishlistCount = wishlistBooks.length

	// 2. Average Score
	const booksWithRating = books.filter(b => typeof b.stars === 'number' && b.stars > 0)
	const avgScore = booksWithRating.length > 0
		? ((booksWithRating.reduce((sum, b) => sum + (b.stars || 0) * 2, 0)) / booksWithRating.length).toFixed(1)
		: '0.0'

	// 3. Top Tags
	const tagCounts: Record<string, number> = {}
	books.forEach(b => {
		b.tags?.forEach(t => {
			const tag = t.trim()
			if (tag && tag.toLowerCase() !== 'all') {
				tagCounts[tag] = (tagCounts[tag] || 0) + 1
			}
		})
	})
	const topTags = Object.entries(tagCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 6)

	// Finished completion percentage
	const finishedRatio = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0

	return (
		<>
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-8 animate-in fade-in duration-300">
				<div className="rounded-3xl border transition-all duration-300 bg-white dark:bg-[#0D1117] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
					
					{/* Panel Header & Actions */}
					<div className="w-full px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
								<BarChart3 className="w-5 h-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
										{isYearFiltered ? `${selectedYear} 年度阅读数据大盘` : '阅读数据统计分析'}
									</h3>
									<span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shrink-0">
										{isYearFiltered ? `${selectedYear} STATS` : 'ANALYTICS'}
									</span>
								</div>
								<p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
									{isYearFiltered ? `已按 ${selectedYear} 年度筛选：完成本数、在读追踪、评分分布与领域雷达` : '全面汇总个人藏书足迹、结卷进度、评分均值与知识体系雷达'}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2.5 flex-wrap self-end sm:self-center">
							{/* Generate Book Report Button - Solid High Contrast Blue */}
							<button
								type="button"
								onClick={() => setIsReportModalOpen(true)}
								className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
								title="一键生成专属阅读年报"
							>
								<Sparkles className="w-3.5 h-3.5" />
								<span>生成阅读报告 🎨</span>
							</button>

							<button
								type="button"
								onClick={onClose}
								className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
								title="收起图表大盘"
							>
								<span>收起</span>
								<ChevronUp className="w-4 h-4" />
							</button>
						</div>
					</div>

					<div className="p-5 sm:p-6 space-y-6">
						{/* 1. Four Summary Metric Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							
							{/* Card 1: Average Rating */}
							<div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex flex-col justify-between shadow-xs">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
										<Star className="w-4 h-4 fill-amber-500 text-amber-500" /> 阅读均分
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold border border-amber-300/80 dark:border-amber-700/50">
										10.0分制
									</span>
								</div>
								<div className="flex items-baseline gap-1.5 my-1">
									<span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
										{avgScore}
									</span>
									<span className="text-xs text-slate-500 dark:text-slate-400 font-bold">/ 10 分</span>
								</div>
								<div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">
									基于已评定星级的 <strong className="text-slate-900 dark:text-slate-200">{booksWithRating.length}</strong> 部书籍
								</div>
							</div>

							{/* Card 2: Collection Total */}
							<div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 flex flex-col justify-between shadow-xs">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
										<BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 藏书收录
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-200/80 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 font-bold border border-blue-300/80 dark:border-blue-700/50">
										TOTAL
									</span>
								</div>
								<div className="flex items-baseline gap-1.5 my-1">
									<span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
										{totalCount}
									</span>
									<span className="text-xs text-slate-500 dark:text-slate-400 font-bold">本书籍</span>
								</div>
								<div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
									<span>已读 <strong className="text-slate-900 dark:text-slate-200">{finishedCount}</strong> 本</span>
									<span className="font-mono text-blue-700 dark:text-blue-300 font-bold">({readingCount} 本在读)</span>
									{wishlistCount > 0 && <span className="text-slate-400">• 想读 {wishlistCount}</span>}
								</div>
							</div>

							{/* Card 3: Reading Progress & Ratio */}
							<div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex flex-col justify-between shadow-xs">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
										<Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 结卷完成率
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 font-bold border border-emerald-300/80 dark:border-emerald-700/50">
										{finishedRatio}%
									</span>
								</div>
								
								{/* Segmented Dual Bar */}
								<div className="my-1 space-y-1.5">
									<div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
										<span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
											✅ 已读 {finishedCount} 本
										</span>
										<span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
											📖 在读 {readingCount} 本
										</span>
									</div>
									<div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
										<div 
											style={{ width: `${finishedRatio}%` }} 
											className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
											title={`已读完成: ${finishedRatio}%`}
										/>
										<div 
											style={{ width: `${100 - finishedRatio}%` }} 
											className="h-full bg-blue-500 rounded-full transition-all duration-500" 
											title={`在读/待读: ${100 - finishedRatio}%`}
										/>
									</div>
								</div>

								<div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">
									已完成 <strong className="text-slate-900 dark:text-slate-100">{finishedCount}</strong> 本 · <strong className="text-blue-700 dark:text-blue-400">{readingCount}</strong> 本在读进行中
								</div>
							</div>

							{/* Card 4: Top Tags & Badges */}
							<div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 flex flex-col justify-between shadow-xs">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-purple-900 dark:text-purple-300">
										<Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" /> 核心领域标签
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 font-bold border border-purple-300/80 dark:border-purple-700/50">
										TOP {topTags.length}
									</span>
								</div>

								<div className="flex flex-wrap gap-1.5 my-1">
									{topTags.map(([tag, count]) => (
										<button
											key={tag}
											type="button"
											onClick={() => onSelectTag?.(tag)}
											className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700/70 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all cursor-pointer active:scale-95 shadow-2xs"
											title={`筛选 #${tag} 图书`}
										>
											#{tag} <span className="opacity-70 font-normal">({count})</span>
										</button>
									))}
								</div>

								<div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">
									点击标签可在下方书库中快捷筛选
								</div>
							</div>
						</div>

						{/* 2. Visualizations: 365-Day Heatmap & Knowledge Radar Chart */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
							<div className="lg:col-span-2 flex flex-col">
								<BookHeatmapCalendar books={books} onSelectBook={onSelectBook} />
							</div>
							<div className="lg:col-span-1 flex flex-col">
								<BookRadarChart books={books} onSelectTag={onSelectTag} />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Book Report Modal */}
			{isReportModalOpen && (
				<BookReportModal
					isOpen={isReportModalOpen}
					onClose={() => setIsReportModalOpen(false)}
					books={books}
				/>
			)}
		</>
	)
}
