'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { 
	Search, 
	LayoutGrid, 
	List, 
	Clock, 
	BookOpen, 
	BarChart3, 
	Bookmark, 
	CheckCircle2, 
	Sparkles, 
	Trophy, 
	Plus, 
	X, 
	RotateCcw,
	Flame
} from 'lucide-react'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'

import { type LogoItem } from './components/logo-upload-dialog'
import { BookCard, type Book } from './components/book-card'
import BookStatsPanel from './components/book-stats-panel'
import BookTimelineView from './components/book-timeline-view'
import BookYearlyStatsView from './components/book-yearly-stats-view'
import BookDetailModal from './components/book-detail-modal'
import dynamic from 'next/dynamic'
const BookEditModal = dynamic(() => import('./components/book-edit-modal'), { ssr: false })
const BookMarkReadModal = dynamic(() => import('./components/book-mark-read-modal'), { ssr: false })
import { StandardToolbar } from '@/components/ui/standard-toolbar'

interface GridViewProps {
	books: Book[]
	categories?: string[]
	isEditMode?: boolean
	isManagement?: boolean
	isStatsOpen?: boolean
	onToggleStats?: () => void
	onUpdate?: (updatedBook: Book, oldBook: Book, logoItem?: LogoItem) => void
	onDelete?: (book: Book) => void
	onTogglePin?: (book: Book) => void
}

