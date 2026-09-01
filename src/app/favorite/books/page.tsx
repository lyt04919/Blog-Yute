'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import BookGridView from '../book-grid-view'
import { useAuthStore } from '@/hooks/use-auth'
import { StandardPageHeader } from '@/components/ui/standard-page-header'

import initialBooks from '@/data/books.json'
import initialCategories from '../categories.json'

import type { Book } from '../components/book-card'

import dynamic from 'next/dynamic'
const BookReportModal = dynamic(() => import('../components/book-report-modal'), { ssr: false })
import { BookOpen, BarChart3, Sparkles } from 'lucide-react'

export default function FavoriteBooksPage() {
	const [books, setBooks] = useState<Book[]>(initialBooks as Book[])
	const [categories] = useState<string[]>(initialCategories as string[])
	const [isReportOpen, setIsReportOpen] = useState(false)
	const [isStatsOpen, setIsStatsOpen] = useState(false)

	const { isAuth } = useAuthStore()

	const persistBooks = async (newBooks: Book[]) => {
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: 'books', data: newBooks })
			})
			const data = await res.json()
			if (!data.success) {
				console.error('Failed to save books:', data.error)
				toast.error(`保存失败: ${data.error || '未知错误'}`)
			}
		} catch (e) {
			console.error('Auto save error:', e)
			toast.error('保存出错了')
		}
	}

	const handleUpdateBook = (updatedBook: Book, oldBook?: Book) => {
		const targetName = (oldBook?.name || updatedBook.name).trim().toLowerCase()

		const exists = books.some(b => b.name.trim().toLowerCase() === targetName)

		let updated: Book[]
		if (exists) {
			updated = books.map(b => b.name.trim().toLowerCase() === targetName ? updatedBook : b)
		} else {
			updated = [...books, updatedBook]
		}

		setBooks(updated)
		if (isAuth) {
			persistBooks(updated)
		}
	}

	// Filter: Showcase page only sees isShow === true.
	const displayedBooks = books.filter(b => b.isShow)

	// Sort books: pinned first
	const sortedBooks = [...displayedBooks].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		
		const timeA = a.readDate ? new Date(a.readDate).getTime() : 0
		const timeB = b.readDate ? new Date(b.readDate).getTime() : 0
		return timeB - timeA
	})

	const headerActions = (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={() => setIsReportOpen(true)}
				className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
			>
				<Sparkles className="w-3.5 h-3.5" />
				<span>阅读年报</span>
			</button>

			<button
				type="button"
				onClick={() => setIsStatsOpen(!isStatsOpen)}
				className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
					isStatsOpen
						? 'bg-blue-600 text-white border-blue-500 font-bold'
						: 'border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
				}`}
			>
				<BarChart3 className="w-3.5 h-3.5" />
				<span>{isStatsOpen ? '收起看板' : '数据看板'}</span>
			</button>

			{isAuth && (
				<Link
					href='/vault/books'
					className='px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm'
				>
					管理仓库 ({books.length}) →
				</Link>
			)}
		</div>
	)

	return (
		<div className='min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]'>
			<StandardPageHeader
				backHref='/favorite'
				backLabel='FAVORITES'
				title='Books'
				badge='for devs'
				subtitle='A curated collection of books, exploring the intersection of technology, humanity, and the future.'
				actions={headerActions}
			/>

			<div>
				<BookGridView 
					books={sortedBooks} 
					categories={categories}
					isEditMode={false} 
					isStatsOpen={isStatsOpen}
					onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
					onUpdate={handleUpdateBook}
				/>
			</div>

			{isReportOpen && (
				<BookReportModal
					isOpen={isReportOpen}
					onClose={() => setIsReportOpen(false)}
					books={books}
				/>
			)}
		</div>
	)
}
