'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Search, Plus, Music, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { FavoriteItemCard, type FavoriteItem } from './favorite-item-card'
import { FavoriteItemCreateDialog } from './favorite-item-create-dialog'
import { AppleMusicSearchDialog } from './apple-music-search-dialog'
import { pushFavoriteData } from '../services/push-favorite-data'

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
	const [searchQuery, setSearchQuery] = useState('')
	const [activeCategory, setActiveCategory] = useState('All')
	const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery')
	const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isAppleMusicOpen, setIsAppleMusicOpen] = useState(false)
	const [pendingItem, setPendingItem] = useState<Partial<FavoriteItem> | null>(null)

	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

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

	// Extract unique tags/categories from items dynamically
	const categories = useMemo(() => {
		const cats = new Set<string>()
		items.forEach(item => {
			if (item.category?.trim()) cats.add(item.category.trim())
		})
		return ['All', ...Array.from(cats)]
	}, [items])

	const isAuthor = isAuth

	// Filter and sort items (pinned items first, then match search and category)
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

		// Sort: pinned first, then normal order
		return result.reverse().sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1
			if (!a.isPinned && b.isPinned) return 1
			
			const timeA = a.playDate ? new Date(a.playDate).getTime() : 0
			const timeB = b.playDate ? new Date(b.playDate).getTime() : 0
			return timeB - timeA
		})
	}, [items, activeCategory, searchQuery, visibilityFilter, isAuthor])

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

	const handleCancel = () => {
		setItems(originalItems)
		setIsEditMode(false)
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isAuthor && !isEditMode && (e.ctrlKey || e.metaKey) && e.key === 'e' && e.shiftKey) {
				e.preventDefault()
				setIsEditMode(true)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode, isAuthor])

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
			isShow: true,
			isPinned: false,
		})
		setIsAppleMusicOpen(false)
		setIsCreateOpen(true)
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
		
		// Immediately save pinning
		silentSave(updated).then(() => {
			toast.success(updatedItem.isPinned ? '已置顶' : '已取消置顶')
		})
	}

	const headerActions = isManagement && isAuthor ? (
		isEditMode ? (
			<div className="flex items-center gap-2 flex-wrap">
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
			</div>
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
	)

	const toolbarExtra = isManagement && isAuthor ? (
		<select
			value={visibilityFilter}
			onChange={e => setVisibilityFilter(e.target.value as any)}
			className='rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white px-3 py-2 text-xs focus:outline-none transition-all cursor-pointer'
		>
			<option value="all">所有内容</option>
			<option value="public">仅精选公开</option>
			<option value="private">仅私人归档</option>
		</select>
	) : undefined

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

			<StandardToolbar
				tags={categories}
				selectedTag={activeCategory}
				onSelectTag={setActiveCategory}
				searchValue={searchQuery}
				onSearchChange={setSearchQuery}
				searchPlaceholder="搜索内容..."
				viewMode={viewMode === 'gallery' ? 'grid' : 'list'}
				onViewModeChange={(m) => setViewMode(m === 'list' ? 'list' : 'gallery')}
				extraRightActions={toolbarExtra}
			/>

			{/* Main Grid View */}
			<div className='mx-auto w-full max-w-7xl px-6'>
				{filteredItems.length === 0 ? (
					<div className='flex flex-col items-center justify-center py-20 text-[var(--color-secondary)]'>
						<p className='text-sm font-medium bg-secondary/5 px-6 py-3 rounded-full'>暂无相关内容</p>
					</div>
				) : (
					viewMode === 'list' ? (
						<div className="w-full overflow-x-auto pb-8">
							<table className="w-full text-sm text-left border-collapse whitespace-nowrap">
								<thead className="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
									<tr>
										<th className="font-normal py-3 px-4 w-[35%] min-w-[200px]">Aa Name</th>
										<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">≡ 状态</th>
										<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">🏷️ 标签</th>
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
											viewMode={viewMode}
											onUpdate={handleUpdate}
											onDelete={() => handleDelete(item)}
											onTogglePin={handleTogglePin}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div
							className={`grid gap-6 ${
								(targetType === 'videos' || targetType === 'games')
									? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
									: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
							}`}
						>
							{filteredItems.map((item, idx) => (
								<FavoriteItemCard
									key={`${item.name}-${idx}`}
									item={item}
									targetType={targetType}
									isEditMode={isEditMode}
									viewMode={viewMode}
									onUpdate={handleUpdate}
									onDelete={() => handleDelete(item)}
									onTogglePin={handleTogglePin}
								/>
							))}
						</div>
					)
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
		</div>
	)
}