export default function BookGridView({ 
	books, 
	categories = [], 
	isEditMode = false, 
	isManagement = false, 
	isStatsOpen, 
	onToggleStats, 
	onUpdate, 
	onDelete, 
	onTogglePin 
}: GridViewProps) {
	const { isAuth } = useAuthStore()
	const canEdit = Boolean(isEditMode && isAuth)
	const [internalStatsOpen, setInternalStatsOpen] = useState(false)
	const showStats = isStatsOpen !== undefined ? isStatsOpen : internalStatsOpen
	const handleCloseStats = onToggleStats ? onToggleStats : () => setInternalStatsOpen(false)

	const [statusFilter, setStatusFilter] = useState<'all' | 'finished' | 'reading' | 'wishlist'>('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')
	const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
	const [sortBy, setSortBy] = useState<'default' | 'ratingDesc' | 'ratingAsc' | 'readDateDesc' | 'progressDesc'>('default')
	const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'timeline' | 'yearly'>('gallery')
	
	const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null)
	const [editingBook, setEditingBook] = useState<Book | null>(null)
	const [markingReadBook, setMarkingReadBook] = useState<Book | null>(null)
	
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

	// Preset standard categories
	const standardTags = ['all', 'Tech', 'Design', 'Fiction', 'Biography', 'Non-tech Learning']
	const extractedTags = Array.from(new Set(books.flatMap(book => book.tags || [])))
	const allTags = ['all', ...Array.from(new Set([...standardTags.filter(t => t !== 'all'), ...extractedTags]))]

	// Status counts
	const countFinished = useMemo(() => books.filter(b => b.status === 'finished' || (!b.status && b.readDate)).length, [books])
	const countReading = useMemo(() => books.filter(b => b.status === 'reading').length, [books])
	const countWishlist = useMemo(() => books.filter(b => b.status === 'wishlist').length, [books])

	// Filter & Sort
	const filteredBooks = useMemo(() => {
		let list = books.filter(book => {
			// Search filter
			const matchesSearch = book.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
				(book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
				(book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
			
			// Tag filter
			const matchesTag = selectedTag === 'all' || (book.tags || []).some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
			
			// Status filter
			let matchesStatus = true
			if (statusFilter === 'finished') {
				matchesStatus = book.status === 'finished' || (!book.status && Boolean(book.readDate))
			} else if (statusFilter === 'reading') {
				matchesStatus = book.status === 'reading'
			} else if (statusFilter === 'wishlist') {
				matchesStatus = book.status === 'wishlist'
			}

			// Visibility filter
			let matchesVisibility = true
			if (isManagement && isAuth) {
				if (visibilityFilter === 'public') {
					matchesVisibility = book.isShow === true
				} else if (visibilityFilter === 'private') {
					matchesVisibility = !book.isShow
				}
			}
			
			return matchesSearch && matchesTag && matchesStatus && matchesVisibility
		})

		// Sort
		if (sortBy === 'ratingDesc') {
			list.sort((a, b) => (b.stars || 0) - (a.stars || 0))
		} else if (sortBy === 'ratingAsc') {
			list.sort((a, b) => (a.stars || 0) - (b.stars || 0))
		} else if (sortBy === 'readDateDesc') {
			list.sort((a, b) => {
				const tA = a.readDate ? new Date(a.readDate).getTime() : 0
				const tB = b.readDate ? new Date(b.readDate).getTime() : 0
				return tB - tA
			})
		} else if (sortBy === 'progressDesc') {
			list.sort((a, b) => (b.progress || 0) - (a.progress || 0))
		} else {
			// Default: Pinned first, then readDate desc
			list.sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1
				if (!a.isPinned && b.isPinned) return 1
				const tA = a.readDate ? new Date(a.readDate).getTime() : 0
				const tB = b.readDate ? new Date(b.readDate).getTime() : 0
				return tB - tA
			})
		}

		return list
	}, [books, searchTerm, selectedTag, statusFilter, visibilityFilter, sortBy, isManagement, isAuth])

	const extraActions = (
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
				<option value="readDateDesc">阅读时间 (最新优先)</option>
				<option value="progressDesc">阅读进度 (由高到低)</option>
			</select>

			{/* Visibility selector for author management */}
			{isManagement && isAuth && (
				<select
					value={visibilityFilter}
					onChange={e => setVisibilityFilter(e.target.value as any)}
					className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white px-3 py-2 text-xs focus:outline-hidden transition-all cursor-pointer"
				>
					<option value="all">所有公开/私有</option>
					<option value="public">仅精选公开</option>
					<option value="private">仅私人归档</option>
				</select>
			)}
		</div>
	)

	return (
		<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16">
			{/* Collapsible Stats Analytics Panel */}
			<BookStatsPanel
				books={books}
				isOpen={showStats}
				onClose={handleCloseStats}
				onOpenYearlyView={() => setViewMode('yearly')}
				onSelectBook={(b) => setSelectedBookForDetail(b)}
				onSelectTag={(t) => setSelectedTag(t)}
			/>

			{/* Status Filter Tabs & View Mode Switcher Header */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
				{/* Status Filter Tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
					<button
						onClick={() => setStatusFilter('all')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
							statusFilter === 'all'
								? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
								: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
						}`}
					>
						<BookOpen className="w-3.5 h-3.5" />
						<span>全部藏书 ({books.length})</span>
					</button>

					<button
						onClick={() => setStatusFilter('finished')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
							statusFilter === 'finished'
								? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
								: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
						}`}
					>
						<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
						<span>已读 ({countFinished})</span>
					</button>

					<button
						onClick={() => setStatusFilter('reading')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
							statusFilter === 'reading'
								? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
								: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
						}`}
					>
						<Flame className="w-3.5 h-3.5 text-amber-500" />
						<span>在读 ({countReading})</span>
					</button>

					<button
						onClick={() => setStatusFilter('wishlist')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
							statusFilter === 'wishlist'
								? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
								: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
						}`}
					>
						<Bookmark className="w-3.5 h-3.5 text-purple-500" />
						<span>想读 ({countWishlist})</span>
					</button>
				</div>

				{/* View Mode Switching Buttons */}
				<div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 self-end md:self-auto shrink-0">
					<button
						onClick={() => setViewMode('gallery')}
						className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
							viewMode === 'gallery'
								? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
								: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
						}`}
						title="画廊网格视图"
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
						title="详细列表视图"
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
						title="阅读时光轴"
					>
						<Clock className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">时光轴</span>
					</button>

					<button
						onClick={() => setViewMode('yearly')}
						className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
							viewMode === 'yearly'
								? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
								: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
						}`}
						title="年度阅读年鉴"
					>
						<Trophy className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">年鉴</span>
					</button>
				</div>
			</div>

			{/* Standard Search & Tags Toolbar (for gallery and list) */}
			{(viewMode === 'gallery' || viewMode === 'list') && (
				<StandardToolbar
					tags={allTags.slice(0, 10)}
					selectedTag={selectedTag}
					onSelectTag={setSelectedTag}
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					searchPlaceholder="搜索书名、作者、书评心得... (⌘K /)"
					viewMode={viewMode === 'gallery' ? 'grid' : 'list'}
					onViewModeChange={(m) => setViewMode(m === 'list' ? 'list' : 'gallery')}
					extraRightActions={extraActions}
				/>
			)}

			{/* ================= VIEW 1: GALLERY GRID VIEW ================= */}
			{viewMode === 'gallery' && (
				<div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{filteredBooks.map((book: Book) => (
						<BookCard 
							key={book.name} 
							book={book} 
							isEditMode={isEditMode} 
							viewMode="gallery"
							onUpdate={onUpdate} 
							onDelete={() => onDelete?.(book)} 
							onTogglePin={onTogglePin} 
							onMarkRead={(b) => setMarkingReadBook(b)}
						/>
					))}
				</div>
			)}

			{/* ================= VIEW 2: DETAILED LIST VIEW ================= */}
			{viewMode === 'list' && (
				<div className="w-full overflow-x-auto pb-8">
					<table className="w-full text-sm text-left border-collapse whitespace-nowrap">
						<thead className="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th className="font-normal py-3 px-4 w-[35%] min-w-[200px]">Aa 书名与作者</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">≡ 阅读状态</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">🏷️ 标签领域</th>
								<th className="font-normal py-3 px-4 w-[20%] min-w-[120px]">📅 读完日期</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">⭐ 评分</th>
							</tr>
						</thead>
						<tbody>
							{filteredBooks.map((book: Book) => (
								<BookCard 
									key={book.name} 
									book={book} 
									isEditMode={isEditMode} 
									viewMode="list"
									onUpdate={onUpdate} 
									onDelete={() => onDelete?.(book)} 
									onTogglePin={onTogglePin} 
									onMarkRead={(b) => setMarkingReadBook(b)}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* ================= VIEW 3: TIMELINE VIEW ================= */}
			{viewMode === 'timeline' && (
				<BookTimelineView
					books={filteredBooks}
					isEditMode={isEditMode}
					onSelectBook={(b) => setSelectedBookForDetail(b)}
					onUpdate={onUpdate}
					onDelete={onDelete}
					onTogglePin={onTogglePin}
				/>
			)}

			{/* ================= VIEW 4: YEARLY RECAP VIEW ================= */}
			{viewMode === 'yearly' && (
				<BookYearlyStatsView
					books={books}
					onSelectBook={(b) => setSelectedBookForDetail(b)}
					onBackToTimeline={() => setViewMode('timeline')}
				/>
			)}

			{/* Empty Search Result Fallback */}
			{(viewMode === 'gallery' || viewMode === 'list') && filteredBooks.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 text-slate-400">
					<div className="w-14 h-14 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200 dark:border-slate-700/60">
						<Search className="w-6 h-6 text-slate-400" />
					</div>
					<p className="text-base font-medium text-slate-700 dark:text-slate-200">未找到相关书籍</p>
					<p className="text-xs mt-1 text-slate-400">试试更换搜索关键词或重置状态与标签筛选</p>
					<button
						onClick={() => {
							setSearchTerm('')
							setSelectedTag('all')
							setStatusFilter('all')
						}}
						className="mt-4 px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						<span>重置所有筛选</span>
					</button>
				</div>
			)}

			{/* Book Detail Modal */}
			{selectedBookForDetail && (
				<BookDetailModal
					book={selectedBookForDetail}
					onClose={() => setSelectedBookForDetail(null)}
					isEditMode={isManagement && isAuth}
					onMarkRead={(b) => setMarkingReadBook(b)}
					onEdit={(b) => {
						setSelectedBookForDetail(null)
						setEditingBook(b)
					}}
				/>
			)}

			{/* Book Edit Modal */}
			{canEdit && editingBook && (
				<BookEditModal
					book={editingBook}
					onClose={() => setEditingBook(null)}
					onSave={(updated) => {
						onUpdate?.(updated, editingBook)
						setEditingBook(null)
					}}
				/>
			)}

			{/* Mark Read Modal */}
			{canEdit && markingReadBook && (
				<BookMarkReadModal
					isOpen={Boolean(markingReadBook)}
					onClose={() => setMarkingReadBook(null)}
					book={markingReadBook}
					onMarkRead={(updated) => {
						onUpdate?.(updated, markingReadBook)
						setMarkingReadBook(null)
					}}
				/>
			)}
		</div>
	)
}
