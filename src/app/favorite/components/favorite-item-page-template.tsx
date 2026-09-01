'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { 
	ArrowLeft, 
	Search, 
	Plus, 
	Music, 
	Gamepad2,
	Video,
	LayoutGrid, 
	List, 
	Clock, 
	BarChart3, 
	Sparkles, 
	CheckCircle2, 
	Flame, 
	Bookmark, 
	Trophy, 
	RotateCcw,
	Layers,
	Disc,
	User,
	Radio
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { FavoriteItemCard, getMusicItemType, type FavoriteItem } from './favorite-item-card'
import { FavoriteItemCreateDialog } from './favorite-item-create-dialog'
import { AppleMusicSearchDialog } from './apple-music-search-dialog'
import { pushFavoriteData } from '../services/push-favorite-data'
import FavoriteItemStatsPanel from './favorite-item-stats-panel'
import FavoriteItemTimelineView from './favorite-item-timeline-view'
import dynamic from 'next/dynamic'
const FavoriteItemReportModal = dynamic(() => import('./favorite-item-report-modal'), { ssr: false })
import { FavoriteItemDetailModal } from './favorite-item-detail-modal'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { MusicTracklistView } from './music-tracklist-view'
import { MusicArtistsView } from './music-artists-view'

import { StandardPageHeader } from '@/components/ui/standard-page-header'
import { StandardToolbar } from '@/components/ui/standard-toolbar'

interface FavoriteItemPageTemplateProps {
	initialItems: FavoriteItem[]
	targetType: 'gears' | 'software' | 'music' | 'games' | 'videos'
	pageTitle: string
	pageDescription: string
	extraActions?: React.ReactNode
	enableAppleMusicImport?: boolean
	backUrl?: string
	backLabel?: string
	isManagement?: boolean
}

