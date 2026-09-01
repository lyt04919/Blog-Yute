'use client'

import { useState, useMemo } from 'react'
import { 
	BarChart3, 
	Gamepad2, 
	Music, 
	Video, 
	Star, 
	Trophy, 
	Sparkles, 
	Tag, 
	Clock, 
	Flame, 
	Bookmark, 
	CheckCircle2, 
	TrendingUp,
	Tv,
	Layers,
	Disc,
	Mic2,
	Dices,
	X
} from 'lucide-react'
import { toast } from 'sonner'
import type { FavoriteItem } from './favorite-item-card'
import { getMusicItemType, getVideoPlatform } from './favorite-item-card'
import dynamic from 'next/dynamic'
const FavoriteItemReportModal = dynamic(() => import('./favorite-item-report-modal'), { ssr: false })
import { FavoriteItemDetailModal } from './favorite-item-detail-modal'
import { cn } from '@/lib/utils'

interface FavoriteItemStatsPanelProps {
	items: FavoriteItem[]
	targetType: 'music' | 'games' | 'videos' | 'gears' | 'software'
	isOpen: boolean
	onClose: () => void
	onSelectCategory?: (category: string) => void
	onSelectItem?: (item: FavoriteItem) => void
}

export default function FavoriteItemStatsPanel({
	items,
	targetType,
	isOpen,
	onClose,
	onSelectCategory,
	onSelectItem
}: FavoriteItemStatsPanelProps) {
	const [isReportModalOpen, setIsReportModalOpen] = useState(false)
	const [selectedModalItem, setSelectedModalItem] = useState<FavoriteItem | null>(null)

	if (!isOpen || !items || items.length === 0) return null

	const totalCount = items.length

	// Type-specific icon and branding
	const typeConfig = useMemo(() => {
		if (targetType === 'games') {
			return {
				title: '游戏成就看板',
				subtitle: '探索虚拟世界 · 记录每一场冒险与通关时刻',
				icon: Gamepad2,
				color: 'emerald',
				colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
				completedLabel: '已通关',
				inProgressLabel: '正在玩',
				wishlistLabel: '想玩',
				stat1Label: '游戏库总数',
				stat2Label: '通关战绩',
				stat3Label: '均分评价'
			}
		}
		if (targetType === 'music') {
			return {
				title: '音乐回响看板',
				subtitle: '收藏旋律共鸣 · 沉淀每一段声乐律动与心动瞬间',
				icon: Music,
				color: 'rose',
				colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
				completedLabel: '唱片专辑',
				inProgressLabel: '精选单曲',
				wishlistLabel: '收藏艺术家',
				stat1Label: '乐库曲目',
				stat2Label: '唱片专辑',
				stat3Label: '评星均分'
			}
		}
		if (targetType === 'videos') {
			return {
				title: '精选视频视界大盘',
				subtitle: '光影故事汇聚 · 记录每一次深度对谈、科技演讲与剧集震撼',
				icon: Video,
				color: 'red',
				colorClass: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800',
				completedLabel: '已追完',
				inProgressLabel: '正在追',
				wishlistLabel: '想看',
				stat1Label: '收录视频',
				stat2Label: '已追完',
				stat3Label: '评分均值'
			}
		}
		return {
			title: '精选收藏看板',
			subtitle: '收录好物与应用 · 打造数字生活装备与生产力矩阵',
			icon: Layers,
			color: 'blue',
			colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
			completedLabel: '在用主力',
			inProgressLabel: '常备备用',
			wishlistLabel: '未来心愿',
			stat1Label: '收录总数',
			stat2Label: '主力在用',
			stat3Label: '均分推荐'
		}
	}, [targetType])

	// 1. Status Breakdown
	const isMusic = targetType === 'music'
	const albumCount = isMusic ? items.filter(i => getMusicItemType(i) === 'album').length : 0
	const songCount = isMusic ? items.filter(i => getMusicItemType(i) === 'song').length : 0

	const completedItems = items.filter(i => 
		i.status?.includes('通关') || i.status?.includes('已追完') || i.status === 'finished' || i.status === 'completed'
	)
	const inProgressItems = items.filter(i => 
		i.status?.includes('正在') || i.status?.includes('在追') || i.status === 'playing' || i.status === 'watching'
	)
	const wishlistItems = items.filter(i => 
		i.status?.includes('想') || i.status === 'wishlist'
	)

	const completedCount = isMusic ? albumCount : completedItems.length
	const inProgressCount = isMusic ? songCount : inProgressItems.length
	
	// 2. Average Score
	const ratedItems = items.filter(i => (i.stars && i.stars > 0) || (i.rating && i.rating > 0))
	const avgScore = ratedItems.length > 0
		? (ratedItems.reduce((sum, i) => sum + (i.stars ? i.stars * 2 : (i.rating || 0)), 0) / ratedItems.length).toFixed(1)
		: '0.0'

	// 3. Category Breakdown
	const categoryCounts: Record<string, number> = {}
	items.forEach(i => {
		const cat = i.category?.trim() || '其他'
		categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
	})
	const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

	// 4. Subtitle / Platform / Artist Breakdown
	const subtitleCounts: Record<string, number> = {}
	items.forEach(i => {
		const sub = i.subtitle?.trim()
		if (sub) {
			subtitleCounts[sub] = (subtitleCounts[sub] || 0) + 1
		}
	})
	const topSubtitles = Object.entries(subtitleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
	const artistCount = Object.keys(subtitleCounts).length
	const wishlistCount = isMusic ? artistCount : wishlistItems.length

	// 5. Video Platforms Distribution
	const videoPlatforms = useMemo(() => {
		if (targetType !== 'videos') return []
		const map: Record<string, { name: string; emoji: string; count: number; badgeClass: string }> = {}
		items.forEach(item => {
			const p = getVideoPlatform(item.link || item.embedLink)
			if (!map[p.name]) {
				map[p.name] = { name: p.name, emoji: p.emoji, count: 0, badgeClass: p.badgeClass }
			}
			map[p.name].count += 1
		})
		return Object.values(map).sort((a, b) => b.count - a.count)
	}, [items, targetType])

	// 6. Game Platforms Distribution (Steam, Switch, PS, Xbox)
	const gamePlatforms = useMemo(() => {
		if (targetType !== 'games') return []
		const map: Record<string, { name: string; emoji: string; count: number; gradient: string }> = {
			'Steam / PC': { name: 'Steam / PC', emoji: '🖥️', count: 0, gradient: 'from-sky-500 via-blue-500 to-indigo-600' },
			'Nintendo Switch': { name: 'Nintendo Switch', emoji: '🕹️', count: 0, gradient: 'from-red-500 via-rose-500 to-red-600' },
			'PlayStation': { name: 'PlayStation', emoji: '🎮', count: 0, gradient: 'from-blue-600 via-indigo-600 to-blue-700' },
			'Xbox': { name: 'Xbox', emoji: '🟢', count: 0, gradient: 'from-emerald-500 via-green-500 to-emerald-600' },
		}

		items.forEach(item => {
			const sub = (item.subtitle || '').toLowerCase()
			let matched = false
			if (sub.includes('steam') || sub.includes('pc') || sub.includes('windows') || sub.includes('epic')) {
				map['Steam / PC'].count += 1
				matched = true
			}
			if (sub.includes('switch') || sub.includes('nintendo') || sub.includes('ns')) {
				map['Nintendo Switch'].count += 1
				matched = true
			}
			if (sub.includes('ps') || sub.includes('playstation') || sub.includes('sony')) {
				map['PlayStation'].count += 1
				matched = true
			}
			if (sub.includes('xbox')) {
				map['Xbox'].count += 1
				matched = true
			}
			if (!matched && item.subtitle) {
				const customKey = item.subtitle.trim()
				if (!map[customKey]) {
					map[customKey] = { name: customKey, emoji: '🎲', count: 0, gradient: 'from-purple-500 to-indigo-500' }
				}
				map[customKey].count += 1
			}
		})

		return Object.values(map)
			.filter(p => p.count > 0)
			.sort((a, b) => b.count - a.count)
	}, [items, targetType])

	// 7. Top Rated Masterpieces for Games (Hall of Fame)
	const topMasterpieces = useMemo(() => {
		if (targetType !== 'games') return []
		return [...items]
			.sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1
				if (!a.isPinned && b.isPinned) return 1
				const scoreA = a.stars ? a.stars * 2 : (a.rating || 0)
				const scoreB = b.stars ? b.stars * 2 : (b.rating || 0)
				return scoreB - scoreA
			})
			.slice(0, 4)
	}, [items, targetType])

	// 8. Aggregated Core Genres for Games
	const aggregatedGameGenres = useMemo(() => {
		if (targetType !== 'games') return []
		const genres = [
			{ label: '动作 / 魂系 / ARPG', emoji: '⚔️', regex: /动作|arpg|魂系|战斗|act/i, count: 0, gradient: 'from-sky-500 via-blue-500 to-indigo-600' },
			{ label: '开放世界 / 冒险探索', emoji: '🌍', regex: /开放世界|冒险|探索|剧情/i, count: 0, gradient: 'from-emerald-500 via-teal-500 to-emerald-600' },
			{ label: '卡牌构筑 / Roguelike', emoji: '🃏', regex: /卡牌|roguelike|肉鸽|策略/i, count: 0, gradient: 'from-amber-500 via-orange-500 to-amber-600' },
			{ label: '模拟经营 / 休闲独立', emoji: '🍣', regex: /模拟|经营|独立|休闲/i, count: 0, gradient: 'from-purple-500 via-pink-500 to-rose-600' }
		]

		items.forEach(item => {
			const cat = `${item.category || ''} ${item.desc || ''}`
			let matched = false
			for (const g of genres) {
				if (g.regex.test(cat)) {
					g.count += 1
					matched = true
					break
				}
			}
			if (!matched) {
				genres[0].count += 1
			}
		})

		return genres.filter(g => g.count > 0).sort((a, b) => b.count - a.count)
	}, [items, targetType])

	// Random game roll function
	const handleRandomGameRoll = () => {
		if (items.length === 0) return
		const randomIndex = Math.floor(Math.random() * items.length)
		const picked = items[randomIndex]
		toast.success(`🎲 命运之轮为你抽选中了：《${picked.name}》！`, {
			description: picked.review ? `“${picked.review.slice(0, 36)}...”` : '准备好开启新的冒险了吗？'
		})
		if (onSelectItem) {
			onSelectItem(picked)
		} else {
			setSelectedModalItem(picked)
		}
	}

	const Icon = typeConfig.icon

	return (
		<>
			<div className="w-full bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
				<div className="max-w-7xl mx-auto flex flex-col gap-6">
					
					{/* Header */}
					<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
						<div className="flex items-center gap-3.5">
							<div className={`p-3 rounded-2xl border shadow-sm ${typeConfig.colorClass}`}>
								<Icon className="w-6 h-6" />
							</div>
							<div>
								<h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
									{typeConfig.title}
								</h2>
								<p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
									{typeConfig.subtitle}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2.5">
							{targetType === 'games' && (
								<button
									type="button"
									onClick={handleRandomGameRoll}
									className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
									title="不知道玩什么？点击随机挑选一款游戏！"
								>
									<Dices className="w-4 h-4 text-emerald-500" />
									<span>🎲 随机挑一款</span>
								</button>
							)}

							<button
								onClick={() => setIsReportModalOpen(true)}
								className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
							>
								<Sparkles className="w-3.5 h-3.5 text-amber-400" />
								<span>生成分享报告</span>
							</button>

							<button
								onClick={onClose}
								className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
								title="收起数据看板"
							>
								<span className="text-xs font-bold px-1.5">✕ 收起</span>
							</button>
						</div>
					</div>

					{/* Metrics Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
						{/* 1. Total */}
						<div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-blue-500/40 transition-colors shadow-xs">
							<div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
								<span className="text-xs">{typeConfig.stat1Label}</span>
								<Layers className="w-4 h-4 text-blue-500" />
							</div>
							<div className="mt-3">
								<div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{totalCount}</div>
								<div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
									精选收录条目
								</div>
							</div>
						</div>

						{/* 2. Completed / Albums */}
						<div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-emerald-500/40 transition-colors shadow-xs">
							<div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
								<span className="text-xs">{typeConfig.completedLabel}</span>
								{isMusic ? <Disc className="w-4 h-4 text-purple-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
							</div>
							<div className="mt-3">
								<div className={cn("text-2xl sm:text-3xl font-black font-mono", targetType === 'games' ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400")}>
									{completedCount}
								</div>
								<div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
									{isMusic ? '完整唱片全集' : targetType === 'games' ? `通关率 ${Math.round((completedCount / Math.max(totalCount, 1)) * 100)}% · 深度沉淀` : '深度体验与沉淀'}
								</div>
							</div>
						</div>

						{/* 3. In Progress / Songs */}
						<div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-rose-500/40 transition-colors shadow-xs">
							<div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
								<span className="text-xs">{typeConfig.inProgressLabel}</span>
								{isMusic ? <Music className="w-4 h-4 text-rose-500" /> : <Flame className="w-4 h-4 text-amber-500" />}
							</div>
							<div className="mt-3">
								<div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">{inProgressCount}</div>
								<div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
									{isMusic ? '单曲循环收藏' : '近期活跃体验'}
								</div>
							</div>
						</div>

						{/* 4. Average Score */}
						<div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-amber-500/40 transition-colors shadow-xs">
							<div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
								<span className="text-xs">{typeConfig.stat3Label}</span>
								<Star className="w-4 h-4 text-amber-500 fill-amber-500" />
							</div>
							<div className="mt-3">
								<div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 font-mono">
									{avgScore}<span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">/ 10</span>
								</div>
								<div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
									{ratedItems.length} 个评星条目
								</div>
							</div>
						</div>

						{/* 5. Wishlist / Artists */}
						<div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-emerald-500/40 transition-colors shadow-xs">
							<div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
								<span className="text-xs">{typeConfig.wishlistLabel}</span>
								{isMusic ? <Mic2 className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4 text-purple-500" />}
							</div>
							<div className="mt-3">
								<div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{wishlistCount}</div>
								<div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
									{isMusic ? '收录音乐人' : '未来体验愿望单'}
								</div>
							</div>
						</div>
					</div>

					{/* Deep Dive Category & Subtitle Breakdowns */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Left Card: Categories Breakdown OR Hall of Fame for Games */}
						<div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
							{targetType === 'games' ? (
								<div>
									<div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
										<span className="flex items-center gap-1.5">
											<Trophy className="w-4 h-4 text-amber-500" />
											<span>满分殿堂 · 精选神作推荐</span>
										</span>
										<span className="text-[11px] text-amber-500 font-mono font-bold">{topMasterpieces.length} 款封神</span>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
										{topMasterpieces.map((game, idx) => (
											<div
												key={idx}
												onClick={() => {
													if (onSelectItem) onSelectItem(game)
													else setSelectedModalItem(game)
												}}
												className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 flex items-center gap-2.5 transition-all cursor-pointer group shadow-2xs hover:shadow-xs active:scale-98"
												title={`点击查看《${game.name}》评测详情`}
											>
												{game.cover ? (
													<img src={game.cover} alt={game.name} className="w-14 h-11 rounded-lg object-cover shrink-0 shadow-2xs group-hover:scale-105 transition-transform" />
												) : (
													<div className="w-14 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
														<Gamepad2 className="w-5 h-5 text-emerald-500" />
													</div>
												)}
												<div className="min-w-0 flex-1">
													<div className="flex items-center justify-between gap-1">
														<h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
															{game.name}
														</h4>
														<span className="text-[10px] font-mono font-bold text-amber-500 shrink-0">
															★ {(game.stars ? game.stars * 2 : (game.rating || 10)).toFixed(1)}
														</span>
													</div>
													<p className="text-[10px] text-slate-400 truncate mt-0.5">
														{game.subtitle || game.category || '精选神作'}
													</p>
													{game.review && (
														<p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate mt-0.5">
															“{game.review}”
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							) : (
								<div>
									<div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
										<span className="flex items-center gap-1.5">
											<Tag className="w-4 h-4 text-blue-500" />
											类型与流派分布
										</span>
										<span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">{topCategories.length} 个分类</span>
									</div>
									<div className="flex flex-wrap gap-2 pt-1">
										{topCategories.map(([cat, count]) => (
											<button
												key={cat}
												onClick={() => onSelectCategory?.(cat)}
												className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-500/50 shadow-2xs text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
											>
												<span>{cat}</span>
												<span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
													{count}
												</span>
											</button>
										))}
									</div>
								</div>
							)}
							<p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-4">
								{targetType === 'games' ? '💡 汇聚评分最高与置顶的殿堂级神作，点击直接查看深度测评' : '💡 点击分类可在下方列表中实时过滤'}
							</p>
						</div>

						{/* Right Card: Aggregated Genres (Games) OR Media Platforms / Artists */}
						<div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
							<div>
								<div className="flex items-center justify-between mb-3.5 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
									<span className="flex items-center gap-1.5">
										{targetType === 'videos' ? (
											<>
												<Tv className="w-4 h-4 text-red-500" />
												<span>收录媒体与平台分布</span>
											</>
										) : targetType === 'games' ? (
											<>
												<Gamepad2 className="w-4 h-4 text-emerald-500" />
												<span>核心游戏流派与战绩分布</span>
											</>
										) : targetType === 'music' ? (
											<>
												<Mic2 className="w-4 h-4 text-rose-500" />
												<span>核心歌手与艺术家</span>
											</>
										) : (
											<>
												<TrendingUp className="w-4 h-4 text-blue-500" />
												<span>品牌与厂商归属</span>
											</>
										)}
									</span>
									<span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
										{targetType === 'videos' ? `${videoPlatforms.length} 个渠道` : targetType === 'games' ? `${aggregatedGameGenres.length} 大流派` : `${topSubtitles.length} 位`}
									</span>
								</div>

								{targetType === 'videos' ? (
									<div className="flex flex-col gap-3 pt-1">
										{videoPlatforms.map((plat) => {
											const pct = Math.round((plat.count / Math.max(items.length, 1)) * 100)
											return (
												<div key={plat.name} className="flex items-center gap-3 text-xs">
													<span className="w-24 sm:w-28 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
														<span>{plat.emoji}</span>
														<span className="truncate">{plat.name}</span>
													</span>
													<div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden">
														<div 
															className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 rounded-full transition-all duration-500" 
															style={{ width: `${pct}%` }} 
														/>
													</div>
													<span className="w-16 text-right font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
														{plat.count} 部 <span className="text-slate-400 text-[10px]">({pct}%)</span>
													</span>
												</div>
											)
										})}
										{videoPlatforms.length === 0 && (
											<p className="text-xs text-slate-500 py-3 text-center">暂无平台信息</p>
										)}
									</div>
								) : targetType === 'games' ? (
									<div className="flex flex-col gap-3 pt-1">
										{aggregatedGameGenres.map((genre) => {
											const pct = Math.round((genre.count / Math.max(items.length, 1)) * 100)
											return (
												<div key={genre.label} className="flex items-center gap-3 text-xs">
													<span className="w-36 sm:w-40 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
														<span>{genre.emoji}</span>
														<span className="truncate">{genre.label}</span>
													</span>
													<div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden">
														<div 
															className={`h-full bg-gradient-to-r ${genre.gradient} rounded-full transition-all duration-500`} 
															style={{ width: `${pct}%` }} 
														/>
													</div>
													<span className="w-16 text-right font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
														{genre.count} 款 <span className="text-slate-400 text-[10px]">({pct}%)</span>
													</span>
												</div>
											)
										})}
										{aggregatedGameGenres.length === 0 && (
											<p className="text-xs text-slate-500 py-3 text-center">暂无流派信息</p>
										)}
									</div>
								) : (
									<div className="flex flex-col gap-2.5 pt-1">
										{topSubtitles.map(([sub, count]) => {
											const maxCount = Math.max(...topSubtitles.map(s => s[1]), 1)
											const pct = Math.round((count / maxCount) * 100)
											return (
												<div key={sub} className="flex items-center gap-3 text-xs">
													<span className="w-24 sm:w-32 font-bold text-slate-800 dark:text-slate-200 truncate">{sub}</span>
													<div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden">
														<div 
															className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500" 
															style={{ width: `${pct}%` }} 
														/>
													</div>
													<span className="w-12 text-right font-mono font-bold text-slate-600 dark:text-slate-400">{count} {isMusic ? '首/张' : '部/件'}</span>
												</div>
											)
										})}
										{topSubtitles.length === 0 && (
											<p className="text-xs text-slate-500 py-3 text-center">暂无更多细分信息</p>
										)}
									</div>
								)}
							</div>
							<p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-4">
								{targetType === 'videos' 
									? '💡 统计各主流视频网站与流媒体的收录占比' 
									: targetType === 'games'
									? '💡 汇聚动作魂系、开放世界、卡牌肉鸽与经营等核心游戏流派'
									: targetType === 'music'
									? '💡 展现乐库核心收录歌手与艺术家聚集'
									: '💡 展现收录内容的主要品牌与厂商矩阵'}
							</p>
						</div>
					</div>

				</div>
			</div>

			{/* Detail modal when clicked from stats board */}
			{selectedModalItem && (
				<FavoriteItemDetailModal
					item={selectedModalItem}
					targetType={targetType}
					onClose={() => setSelectedModalItem(null)}
				/>
			)}

			{/* Report Modal */}
			{isReportModalOpen && (
				<FavoriteItemReportModal
					isOpen={isReportModalOpen}
					onClose={() => setIsReportModalOpen(false)}
					items={items}
					targetType={targetType}
				/>
			)}
		</>
	)
}
