'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import TimelineView from './timeline-view'
import CreateDialog from './components/create-dialog'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import type { Diary, DiaryViewMode } from '@/types/diary'

import { LayoutGrid, Calendar as CalendarIcon, List, Search, Filter, ArrowDownWideNarrow, ArrowUpNarrowWide, X } from 'lucide-react'
import DiaryCalendar from './components/diary-calendar'
import ChangelogView from './changelog-view'
import OnThisDay from './components/on-this-day'
import DiaryFilterPanel from './components/diary-filter-panel'
import MemoryHeatmap from './components/memory-heatmap'
import DiaryEmptyState from './components/diary-empty-state'
import DiarySkeleton from './components/diary-skeleton'
import { useDiaryData } from './hooks/use-diary-data'
import { useDiaryFilters } from './hooks/use-diary-filters'

export default function Page() {
	const {
		isAuth,
		isLoading,
		diaries,
		handleUpdateDiary,
		handleSaveDiary,
		handleDeleteDiary
	} = useDiaryData()

	const {
		searchQuery,
		setSearchQuery,
		sortOrder,
		setSortOrder,
		filters,
		setFilters,
		filteredDiaries,
		activeFilterCount,
		resetFilters,
		setSingleDateFilter
	} = useDiaryFilters(diaries)

	const [isEditMode, setIsEditMode] = useState(false)
	const [editingDiary, setEditingDiary] = useState<Diary | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [viewMode, setViewMode] = useState<DiaryViewMode>('grid')
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleAdd = () => {
		setEditingDiary(null)
		setIsCreateDialogOpen(true)
	}

	const handleAddForDate = (dateStr: string) => {
		setEditingDiary({
			id: Date.now().toString(),
			date: dateStr,
			content: ''
		})
		setIsCreateDialogOpen(true)
	}

	const onSaveFromDialog = (updated: Diary) => {
		handleSaveDiary(updated, editingDiary?.id)
		setIsCreateDialogOpen(false)
		setEditingDiary(null)
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
		return <DiarySkeleton />
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
		<div className='relative min-h-screen px-4 pb-28 pt-16 md:px-8 max-w-6xl mx-auto'>
			{/* Dashboard Layered Layout */}
			<div className="flex flex-col gap-8 mb-8">
				{/* Layer 1: Title & Global Actions */}
				<div className="flex items-center justify-between">
					<h1 className='text-4xl font-medium tracking-tight lg:text-5xl font-serif text-[var(--color-primary)]'>
						Diary
					</h1>
					
					<div className="flex items-center gap-2">
						{!hideEditButton && (
							<button 
								onClick={() => setIsEditMode(prev => !prev)} 
								className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[13px] font-medium transition-all duration-300 shadow-xs border border-black/5 dark:border-white/10 ${isEditMode ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-white dark:bg-neutral-900 text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
							>
								{isEditMode ? '完成' : '编辑模式'}
							</button>
						)}
						{!hideEditButton && (
							<button 
								onClick={handleAdd}
								className="bg-brand text-white px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xs text-[13px] font-medium"
							>
								写日记
							</button>
						)}
					</div>
				</div>

				{/* Layer 2: Memory Dashboard (OnThisDay & Interactive Heatmap) */}
				<div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-3xl p-6 md:p-8 border border-neutral-100 dark:border-neutral-800/60 w-full overflow-x-auto scrollbar-none">
					<div className="shrink-0">
						<OnThisDay diaries={diaries} />
					</div>
					<div className="w-[1px] h-32 bg-neutral-200 dark:bg-neutral-800 hidden md:block shrink-0" />
					<div className="flex-1 w-full flex justify-start md:justify-end min-w-0">
						<MemoryHeatmap 
							diaries={diaries} 
							selectedDate={filters.date} 
							onSelectDate={setSingleDateFilter} 
						/>
					</div>
				</div>

				{/* Heatmap Active Date Banner */}
				{filters.date && (
					<div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-brand/10 border border-brand/20 text-xs font-medium text-brand">
						<span>当前筛选日期：{filters.date}</span>
						<button 
							onClick={() => setSingleDateFilter(filters.date!)} 
							className="flex items-center gap-1 hover:underline"
						>
							<X className="w-3.5 h-3.5" />
							<span>清除日期筛选</span>
						</button>
					</div>
				)}

				{/* Layer 3: Controls Row */}
				<div className='flex flex-col md:flex-row items-center justify-between gap-4 w-full'>
					{/* Left: Search & Filter */}
					<div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
						<div className='relative flex-1 min-w-[240px] md:max-w-[320px]'>
							<Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
							<input 
								type="text"
								placeholder="搜索回忆、地点、标签、情绪..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='w-full bg-white dark:bg-neutral-900 border border-[var(--color-border)] rounded-full pl-10 pr-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs placeholder:text-neutral-400'
							/>
						</div>
						
						<div className="flex items-center gap-2">
							<button 
								onClick={() => setIsFilterPanelOpen(true)}
								className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all shadow-xs ${
									activeFilterCount > 0
										? 'bg-brand text-white border-transparent'
										: 'bg-white dark:bg-neutral-900 border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
								}`}
							>
								<Filter className="w-3.5 h-3.5" />
								<span className="max-sm:hidden">高级筛选</span>
								{activeFilterCount > 0 && (
									<span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white ml-0.5">
										{activeFilterCount}
									</span>
								)}
							</button>

							<button
								onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
								className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-[var(--color-border)] text-[var(--color-secondary)] text-sm font-medium hover:text-[var(--color-primary)] transition-all shadow-xs"
								title={sortOrder === 'desc' ? '按时间倒序（最新优先）' : '按时间正序（最旧优先）'}
							>
								{sortOrder === 'desc' ? <ArrowDownWideNarrow className="w-3.5 h-3.5" /> : <ArrowUpNarrowWide className="w-3.5 h-3.5" />}
								<span className="max-sm:hidden">{sortOrder === 'desc' ? '最新' : '最旧'}</span>
							</button>
						</div>
					</div>

					{/* Right: View Mode Toggle */}
					<div className='flex items-center bg-white dark:bg-neutral-900 border border-[var(--color-border)] p-1 rounded-full shrink-0 shadow-xs w-full md:w-auto justify-center'>
						<button
							onClick={() => setViewMode('grid')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
								viewMode === 'grid' ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
							}`}
						>
							<LayoutGrid className='w-3.5 h-3.5' />
							<span>卡片</span>
						</button>
						<button
							onClick={() => setViewMode('calendar')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
								viewMode === 'calendar' ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
							}`}
						>
							<CalendarIcon className='w-3.5 h-3.5' />
							<span>日历</span>
						</button>
						<button
							onClick={() => setViewMode('changelog')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
								viewMode === 'changelog' ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
							}`}
						>
							<List className='w-3.5 h-3.5' />
							<span>时间轴</span>
						</button>
					</div>
				</div>
			</div>

			{/* Views or Empty State */}
			{filteredDiaries.length === 0 ? (
				<DiaryEmptyState
					isFiltered={activeFilterCount > 0 || !!searchQuery}
					onResetFilter={resetFilters}
					onCreateDiary={handleAdd}
				/>
			) : (
				<>
					{viewMode === 'grid' && (
						<TimelineView 
							diaries={filteredDiaries} 
							isEditMode={isEditMode} 
							onUpdate={handleUpdateDiary} 
							onDelete={handleDeleteDiary} 
						/>
					)}
					{viewMode === 'calendar' && (
						<DiaryCalendar 
							diaries={filteredDiaries} 
							isEditMode={isEditMode} 
							onUpdate={handleUpdateDiary} 
							onDelete={handleDeleteDiary}
							onAddForDate={handleAddForDate}
						/>
					)}
					{viewMode === 'changelog' && (
						<ChangelogView 
							diaries={filteredDiaries} 
							isEditMode={isEditMode} 
							onUpdate={handleUpdateDiary} 
							onDelete={handleDeleteDiary} 
						/>
					)}
				</>
			)}

			{/* Floating Edit Mode Bar */}
			<AnimatePresence>
				{isEditMode && (
					<motion.div 
						initial={{ y: 80, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 80, opacity: 0 }}
						className='fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 rounded-full bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xl'
					>
						<button
							onClick={() => setIsEditMode(false)}
							className='rounded-full bg-white dark:bg-neutral-800 shadow-xs px-5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 transition-colors hover:text-black dark:hover:text-white'
						>
							退出编辑
						</button>
						<button
							onClick={handleAdd}
							className='rounded-full bg-brand text-white shadow-xs px-5 py-2.5 text-xs font-bold transition-opacity hover:brightness-110'
						>
							+ 添加日记
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Create/Edit Dialog */}
			{isCreateDialogOpen && (
				<CreateDialog 
					diary={editingDiary} 
					onClose={() => { setIsCreateDialogOpen(false); setEditingDiary(null); }} 
					onSave={onSaveFromDialog} 
				/>
			)}

			{/* Advanced Filter Panel Drawer */}
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
