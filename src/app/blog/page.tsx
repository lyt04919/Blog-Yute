'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { motion } from 'motion/react'

dayjs.extend(weekOfYear)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { INIT_DELAY } from '@/consts'
import ShortLineSVG from '@/svgs/short-line.svg'
import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { useSWRConfig } from 'swr'
import { useCategories } from '@/hooks/use-categories'
import { useReadArticles } from '@/hooks/use-read-articles'
import JuejinSVG from '@/svgs/juejin.svg'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { readFileAsText } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { saveBlogEdits } from './services/save-blog-edits'
import { Check, ArrowRight, BookIcon, Trash2, Save, Upload, X, FolderOpen, SquareCheck, Activity, LayoutGrid, BookOpen, Calendar, Sparkles, Clock, Compass } from 'lucide-react'
import { BlogCoverHoverPreview, useBlogCoverHover } from './components/blog-cover-hover'
import { CategoryModal } from './components/category-modal'
import { StatusModal } from './components/status-modal'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'

import { BlogGridCard } from '@/components/blog-grid-card'
import { BlogEditorialCard } from '@/components/blog-editorial-card'
import { TagFilter } from '@/components/tag-filter'
import { BlogSearch } from '@/components/blog-search'
import { PageTitle } from '@/components/page-title'
import { EmptyState } from '@/components/empty-state'
import { StandardPageHeader } from '@/components/ui/standard-page-header'
import { StandardToolbar } from '@/components/ui/standard-toolbar'

type DisplayMode = 'day' | 'week' | 'month' | 'year' | 'category'

