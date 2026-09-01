import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, LayoutGrid, List, Clock, Film, BarChart3, Bookmark, CheckCircle2, Sparkles, Trophy, Layers, Plus, X, RotateCcw } from 'lucide-react'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'

import { type LogoItem } from './components/logo-upload-dialog'
import { MovieCard, type Movie, getMovieRating, getWatchCount, getLatestWatchTimestamp } from './components/movie-card'
import MovieStatsPanel from './components/movie-stats-panel'
import MovieTimelineView from './components/movie-timeline-view'
import MovieYearlyStatsView from './components/movie-yearly-stats-view'
import MovieDetailModal from './components/movie-detail-modal'
import MovieEditModal from './components/movie-edit-modal'
import MovieMarkWatchedModal from './components/movie-mark-watched-modal'
import dynamic from 'next/dynamic'
const MovieTop250Modal = dynamic(() => import('./components/movie-top250-modal'), { ssr: false })
import { StandardToolbar } from '@/components/ui/standard-toolbar'

import initialFranchisesData from '@/data/franchises.json'
import initialPlaylistsData from '@/data/custom-playlists.json'
import { FranchiseCard, type FranchiseInfo } from './components/franchise-card'
import { FranchiseDetailModal } from './components/franchise-detail-modal'
import { FranchiseEditModal } from './components/franchise-edit-modal'
import type { CustomPlaylist } from './components/playlist-edit-modal'

interface GridViewProps {
	movies: Movie[]
	isEditMode?: boolean
	isManagement?: boolean
	isStatsOpen?: boolean
	onToggleStats?: () => void
	onUpdate?: (updatedMovie: Movie, oldMovie?: Movie, logoItem?: LogoItem) => void
	onDelete?: (movie: Movie) => void
	onTogglePin?: (movie: Movie) => void
}