export function FavoriteItemPageTemplate({
	initialItems,
	targetType,
	pageTitle,
	pageDescription,
	extraActions,
	enableAppleMusicImport = false,
	backUrl = '/favorite',
	backLabel = 'Favorites',
	isManagement = false
}: FavoriteItemPageTemplateProps) {
	const [items, setItems] = useState<FavoriteItem[]>(initialItems)
	const [originalItems, setOriginalItems] = useState<FavoriteItem[]>(initialItems)

	useEffect(() => {
		setItems(initialItems)
		setOriginalItems(initialItems)
	}, [initialItems])

	const [searchQuery, setSearchQuery] = useState('')
	const [activeCategory, setActiveCategory] = useState('All')
	const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'wishlist' | 'album' | 'song' | 'podcast' | 'artist'>(targetType === 'music' ? 'song' : 'all')
	const [sortBy, setSortBy] = useState<'default' | 'ratingDesc' | 'ratingAsc' | 'dateDesc'>('default')
	const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'timeline'>('gallery')
	const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
	
	const [isStatsOpen, setIsStatsOpen] = useState(false)
	const [isReportOpen, setIsReportOpen] = useState(false)
	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isAppleMusicOpen, setIsAppleMusicOpen] = useState(false)
	const [pendingItem, setPendingItem] = useState<Partial<FavoriteItem> | null>(null)
	const [selectedItemForDetail, setSelectedItemForDetail] = useState<FavoriteItem | null>(null)
	
	const { playTrack, currentTrack } = useMusicPlayerStore()

	const searchInputRef = useRef<HTMLInputElement>(null)
	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const isAuthor = isAuth

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

	// Extract unique tags/categories from items dynamically
	const categories = useMemo(() => {
		const cats = new Set<string>()
		items.forEach(item => {
			if (item.category?.trim()) cats.add(item.category.trim())
		})
		return ['All', ...Array.from(cats)]
	}, [items])

	// Status tabs labels
	const statusLabels = useMemo(() => {
		if (targetType === 'games') {
			return {
				all: '全部游戏',
				completed: '已通关',
				in_progress: '正在玩',
				wishlist: '想玩'
			}
		}
		if (targetType === 'music') {
			return {
				all: '全部音乐',
				completed: '精选专辑',
				in_progress: '单曲循环',
				wishlist: '歌单收藏'
			}
		}
		return {
			all: '全部影视',
			completed: '已追完',
			in_progress: '在追',
			wishlist: '想看'
		}
	}, [targetType])

	// Status counts
	const countCompleted = useMemo(() => items.filter(i => 
		i.status?.includes('通关') || i.status?.includes('已追完') || i.status === 'finished' || i.status === 'completed'
	).length, [items])
	const countInProgress = useMemo(() => items.filter(i => 
		i.status?.includes('正在') || i.status?.includes('在追') || i.status === 'playing' || i.status === 'watching'
	).length, [items])
	const countWishlist = useMemo(() => items.filter(i => 
		i.status?.includes('想') || i.status === 'wishlist'
	).length, [items])

	// Filter and sort items
	const filteredItems = useMemo(() => {
		let result = items.filter(item => {
			if (!isManagement) return item.isShow
			return true
		})

		// Apply visibility filter for author
		if (isManagement && isAuthor) {
			if (visibilityFilter === 'public') {
				result = result.filter(item => item.isShow === true)
			} else if (visibilityFilter === 'private') {
				result = result.filter(item => !item.isShow)
			}
		}

		// Category filter
		if (activeCategory !== 'All') {
			result = result.filter(item => item.category?.trim() === activeCategory)
		}

		// Status / Type filter
		if (targetType === 'music') {
			if (statusFilter === 'album') {
				result = result.filter(i => getMusicItemType(i) === 'album')
			} else if (statusFilter === 'song') {
				result = result.filter(i => getMusicItemType(i) === 'song')
			} else if (statusFilter === 'podcast') {
				result = result.filter(i => getMusicItemType(i) === 'podcast')
			}
		} else {
			if (statusFilter === 'completed') {
				result = result.filter(i => i.status?.includes('通关') || i.status?.includes('已追完') || i.status === 'finished' || i.status === 'completed')
			} else if (statusFilter === 'in_progress') {
				result = result.filter(i => i.status?.includes('正在') || i.status?.includes('在追') || i.status === 'playing' || i.status === 'watching')
			} else if (statusFilter === 'wishlist') {
				result = result.filter(i => i.status?.includes('想') || i.status === 'wishlist')
			}
		}

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim()
			result = result.filter(
				item =>
					item.name.toLowerCase().includes(query) ||
					item.desc.toLowerCase().includes(query) ||
					item.subtitle?.toLowerCase().includes(query) ||
					item.category?.toLowerCase().includes(query)
			)
		}

		// Sort
		if (sortBy === 'ratingDesc') {
			result.sort((a, b) => (b.stars || b.rating || 0) - (a.stars || a.rating || 0))
		} else if (sortBy === 'ratingAsc') {
			result.sort((a, b) => (a.stars || a.rating || 0) - (b.stars || b.rating || 0))
		} else if (sortBy === 'dateDesc') {
			result.sort((a, b) => {
				const tA = a.playDate ? new Date(a.playDate).getTime() : 0
				const tB = b.playDate ? new Date(b.playDate).getTime() : 0
				return tB - tA
			})
		} else {
			// Sort: pinned first, then newest
			result.sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1
				if (!a.isPinned && b.isPinned) return 1
				const timeA = a.playDate ? new Date(a.playDate).getTime() : 0
				const timeB = b.playDate ? new Date(b.playDate).getTime() : 0
				return timeB - timeA
			})
		}

		return result
	}, [items, activeCategory, statusFilter, searchQuery, visibilityFilter, sortBy, isManagement, isAuthor])

	if (isManagement && !isAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-primary)]">
				<div className="text-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] max-w-md mx-6">
					<h2 className="text-xl font-bold mb-2">未授权访问</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-4">此页面是私人仓库管理，请先在右上角输入密码切换为作者模式。</p>
					<Link href="/favorite" className="brand-btn px-4 py-2 rounded-full text-sm inline-block">
						返回精选页
					</Link>
				</div>
			</div>
		)
	}

	// Basic local save without toast (used for pinning immediately)
	const silentSave = async (updatedItems: FavoriteItem[]) => {
		try {
			await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: targetType, data: updatedItems })
			})
		} catch (err) {
			console.error('Silent save failed', err)
		}
	}

	const autoSave = async (updatedItems: FavoriteItem[]) => {
		setIsSaving(true)
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: targetType, data: updatedItems })
			})
			const data = await res.json()
			if (!data.success) throw new Error(data.error)

			setOriginalItems(updatedItems)
			toast.success('已自动保存！')
		} catch (error: any) {
			console.error('Failed to auto-save:', error)
			toast.error(`自动保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handlePublishCloudClick = () => {
		if (isAuth) {
			handlePublishCloud()
		} else {
			toast.error('未授权，请先使用右上角切换到作者模式')
		}
	}

	const handlePublishCloud = async () => {
		setIsSaving(true)
		try {
			await pushFavoriteData({
				target: targetType,
				items
			})
			setOriginalItems(items)
			setIsEditMode(false)
		} catch (error: any) {
			console.error('Failed to push:', error)
			toast.error(`云端发布失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleAdd = (newItem: FavoriteItem) => {
		const updated = [newItem, ...items]
		setItems(updated)
		setIsCreateOpen(false)
		setPendingItem(null)
		autoSave(updated)
	}

	const handleAppleMusicSelect = (selected: {
		name: string
		subtitle: string
		cover: string
		desc: string
		review: string
		link: string
		embedCode: string
		category: string
		status?: string
		releaseDate?: string
		playDate?: string
	}) => {
		setPendingItem({
			name: selected.name,
			subtitle: selected.subtitle,
			cover: selected.cover,
			desc: selected.desc,
			review: selected.review,
			link: selected.link,
			embedCode: selected.embedCode,
			category: selected.category,
			status: selected.status || '单曲循环',
			releaseDate: selected.releaseDate || '',
			playDate: selected.playDate || new Date().toISOString().split('T')[0],
			isShow: true,
			isPinned: false,
		})
		setIsAppleMusicOpen(false)
		setIsCreateOpen(true)
	}

	const handlePlayTrack = (track: FavoriteItem) => {
		playTrack(track, filteredItems)
		toast.success(`正在播放: ${track.name}`, { icon: '🎵' })
	}

	const handleUpdate = (updatedItem: FavoriteItem, oldItem: FavoriteItem) => {
		const updated = items.map(it => (it.name === oldItem.name ? updatedItem : it))
		setItems(updated)
		autoSave(updated)
	}

	const handleDelete = (itemToDelete: FavoriteItem) => {
		if (confirm(`确定要删除“${itemToDelete.name}”吗？`)) {
			const updated = items.filter(it => it.name !== itemToDelete.name)
			setItems(updated)
			autoSave(updated)
		}
	}

	const handleTogglePin = (itemToPin: FavoriteItem) => {
		const pinCount = items.filter(it => it.isPinned).length
		if (!itemToPin.isPinned && pinCount >= 5) {
			toast.error('最多只能置顶 5 个项目')
			return
		}

		const updatedItem = { ...itemToPin, isPinned: !itemToPin.isPinned }
		const updated = items.map(it => (it.name === itemToPin.name ? updatedItem : it))
		setItems(updated)
		setOriginalItems(updated)
		
		silentSave(updated).then(() => {
			toast.success(updatedItem.isPinned ? '已置顶' : '已取消置顶')
		})
	}

	const headerActions = (
		<div className="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				onClick={() => setIsReportOpen(true)}
				className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
			>
				<Sparkles className="w-3.5 h-3.5 text-amber-400" />
				<span>分享报告</span>
			</button>

			<button
				type="button"
				onClick={() => setIsStatsOpen(!isStatsOpen)}
				className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
					isStatsOpen
						? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 font-bold'
						: 'border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
				}`}
			>
				<BarChart3 className="w-3.5 h-3.5" />
				<span>{isStatsOpen ? '收起看板' : '数据看板'}</span>
			</button>

			{isManagement && isAuthor ? (
				isEditMode ? (
					<>
						<button onClick={() => setIsEditMode(false)} className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'>
							退出编辑
						</button>
						<button onClick={() => { setPendingItem(null); setIsCreateOpen(true); }} className='px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors'>
							+ 添加
						</button>
						{extraActions}
						{enableAppleMusicImport && (
							<button
								onClick={() => setIsAppleMusicOpen(true)}
								className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
							>
								<Music className="w-3.5 h-3.5" />
								Apple Music
							</button>
						)}
						<button onClick={handlePublishCloudClick} disabled={isSaving} className='px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm'>
							{isSaving ? '发布中...' : '发布云端'}
						</button>
					</>
				) : (
					<button onClick={() => setIsEditMode(true)} className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>
						编辑模式
					</button>
				)
			) : (
				isAuthor && (
					<Link href={`/vault/${targetType}`} className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm'>
						管理仓库 ({items.length}) →
					</Link>
				)
			)}
		</div>
	)

	const toolbarExtra = (
		<div className="flex items-center gap-2">
			{/* Sort Selector */}
			<select
				value={sortBy}
				onChange={e => setSortBy(e.target.value as any)}
				className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white px-3 py-2 text-xs focus:outline-hidden transition-all cursor-pointer"
			>
				<option value="default">默认排序 (置顶优先)</option>
				<option value="ratingDesc">评分最高 (5★ → 1★)</option>
				<option value="ratingAsc">评分升序 (1★ → 5★)</option>
				<option value="dateDesc">记录时间 (最新优先)</option>
			</select>

			{isManagement && isAuthor && (
				<select
					value={visibilityFilter}
					onChange={e => setVisibilityFilter(e.target.value as any)}
					className='rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white px-3 py-2 text-xs focus:outline-hidden transition-all cursor-pointer'
				>
					<option value="all">所有内容</option>
					<option value="public">仅精选公开</option>
					<option value="private">仅私人归档</option>
				</select>
			)}
		</div>
	)

	return (
		<div className='min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]'>
			<StandardPageHeader
				backHref={backUrl}
				backLabel={backLabel}
				title={
					<div className="flex items-center gap-3">
						{pageTitle}
						{isManagement && (
							<>
								<span className="text-lg font-medium font-mono hidden sm:inline-block px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-secondary)] align-middle leading-none">
									Vault
								</span>
								<span className='text-sm font-medium font-mono hidden sm:inline-block px-3 py-1 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand)] align-middle leading-none'>
									共 {items.length} 项
								</span>
							</>
						)}
					</div>
				}
				subtitle={pageDescription}
				actions={headerActions}
			/>

			{/* Collapsible Stats Panel */}
			{isStatsOpen && (
				<div className="mb-6">
					<FavoriteItemStatsPanel
						items={items}
						targetType={targetType}
						isOpen={isStatsOpen}
						onClose={() => setIsStatsOpen(false)}
						onSelectCategory={(cat) => setActiveCategory(cat)}
						onSelectItem={(item) => setSelectedItemForDetail(item)}
					/>
				</div>
			)}

			<div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 space-y-6 ${currentTrack ? 'pb-52' : 'pb-12'}`}>
				{/* Dedicated Music Stats Dashboard */}
				{targetType === 'music' && (
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-2">
						<div 
							onClick={() => setStatusFilter('song')}
							className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 cursor-pointer transition-all ${
								statusFilter === 'song'
									? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
									: 'bg-white dark:bg-[#0D1117] border-slate-200/80 dark:border-slate-800/80 hover:border-rose-200'
							}`}
							title="点击只看精选单曲"
						>
							<div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-800/50">
								<Music className="w-5 h-5" />
							</div>
							<div className="flex flex-col">
								<span className="text-[11px] font-mono text-slate-400 uppercase">精选单曲</span>
								<span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono leading-tight">
									{items.filter(i => getMusicItemType(i) === 'song').length} <span className="text-xs text-slate-400 font-normal">首</span>
								</span>
							</div>
						</div>

						<div 
							onClick={() => setStatusFilter('album')}
							className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 cursor-pointer transition-all ${
								statusFilter === 'album'
									? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
									: 'bg-white dark:bg-[#0D1117] border-slate-200/80 dark:border-slate-800/80 hover:border-purple-200'
							}`}
							title="点击只看唱片专辑"
						>
							<div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/50">
								<Disc className="w-5 h-5" />
							</div>
							<div className="flex flex-col">
								<span className="text-[11px] font-mono text-slate-400 uppercase">唱片专辑</span>
								<span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono leading-tight">
									{items.filter(i => getMusicItemType(i) === 'album').length} <span className="text-xs text-slate-400 font-normal">张</span>
								</span>
							</div>
						</div>

						<div 
							onClick={() => setStatusFilter('artist')}
							className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 cursor-pointer transition-all ${
								statusFilter === 'artist'
									? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
									: 'bg-white dark:bg-[#0D1117] border-slate-200/80 dark:border-slate-800/80 hover:border-amber-200'
							}`}
							title="点击按音乐人/歌手分类浏览"
						>
							<div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-800/50">
								<User className="w-5 h-5 text-amber-500" />
							</div>
							<div className="flex flex-col">
								<span className="text-[11px] font-mono text-slate-400 uppercase">音乐人/歌手</span>
								<span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono leading-tight">
									{new Set(items.map(i => i.subtitle).filter(Boolean)).size} <span className="text-xs text-slate-400 font-normal">位</span>
								</span>
							</div>
						</div>

						<div 
							onClick={() => setStatusFilter(items.some(i => getMusicItemType(i) === 'podcast') ? 'podcast' : 'all')}
							className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 cursor-pointer transition-all ${
								statusFilter === 'podcast'
									? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
									: 'bg-white dark:bg-[#0D1117] border-slate-200/80 dark:border-slate-800/80 hover:border-blue-200'
							}`}
							title="点击查看播客电台"
						>
							<div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50">
								<Radio className="w-5 h-5" />
							</div>
							<div className="flex flex-col">
								<span className="text-[11px] font-mono text-slate-400 uppercase">播客电台</span>
								<span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono leading-tight">
									{items.filter(i => getMusicItemType(i) === 'podcast').length} <span className="text-xs text-slate-400 font-normal">档</span>
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Status Filter Tabs & View Mode Switcher Header */}
				<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
					{/* Status / Type Filter Tabs */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
						{targetType === 'music' ? (
							<>
								<button
									onClick={() => setStatusFilter('song')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'song'
											? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<Music className="w-3.5 h-3.5 text-rose-500" />
									<span>🎵 精选单曲 ({items.filter(i => getMusicItemType(i) === 'song').length})</span>
								</button>

								<button
									onClick={() => setStatusFilter('album')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'album'
											? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<Disc className="w-3.5 h-3.5 text-purple-500" />
									<span>💽 唱片专辑 ({items.filter(i => getMusicItemType(i) === 'album').length})</span>
								</button>

								<button
									onClick={() => setStatusFilter('artist')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'artist'
											? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<User className="w-3.5 h-3.5 text-amber-500" />
									<span>🎙️ 音乐人/歌手 ({new Set(items.map(i => i.subtitle).filter(Boolean)).size})</span>
								</button>

								<button
									onClick={() => setStatusFilter('podcast')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'podcast'
											? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<Radio className="w-3.5 h-3.5 text-blue-500" />
									<span>📻 播客电台 ({items.filter(i => getMusicItemType(i) === 'podcast').length})</span>
								</button>

								<button
									onClick={() => setStatusFilter('all')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'all'
											? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<Layers className="w-3.5 h-3.5" />
									<span>全部 ({items.length})</span>
								</button>
							</>
						) : (
							<>
								<button
									onClick={() => setStatusFilter('all')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'all'
											? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<Layers className="w-3.5 h-3.5" />
									<span>{statusLabels.all} ({items.length})</span>
								</button>

								<button
									onClick={() => setStatusFilter('completed')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'completed'
											? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
									<span>{statusLabels.completed} ({countCompleted})</span>
								</button>

								<button
									onClick={() => setStatusFilter('in_progress')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
										statusFilter === 'in_progress'
											? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
											: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									<Flame className="w-3.5 h-3.5 text-amber-500" />
									<span>{statusLabels.in_progress} ({countInProgress})</span>
								</button>

								{countWishlist > 0 && (
									<button
										onClick={() => setStatusFilter('wishlist')}
										className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
											statusFilter === 'wishlist'
												? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
												: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
										}`}
									>
										<Bookmark className="w-3.5 h-3.5 text-purple-500" />
										<span>{statusLabels.wishlist} ({countWishlist})</span>
									</button>
								)}
							</>
						)}
					</div>

					{/* View Mode Switcher */}
					<div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 self-end md:self-auto shrink-0">
						<button
							onClick={() => setViewMode('gallery')}
							className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
								viewMode === 'gallery'
									? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
									: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
							}`}
							title="画廊网格"
						>
							<LayoutGrid className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">画廊</span>
						</button>

						<button
							onClick={() => setViewMode('list')}
							className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
								viewMode === 'list'
									? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
									: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
							}`}
							title="紧凑列表"
						>
							<List className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">列表</span>
						</button>

						<button
							onClick={() => setViewMode('timeline')}
							className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
								viewMode === 'timeline'
									? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
									: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
							}`}
							title="时光轴"
						>
							<Clock className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">时光轴</span>
						</button>
					</div>
				</div>

				{/* Toolbar (for Gallery & List) */}
				{(viewMode === 'gallery' || viewMode === 'list') && (
					<StandardToolbar
						tags={categories}
						selectedTag={activeCategory}
						onSelectTag={setActiveCategory}
						searchValue={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="搜索内容名称、描述、流派... (⌘K /)"
						viewMode={viewMode === 'gallery' ? 'grid' : 'list'}
						onViewModeChange={(m) => setViewMode(m === 'list' ? 'list' : 'gallery')}
						extraRightActions={toolbarExtra}
					/>
				)}

				{/* ================= MUSIC ARTISTS VIEW ================= */}
				{targetType === 'music' && statusFilter === 'artist' ? (
					<MusicArtistsView
						items={items}
						onPlayTrack={handlePlayTrack}
						onSelectItem={(item) => setSelectedItemForDetail(item)}
						onTogglePin={handleTogglePin}
					/>
				) : targetType === 'music' && statusFilter === 'song' ? (
					<MusicTracklistView
						items={filteredItems}
						isEditMode={isEditMode}
						currentPlayingTrack={currentTrack}
						onPlayTrack={handlePlayTrack}
						onSelectItem={(item) => setSelectedItemForDetail(item)}
						onTogglePin={handleTogglePin}
						onUpdate={handleUpdate}
						onDelete={handleDelete}
					/>
				) : (
					<>
						{/* ================= VIEW 1: GALLERY ================= */}
						{viewMode === 'gallery' && (
							<div
								className={`grid gap-6 sm:gap-7 ${
									(targetType === 'videos' || targetType === 'games')
										? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
										: targetType === 'music'
										? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
										: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
								}`}
							>
								{filteredItems.map((item, idx) => (
									<FavoriteItemCard
										key={`${item.name}-${idx}`}
										item={item}
										targetType={targetType}
										isEditMode={isEditMode}
										viewMode="gallery"
										onPlayTrack={handlePlayTrack}
										onUpdate={handleUpdate}
										onDelete={() => handleDelete(item)}
										onTogglePin={handleTogglePin}
									/>
								))}
							</div>
						)}

						{/* ================= VIEW 2: LIST ================= */}
						{viewMode === 'list' && (
							targetType === 'music' ? (
								<MusicTracklistView
									items={filteredItems}
									isEditMode={isEditMode}
									currentPlayingTrack={currentTrack}
									onPlayTrack={handlePlayTrack}
									onSelectItem={(item) => setSelectedItemForDetail(item)}
									onTogglePin={handleTogglePin}
									onUpdate={handleUpdate}
									onDelete={handleDelete}
								/>
							) : (
								<div className="w-full overflow-x-auto pb-8">
									<table className="w-full text-sm text-left border-collapse whitespace-nowrap">
										<thead className="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
											<tr>
												<th className="font-normal py-3 px-4 w-[35%] min-w-[200px]">Aa Name</th>
												<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">≡ 状态</th>
												<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">🏷️ 标签/类型</th>
												<th className="font-normal py-3 px-4 w-[20%] min-w-[120px]">📅 记录时间</th>
												<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">⭐ 评分</th>
											</tr>
										</thead>
										<tbody>
											{filteredItems.map((item, idx) => (
												<FavoriteItemCard
													key={`${item.name}-${idx}`}
													item={item}
													targetType={targetType}
													isEditMode={isEditMode}
													viewMode="list"
													onPlayTrack={handlePlayTrack}
													onUpdate={handleUpdate}
													onDelete={() => handleDelete(item)}
													onTogglePin={handleTogglePin}
												/>
											))}
										</tbody>
									</table>
								</div>
							)
						)}
					</>
				)}

				{/* ================= VIEW 3: TIMELINE ================= */}
				{viewMode === 'timeline' && (
					<FavoriteItemTimelineView
						items={filteredItems}
						targetType={targetType}
						isEditMode={isEditMode}
						onUpdate={handleUpdate}
						onDelete={handleDelete}
						onTogglePin={handleTogglePin}
						onPlayTrack={handlePlayTrack}
						onSelectItem={(item) => setSelectedItemForDetail(item)}
					/>
				)}

				{/* Empty state */}
				{filteredItems.length === 0 && (
					<div className="flex flex-col items-center justify-center py-24 text-slate-400">
						<div className="w-14 h-14 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200 dark:border-slate-700/60">
							<Search className="w-6 h-6 text-slate-400" />
						</div>
						<p className="text-base font-medium text-slate-700 dark:text-slate-200">未找到相关内容</p>
						<p className="text-xs mt-1 text-slate-400">试试更换搜索关键词或重置状态与标签筛选</p>
						<button
							onClick={() => {
								setSearchQuery('')
								setActiveCategory('All')
								setStatusFilter('all')
							}}
							className="mt-4 px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							<span>重置所有筛选</span>
						</button>
					</div>
				)}
			</div>

			{/* Create Dialog Overlay */}
			{isCreateOpen && (
				<FavoriteItemCreateDialog
					targetType={targetType}
					initialData={pendingItem || undefined}
					onClose={() => {
						setIsCreateOpen(false)
						setPendingItem(null)
					}}
					onSave={handleAdd}
				/>
			)}

			{/* Apple Music Search Dialog */}
			{isAppleMusicOpen && (
				<AppleMusicSearchDialog
					open={isAppleMusicOpen}
					onClose={() => setIsAppleMusicOpen(false)}
					onSelect={handleAppleMusicSelect}
				/>
			)}

			{/* Report Modal */}
			{isReportOpen && (
				<FavoriteItemReportModal
					isOpen={isReportOpen}
					onClose={() => setIsReportOpen(false)}
					items={items}
					targetType={targetType}
				/>
			)}

			{/* Selected Item Detail Modal */}
			{selectedItemForDetail && (
				<FavoriteItemDetailModal
					item={selectedItemForDetail}
					targetType={targetType}
					onClose={() => setSelectedItemForDetail(null)}
					isEditMode={isManagement && isAuthor}
					onDelete={handleDelete}
					onEdit={() => {
						const target = selectedItemForDetail
						setSelectedItemForDetail(null)
						setPendingItem(target)
						setIsCreateOpen(true)
					}}
				/>
			)}
		</div>
	)
}
