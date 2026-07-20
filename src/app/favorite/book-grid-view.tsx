'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAuthStore } from '@/hooks/use-auth'

import { type LogoItem } from './components/logo-upload-dialog'
import { BookCard, type Book } from './components/book-card'
import { StandardToolbar } from '@/components/ui/standard-toolbar'

interface GridViewProps {
	books: Book[]
	categories?: string[]
	isEditMode?: boolean
	isManagement?: boolean
	onUpdate?: (updatedBook: Book, oldBook: Book, logoItem?: LogoItem) => void
	onDelete?: (book: Book) => void
	onTogglePin?: (book: Book) => void
}

export default function GridView({ books, isEditMode = false, isManagement = false, onUpdate, onDelete, onTogglePin }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')
	const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
	const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery')
	const { isAuth } = useAuthStore()

	// 预设标准分类
	const standardTags = ['all', 'Tech', 'Design', 'Fiction', 'Biography']
	const extractedTags = Array.from(new Set(books.flatMap(book => book.tags)))
	const allTags = ['all', ...Array.from(new Set([...standardTags.filter(t => t !== 'all'), ...extractedTags]))]

	const filteredBooks = books.filter(book => {
		const matchesSearch = book.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
			(book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
		const matchesTag = selectedTag === 'all' || book.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
		
		let matchesVisibility = true
		if (isManagement && isAuth) {
			if (visibilityFilter === 'public') {
				matchesVisibility = book.isShow === true
			} else if (visibilityFilter === 'private') {
				matchesVisibility = !book.isShow
			}
		}
		
		return matchesSearch && matchesTag && matchesVisibility
	})

	const extraActions = isManagement && isAuth ? (
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
		<div className='mx-auto w-full max-w-7xl px-6 pb-12'>
			<StandardToolbar
				tags={allTags.slice(0, 10)}
				selectedTag={selectedTag}
				onSelectTag={setSelectedTag}
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				searchPlaceholder="搜索书籍..."
				viewMode={viewMode === 'gallery' ? 'grid' : 'list'}
				onViewModeChange={(m) => setViewMode(m === 'list' ? 'list' : 'gallery')}
				extraRightActions={extraActions}
			/>

			{/* Grid or List */}
			{viewMode === 'list' ? (
				<div className="w-full overflow-x-auto pb-8">
					<table className="w-full text-sm text-left border-collapse whitespace-nowrap">
						<thead className="text-xs text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th className="font-normal py-3 px-4 w-[35%] min-w-[200px]">Aa Name</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">≡ 状态</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">🏷️ 标签</th>
								<th className="font-normal py-3 px-4 w-[20%] min-w-[120px]">📅 阅读时间</th>
								<th className="font-normal py-3 px-4 w-[15%] min-w-[100px]">⭐ 评分</th>
							</tr>
						</thead>
						<tbody>
							{filteredBooks.map((book: Book) => (
								<BookCard 
									key={book.name} 
									book={book} 
									isEditMode={isEditMode} 
									viewMode={viewMode}
									onUpdate={onUpdate} 
									onDelete={() => onDelete?.(book)} 
									onTogglePin={onTogglePin} 
								/>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className='grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
					{filteredBooks.map((book: Book) => (
						<BookCard 
							key={book.name} 
							book={book} 
							isEditMode={isEditMode} 
							viewMode={viewMode}
							onUpdate={onUpdate} 
							onDelete={() => onDelete?.(book)} 
							onTogglePin={onTogglePin} 
						/>
					))}
				</div>
			)}

			{filteredBooks.length === 0 && (
				<div className='flex flex-col items-center justify-center py-24 text-slate-400'>
					<div className='w-14 h-14 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200 dark:border-slate-700/60'>
						<Search className='w-6 h-6 text-slate-400' />
					</div>
					<p className='text-base font-medium text-slate-700 dark:text-slate-200'>未找到相关书籍</p>
					<p className='text-xs mt-1 text-slate-400'>试试更换搜索关键词或标签筛选</p>
				</div>
			)}
		</div>
	)
}
