'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import TimelineView from './timeline-view'
import CreateDialog from './components/create-dialog'
import { pushDiaries } from './services/push-diaries'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'
import type { ImageItem } from '@/app/projects/components/image-upload-dialog'
import type { Diary } from './components/diary-card'
import dayjs from 'dayjs'

import { LayoutGrid, Calendar as CalendarIcon, List, Search, Filter, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import DiaryCalendar from './components/diary-calendar'
import ChangelogView from './changelog-view'
import OnThisDay from './components/on-this-day'
import DiaryFilterPanel from './components/diary-filter-panel'
import MemoryHeatmap from './components/memory-heatmap'

export default function Page() {
	const { isAuth, getAuthToken } = useAuthStore()
	const [diaries, setDiaries] = useState<Diary[]>([])
	const [originalDiaries, setOriginalDiaries] = useState<Diary[]>([])
	const [isLoading, setIsLoading] = useState(true)

	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editingDiary, setEditingDiary] = useState<Diary | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())

	const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'changelog'>('grid')
	const [searchQuery, setSearchQuery] = useState('')
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
	const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
	const [filters, setFilters] = useState<import('./components/diary-filter-panel').FilterState>({
		year: null,
		month: null,
		tags: [],
		locations: [],
		moods: [],
		weathers: [],
		mediaType: 'all'
	})

	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const [quickContent, setQuickContent] = useState('')

	useEffect(() => {
		let isMounted = true
		const fetchData = async () => {
			try {
				if (!isAuth) {
					setIsLoading(false)
					return
				}
				
				let token = ''
				try {
					if (isAuth) {
						token = await getAuthToken()
					}
				} catch(e) {
					console.error('No auth token available locally, proceeding with dev mode.')
				}

				const headers: Record<string, string> = {}
				if (token) {
					headers['Authorization'] = `Bearer ${token}`
				}

				const res = await fetch('/api/private/diary', {
					headers
				})
				if (res.ok) {
					const data = await res.json()
					if (isMounted) {
						setDiaries(data)
						setOriginalDiaries(data)
					}
				}
			} catch (error) {
				console.error('Failed to fetch diaries:', error)
			} finally {
				if (isMounted) setIsLoading(false)
			}
		}
		fetchData()
		return () => { isMounted = false }
	}, [isAuth, getAuthToken])

	const filteredDiaries = useMemo(() => {
		const filtered = diaries.filter(d => {
			const q = searchQuery.toLowerCase()
			const matchesSearch = !q || 
				(d.content && d.content.toLowerCase().includes(q)) || 
				(d.tags && d.tags.some(t => t.toLowerCase().includes(q))) || 
				(d.location && d.location.toLowerCase().includes(q))
			
			if (!matchesSearch) return false

			// Year and Month
			if (filters.year) {
				const date = dayjs(d.date)
				if (date.format('YYYY') !== filters.year) return false
				if (filters.month && date.format('MM') !== filters.month) return false
			}

			// Array filters (OR within the same category)
			if (filters.tags.length > 0 && (!d.tags || !filters.tags.some(t => d.tags!.includes(t)))) return false
			if (filters.locations.length > 0 && (!d.location || !filters.locations.includes(d.location))) return false
			if (filters.moods.length > 0 && (!d.mood || !filters.moods.includes(d.mood))) return false
			if (filters.weathers.length > 0 && (!d.weather || !filters.weathers.includes(d.weather))) return false

			// Media Type
			if (filters.mediaType !== 'all') {
				const hasMedia = (d.media && d.media.length > 0) || !!d.image
				if (filters.mediaType === 'media-only' && !hasMedia) return false
				if (filters.mediaType === 'text-only' && hasMedia) return false
			}
			
			return true
		})

		// Sort
		return filtered.sort((a, b) => {
			const dateA = dayjs(a.date).valueOf()
			const dateB = dayjs(b.date).valueOf()
			// Fallback to ID if dates are the same
			if (dateA === dateB) {
				return sortOrder === 'desc' 
					? parseInt(b.id) - parseInt(a.id)
					: parseInt(a.id) - parseInt(b.id)
			}
			return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
		})
	}, [diaries, searchQuery, filters, sortOrder])

	const activeFilterCount = 
		(filters.year ? 1 : 0) + 
		(filters.month ? 1 : 0) + 
		filters.tags.length + 
		filters.locations.length + 
		filters.moods.length + 
		filters.weathers.length + 
		(filters.mediaType !== 'all' ? 1 : 0)

	const autoSaveDiaries = async (newDiaries: Diary[]) => {
		try {
			await pushDiaries({ diaries: newDiaries, imageItems })
			setOriginalDiaries(newDiaries)
		} catch (error: any) {
			console.error('Failed to auto-save:', error)
			toast.error(`自动保存失败: ${error?.message || '未知错误'}`)
		}
	}

	const handleUpdate = (updatedDiary: Diary, oldDiary: Diary, imageItem?: any) => {
		const newDiaries = diaries.map(s => (s.id === oldDiary.id ? updatedDiary : s))
		setDiaries(newDiaries)
		if (imageItem) {
			setImageItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedDiary.id, imageItem)
				return newMap
			})
		}
		autoSaveDiaries(newDiaries)
	}

	const handleAdd = () => {
		setEditingDiary(null)
		setIsCreateDialogOpen(true)
	}

	const handleQuickAdd = () => {
		if (!quickContent.trim()) return
		const newDiary: Diary = {
			id: Date.now().toString(),
			date: dayjs().format('YYYY-MM-DD'),
			content: quickContent
		}
		const newDiaries = [newDiary, ...diaries]
		setDiaries(newDiaries)
		setQuickContent('')
		toast.success('记录成功')
		autoSaveDiaries(newDiaries)
	}

	const handleSaveDiary = (updatedDiary: Diary) => {
		const newDiaries = editingDiary 
			? diaries.map(s => (s.id === editingDiary.id ? updatedDiary : s))
			: [updatedDiary, ...diaries]
		setDiaries(newDiaries)
		autoSaveDiaries(newDiaries)
	}

	const handleDelete = (diary: Diary) => {
		if (confirm(`确定要删除这篇日记吗？`)) {
			const newDiaries = diaries.filter(s => s.id !== diary.id)
			setDiaries(newDiaries)
			autoSaveDiaries(newDiaries)
		}
	}

	const handleSave = async () => {
		setIsSaving(true)

		try {
			await pushDiaries({
				diaries,
				imageItems
			})

			setOriginalDiaries(diaries)
			setImageItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleExitEditMode = () => {
		if (diaries !== originalDiaries) {
			handleSave()
		} else {
			setIsEditMode(false)
		}
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode])

	if (isLoading) {
		return <div className="min-h-[100dvh] flex items-center justify-center text-slate-500 font-mono text-sm tracking-widest uppercase">Opening Vault...</div>
	}

	if (!isAuth) {
		return (
			<div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-slate-500 font-mono px-4">
				<div className="mb-8 relative group">
					<div className="absolute -inset-4 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition duration-1000"></div>
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 relative z-10">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
				</div>
				<h1 className="text-xl tracking-widest uppercase opacity-50 mb-8">Vault Locked</h1>
				
				<div className="w-full max-w-sm flex flex-col gap-4">
					<input 
						type="password" 
						placeholder="ENTER PASSWORD" 
						className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-center text-slate-300 font-mono text-sm tracking-widest focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								const key = e.currentTarget.value
								if (key) {
									import('@/hooks/use-auth').then(async ({ useAuthStore }) => {
										try {
											await useAuthStore.getState().setPassword(key)
											toast.success('Access granted. Decoding vault...')
											// Reload to trigger useEffect
											window.location.reload()
										} catch (err: any) {
											toast.error(err.message || 'Access denied.')
										}
									})
								}
							}
						}}
					/>
					<p className="text-xs opacity-40 text-center">Authentication required to access this private repository. Press ENTER to verify.</p>
				</div>
			</div>
		)
	}

	return (
		<div className='relative min-h-screen px-4 pb-20 pt-16 md:px-8 max-w-6xl mx-auto'>
			
			{/* Dashboard Layered Layout */}
			<div className="flex flex-col gap-8 mb-10">
				{/* Layer 1: Title & Global Actions */}
				<div className="flex items-center justify-between">
					<h1 className='text-4xl font-medium tracking-tight lg:text-5xl font-serif text-[var(--color-primary)]'>
						Diary
					</h1>
					
					<div className="flex items-center gap-2">
						{!hideEditButton && (
							<button 
								onClick={() => {
									if (isEditMode) {
										handleExitEditMode()
									} else {
										setIsEditMode(true)
									}
								}} 
								className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[13px] font-medium transition-all duration-300 shadow-sm border border-black/5 ${isEditMode ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-white dark:bg-neutral-900 text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
							>
								{isEditMode ? '完成' : '编辑模式'}
							</button>
						)}
						{!hideEditButton && (
							<button 
								onClick={() => setIsCreateDialogOpen(true)}
								className="bg-brand text-white px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-sm text-[13px] font-medium"
							>
								写日记
							</button>
						)}
					</div>
				</div>

				{/* Layer 2: Data Dashboard */}
				<div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-3xl p-8 border border-neutral-100 dark:border-neutral-800/50 w-full mb-2 overflow-x-auto scrollbar-none">
					<div className="flex-shrink-0">
						<OnThisDay diaries={diaries} />
					</div>
					<div className="w-[1px] h-32 bg-neutral-200 dark:bg-neutral-700 hidden md:block shrink-0"></div>
					<div className="flex-1 w-full flex md:justify-end shrink-0 min-w-max">
						<MemoryHeatmap diaries={diaries} />
					</div>
				</div>

				{/* Layer 3: Controls Row */}
				<div className='flex flex-col md:flex-row items-center justify-between gap-4 w-full'>
					{/* Left: Search & Filter */}
					<div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
						<div className='relative flex-1 min-w-[240px] md:max-w-[320px]'>
							<Search className='absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[var(--color-secondary)]' />
							<input 
								type="text"
								placeholder="搜索回忆、地点、标签..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='w-full bg-white dark:bg-neutral-900 border border-[var(--color-border)] rounded-full pl-10 pr-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm placeholder:text-neutral-400'
							/>
						</div>
						
						<div className="flex items-center gap-2">
							<button 
								onClick={() => setIsFilterPanelOpen(true)}
								className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm ${
									activeFilterCount > 0
										? 'bg-brand text-white border-transparent'
										: 'bg-white dark:bg-neutral-900 border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
								}`}
							>
								<Filter className="w-3.5 h-3.5" />
								<span className="max-sm:hidden">高级筛选</span>
								{activeFilterCount > 0 && (
									<span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white ml-0.5">
										{activeFilterCount}
									</span>
								)}
							</button>

							<button
								onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
								className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-[var(--color-border)] text-[var(--color-secondary)] text-sm font-medium hover:text-[var(--color-primary)] transition-all shadow-sm"
								title={sortOrder === 'desc' ? '当前：按时间倒序（最新优先）' : '当前：按时间正序（最旧优先）'}
							>
								{sortOrder === 'desc' ? <ArrowDownWideNarrow className="w-3.5 h-3.5" /> : <ArrowUpNarrowWide className="w-3.5 h-3.5" />}
								<span className="max-sm:hidden">{sortOrder === 'desc' ? '最新' : '最旧'}</span>
							</button>
						</div>
					</div>

					{/* Right: View Mode Toggle */}
					<div className='flex items-center bg-white dark:bg-neutral-900 border border-[var(--color-border)] p-1 rounded-full shrink-0 shadow-sm w-full md:w-auto justify-center'>
						<button
							onClick={() => setViewMode('grid')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
								viewMode === 'grid' ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
							}`}
						>
							<LayoutGrid className='w-3.5 h-3.5' />
							<span className="max-md:hidden">卡片</span>
						</button>
						<button
							onClick={() => setViewMode('calendar')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
								viewMode === 'calendar' ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
							}`}
						>
							<CalendarIcon className='w-3.5 h-3.5' />
							<span className="max-md:hidden">日历</span>
						</button>
						<button
							onClick={() => setViewMode('changelog')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
								viewMode === 'changelog' ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
							}`}
						>
							<List className='w-3.5 h-3.5' />
							<span className="max-md:hidden">时间轴</span>
						</button>
					</div>
				</div>
			</div>

			{viewMode === 'grid' && (
				<TimelineView diaries={filteredDiaries} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />
			)}
			{viewMode === 'calendar' && (
				<DiaryCalendar diaries={filteredDiaries} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />
			)}
			{viewMode === 'changelog' && (
				<ChangelogView diaries={filteredDiaries} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />
			)}

			<AnimatePresence>
				{isEditMode && (
					<motion.div 
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 100, opacity: 0 }}
						className='fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 rounded-full bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
					>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleExitEditMode}
							className='rounded-full bg-white dark:bg-neutral-800 shadow-sm px-6 py-3 text-sm font-bold text-neutral-600 dark:text-neutral-300 transition-colors hover:text-neutral-900 dark:hover:text-white'>
							完成编辑
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleAdd}
							className='rounded-full bg-[#18181b] text-white shadow-sm px-6 py-3 text-sm font-bold transition-colors hover:bg-neutral-800'>
							+ 添加日记
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>

			{isCreateDialogOpen && <CreateDialog diary={editingDiary} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveDiary} />}

			<DiaryFilterPanel
				isOpen={isFilterPanelOpen}
				onClose={() => setIsFilterPanelOpen(false)}
				diaries={diaries}
				filteredCount={filteredDiaries.length}
				filters={filters}
				setFilters={setFilters}
			/>
		</div>
	)
}
