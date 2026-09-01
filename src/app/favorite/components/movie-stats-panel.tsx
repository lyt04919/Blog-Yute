'use client'

import { useState } from 'react'
import { 
	BarChart3, 
	Film, 
	Star, 
	Trophy, 
	Building2, 
	Home, 
	ChevronUp, 
	Sparkles, 
	Tag, 
	Image as ImageIcon, 
	ArrowUpRight, 
	Clock,
	Compass,
	Flame,
	Plane,
	Moon,
	Orbit,
	Globe
} from 'lucide-react'
import { type Movie, formatMovieRating, getMovieRating, getWatchCount } from './movie-card'
import MovieHeatmapCalendar from './movie-heatmap-calendar'
import MovieRadarChart from './movie-radar-chart'
import dynamic from 'next/dynamic'
const MovieReportModal = dynamic(() => import('./movie-report-modal'), { ssr: false })

interface MovieStatsPanelProps {
	movies: Movie[]
	selectedYear?: string
	isOpen: boolean
	onClose: () => void
	onOpenYearlyView?: () => void
	onSelectMovie?: (movie: Movie) => void
	onSelectTag?: (tag: string) => void
}

export default function MovieStatsPanel({ 
	movies, 
	selectedYear, 
	isOpen, 
	onClose, 
	onOpenYearlyView, 
	onSelectMovie, 
	onSelectTag 
}: MovieStatsPanelProps) {
	const [isReportModalOpen, setIsReportModalOpen] = useState(false)

	if (!isOpen || !movies || movies.length === 0) return null

	const isYearFiltered = Boolean(selectedYear && selectedYear !== 'all')

	// 1. Total & Watched vs Wishlist
	const totalCount = movies.length
	const watchedMovies = movies.filter(m => m.status === 'watched' || !m.status)
	const wishlistCount = movies.filter(m => m.status === 'wishlist').length
	const totalWatchSessions = movies.reduce((sum, m) => sum + getWatchCount(m), 0)
	const totalRuntimeMin = movies.reduce((sum, m) => sum + (m.runtime || 115) * getWatchCount(m), 0)
	const totalHours = (totalRuntimeMin / 60).toFixed(1)

	// Time Milestones Calculations
	const equivalentDays = (totalRuntimeMin / (60 * 24)).toFixed(1)
	const earthOrbits = (totalRuntimeMin / (60 * 45)).toFixed(1) // 45h per orbit at passenger cruising speed
	const cinemaRuntimeMin = movies
		.filter(m => m.watchMethod === 'cinema')
		.reduce((sum, m) => sum + (m.runtime || 115) * getWatchCount(m), 0)
	const cinemaHours = (cinemaRuntimeMin / 60).toFixed(1)
	const avgMovieRuntime = Math.round(totalRuntimeMin / (totalWatchSessions || 1))

	// 2. Average Score calculation (10-point scale)
	const moviesWithRating = movies.filter(m => m.stars > 0)
	const avgScore = moviesWithRating.length > 0
		? (moviesWithRating.reduce((sum, m) => sum + getMovieRating(m.stars), 0) / moviesWithRating.length).toFixed(1)
		: '0.0'

	// 3. Watch Method Ratio (Cinema vs Home)
	const cinemaCount = movies.filter(m => m.watchMethod === 'cinema').length
	const homeCount = movies.filter(m => m.watchMethod === 'home' || !m.watchMethod).length
	const cinemaRatio = totalCount > 0 ? Math.round((cinemaCount / totalCount) * 100) : 0
	const homeRatio = 100 - cinemaRatio

	// 4. Top 10 Count
	const top10Count = movies.filter(m => m.topRank && m.topRank >= 1 && m.topRank <= 10).length

	// 5. Popular Tags aggregation
	const tagCounts: Record<string, number> = {}
	movies.forEach(m => {
		m.tags.forEach(t => {
			const clean = t.trim()
			if (clean && clean !== 'all' && !clean.startsWith('TOP')) {
				tagCounts[clean] = (tagCounts[clean] || 0) + 1
			}
		})
	})
	const topTags = Object.entries(tagCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 6)

	return (
		<>
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-8 animate-in fade-in duration-300">
				<div className="rounded-3xl border transition-all duration-300 bg-white/90 dark:bg-[#0D1117]/90 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-xl dark:shadow-2xl overflow-hidden">
					
					{/* Panel Header & Actions */}
					<div className="w-full px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/5 via-slate-50/50 to-purple-500/5 dark:from-amber-500/10 dark:via-slate-900/40 dark:to-purple-500/10 border-b border-slate-200/60 dark:border-slate-800/60">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
								<BarChart3 className="w-5 h-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
										{isYearFiltered ? `${selectedYear} 年度观影数据大盘` : '观影数据统计分析'}
									</h3>
									<span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm shrink-0">
										{isYearFiltered ? `${selectedYear} STATS` : 'ANALYTICS'}
									</span>
								</div>
								<p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
									{isYearFiltered ? `已按 ${selectedYear} 年度筛选：收录统计、影院大银幕比例、评分分布与类型口味` : '全面汇总个人观影足迹、时光里程碑换算、评分均值与类型口味雷达'}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
							{/* Generate Movie Report Button */}
							<button
								type="button"
								onClick={() => setIsReportModalOpen(true)}
								className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md hover:shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
								title="一键生成专属战报海报"
							>
								<Sparkles className="w-3.5 h-3.5" />
								<span>生成观影报告 🎨</span>
							</button>

							{onOpenYearlyView && (
								<button
									type="button"
									onClick={onOpenYearlyView}
									className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
									title="进入电影海报相册画廊"
								>
									<ImageIcon className="w-3.5 h-3.5 text-amber-500" />
									<span>海报相册</span>
									<ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
								</button>
							)}

							<button
								type="button"
								onClick={onClose}
								className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-xl transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
								title="收起图表大盘"
							>
								<span>收起</span>
								<ChevronUp className="w-4 h-4" />
							</button>
						</div>
					</div>

					<div className="p-5 sm:p-6 space-y-5">
						{/* 1. Four Summary Metric Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
							
							{/* Card 1: Average Rating */}
							<div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex flex-col justify-between shadow-xs transition-all hover:border-amber-500/40">
								<div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
									<span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
										<Star className="w-4 h-4 fill-current text-amber-500" /> 观影均分
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
										10.0分制
									</span>
								</div>
								<div className="flex items-baseline gap-1.5 my-1">
									<span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
										{avgScore}
									</span>
									<span className="text-xs text-slate-500 dark:text-slate-400 font-bold">/ 10 分</span>
								</div>
								<div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
									基于已评定星级的 <span className="font-bold text-slate-700 dark:text-slate-200">{moviesWithRating.length}</span> 部作品
								</div>
							</div>

							{/* Card 2: Collection Total */}
							<div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/25 flex flex-col justify-between shadow-xs transition-all hover:border-blue-500/40">
								<div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
									<span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
										<Film className="w-4 h-4 text-blue-500" /> 影片收藏
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 font-extrabold">
										TOTAL
									</span>
								</div>
								<div className="flex items-baseline gap-1.5 my-1">
									<span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
										{totalCount}
									</span>
									<span className="text-xs text-slate-500 dark:text-slate-400 font-bold">部电影</span>
								</div>
								<div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
									<span>已看 <strong className="text-slate-800 dark:text-slate-200">{watchedMovies.length}</strong> 部</span>
									<span className="font-mono text-amber-600 dark:text-amber-400 font-bold">({totalWatchSessions} 场 · {totalHours}h)</span>
									{wishlistCount > 0 && <span className="text-slate-400">• 想看 {wishlistCount}</span>}
								</div>
							</div>

							{/* Card 3: Cinema vs Home */}
							<div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/25 flex flex-col justify-between shadow-xs transition-all hover:border-purple-500/40">
								<div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
									<span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
										<Building2 className="w-4 h-4 text-purple-500" /> 观影场景占比
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold">
										RATIO
									</span>
								</div>
								
								{/* Segmented Dual Bar */}
								<div className="my-1 space-y-1.5">
									<div className="flex items-center justify-between text-xs font-bold">
										<span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
											🏛️ 影院 {cinemaCount} 部 ({cinemaRatio}%)
										</span>
										<span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
											🏠 居家 {homeCount} 部
										</span>
									</div>
									<div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
										<div 
											style={{ width: `${cinemaRatio}%` }} 
											className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
											title={`大银幕: ${cinemaRatio}%`}
										/>
										<div 
											style={{ width: `${homeRatio}%` }} 
											className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500" 
											title={`居家: ${homeRatio}%`}
										/>
									</div>
								</div>

								<div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
									影院大银幕沉浸占比 <span className="font-bold text-purple-600 dark:text-purple-400">{cinemaRatio}%</span>
								</div>
							</div>

							{/* Card 4: Top Tags & Badges */}
							<div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 flex flex-col justify-between shadow-xs transition-all hover:border-emerald-500/40">
								<div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
									<span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
										<Tag className="w-4 h-4 text-emerald-500" /> 核心偏好标签
									</span>
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1">
										<Trophy className="w-3 h-3 text-amber-500" /> {top10Count} TOP
									</span>
								</div>

								<div className="flex flex-wrap gap-1.5 my-1">
									{topTags.map(([tag, count]) => (
										<button
											key={tag}
											type="button"
											onClick={() => onSelectTag?.(tag)}
											className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
											title={`筛选 #${tag} 电影`}
										>
											#{tag} <span className="opacity-75 font-normal">({count})</span>
										</button>
									))}
								</div>

								<div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
									已精选 <span className="font-bold text-emerald-600 dark:text-emerald-400">{top10Count}</span> 部入选个人年度榜单
								</div>
							</div>
						</div>

						{/* 2. Cinematic Time Milestones (时光光影里程碑换算) */}
						<div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-blue-500/10 border border-amber-500/20 dark:border-amber-500/15 relative overflow-hidden">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
								<div className="flex items-center gap-2.5">
									<div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 shrink-0">
										<Clock className="w-4 h-4" />
									</div>
									<div>
										<h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
											<span>时光光影里程碑换算</span>
											<span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
												TIME MILESTONES
											</span>
										</h4>
										<p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
											将投入在电影世界的生命刻度，换算为真实的浪漫时空旅程
										</p>
									</div>
								</div>

								<div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 self-start md:self-center bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
									<span className="text-amber-500">✨ 累计光影:</span>
									<strong className="text-sm font-black text-slate-900 dark:text-white">{totalHours}</strong>
									<span>小时</span>
									<span className="text-slate-400 text-[10px]">({totalRuntimeMin.toLocaleString()} 分钟)</span>
								</div>
							</div>

							{/* 4 Milestone conversion pills */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
								{/* Milestone 1: 完整日夜 */}
								<div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs transition-all hover:border-amber-500/40">
									<div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
										🌙
									</div>
									<div className="min-w-0">
										<div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
											时空沉浸日夜
										</div>
										<div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
											{equivalentDays} <span className="text-xs font-normal text-slate-500">个日夜</span>
										</div>
										<div className="text-[10px] text-slate-500 truncate mt-0.5">
											等效 24h 不间断穿梭
										</div>
									</div>
								</div>

								{/* Milestone 2: 环球飞行 */}
								<div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs transition-all hover:border-blue-500/40">
									<div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
										✈️
									</div>
									<div className="min-w-0">
										<div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
											环球客机航程
										</div>
										<div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
											{earthOrbits} <span className="text-xs font-normal text-slate-500">圈赤道</span>
										</div>
										<div className="text-[10px] text-slate-500 truncate mt-0.5">
											约 {(Math.round(parseFloat(totalHours) * 900)).toLocaleString()} km 空中漫游
										</div>
									</div>
								</div>

								{/* Milestone 3: 影院大银幕仪式感 */}
								<div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs transition-all hover:border-purple-500/40">
									<div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0">
										🏛️
									</div>
									<div className="min-w-0">
										<div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
											大银幕沉浸
										</div>
										<div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
											{cinemaHours} <span className="text-xs font-normal text-slate-500">小时</span>
										</div>
										<div className="text-[10px] text-slate-500 truncate mt-0.5">
											贡献了 {cinemaCount} 场影院入座
										</div>
									</div>
								</div>

								{/* Milestone 4: 多重人生与平行宇宙 */}
								<div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs transition-all hover:border-emerald-500/40">
									<div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
										🪐
									</div>
									<div className="min-w-0">
										<div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
											平行人生体验
										</div>
										<div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
											{totalCount} <span className="text-xs font-normal text-slate-500">种人生</span>
										</div>
										<div className="text-[10px] text-slate-500 truncate mt-0.5">
											均片长 {avgMovieRuntime} 分钟 / 故事
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* 3. Bottom Analytics: 365-Day Heatmap & Taste Radar Chart */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
							<div className="lg:col-span-2 flex flex-col">
								<MovieHeatmapCalendar movies={movies} onSelectMovie={onSelectMovie} />
							</div>
							<div className="lg:col-span-1 flex flex-col">
								<MovieRadarChart movies={movies} onSelectTag={onSelectTag} />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Movie Report Poster Modal */}
			{isReportModalOpen && (
				<MovieReportModal
					isOpen={isReportModalOpen}
					onClose={() => setIsReportModalOpen(false)}
					movies={movies}
					selectedYear={selectedYear}
				/>
			)}
		</>
	)
}
