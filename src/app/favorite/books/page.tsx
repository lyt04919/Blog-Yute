'use client'

import { useState } from 'react'
import Link from 'next/link'
import BookGridView from '../book-grid-view'
import { useAuthStore } from '@/hooks/use-auth'
import { StandardPageHeader } from '@/components/ui/standard-page-header'

import initialBooks from '@/data/books.json'
import initialCategories from '../categories.json'

import type { Book } from '../components/book-card'

export default function FavoriteBooksPage() {
	const [books] = useState<Book[]>(initialBooks as Book[])
	const [categories] = useState<string[]>(initialCategories as string[])

	const { isAuth } = useAuthStore()

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

	const headerActions = isAuth ? (
		<Link
			href='/vault/books'
			className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm'
		>
			管理书籍仓库 ({books.length}) →
		</Link>
	) : undefined

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
				/>
			</div>
		</div>
	)
}
