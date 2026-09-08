'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import BookGridView from '@/app/favorite/book-grid-view'
import dynamic from 'next/dynamic'
const BookCreateDialog = dynamic(() => import('@/app/favorite/components/book-create-dialog'), { ssr: false })
const BookSearchDialog = dynamic(() => import('@/app/favorite/components/book-search-dialog'), { ssr: false })
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'
import { pushBooks } from '@/app/favorite/books/services/push-books'

import initialBooks from '@/data/books.json'
import initialCategories from '@/app/favorite/categories.json'

import type { Book } from '@/app/favorite/components/book-card'
import type { LogoItem } from '@/app/favorite/components/logo-upload-dialog'

export default function VaultBooksPage() {
	const { isAuth } = useAuthStore()

	if (!isAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-primary)]">
				<div className="text-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] max-w-md mx-6">
					<h2 className="text-xl font-bold mb-2">未授权访问</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-4">此页面是私人仓库管理，请先在右上角输入密码切换为作者模式。</p>
					<Link href="/favorite/books" className="brand-btn px-4 py-2 rounded-full text-sm inline-block">
						返回精选页
					</Link>
				</div>
			</div>
		)
	}

	return <VaultBooksContent />
}

function VaultBooksContent() {
	const [books, setBooks] = useState<Book[]>(initialBooks as Book[])
	const [originalBooks, setOriginalBooks] = useState<Book[]>(initialBooks as Book[])
	const [categories, setCategories] = useState<string[]>(initialCategories as string[])
	const [originalCategories, setOriginalCategories] = useState<string[]>(initialCategories as string[])
	const [editingBook, setEditingBook] = useState<Book | null>(null)
	const [isBookDialogOpen, setIsBookDialogOpen] = useState(false)
	const [isSearchOpen, setIsSearchOpen] = useState(false)

	const { isAuth } = useAuthStore()

	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())

	const { siteContent } = useConfigStore()

	const handleUpdateBook = (updatedBook: Book, oldBook: Book, logoItem?: LogoItem) => {
		const updated = books.map(s => (s.name === oldBook.name ? updatedBook : s))
		setBooks(updated)
		if (logoItem) {
			setLogoItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedBook.name, logoItem)
				return newMap
			})
		}
		autoSave(updated, categories)
	}

	const handleSaveBook = (updatedBook: Book) => {
		let updated: Book[] = []
		if (editingBook) {
			updated = books.map(s => (s.name === editingBook.name ? updatedBook : s))
		} else {
			updated = [...books, updatedBook]
		}
		setBooks(updated)
		autoSave(updated, categories)
	}

	const handleDeleteBook = (book: Book) => {
		if (confirm(`确定要删除《${book.name}》吗？`)) {
			const updated = books.filter(s => s.name !== book.name)
			setBooks(updated)
			autoSave(updated, categories)
		}
	}

	const handleTogglePin = async (book: Book) => {
		const pinCount = books.filter(b => b.isPinned).length
		if (!book.isPinned && pinCount >= 5) {
			toast.error('最多只能置顶 5 个书籍')
			return
		}

		const updatedBook = { ...book, isPinned: !book.isPinned }
		const newBooks = books.map(s => (s.name === book.name ? updatedBook : s))
		setBooks(newBooks)
		setOriginalBooks(newBooks)

		try {
			const res = await fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'books', data: newBooks }) })
			const data = await res.json()
			if (data.success) {
				toast.success(updatedBook.isPinned ? '已置顶' : '已取消置顶')
			}
		} catch (err) {
			console.error(err)
		}
	}

	const handleAddCategory = (newCategory: string) => {
		if (newCategory.trim() && !categories.includes(newCategory.trim())) {
			const updatedCats = [...categories, newCategory.trim()]
			setCategories(updatedCats)
			autoSave(books, updatedCats)
		}
	}

	const handleDeleteCategory = (categoryToDelete: string) => {
		const updatedCats = categories.filter(c => c !== categoryToDelete)
		setCategories(updatedCats)
		autoSave(books, updatedCats)
	}

	const autoSave = async (updatedBooks: Book[], updatedCategories: string[]) => {
		setIsSaving(true)
		try {
			const promises = [
				fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'books', data: updatedBooks }) }),
				fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'book-categories', data: updatedCategories }) })
			]

			const results = await Promise.all(promises)
			for (const res of results) {
				const data = await res.json()
				if (!data.success) throw new Error(data.error)
			}

			setOriginalBooks(updatedBooks)
			setOriginalCategories(updatedCategories)
			setLogoItems(new Map())
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
			await pushBooks({
				books,
				categories,
				logoItems
			})

			setOriginalBooks(books)
			setOriginalCategories(categories)
			setLogoItems(new Map())
			setIsEditMode(false)
		} catch (error: any) {
			console.error('Failed to push:', error)
			toast.error(`云端发布失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	// In the vault, we always see ALL books
	const sortedBooks = [...books].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		
		const timeA = a.readDate ? new Date(a.readDate).getTime() : 0
		const timeB = b.readDate ? new Date(b.readDate).getTime() : 0
		return timeB - timeA
	})

	return (
		<div className='min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]'>
			<div className='mx-auto w-full max-w-7xl px-6 pt-32 pb-8'>
				<div className='flex items-center gap-2 mb-4'>
					<Link
						href='/favorite/books'
						className='flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:scale-105 active:scale-95 transition-all shadow-sm'
					>
						<ArrowLeft className='w-4 h-4' />
					</Link>
					<span className='text-xs font-semibold tracking-widest uppercase text-[var(--color-secondary)]'>返回公开页</span>
				</div>

				<div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
					<div>
						<h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl mb-3 font-sans flex items-center gap-3'>
							Books 仓库管理
							<span className='text-lg font-medium font-mono hidden sm:inline-block px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-secondary)]'>Vault</span>
							<span className='text-sm font-medium font-mono hidden sm:inline-block px-3 py-1 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand)]'>共 {books.length} 项</span>
						</h1>
						<p className='text-sm max-w-xl leading-relaxed text-[var(--color-secondary)]'>
							在这里管理你的所有书籍记录。可以新增、编辑、删除以及控制哪些项目公开到 Favorites 精选和主页展示。
						</p>
					</div>

					<div className='flex items-center gap-3'>
						{isEditMode ? (
							<>
								<motion.button onClick={() => setIsEditMode(false)} className='rounded-full border bg-[var(--color-bg)] dark:bg-[var(--color-card)] px-4 py-2 text-sm shadow-sm font-medium text-[var(--color-primary)]'>
									退出编辑
								</motion.button>
								<motion.button onClick={() => setIsSearchOpen(true)} className='rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 text-sm shadow-sm font-medium flex items-center gap-1.5 hover:bg-blue-500/20 transition-all'>
									<Search className="w-3.5 h-3.5" />
									<span>搜书录入</span>
								</motion.button>
								<motion.button onClick={() => { setEditingBook(null); setIsBookDialogOpen(true); }} className='rounded-full border bg-[var(--color-bg)] dark:bg-[var(--color-card)] px-4 py-2 text-sm shadow-sm font-medium text-[var(--color-primary)]'>
									+ 手动添加
								</motion.button>
								<motion.button onClick={handlePublishCloudClick} disabled={isSaving} className='brand-btn px-6 py-2 rounded-full text-sm shadow-sm font-medium'>
									{isSaving ? '发布中...' : '发布云端'}
								</motion.button>
							</>
						) : (
							<motion.button onClick={() => setIsEditMode(true)} className='bg-[var(--color-bg)] dark:bg-[var(--color-card)] rounded-full border px-4 py-2 text-sm shadow-sm transition-colors hover:bg-[var(--color-bg)] font-medium text-[var(--color-secondary)]'>
								编辑模式
							</motion.button>
						)}
					</div>
				</div>
			</div>

			<div>
				<BookGridView 
					books={sortedBooks} 
					categories={categories}
					isEditMode={isEditMode} 
					isManagement={true}
					onUpdate={handleUpdateBook} 
					onDelete={handleDeleteBook}
					onTogglePin={handleTogglePin}
				/>
			</div>

			{isBookDialogOpen && <BookCreateDialog bookList={books} books={editingBook} categories={categories} onClose={() => setIsBookDialogOpen(false)} onSave={handleSaveBook} />}
			
			<BookSearchDialog
				open={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
				onSelect={(selected) => {
					setEditingBook(selected as Book)
					setIsBookDialogOpen(true)
				}}
			/>
		</div>
	)
}