export default function GridView({ movies, isEditMode = false, isManagement = false, isStatsOpen, onToggleStats, onUpdate, onDelete, onTogglePin }: GridViewProps) {
	const { isAuth } = useAuthStore()
	const canEdit = Boolean(isEditMode && isAuth)
	const [internalStatsOpen, setInternalStatsOpen] = useState(false)
	const showStats = isStatsOpen !== undefined ? isStatsOpen : internalStatsOpen
	const handleCloseStats = onToggleStats ? onToggleStats : () => setInternalStatsOpen(false)

	const [statusFilter, setStatusFilter] = useState<'watched' | 'wishlist' | 'all'>('watched')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')
	const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
	const [watchMethodFilter, setWatchMethodFilter] = useState<'all' | 'cinema' | 'home'>('all')
	const [sortBy, setSortBy] = useState<'default' | 'watchCountDesc' | 'topRank' | 'ratingDesc' | 'ratingAsc' | 'watchDateDesc' | 'releaseDateDesc' | 'expectationDesc'>('default')
	const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'timeline' | 'yearly'>('gallery')
	const [isCollectionMode, setIsCollectionMode] = useState(false)
	const [franchises, setFranchises] = useState<FranchiseInfo[]>(initialFranchisesData as FranchiseInfo[])
	const [editingFranchise, setEditingFranchise] = useState<FranchiseInfo | null>(null)
	const [isFranchiseEditOpen, setIsFranchiseEditOpen] = useState(false)
	const [selectedFranchise, setSelectedFranchise] = useState<FranchiseInfo | null>(null)
	const [selectedFranchiseMovies, setSelectedFranchiseMovies] = useState<Movie[]>([])

	const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>(initialPlaylistsData as CustomPlaylist[])
	const searchInputRef = useRef<HTMLInputElement>(null)

	// Global Keyboard Shortcut: ⌘K or / to focus search
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				searchInputRef.current?.focus()
			} else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
				e.preventDefault()
				searchInputRef.current?.focus()
			} else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
				searchInputRef.current?.blur()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const persistPlaylists = async (newPlaylists: CustomPlaylist[]) => {
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: 'custom-playlists', data: newPlaylists })
			})
			const data = await res.json()
			if (!data.success) {
				console.error('Failed to save playlists:', data.error)
				toast.error(`主题片单保存失败: ${data.error || '未知错误'}`)
			}
		} catch (e) {
			console.error('Auto save error:', e)
			toast.error('主题片单保存出错了')
		}
	}

	const handleSavePlaylist = (updated: CustomPlaylist) => {
		if (!canEdit) {
			toast.error('访客模式下无主题片单编辑权限')
			return
		}
		setCustomPlaylists(prev => {
			const index = prev.findIndex(p => p.id === updated.id)
			let next: CustomPlaylist[]
			if (index >= 0) {
				next = [...prev]
				next[index] = updated
			} else {
				next = [...prev, updated]
			}
			persistPlaylists(next)
			return next
		})
	}

	const handleDeletePlaylist = (playlistId: string) => {
		if (!canEdit) {
			toast.error('访客模式下无主题片单删除权限')
			return
		}
		setCustomPlaylists(prev => {
			const next = prev.filter(p => p.id !== playlistId)
			persistPlaylists(next)
			return next
		})
	}

	const persistFranchises = async (newFranchises: FranchiseInfo[]) => {
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: 'franchises', data: newFranchises })
			})
			const data = await res.json()
			if (!data.success) {
				console.error('Failed to save franchises:', data.error)
				toast.error(`合集保存失败: ${data.error || '未知错误'}`)
			}
		} catch (e) {
			console.error('Auto save error:', e)
			toast.error('合集保存出错了')
		}
	}

	const handleSaveFranchise = (updated: FranchiseInfo) => {
		if (!canEdit) {
			toast.error('访客模式下无合集编辑权限')
			return
		}

		const exists = franchises.some(f => f.id === updated.id)
		let newFranchises: FranchiseInfo[]
		if (exists) {
			newFranchises = franchises.map(f => f.id === updated.id ? updated : f)
		} else {
			newFranchises = [...franchises, updated]
		}
		setFranchises(newFranchises)
		persistFranchises(newFranchises)

		// Synchronize open detail modal
		if (selectedFranchise && selectedFranchise.id === updated.id) {
			setSelectedFranchise(updated)
			const matchingMovies = movies.filter(movie => {
				if (updated.includedMovieNames && updated.includedMovieNames.includes(movie.name)) {
					return true
				}
				if (updated.excludedMovieNames && updated.excludedMovieNames.includes(movie.name)) {
					return false
				}
				return (updated.keywords || []).some(kw => kw && (
					movie.name.includes(kw) || 
					(movie.englishName && movie.englishName.toLowerCase().includes(kw.toLowerCase()))
				))
			})
			setSelectedFranchiseMovies(matchingMovies)
		}

		toast.success(`合集《${updated.name}》保存成功！`)
	}

	const handleDeleteFranchise = (franchiseId: string) => {
		if (!canEdit) {
			toast.error('访客模式下无合集删除权限')
			return
		}

		const newFranchises = franchises.filter(f => f.id !== franchiseId)
		setFranchises(newFranchises)
		persistFranchises(newFranchises)
		if (selectedFranchise?.id === franchiseId) {
			setSelectedFranchise(null)
			setSelectedFranchiseMovies([])
		}
		toast.success('合集已删除！')
	}
	const [timelineSelectedYear, setTimelineSelectedYear] = useState<string>('all')
	const [selectedTimelineMovie, setSelectedTimelineMovie] = useState<Movie | null>(null)
	const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
	const [markingMovie, setMarkingMovie] = useState<Movie | null>(null)
	const [isTop250ModalOpen, setIsTop250ModalOpen] = useState(false)

	// Edit mode state strictly respects isEditMode across all view modes
	const effectiveEditMode = isEditMode

	// Keep only the most fundamental core movie genres (科幻, 动作, 剧情, 冒险, 奇幻, 喜剧, 动画, 悬疑, 经典)
	const { allTags, tagCountMap } = useMemo(() => {
		const counts: Record<string, number> = {}
		let top10Count = 0

		movies.forEach(m => {
			if (typeof m.topRank === 'number' && m.topRank >= 1 && m.topRank <= 10) {
				top10Count++
			}
			if (m.tags && Array.isArray(m.tags)) {
				m.tags.forEach(rawTag => {
					const tag = rawTag.trim()
					if (tag) {
						counts[tag] = (counts[tag] || 0) + 1
					}
				})
			}
		})

		const CORE_GENRES = ['科幻', '动作', '剧情', '冒险', '奇幻', '喜剧', '动画', '悬疑', '经典']
		const validCoreGenres = CORE_GENRES.filter(g => (counts[g] || 0) > 0 || (g === '悬疑' && (counts['惊悚'] || 0) > 0))

		const tagList: string[] = ['all']
		if (top10Count > 0) {
			tagList.push('🏆 TOP 10')
		}
		tagList.push(...validCoreGenres)

		const countMap: Record<string, number> = {
			all: movies.length,
			'🏆 TOP 10': top10Count,
			...counts
		}
		if (counts['悬疑'] || counts['惊悚']) {
			countMap['悬疑'] = (counts['悬疑'] || 0) + (counts['惊悚'] || 0)
		}

		return { allTags: tagList, tagCountMap: countMap }
	}, [movies])
	const watchedCount = movies.filter(m => m.status !== 'wishlist').length
	const wishlistCount = movies.filter(m => m.status === 'wishlist' || Boolean(m.isRewatching)).length
	const totalCount = movies.length

	let filteredMovies = movies.filter(movie => {
		let matchesStatus = true
		if (statusFilter === 'watched') {
			matchesStatus = movie.status !== 'wishlist'
		} else if (statusFilter === 'wishlist') {
			matchesStatus = movie.status === 'wishlist' || Boolean(movie.isRewatching)
		}

		const searchLower = searchTerm.toLowerCase()
		const matchesSearch = movie.name.toLowerCase().includes(searchLower) ||
			(movie.englishName && movie.englishName.toLowerCase().includes(searchLower)) ||
			(movie.description && movie.description.toLowerCase().includes(searchLower))
		const matchesTag = selectedTag === 'all'
			? true
			: selectedTag === '🏆 TOP 10'
				? Boolean(movie.topRank && movie.topRank >= 1 && movie.topRank <= 10)
				: movie.tags.some(tag => {
						const t = tag.toLowerCase()
						const st = selectedTag.toLowerCase()
						if (st === '悬疑') return t === '悬疑' || t === '惊悚'
						return t === st
				  })
		
		let matchesWatchMethod = true
		if (watchMethodFilter === 'cinema') {
			matchesWatchMethod = movie.watchMethod === 'cinema'
		} else if (watchMethodFilter === 'home') {
			matchesWatchMethod = movie.watchMethod === 'home' || !movie.watchMethod
		}

		let matchesVisibility = true
		if (isManagement && isAuth) {
			if (visibilityFilter === 'public') {
				matchesVisibility = movie.isShow === true
			} else if (visibilityFilter === 'private') {
				matchesVisibility = !movie.isShow
			}
		}
		
		return matchesStatus && matchesSearch && matchesTag && matchesWatchMethod && matchesVisibility
	})

	// Movies dataset for top Analytics Dashboard Panel
	const statsMovies = (viewMode === 'timeline' && timelineSelectedYear !== 'all')
		? filteredMovies.filter(m => {
				const dateStr = m.watchDate
				return dateStr && dateStr.startsWith(timelineSelectedYear)
		  })
		: movies

	// Multi-criteria sorting: Pinned movies always float to top and are sorted by rating descending
	filteredMovies = [...filteredMovies].sort((a, b) => {
		const isPinnedA = Boolean(a.isPinned)
		const isPinnedB = Boolean(b.isPinned)

		// 1. Pinned priority: Both pinned -> Rating descending; One pinned -> floats to front
		if (isPinnedA && isPinnedB) {
			const ratingA = getMovieRating(a.stars)
			const ratingB = getMovieRating(b.stars)
			if (ratingB !== ratingA) {
				return ratingB - ratingA // 评分降序
			}
			if (a.topRank && b.topRank) return a.topRank - b.topRank
			if (a.topRank) return -1
			if (b.topRank) return 1
		} else if (isPinnedA && !isPinnedB) {
			return -1
		} else if (!isPinnedA && isPinnedB) {
			return 1
		}

		// 2. Non-pinned movies multi-criteria sorting
		if (selectedTag === '🏆 TOP 10' || sortBy === 'topRank') {
			if (a.topRank && b.topRank) return a.topRank - b.topRank
			if (a.topRank) return -1
			if (b.topRank) return 1
		}
		if (sortBy === 'watchCountDesc') {
			const countA = getWatchCount(a)
			const countB = getWatchCount(b)
			if (countB !== countA) {
				return countB - countA
			}
			return getLatestWatchTimestamp(b) - getLatestWatchTimestamp(a)
		}
		if (sortBy === 'expectationDesc') {
			const expA = a.expectation || a.stars || 0
			const expB = b.expectation || b.stars || 0
			return expB - expA
		}
		if (sortBy === 'ratingDesc') {
			return getMovieRating(b.stars) - getMovieRating(a.stars)
		}
		if (sortBy === 'ratingAsc') {
			return getMovieRating(a.stars) - getMovieRating(b.stars)
		}
		if (sortBy === 'watchDateDesc') {
			const dateA = a.watchDate ? new Date(a.watchDate).getTime() : 0
			const dateB = b.watchDate ? new Date(b.watchDate).getTime() : 0
			return dateB - dateA
		}
		if (sortBy === 'releaseDateDesc') {
			const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
			const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
			return dateB - dateA
		}
		return 0
	})

	interface DisplayItem {
		type: 'movie' | 'franchise'
		movie?: Movie
		franchise?: FranchiseInfo
		franchiseMovies?: Movie[]
	}

	const displayItems: DisplayItem[] = []
	if (viewMode === 'gallery' && isCollectionMode) {
		const matchedMovieNames = new Set<string>()

		franchises.forEach(franchise => {
			const matchingMovies = filteredMovies.filter(movie => {
				// 1. Explicit inclusion
				if (franchise.includedMovieNames && franchise.includedMovieNames.includes(movie.name)) {
					return true
				}
				// 2. Explicit exclusion
				if (franchise.excludedMovieNames && franchise.excludedMovieNames.includes(movie.name)) {
					return false
				}
				// 3. Keyword matching
				return (franchise.keywords || []).some(kw => kw && (
					movie.name.includes(kw) || 
					(movie.englishName && movie.englishName.toLowerCase().includes(kw.toLowerCase()))
				))
			})

			// Only group if there is AT LEAST 1 movie matching the current filter criteria (matchingMovies.length >= 1)
			if (matchingMovies.length >= 2 || (matchingMovies.length >= 1 && franchise.includedMovieNames && franchise.includedMovieNames.length >= 2)) {
				matchingMovies.forEach(m => matchedMovieNames.add(m.name))
				displayItems.push({
					type: 'franchise',
					franchise,
					franchiseMovies: matchingMovies
				})
			}
		})

		// Add remaining standalone movies
		filteredMovies.forEach(movie => {
			if (!matchedMovieNames.has(movie.name)) {
				displayItems.push({
					type: 'movie',
					movie
				})
			}
		})
	} else {
		filteredMovies.forEach(movie => {
			displayItems.push({
				type: 'movie',
				movie
			})
		})
	}

	const extraActions = (
		<div className="flex items-center gap-2 flex-wrap">
			{/* Create New Franchise Button (Requires Edit Permission) */}
			{canEdit && (
				<button
					onClick={() => {
						setEditingFranchise({ id: '', name: '', keywords: [] })
						setIsFranchiseEditOpen(true)
					}}
					className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 shadow-sm"
					title="创建新的系列电影合集"
				>
					<Plus className="w-3.5 h-3.5 text-amber-500" />
					<span>新建合集</span>
				</button>
			)}

			{/* Collection Mode Switcher */}
			<button
				onClick={() => setIsCollectionMode(!isCollectionMode)}
				className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border ${
					isCollectionMode
						? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10 font-black'
						: 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200'
				}`}
				title="将同一系列的电影折叠收纳为合集卡片"
			>
				<Layers className="w-3.5 h-3.5 text-amber-500" />
				<span>📚 系列合集 {isCollectionMode ? 'ON' : 'OFF'}</span>
			</button>

			{/* Unified 4-in-1 View Mode Switcher Pill */}
			<div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700/60 shadow-sm">
				<button
					onClick={() => setViewMode('gallery')}
					className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
						viewMode === 'gallery'
							? 'bg-white dark:bg-[#090D14] text-slate-900 dark:text-white shadow-sm font-black'
							: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
					}`}
					title="网格画廊视图"
				>
					<LayoutGrid className="w-3.5 h-3.5" />
					<span className="hidden sm:inline">网格</span>
				</button>
				<button
					onClick={() => setViewMode('list')}
					className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
						viewMode === 'list'
							? 'bg-white dark:bg-[#090D14] text-slate-900 dark:text-white shadow-sm font-black'
							: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
					}`}
					title="表格列表视图"
				>
					<List className="w-3.5 h-3.5" />
					<span className="hidden sm:inline">列表</span>
				</button>
				<button
					onClick={() => setViewMode('timeline')}
					className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
						viewMode === 'timeline'
							? 'bg-amber-400 text-slate-950 font-black shadow-sm'
							: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
					}`}
					title="观影时光轴视图"
				>
					<Clock className="w-3.5 h-3.5" />
					<span className="hidden sm:inline">时光轴</span>
				</button>
				<button
					onClick={() => setViewMode('yearly')}
					className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
						viewMode === 'yearly'
							? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-sm font-black'
							: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
					}`}
					title="沉浸式电影海报相册"
				>
					<BarChart3 className="w-3.5 h-3.5" />
					<span className="hidden sm:inline">相册</span>
				</button>
			</div>

			{/* Watch Method Filter Dropdown */}
			<select
				value={watchMethodFilter}
				onChange={e => setWatchMethodFilter(e.target.value as any)}
				className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm"
			>
				<option value="all">全部场景</option>
				<option value="cinema">🏛️ 影院</option>
				<option value="home">🏠 居家</option>
			</select>

			{/* Multi-Criteria Sort Dropdown */}
			<select
				value={sortBy}
				onChange={e => setSortBy(e.target.value as any)}
				className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm"
			>
				<option value="default">默认排序</option>
				{statusFilter === 'wishlist' && <option value="expectationDesc">🔥 期待指数 (高 ➜ 低)</option>}
				<option value="watchCountDesc">🍿 观影次数 (多 ➜ 少)</option>
				<option value="topRank">🏆 TOP 榜单排名</option>
				<option value="ratingDesc">⭐ 评分最高 (高 ➜ 低)</option>
				<option value="ratingAsc">⭐ 评分最低 (低 ➜ 高)</option>
				<option value="watchDateDesc">📅 观影时间 (最新)</option>
				<option value="releaseDateDesc">🎬 上映年份 (最新)</option>
			</select>

			{isManagement && isAuth && (
				<select
					value={visibilityFilter}
					onChange={e => setVisibilityFilter(e.target.value as any)}
					className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer shadow-sm"
				>
					<option value="all">公开/归档</option>
					<option value="public">仅公开</option>
					<option value="private">仅归档</option>
				</select>
			)}
		</div>
	)

	return (
		<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12">
			{/* Analytics Dashboard Panel (Renders smoothly when toggled open) */}
			<MovieStatsPanel
				movies={statsMovies}
				selectedYear={viewMode === 'timeline' ? timelineSelectedYear : undefined}
				isOpen={showStats}
				onClose={handleCloseStats}
				onOpenYearlyView={() => setViewMode('yearly')}
				onSelectMovie={(movie) => setSelectedTimelineMovie(movie)}
				onSelectTag={(tag) => setSelectedTag(tag)}
			/>

			{/* Layer 1: Unified Status & Genre Category Filter Bar */}
			<div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-200/80 dark:border-slate-800/80 pb-3.5">
				<div className="flex items-center gap-3 overflow-x-auto scrollbar-none flex-1 min-w-0">
					{/* Status Segmented Controls (已看 / 想看 / 全部) */}
					<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 border border-slate-200/80 dark:border-slate-700/60">
						<button
							type="button"
							onClick={() => setStatusFilter('watched')}
							className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
								statusFilter === 'watched'
									? 'bg-white dark:bg-[#090D14] text-slate-900 dark:text-white shadow-sm font-black'
									: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
							}`}
						>
							<span>✅ 已看</span>
							<span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
								statusFilter === 'watched'
									? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
									: 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500'
							}`}>
								{watchedCount}
							</span>
						</button>

						<button
							type="button"
							onClick={() => setStatusFilter('wishlist')}
							className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
								statusFilter === 'wishlist'
									? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm font-black'
									: 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
							}`}
						>
							<Bookmark className="w-3.5 h-3.5" />
							<span>📌 想看</span>
							<span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
								statusFilter === 'wishlist'
									? 'bg-slate-950/20 text-slate-950'
									: 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500'
							}`}>
								{wishlistCount}
							</span>
						</button>

						<button
							type="button"
							onClick={() => setStatusFilter('all')}
							className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
								statusFilter === 'all'
									? 'bg-white dark:bg-[#090D14] text-slate-900 dark:text-white shadow-sm font-black'
									: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
							}`}
						>
							<span>全部</span>
							<span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
								statusFilter === 'all'
									? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
									: 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500'
							}`}>
								{totalCount}
							</span>
						</button>
					</div>

					{/* Vertical Separator */}
					<div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

					{/* Core Genre Pills */}
					<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
						{allTags.map(tag => {
							const isSelected = selectedTag === tag
							const label = tag === 'all' ? '全部题材' : tag
							const count = tagCountMap[tag] ?? 0
							return (
								<button
									key={tag}
									type="button"
									onClick={() => setSelectedTag(tag)}
									className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
										isSelected
											? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm scale-105'
											: 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<span>{label}</span>
									<span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
										isSelected
											? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-950 font-black'
											: 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
									}`}>
										{count}
									</span>
								</button>
							)
						})}
					</div>
				</div>

				{/* Right: Top 250 Button */}
				<button
					type="button"
					onClick={() => setIsTop250ModalOpen(true)}
					className="px-3.5 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 hover:from-amber-500 hover:to-orange-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 border border-amber-500/30 shadow-sm active:scale-95 ml-auto"
				>
					<Trophy className="w-3.5 h-3.5 text-amber-500" />
					<span className="hidden sm:inline">Top 250 影单</span>
					<span className="sm:hidden">Top 250</span>
				</button>
			</div>

			{/* Layer 2: Operations & Search Toolbar */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-8">
				{/* Search Box */}
				<div className="relative flex-1 min-w-[240px] max-w-md">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
					<input
						ref={searchInputRef}
						type="text"
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						placeholder="搜索电影名称、简介..."
						className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-sm"
					/>
					{searchTerm ? (
						<button
							type="button"
							onClick={() => {
								setSearchTerm('')
								searchInputRef.current?.focus()
							}}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
							title="清空搜索内容 (Esc)"
							aria-label="清空搜索内容"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					) : (
						<kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-600/40 pointer-events-none shadow-2xs">
							⌘K
						</kbd>
					)}
				</div>

				{/* Right Side Controls & Filters */}
				<div className="flex items-center gap-2 flex-wrap justify-end">
					{extraActions}
				</div>
			</div>

			{/* Render Views: Yearly Stats vs Timeline vs List vs Gallery */}
			{viewMode === 'yearly' ? (
				<MovieYearlyStatsView
					movies={filteredMovies}
					allMoviesCount={movies.length}
					selectedTag={selectedTag}
					onClearTag={() => setSelectedTag('all')}
					statusFilter={statusFilter}
					isEditMode={effectiveEditMode}
					onUpdate={onUpdate}
					onDelete={onDelete}
					onTogglePin={onTogglePin}
				/>
			) : viewMode === 'timeline' ? (
				<MovieTimelineView
					movies={filteredMovies}
					isEditMode={effectiveEditMode}
					selectedYear={timelineSelectedYear}
					onSelectYear={setTimelineSelectedYear}
					onSelectMovie={(movie) => setSelectedTimelineMovie(movie)}
					onUpdate={onUpdate}
					onDelete={onDelete}
					onTogglePin={onTogglePin}
				/>
			) : viewMode === 'list' ? (
				<div className="w-full overflow-x-auto pb-8">
					<table className="w-full text-sm text-left border-collapse whitespace-nowrap">
						<thead className="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th className="font-normal py-3 px-4 w-[28%] min-w-[180px]">Aa 名称</th>
								<th className="font-normal py-3 px-4 w-[12%] min-w-[90px]">≡ 状态</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">🏷️ 标签</th>
								<th className="font-normal py-3 px-4 w-[18%] min-w-[110px]">📅 观影时间</th>
								<th className="font-normal py-3 px-4 w-[12%] min-w-[80px]">⭐ 评分</th>
								{effectiveEditMode && (
									<th className="font-normal py-3 px-4 text-right w-[15%] min-w-[140px]">⚙️ 管理操作</th>
								)}
							</tr>
						</thead>
						<tbody>
							{filteredMovies.map((movie: Movie, index: number) => (
								<MovieCard 
									key={movie.name} 
									movie={movie} 
									listIndex={index + 1}
									isEditMode={effectiveEditMode} 
									viewMode={viewMode}
									onUpdate={onUpdate} 
									onDelete={() => onDelete?.(movie)} 
									onTogglePin={onTogglePin} 
									onMarkWatched={(m) => setMarkingMovie(m)}
								/>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{displayItems.map((item, index) => {
						if (item.type === 'franchise' && item.franchise && item.franchiseMovies) {
							return (
								<FranchiseCard
									key={item.franchise.id}
									franchise={item.franchise}
									movies={item.franchiseMovies}
									onClick={() => {
										setSelectedFranchise(item.franchise!)
										setSelectedFranchiseMovies(item.franchiseMovies!)
									}}
								/>
							)
						}
						return (
							<MovieCard 
								key={item.movie!.name} 
								movie={item.movie!} 
								listIndex={index + 1}
								isEditMode={effectiveEditMode} 
								viewMode={viewMode}
								onUpdate={onUpdate} 
								onDelete={() => onDelete?.(item.movie!)} 
								onTogglePin={onTogglePin} 
								onMarkWatched={(m) => setMarkingMovie(m)}
							/>
						)
					})}
				</div>
			)}

			{filteredMovies.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20 text-slate-400">
					<div className="w-14 h-14 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200 dark:border-slate-700/60">
						<Search className="w-6 h-6 text-slate-400" />
					</div>
					<p className="text-base font-medium text-slate-700 dark:text-slate-200">未找到相关电影</p>
					<p className="text-xs mt-1 text-slate-400">当前筛选条件下暂无影片，可尝试重置搜索或标签</p>
					<button
						type="button"
						onClick={() => {
							setSearchTerm('')
							setSelectedTag('all')
							setWatchMethodFilter('all')
							setVisibilityFilter('all')
							setSortBy('default')
						}}
						className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						<span>一键清空筛选并查看全部</span>
					</button>
				</div>
			)}

			{/* Selected Timeline Movie Detail Modal */}
			{selectedTimelineMovie && (
				<MovieDetailModal
					movie={selectedTimelineMovie}
					isEditMode={effectiveEditMode}
					onEdit={(m) => {
						setSelectedTimelineMovie(null)
						setEditingMovie(m)
					}}
					onUpdateMovie={(updated) => {
						onUpdate?.(updated, selectedTimelineMovie)
						setSelectedTimelineMovie(updated)
					}}
					onClose={() => setSelectedTimelineMovie(null)}
				/>
			)}

			{/* Franchise Detail Timeline Modal */}
			<FranchiseDetailModal
				isOpen={Boolean(selectedFranchise)}
				franchise={selectedFranchise}
				movies={selectedFranchiseMovies}
				onClose={() => setSelectedFranchise(null)}
				onSelectMovie={(movie) => {
					setSelectedFranchise(null)
					setSelectedTimelineMovie(movie)
				}}
				onMarkWatched={(movie) => setMarkingMovie(movie)}
				onEditFranchise={canEdit ? (franchiseToEdit) => {
					setEditingFranchise(franchiseToEdit)
					setIsFranchiseEditOpen(true)
				} : undefined}
			/>

			{/* Franchise Edit & Creation Modal */}
			<FranchiseEditModal
				key={editingFranchise?.id || 'new-franchise'}
				isOpen={isFranchiseEditOpen}
				franchise={editingFranchise}
				allMovies={movies}
				onClose={() => setIsFranchiseEditOpen(false)}
				onSave={handleSaveFranchise}
				onDelete={handleDeleteFranchise}
			/>

			{/* In-place Movie Edit Modal for timeline/detail view edit trigger */}
			{editingMovie && (
				<MovieEditModal
					movie={editingMovie}
					onClose={() => setEditingMovie(null)}
					onSave={(updated) => {
						onUpdate?.(updated, editingMovie)
						setEditingMovie(null)
					}}
				/>
			)}

			{/* Movie Mark Watched Modal */}
			{markingMovie && (
				<MovieMarkWatchedModal
					movie={markingMovie}
					onClose={() => setMarkingMovie(null)}
					onSaveWatched={(updated) => {
						onUpdate?.(updated, markingMovie)
						setMarkingMovie(null)
						toast.success(`《${updated.name}》已成功归入已看库！🎉`)
					}}
				/>
			)}

			{/* Top 250 Explorer Modal */}
			{isTop250ModalOpen && (
				<MovieTop250Modal
					isOpen={isTop250ModalOpen}
					onClose={() => setIsTop250ModalOpen(false)}
					userMovies={movies}
					customPlaylists={customPlaylists}
					isEditMode={canEdit}
					onSavePlaylist={handleSavePlaylist}
					onDeletePlaylist={handleDeletePlaylist}
					onImportMovie={(movieToImport) => {
						const existing = movies.find(m =>
							m.name.trim().toLowerCase() === movieToImport.name.trim().toLowerCase() ||
							(movieToImport.englishName && m.englishName && m.englishName.trim().toLowerCase() === movieToImport.englishName.trim().toLowerCase())
						)
						onUpdate?.(movieToImport, existing)
					}}
					onRemoveMovie={(movieToRemove) => {
						onDelete?.(movieToRemove)
					}}
				/>
			)}
		</div>
	)
}