export default function BlogPage() {
	const { mutate } = useSWRConfig()
	const { items, loading } = useBlogIndex()
	const { categories: categoriesFromServer } = useCategories()
	const { isRead } = useReadArticles()
	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false
	const enableCategories = siteContent.enableCategories ?? false

	const [editMode, setEditMode] = useState(false)
	const [editableItems, setEditableItems] = useState<BlogIndexItem[]>([])
	const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
	const [saving, setSaving] = useState(false)
	const [displayMode, setDisplayMode] = useState<DisplayMode>('year')
	const [categoryModalOpen, setCategoryModalOpen] = useState(false)
	const [statusModalOpen, setStatusModalOpen] = useState(false)
	const [categoryList, setCategoryList] = useState<string[]>([])
	const [newCategory, setNewCategory] = useState('')
	const [viewLayout, setViewLayout] = useState<'grid' | 'magazine' | 'timeline'>('grid')
	const [selectedTag, setSelectedTag] = useState<string>('All')
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

	const { cancelCoverPreview, onCoverLinkMouseEnter, hoverCoverPreview, mousePosition } = useBlogCoverHover(editMode)

	useEffect(() => {
		if (!editMode) {
			setEditableItems(items)
		}
	}, [items, editMode])

	useEffect(() => {
		setCategoryList(categoriesFromServer || [])
	}, [categoriesFromServer])

	const displayItems = useMemo(() => {
		const baseItems = editMode ? editableItems : items;
		if (!isAuth) {
			return baseItems.filter(item => item.status !== 'draft');
		}
		return baseItems;
	}, [editMode, editableItems, items, isAuth]);

	const statusFilteredItems = useMemo(() => {
		if (statusFilter === 'all') return displayItems
		return displayItems.filter(item => {
			const itemStatus = item.status || 'published'
			return itemStatus === statusFilter
		})
	}, [displayItems, statusFilter])

	// 实时即刻搜索过滤
	const searchFilteredItems = useMemo(() => {
		if (!searchQuery.trim()) return statusFilteredItems
		const q = searchQuery.toLowerCase().trim()
		return statusFilteredItems.filter(item => {
			const titleMatch = item.title?.toLowerCase().includes(q)
			const slugMatch = item.slug?.toLowerCase().includes(q)
			const summaryMatch = item.summary?.toLowerCase().includes(q)
			const tagsMatch = item.tags?.some(t => t.toLowerCase().includes(q))
			const categoryMatch = item.category?.toLowerCase().includes(q)
			return Boolean(titleMatch || slugMatch || summaryMatch || tagsMatch || categoryMatch)
		})
	}, [statusFilteredItems, searchQuery])

	const dynamicTags = useMemo(() => {
		const counts: Record<string, number> = {}
		statusFilteredItems.forEach(item => {
			if (item.category && item.category.trim() && item.category.trim().toLowerCase() !== 'blog') {
				const cat = item.category.trim()
				counts[cat] = (counts[cat] || 0) + 1
			}
			if (item.tags && Array.isArray(item.tags)) {
				item.tags.forEach(tag => {
					const normalized = tag.trim()
					if (normalized) {
						counts[normalized] = (counts[normalized] || 0) + 1
					}
				})
			}
		})

		const sorted = Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.map(([tag, count]) => ({
				label: tag,
				value: tag,
				count
			}))

		return [{ label: 'All', value: 'All', count: statusFilteredItems.length }, ...sorted]
	}, [statusFilteredItems])

	const gridFilteredItems = useMemo(() => {
		if (selectedTag === 'All' || selectedTag === 'all') return searchFilteredItems
		return searchFilteredItems.filter(item => {
			const matchesCategory = item.category?.toLowerCase() === selectedTag.toLowerCase()
			const matchesTag = item.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase())
			return matchesCategory || matchesTag
		})
	}, [searchFilteredItems, selectedTag])

	// 当处于全量无搜索且存在多篇文章时，提炼出精选头条沉浸式卡片
	const isHeroEligible = useMemo(() => {
		return (
			(selectedTag === 'All' || selectedTag === 'all') &&
			!searchQuery.trim() &&
			statusFilter === 'all' &&
			gridFilteredItems.length > 1 &&
			viewLayout === 'grid' &&
			!editMode
		)
	}, [selectedTag, searchQuery, statusFilter, gridFilteredItems.length, viewLayout, editMode])

	const featuredArticle = useMemo(() => {
		if (!isHeroEligible) return null
		return gridFilteredItems.find(item => item.isFeatured) || gridFilteredItems[0]
	}, [isHeroEligible, gridFilteredItems])

	const remainingArticles = useMemo(() => {
		if (!featuredArticle) return gridFilteredItems
		return gridFilteredItems.filter(item => item.slug !== featuredArticle.slug)
	}, [gridFilteredItems, featuredArticle])

	const { groupedItems, groupKeys, getGroupLabel } = useMemo(() => {
		const sorted = [...gridFilteredItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		const grouped = sorted.reduce(
			(acc, item) => {
				let key: string
				let label: string
				const date = dayjs(item.date)

				switch (displayMode) {
					case 'category':
						key = item.category || '未分类'
						label = key
						break
					case 'day':
						key = date.format('YYYY-MM-DD')
						label = date.format('YYYY年MM月DD日')
						break
					case 'week':
						const week = date.week()
						key = `${date.format('YYYY')}-W${week.toString().padStart(2, '0')}`
						label = `${date.format('YYYY')}年第${week}周`
						break
					case 'month':
						key = date.format('YYYY-MM')
						label = date.format('YYYY年MM月')
						break
					case 'year':
					default:
						key = date.format('YYYY')
						label = date.format('YYYY年')
						break
				}

				if (!acc[key]) {
					acc[key] = { items: [], label }
				}
				acc[key].items.push(item)
				return acc
			},
			{} as Record<string, { items: BlogIndexItem[]; label: string }>
		)

		const keys = Object.keys(grouped).sort((a, b) => {
			if (displayMode === 'category') {
				const categoryOrder = new Map(categoryList.map((c, index) => [c, index]))
				const aOrder = categoryOrder.has(a) ? categoryOrder.get(a)! : Number.MAX_SAFE_INTEGER
				const bOrder = categoryOrder.has(b) ? categoryOrder.get(b)! : Number.MAX_SAFE_INTEGER
				if (aOrder !== bOrder) return aOrder - bOrder
				return a.localeCompare(b)
			}
			// 按时间倒序排序
			if (displayMode === 'week') {
				// 周格式：YYYY-WW
				const [yearA, weekA] = a.split('-W').map(Number)
				const [yearB, weekB] = b.split('-W').map(Number)
				if (yearA !== yearB) return yearB - yearA
				return weekB - weekA
			}
			return b.localeCompare(a)
		})

		return {
			groupedItems: grouped,
			groupKeys: keys,
			getGroupLabel: (key: string) => grouped[key]?.label || key
		}
	}, [statusFilteredItems, displayMode, categoryList])

	const selectedCount = selectedSlugs.size

	const toggleEditMode = useCallback(() => {
		if (editMode) {
			setEditMode(false)
			setEditableItems(items)
			setSelectedSlugs(new Set())
		} else {
			setEditableItems(items)
			setEditMode(true)
		}
	}, [editMode, items])

	const toggleSelect = useCallback((slug: string) => {
		setSelectedSlugs(prev => {
			const next = new Set(prev)
			if (next.has(slug)) {
				next.delete(slug)
			} else {
				next.add(slug)
			}
			return next
		})
	}, [])

	// 全选所有文章
	const handleSelectAll = useCallback(() => {
		setSelectedSlugs(new Set(editableItems.map(item => item.slug)))
	}, [editableItems])

	// 全选/取消全选某个时间维度分组
	const handleSelectGroup = useCallback(
		(groupKey: string) => {
			const group = groupedItems[groupKey]
			if (!group) return

			// 检查该分组是否所有文章都已选中
			const allSelected = group.items.every(item => selectedSlugs.has(item.slug))

			setSelectedSlugs(prev => {
				const next = new Set(prev)
				if (allSelected) {
					// 如果已全选，则取消该分组的选择
					group.items.forEach(item => {
						next.delete(item.slug)
					})
				} else {
					// 如果未全选，则全选该分组
					group.items.forEach(item => {
						next.add(item.slug)
					})
				}
				return next
			})
		},
		[groupedItems, selectedSlugs]
	)

	// 取消全选
	const handleDeselectAll = useCallback(() => {
		setSelectedSlugs(new Set())
	}, [])

	const handleItemClick = useCallback(
		(event: React.MouseEvent, slug: string) => {
			if (!editMode) return
			event.preventDefault()
			event.stopPropagation()
			toggleSelect(slug)
		},
		[editMode, toggleSelect]
	)

	const handleDeleteSelected = useCallback(() => {
		if (selectedCount === 0) {
			toast.info('请选择要删除的文章')
			return
		}
		setDeleteDialogOpen(true)
	}, [selectedCount])

	const confirmDelete = useCallback(() => {
		setEditableItems(prev => prev.filter(item => !selectedSlugs.has(item.slug)))
		setSelectedSlugs(new Set())
		setDeleteDialogOpen(false)
		toast.success(`已删除 ${selectedCount} 篇文章`)
	}, [selectedSlugs, selectedCount])

	const handleAssignCategory = useCallback((slug: string, category?: string) => {
		setEditableItems(prev =>
			prev.map(item => {
				if (item.slug !== slug) return item
				const nextCategory = category?.trim()
				if (!nextCategory) return { ...item, category: undefined }
				return { ...item, category: nextCategory }
			})
		)
	}, [])

	const handleAssignStatus = useCallback((slug: string, status?: string) => {
		setEditableItems(prev =>
			prev.map(item => {
				if (item.slug !== slug) return item
				const nextStatus = (status?.trim() as 'draft' | 'published') || 'published'
				return { ...item, status: nextStatus }
			})
		)
	}, [])

	const handleAddCategory = useCallback(() => {
		const value = newCategory.trim()
		if (!value) {
			toast.info('请输入分类名称')
			return
		}
		setCategoryList(prev => (prev.includes(value) ? prev : [...prev, value]))
		setNewCategory('')
	}, [newCategory])

	const handleRemoveCategory = useCallback((category: string) => {
		setCategoryList(prev => prev.filter(item => item !== category))
		setEditableItems(prev => prev.map(item => (item.category === category ? { ...item, category: undefined } : item)))
	}, [])

	const handleReorderCategories = useCallback((nextList: string[]) => {
		setCategoryList(nextList)
	}, [])

	const handleCancel = useCallback(() => {
		setEditableItems(items)
		setSelectedSlugs(new Set())
		setEditMode(false)
	}, [items])

	const handleSave = useCallback(async () => {
		const removedSlugs = items.filter(item => !editableItems.some(editItem => editItem.slug === item.slug)).map(item => item.slug)
		const normalizedCategoryList = categoryList.map(c => c.trim()).filter(Boolean)
		const categoryListChanged = JSON.stringify(normalizedCategoryList) !== JSON.stringify((categoriesFromServer || []).map(c => c.trim()).filter(Boolean))
		const categoryAssignmentChanged = items.some(origin => {
			const next = editableItems.find(editItem => editItem.slug === origin.slug)
			const originCategory = origin.category || ''
			const nextCategory = next?.category || ''
			return originCategory !== nextCategory
		})
		const hasChanges = removedSlugs.length > 0 || categoryListChanged || categoryAssignmentChanged

		if (!hasChanges) {
			toast.info('没有需要保存的改动')
			return
		}

		try {
			setSaving(true)
			await saveBlogEdits(items, editableItems, normalizedCategoryList)
			setEditMode(false)
			setSelectedSlugs(new Set())
			setCategoryModalOpen(false)
			// 强制刷新 SWR 缓存
			await mutate((key: any) => typeof key === 'string' && (key.startsWith('/api/blogs') || key.startsWith('/blogs/index.json')))
			await mutate('/blogs/categories.json')
			toast.success('推送到 GitHub 成功！')
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || '保存失败')
		} finally {
			setSaving(false)
		}
	}, [items, editableItems, categoryList, categoriesFromServer, mutate])

	const handleSaveLocal = useCallback(async () => {
		const removedSlugs = items.filter(item => !editableItems.some(editItem => editItem.slug === item.slug)).map(item => item.slug)
		const normalizedCategoryList = categoryList.map(c => c.trim()).filter(Boolean)
		const categoryListChanged = JSON.stringify(normalizedCategoryList) !== JSON.stringify((categoriesFromServer || []).map(c => c.trim()).filter(Boolean))
		const categoryAssignmentChanged = items.some(origin => {
			const next = editableItems.find(editItem => editItem.slug === origin.slug)
			const originCategory = origin.category || ''
			const nextCategory = next?.category || ''
			return originCategory !== nextCategory
		})
		const statusAssignmentChanged = items.some(origin => {
			const next = editableItems.find(editItem => editItem.slug === origin.slug)
			const originStatus = origin.status || 'published'
			const nextStatus = next?.status || 'published'
			return originStatus !== nextStatus
		})
		const hasChanges = removedSlugs.length > 0 || categoryListChanged || categoryAssignmentChanged || statusAssignmentChanged

		if (!hasChanges) {
			toast.info('没有需要保存的改动')
			return
		}

		try {
			setSaving(true)

			const sortedItems = [...editableItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			const resIndex = await fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'blog-index', data: sortedItems }) })
			const indexData = await resIndex.json()
			if (!indexData.success) throw new Error(indexData.error)

			const resCategories = await fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'blog-categories', data: { categories: normalizedCategoryList } }) })
			const categoriesData = await resCategories.json()
			if (!categoriesData.success) throw new Error(categoriesData.error)

			if (removedSlugs.length > 0) {
				const deletedFiles = removedSlugs.map(slug => `public/blogs/${slug}`)
				const resDel = await fetch('/api/save-local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deletedFiles }) })
				if (!resDel.ok) {
					const err = await resDel.json()
					throw new Error(err.error || 'Failed to delete local files')
				}
			}

			setEditMode(false)
			setSelectedSlugs(new Set())
			setCategoryModalOpen(false)
			// 强制刷新 SWR 缓存
			await mutate((key: any) => typeof key === 'string' && (key.startsWith('/api/blogs') || key.startsWith('/blogs/index.json')))
			await mutate('/blogs/categories.json')
			toast.success('本地保存成功！')
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || '保存失败')
		} finally {
			setSaving(false)
		}
	}, [items, editableItems, categoryList, categoriesFromServer])

	const handleSaveClick = useCallback(() => {
		if (!isAuth) {
			toast.error('未授权，请先在顶部导航栏登录作者账户')
			return
		}
		void handleSave()
	}, [handleSave, isAuth])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isAuth && !editMode && (e.ctrlKey || e.metaKey) && e.key === 'e' && e.shiftKey) {
				e.preventDefault()
				toggleEditMode()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [editMode, toggleEditMode, isAuth])

	return (
		<>
			<PageTitle title="Blog" />
			<CategoryModal
				open={categoryModalOpen}
				onClose={() => setCategoryModalOpen(false)}
				categoryList={categoryList}
				newCategory={newCategory}
				onNewCategoryChange={setNewCategory}
				onAddCategory={handleAddCategory}
				onRemoveCategory={handleRemoveCategory}
				onReorderCategories={handleReorderCategories}
				editableItems={editableItems}
				onAssignCategory={handleAssignCategory}
			/>
			<StatusModal
				open={statusModalOpen}
				onClose={() => setStatusModalOpen(false)}
				editableItems={editableItems}
				onAssignStatus={handleAssignStatus}
			/>

			{/* Edit Mode Toolbar */}
			{editMode && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className='sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md'>
					<div className='mx-auto w-full max-w-7xl px-6 py-3'>
						<div className='flex items-center justify-between gap-4'>
							<div className='flex items-center gap-2'>
								<span className='text-sm font-medium text-[var(--color-primary)]'>
									已选择 {selectedCount} 篇
								</span>
								{selectedCount > 0 && (
									<button
										onClick={handleDeselectAll}
										className='text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'>
										清空
									</button>
								)}
							</div>
							<div className='flex items-center gap-2 flex-wrap'>
								{enableCategories && (
									<button
										onClick={() => setCategoryModalOpen(true)}
										disabled={saving}
										className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-bg)] text-[var(--color-primary)]'>
										<FolderOpen className='h-3.5 w-3.5' />
										分类
									</button>
								)}
								<button
									onClick={() => setStatusModalOpen(true)}
									disabled={saving}
									className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-bg)] text-[var(--color-primary)]'>
									<Activity className='h-3.5 w-3.5' />
									状态
								</button>
								<button
									onClick={selectedCount === editableItems.length ? handleDeselectAll : handleSelectAll}
									className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-bg)] text-[var(--color-primary)]'>
									<SquareCheck className='h-3.5 w-3.5' />
									{selectedCount === editableItems.length ? '取消全选' : '全选'}
								</button>
								<button
									onClick={handleDeleteSelected}
									disabled={selectedCount === 0}
									className='inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 transition-colors disabled:opacity-40'>
									<Trash2 className='h-3.5 w-3.5' />
									删除
								</button>
								<div className='h-4 w-px bg-[var(--color-border)] mx-1' />
								<button
									onClick={handleCancel}
									disabled={saving}
									className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-bg)] text-[var(--color-primary)]'>
									<X className='h-3.5 w-3.5' />
									取消
								</button>
								<button
									onClick={handleSaveLocal}
									disabled={saving}
									className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-bg)] text-[var(--color-primary)]'>
									<Save className='h-3.5 w-3.5' />
									{saving ? '保存中...' : '本地保存'}
								</button>
								<button
									onClick={handleSaveClick}
									disabled={saving}
									className='brand-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs'>
									<Upload className='h-3.5 w-3.5' />
									{saving ? '保存中...' : '推送到 GitHub'}
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			)}

			<div className='min-h-screen relative pb-48'>
				{(() => {
					const blogHeaderActions = isAuth ? (
						<div className="flex items-center gap-2">
							<Link href="/write/new">
								<button className='px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm'>
									+ 写博客
								</button>
							</Link>
							{!hideEditButton && (
								<button
									onClick={toggleEditMode}
									className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
								>
									{editMode ? '退出编辑' : '编辑模式'}
								</button>
							)}
						</div>
					) : undefined

					const blogStatusTabs = isAuth ? [
						{ label: 'All', value: 'all' },
						{ label: 'Published', value: 'published' },
						{ label: 'Drafts', value: 'draft' },
					] : undefined

					const viewModeToggle = (
						<div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold shrink-0 border border-slate-200 dark:border-slate-700/60">
							<button
								type="button"
								onClick={() => setViewLayout('grid')}
								className={cn(
									'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
									viewLayout === 'grid'
										? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
										: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
								)}
								title="网格画廊视图"
							>
								<LayoutGrid className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">网格</span>
							</button>
							<button
								type="button"
								onClick={() => setViewLayout('magazine')}
								className={cn(
									'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
									viewLayout === 'magazine'
										? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
										: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
								)}
								title="图文精读视图"
							>
								<BookOpen className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">精读</span>
							</button>
							<button
								type="button"
								onClick={() => setViewLayout('timeline')}
								className={cn(
									'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
									viewLayout === 'timeline'
										? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
										: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
								)}
								title="年表归档视图"
							>
								<Calendar className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">年表</span>
							</button>
						</div>
					)

					return (
						<>
							<StandardPageHeader
								title="Writings & Thoughts"
								badge={`${items.length} ARTICLES`}
								subtitle="探寻前端架构、游戏逆向与生活哲学的数字花园。"
								actions={blogHeaderActions}
							/>

							{/* 数字花园概览胶囊 */}
							<div className="mx-auto w-full max-w-7xl px-6 -mt-3 mb-6">
								<div className="inline-flex items-center gap-2 sm:gap-3.5 px-3.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 text-xs text-slate-600 dark:text-zinc-300 backdrop-blur-sm flex-wrap shadow-2xs">
									<span className="inline-flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
										<Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/80" />
										数字花园
									</span>
									<span className="text-slate-300 dark:text-zinc-700">·</span>
									<span>{statusFilteredItems.length} 篇深度沉淀</span>
									<span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">·</span>
									<span className="hidden sm:inline">覆盖 {Math.max(1, dynamicTags.length - 1)} 个技术领域</span>
									<span className="text-slate-300 dark:text-zinc-700 hidden md:inline">·</span>
									<span className="hidden md:inline">持续精进与记录</span>
								</div>
							</div>

							<StandardToolbar
								statusTabs={blogStatusTabs}
								selectedStatus={statusFilter}
								onSelectStatus={(s) => setStatusFilter(s as any)}
								tags={dynamicTags}
								selectedTag={selectedTag}
								onSelectTag={setSelectedTag}
								searchValue={searchQuery}
								onSearchChange={setSearchQuery}
								searchPlaceholder="实时搜索标题、标签、摘要..."
								extraRightActions={
									<div className="flex items-center gap-2">
										{viewModeToggle}
										<BlogSearch items={items} />
									</div>
								}
							/>
						</>
					)
				})()}

				<div className='mx-auto w-full max-w-7xl px-6'>
					{/* 实时搜索匹配提示 */}
					{searchQuery && (
						<div className="mb-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
							<span>
								找到 <strong className="text-slate-900 dark:text-white font-semibold">{gridFilteredItems.length}</strong> 篇包含 “<span className="text-brand font-medium">{searchQuery}</span>” 的文章
							</span>
							<button
								type="button"
								onClick={() => setSearchQuery('')}
								className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
							>
								清空搜索
							</button>
						</div>
					)}

					{gridFilteredItems.length === 0 ? (
						<EmptyState type="blog" />
					) : viewLayout === 'grid' ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
							{gridFilteredItems.map((blog) => (
								<BlogGridCard
									key={blog.slug}
									blog={blog}
									editMode={editMode}
									isSelected={selectedSlugs.has(blog.slug)}
									isRead={isRead(blog.slug)}
									onToggleSelect={toggleSelect}
									onClick={handleItemClick}
								/>
							))}
						</div>
					) : viewLayout === 'magazine' ? (
						<div className="flex flex-col gap-6 max-w-5xl mx-auto">
							{gridFilteredItems.map((blog, idx) => (
								<BlogEditorialCard
									key={blog.slug}
									blog={blog}
									isHero={idx === 0 && !searchQuery && (selectedTag === 'All' || selectedTag === 'all') && statusFilter === 'all' && !editMode}
									editMode={editMode}
									isSelected={selectedSlugs.has(blog.slug)}
									isRead={isRead(blog.slug)}
									onToggleSelect={toggleSelect}
									onClick={handleItemClick}
								/>
							))}
						</div>
					) : (
						<div className='flex flex-col items-center justify-center gap-6 pt-4'>
					{items.length > 0 && (
						<motion.div
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						className='card btn-rounded relative mx-auto flex items-center gap-1 p-1 max-sm:hidden'>
						{[
							{ value: 'day', label: '日' },
							{ value: 'week', label: '周' },
							{ value: 'month', label: '月' },
							{ value: 'year', label: '年' },
							...(enableCategories ? ([{ value: 'category', label: '分类' }] as const) : [])
						].map(option => (
							<motion.button
							key={option.value}
							onClick={() => setDisplayMode(option.value as DisplayMode)}
							className={cn(
								'btn-rounded px-3 py-1.5 text-xs font-medium transition-all',
								displayMode === option.value ? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-sm' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-card)]'
							)}
						>
							{option.label}
						</motion.button>
						))}
					</motion.div>
				)}

				{groupKeys.map((groupKey, index) => {
					const group = groupedItems[groupKey]
					if (!group) return null

					return (
						<motion.div
							onMouseLeave={cancelCoverPreview}
							key={groupKey}
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							transition={{ delay: INIT_DELAY / 2 }}
							className='card relative w-full max-w-[840px] space-y-6'>
							<div className='mb-3 flex items-center justify-between gap-3 text-base'>
								<div className='flex items-center gap-3'>
									<div className='font-medium text-[var(--color-primary)]'>{getGroupLabel(groupKey)}</div>
									<div className='h-2 w-2 rounded-full bg-[var(--color-border)]'></div>
									<div className='text-[var(--color-secondary)] text-sm'>{group.items.length} 篇文章</div>
								</div>
								{editMode &&
									(() => {
										const groupAllSelected = group.items.every(item => selectedSlugs.has(item.slug))
										return (
											<motion.button
										onClick={() => handleSelectGroup(groupKey)}
										className={cn(
											'rounded-lg border px-3 py-1 text-xs transition-colors',
											groupAllSelected
												? 'border-[var(--color-secondary)] bg-[var(--color-card)] text-[var(--color-primary)] hover:bg-[var(--color-border)]'
												: 'text-[var(--color-secondary)] hover:border-[var(--color-secondary)] hover:text-[var(--color-primary)] border-transparent bg-[var(--color-bg)] hover:bg-[var(--color-card)]'
										)}
									>
										{groupAllSelected ? '取消全选' : '全选该分组'}
									</motion.button>
										)
									})()}
							</div>
							<div>
								{group.items.map(it => {
									const hasRead = isRead(it.slug)
									const isSelected = selectedSlugs.has(it.slug)
									return (
										<Link
											onMouseEnter={() => onCoverLinkMouseEnter(it.cover)}
											onMouseLeave={cancelCoverPreview}
											href={`/blog/${it.slug}`}
											key={it.slug}
											onClick={event => handleItemClick(event, it.slug)}
											className={cn(
												'group flex min-h-10 items-center gap-3 py-3 transition-all',
												editMode
													? cn(
																'rounded-lg border px-3',
																isSelected ? 'border-[var(--color-secondary)] bg-[var(--color-card)]' : 'hover:border-[var(--color-secondary)] border-transparent hover:bg-[var(--color-card)]'
														)
														: 'cursor-pointer'
													)}>
													{editMode && (
														<span
															className={cn(
																'flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold',
																isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]' : 'border-[var(--color-border)] text-transparent'
															)}>
															<Check />
														</span>
													)}
													<span className='text-[var(--color-secondary)] w-[44px] shrink-0 text-sm font-medium'>{dayjs(it.date).format('MM-DD')}</span>

													<div className='relative flex h-2 w-2 items-center justify-center'>
														<div className='bg-[var(--color-border)] group-hover:bg-[var(--color-primary)] h-1.5 w-1.5 rounded-full transition-all group-hover:scale-150'></div>
														<ShortLineSVG className='absolute bottom-4' />
													</div>
													<div
														className={cn(
															'flex-1 truncate text-sm font-medium transition-all text-[var(--color-secondary)] flex items-center gap-2',
															editMode ? null : 'group-hover:text-[var(--color-primary)] group-hover:translate-x-2'
														)}>
														<span className={cn(hasRead ? 'text-slate-500 dark:text-zinc-400' : 'text-[var(--color-primary)]')}>
															{it.title || it.slug}
														</span>
														{hasRead && (
															<span className='inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20'>
																<Check className="w-2.5 h-2.5" /> 已读
															</span>
														)}
														{it.status === 'draft' && (
															<span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-medium border border-amber-500/20">
																草稿
															</span>
														)}
													</div>
											<div className='flex flex-wrap items-center gap-2 max-sm:hidden'>
												{(it.tags || []).map(t => (
													<span key={t} className='text-secondary text-sm'>
														#{t}
													</span>
												))}
											</div>
										</Link>
									)
								})}
							</div>
						</motion.div>
					)
				})}
				{items.length > 0 && (
					<div className='text-center'>
						<motion.a
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							
							href='https://juejin.cn/user/2427311675422382/posts'
							target='_blank'
							className='card text-secondary static inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs'>
							<JuejinSVG className='h-4 w-4' />
							更多
						</motion.a>
					</div>
				)}
			</div>
					)}
				</div>
			</div>

			<div className='pt-12'>
				{!loading && items.length === 0 && (
				<div className='flex flex-col items-center justify-center py-20 text-[var(--color-secondary)]'>
					<p className='text-lg'>暂无内容</p>
				</div>
			)}
			{loading && (
				<div className='flex flex-col items-center justify-center py-20 text-[var(--color-secondary)]'>
					<p className='text-lg'>加载中...</p>
				</div>
			)}
			</div>



			<BlogCoverHoverPreview preview={hoverCoverPreview} position={mousePosition} />

			<CategoryModal
				open={categoryModalOpen}
				onClose={() => setCategoryModalOpen(false)}
				categoryList={categoryList}
				newCategory={newCategory}
				onNewCategoryChange={setNewCategory}
				onAddCategory={handleAddCategory}
				onRemoveCategory={handleRemoveCategory}
				onReorderCategories={handleReorderCategories}
				editableItems={editableItems}
				onAssignCategory={handleAssignCategory}
			/>

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				count={selectedCount}
				onConfirm={confirmDelete}
				onCancel={() => setDeleteDialogOpen(false)}
			/>
		</>
	)
}
