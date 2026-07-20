'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { gsap } from 'gsap'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import ScrollFloat from '@/components/scroll-float/ScrollFloat'
import { BookOpen, Film, Hammer, FileText, ArrowUpRight, Settings, Loader2, Sparkles, SlidersHorizontal, Eye, Save, Upload, Play, Headphones, MapPin, Pause } from 'lucide-react'
import { toast } from 'sonner'

import booksData from '@/data/books.json'
import moviesData from '@/data/movies.json'
import blogIndex from '@/../public/blogs/index.json'
import projectsData from '@/data/projects.json'

import type { Book } from '@/app/favorite/components/book-card'
import type { Movie } from '@/app/favorite/components/movie-card'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'
import { pushSiteContent } from '@/app/(home)/services/push-site-content'
import { DialogModal } from '@/components/dialog-modal'
import StarBadge from '@/components/ui/star-badge'

interface BlogItem {
	slug: string
	title: string
	date: string
	summary?: string
	cover?: string
	hidden?: boolean
	status?: string
}

interface ProjectItem {
	name: string
	description?: string
	image?: string
	url?: string
	tags?: string[]
}

export default function LiveStatus() {
	const { isAuth } = useAuthStore()
	const { siteContent, setSiteContent, cardStyles } = useConfigStore()

	const [isEditOpen, setIsEditOpen] = useState(false)
	const [activeTab, setActiveTab] = useState<'building' | 'article' | 'book' | 'movie'>('building')
	const [isSaving, setIsSaving] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)

	const fileInputRef = useRef<HTMLInputElement>(null)


	const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const card = e.currentTarget
		const rect = card.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100
		card.style.setProperty('--glow-x', `${x}%`)
		card.style.setProperty('--glow-y', `${y}%`)
		card.style.setProperty('--glow-intensity', '1')
	}

	const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
		const card = e.currentTarget
		card.style.setProperty('--glow-intensity', '0')
	}
	const [uploadTarget, setUploadTarget] = useState<'article' | 'book' | 'movie'>('article')

	const bentoConfig = siteContent.bentoConfig || {}

	// --- 1. Automated fallbacks from data stores ---
	const readingBooks = (booksData as Book[]).filter(b => b.status === 'reading' && b.isShow)
	const autoBook = readingBooks.length > 0 ? readingBooks[0] : (booksData[0] as Book)

	const wishlistMovies = (moviesData as Movie[]).filter(m => m.status === 'wishlist' && m.isShow)
	const autoMovie = wishlistMovies.length > 0 ? wishlistMovies[0] : (moviesData[0] as Movie)

	const validPosts = (blogIndex as BlogItem[]).filter(p => !p.hidden && p.status !== 'draft')
	const autoPost = validPosts.length > 0 ? validPosts[0] : null
	const allProjects = projectsData as ProjectItem[]

	// Filtered lists for side-by-side showcase
	const booksList = useMemo(() => {
		return (booksData as Book[]).filter(b => b.isShow !== false)
	}, [])

	const moviesList = useMemo(() => {
		return (moviesData as Movie[]).filter(m => m.isShow !== false)
	}, [])

	const booksMarqueeItems = useMemo(() => {
		if (booksList.length === 0) return []
		return [...booksList, ...booksList, ...booksList, ...booksList]
	}, [booksList])

	const moviesMarqueeItems = useMemo(() => {
		if (moviesList.length === 0) return []
		return [...moviesList, ...moviesList, ...moviesList, ...moviesList]
	}, [moviesList])

	// --- 2. Resolved Display Values ---
	const buildingName = bentoConfig.buildingName ?? "数字花园 & 全栈 UI 重构"
	const buildingTech = bentoConfig.buildingTech ?? "Next.js 15 / React / Tailwind"
	const buildingProgress = typeof bentoConfig.buildingProgress === 'number' ? bentoConfig.buildingProgress : 85

	const articleTitle = bentoConfig.articleTitle || autoPost?.title || "暂无最新文章"
	const articleDate = bentoConfig.articleDate || autoPost?.date?.split('T')[0] || "Recently"
	const articleSummary = bentoConfig.articleSummary || autoPost?.summary || "暂无文章摘要"
	const articleCover = bentoConfig.articleCover !== undefined ? bentoConfig.articleCover : autoPost?.cover
	const articleLink = bentoConfig.articleLink || (autoPost ? `/blog/${autoPost.slug}` : '/blog')

	const bookName = bentoConfig.bookName || autoBook?.name || "掌控习惯 (Atomic Habits)"
	const bookAuthor = bentoConfig.bookAuthor || autoBook?.author || "詹姆斯·克莱尔"
	const bookProgress = typeof bentoConfig.bookProgress === 'number' ? bentoConfig.bookProgress : (autoBook?.progress ?? 45)
	const bookCover = bentoConfig.bookCover || autoBook?.cover || "/images/books/atomic-habits.jpg"

	const movieName = bentoConfig.movieName || autoMovie?.name || "头号玩家"
	const movieDirector = bentoConfig.movieDirector || autoMovie?.director || "史蒂文·斯皮尔伯格"
	const movieDescription = bentoConfig.movieDescription || autoMovie?.description || "故事发生在2045年..."
	const moviePoster = bentoConfig.moviePoster || autoMovie?.poster || "/images/movies/ready-player-one.jpg"

	// --- 3. Local Edit Form States ---
	const [editBuildingName, setEditBuildingName] = useState(buildingName)
	const [editBuildingTech, setEditBuildingTech] = useState(buildingTech)
	const [editBuildingProgress, setEditBuildingProgress] = useState(buildingProgress)

	const [editArticleTitle, setEditArticleTitle] = useState(bentoConfig.articleTitle || '')
	const [editArticleDate, setEditArticleDate] = useState(bentoConfig.articleDate || '')
	const [editArticleSummary, setEditArticleSummary] = useState(bentoConfig.articleSummary || '')
	const [editArticleCover, setEditArticleCover] = useState(bentoConfig.articleCover || '')
	const [editArticleLink, setEditArticleLink] = useState(bentoConfig.articleLink || '')

	const [editBookName, setEditBookName] = useState(bentoConfig.bookName || '')
	const [editBookAuthor, setEditBookAuthor] = useState(bentoConfig.bookAuthor || '')
	const [editBookProgress, setEditBookProgress] = useState<number | string>(bentoConfig.bookProgress ?? '')
	const [editBookCover, setEditBookCover] = useState(bentoConfig.bookCover || '')

	const [editMovieName, setEditMovieName] = useState(bentoConfig.movieName || '')
	const [editMovieDirector, setEditMovieDirector] = useState(bentoConfig.movieDirector || '')
	const [editMovieDescription, setEditMovieDescription] = useState(bentoConfig.movieDescription || '')
	const [editMoviePoster, setEditMoviePoster] = useState(bentoConfig.moviePoster || '')

	const handleOpenMasterEdit = () => {
		setEditBuildingName(bentoConfig.buildingName ?? "数字花园 & 全栈 UI 重构")
		setEditBuildingTech(bentoConfig.buildingTech ?? "Next.js 15 / React / Tailwind")
		setEditBuildingProgress(typeof bentoConfig.buildingProgress === 'number' ? bentoConfig.buildingProgress : 85)

		setEditArticleTitle(bentoConfig.articleTitle || '')
		setEditArticleDate(bentoConfig.articleDate || '')
		setEditArticleSummary(bentoConfig.articleSummary || '')
		setEditArticleCover(bentoConfig.articleCover || '')
		setEditArticleLink(bentoConfig.articleLink || '')

		setEditBookName(bentoConfig.bookName || '')
		setEditBookAuthor(bentoConfig.bookAuthor || '')
		setEditBookProgress(bentoConfig.bookProgress ?? '')
		setEditBookCover(bentoConfig.bookCover || '')

		setEditMovieName(bentoConfig.movieName || '')
		setEditMovieDirector(bentoConfig.movieDirector || '')
		setEditMovieDescription(bentoConfig.movieDescription || '')
		setEditMoviePoster(bentoConfig.moviePoster || '')

		setIsEditOpen(true)
	}

	const handleSelectProject = (projectName: string) => {
		if (projectName === '__CUSTOM__') {
			setEditBuildingName('')
			setEditBuildingTech('')
			return
		}
		if (!projectName) return
		const found = allProjects.find(p => p.name === projectName)
		if (found) {
			setEditBuildingName(found.name)
			setEditBuildingTech(found.tags ? found.tags.join(' / ') : (found.description || ''))
		}
	}

	const handleSelectArticle = (slug: string) => {
		if (slug === '__CUSTOM__') {
			setEditArticleTitle('自定义文章标题')
			setEditArticleDate(new Date().toISOString().split('T')[0])
			setEditArticleSummary('')
			setEditArticleCover('')
			setEditArticleLink('/blog')
			return
		}
		if (!slug) {
			setEditArticleTitle('')
			setEditArticleDate('')
			setEditArticleSummary('')
			setEditArticleCover('')
			setEditArticleLink('')
			return
		}
		const found = validPosts.find(p => p.slug === slug)
		if (found) {
			setEditArticleTitle(found.title)
			setEditArticleDate(found.date?.split('T')[0] || '')
			setEditArticleSummary(found.summary || '')
			setEditArticleCover(found.cover || '')
			setEditArticleLink(`/blog/${found.slug}`)
		}
	}

	const handleSelectBook = (bookTitle: string) => {
		if (bookTitle === '__CUSTOM__') {
			setEditBookName('')
			setEditBookAuthor('')
			setEditBookProgress(50)
			setEditBookCover('')
			return
		}
		if (!bookTitle) {
			setEditBookName('')
			setEditBookAuthor('')
			setEditBookProgress('')
			setEditBookCover('')
			return
		}
		const found = (booksData as Book[]).find(b => b.name === bookTitle)
		if (found) {
			setEditBookName(found.name)
			setEditBookAuthor(found.author)
			setEditBookProgress(found.progress ?? 50)
			setEditBookCover(found.cover)
		}
	}

	const handleSelectMovie = (movieTitle: string) => {
		if (movieTitle === '__CUSTOM__') {
			setEditMovieName('')
			setEditMovieDirector('')
			setEditMovieDescription('')
			setEditMoviePoster('')
			return
		}
		if (!movieTitle) {
			setEditMovieName('')
			setEditMovieDirector('')
			setEditMovieDescription('')
			setEditMoviePoster('')
			return
		}
		const found = (moviesData as Movie[]).find(m => m.name === movieTitle)
		if (found) {
			setEditMovieName(found.name)
			setEditMovieDirector(found.director)
			setEditMovieDescription(found.description || '')
			setEditMoviePoster(found.poster)
		}
	}

	// --- Image File Upload Handler ---
	const processFileUpload = async (file: File, target: 'article' | 'book' | 'movie') => {
		setIsUploading(true)
		try {
			const formData = new FormData()
			formData.append('file', file)
			formData.append('folder', 'images/uploads')

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			})

			const data = await res.json()
			if (data.url) {
				if (target === 'article') setEditArticleCover(data.url)
				else if (target === 'book') setEditBookCover(data.url)
				else if (target === 'movie') setEditMoviePoster(data.url)
				toast.success('本地图片上传成功！')
			} else {
				throw new Error(data.error || '上传失败')
			}
		} catch (error: any) {
			console.error('File upload error:', error)
			toast.error(`图片上传出错: ${error?.message || '未知错误'}`)
		} finally {
			setIsUploading(false)
		}
	}

	const triggerFilePick = (target: 'article' | 'book' | 'movie') => {
		setUploadTarget(target)
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			processFileUpload(file, uploadTarget)
		}
	}

	const handleDropFile = (e: React.DragEvent, target: 'article' | 'book' | 'movie') => {
		e.preventDefault()
		e.stopPropagation()
		const file = e.dataTransfer.files?.[0]
		if (file && file.type.startsWith('image/')) {
			processFileUpload(file, target)
		}
	}

	const handleSaveLiveStatus = async () => {
		setIsSaving(true)
		try {
			const updatedContent = { ...siteContent }
			const updatedBento: any = { ...(updatedContent.bentoConfig || {}) }

			// Building
			updatedBento.buildingName = editBuildingName
			updatedBento.buildingTech = editBuildingTech
			updatedBento.buildingProgress = editBuildingProgress

			// Article
			updatedBento.articleTitle = editArticleTitle
			updatedBento.articleDate = editArticleDate
			updatedBento.articleSummary = editArticleSummary
			updatedBento.articleCover = editArticleCover
			updatedBento.articleLink = editArticleLink

			// Book
			updatedBento.bookName = editBookName
			updatedBento.bookAuthor = editBookAuthor
			updatedBento.bookProgress = editBookProgress !== '' ? Number(editBookProgress) : undefined
			updatedBento.bookCover = editBookCover

			// Movie
			updatedBento.movieName = editMovieName
			updatedBento.movieDirector = editMovieDirector
			updatedBento.movieDescription = editMovieDescription
			updatedBento.moviePoster = editMoviePoster

			updatedContent.bentoConfig = updatedBento

			await pushSiteContent(updatedContent, cardStyles)
			setSiteContent(updatedContent)
			toast.success('已保存 Live Status 动态看板配置')
			setIsEditOpen(false)
		} catch (error: any) {
			console.error('Save error:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	if (!autoBook && !autoMovie && !autoPost) return null

	return (
		<div className="w-full max-w-7xl mx-auto px-6 py-6 z-20 relative">
			{/* Hidden File Input for Image Upload */}
			<input 
				type="file" 
				ref={fileInputRef} 
				onChange={handleFileChange} 
				accept="image/*" 
				className="hidden" 
			/>

			{/* Unified Master Settings Dialog */}
			<DialogModal
				open={isEditOpen}
				onClose={() => setIsEditOpen(false)}
				className="card p-6 flex flex-col gap-4 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<SlidersHorizontal className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Status 看板控制台</h3>
							<p className="text-xs text-slate-400 dark:text-slate-500">定制并微调主页实时模块的数据与视觉展示</p>
						</div>
					</div>
				</div>

				{/* High-Contrast Segmented Navigation Tabs with Bulletproof Solid Inline Colors */}
				<div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs font-semibold">
					<button
						onClick={() => setActiveTab('building')}
						style={{
							backgroundColor: activeTab === 'building' ? '#059669' : 'transparent',
							color: activeTab === 'building' ? '#ffffff' : '#64748b',
							boxShadow: activeTab === 'building' ? '0 4px 6px -1px rgba(5, 150, 105, 0.2)' : 'none'
						}}
						className="py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-0"
					>
						<Hammer style={{ color: activeTab === 'building' ? '#ffffff' : 'currentColor' }} className="w-3.5 h-3.5" />
						<span style={{ color: activeTab === 'building' ? '#ffffff' : 'currentColor', fontWeight: activeTab === 'building' ? 'bold' : 'normal' }}>正在折腾</span>
					</button>

					<button
						onClick={() => setActiveTab('article')}
						style={{
							backgroundColor: activeTab === 'article' ? '#059669' : 'transparent',
							color: activeTab === 'article' ? '#ffffff' : '#64748b',
							boxShadow: activeTab === 'article' ? '0 4px 6px -1px rgba(5, 150, 105, 0.2)' : 'none'
						}}
						className="py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-0"
					>
						<FileText style={{ color: activeTab === 'article' ? '#ffffff' : 'currentColor' }} className="w-3.5 h-3.5" />
						<span style={{ color: activeTab === 'article' ? '#ffffff' : 'currentColor', fontWeight: activeTab === 'article' ? 'bold' : 'normal' }}>最新文章</span>
					</button>

					<button
						onClick={() => setActiveTab('book')}
						style={{
							backgroundColor: activeTab === 'book' ? '#059669' : 'transparent',
							color: activeTab === 'book' ? '#ffffff' : '#64748b',
							boxShadow: activeTab === 'book' ? '0 4px 6px -1px rgba(5, 150, 105, 0.2)' : 'none'
						}}
						className="py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-0"
					>
						<BookOpen style={{ color: activeTab === 'book' ? '#ffffff' : 'currentColor' }} className="w-3.5 h-3.5" />
						<span style={{ color: activeTab === 'book' ? '#ffffff' : 'currentColor', fontWeight: activeTab === 'book' ? 'bold' : 'normal' }}>正在阅读</span>
					</button>

					<button
						onClick={() => setActiveTab('movie')}
						style={{
							backgroundColor: activeTab === 'movie' ? '#059669' : 'transparent',
							color: activeTab === 'movie' ? '#ffffff' : '#64748b',
							boxShadow: activeTab === 'movie' ? '0 4px 6px -1px rgba(5, 150, 105, 0.2)' : 'none'
						}}
						className="py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-0"
					>
						<Film style={{ color: activeTab === 'movie' ? '#ffffff' : 'currentColor' }} className="w-3.5 h-3.5" />
						<span style={{ color: activeTab === 'movie' ? '#ffffff' : 'currentColor', fontWeight: activeTab === 'movie' ? 'bold' : 'normal' }}>打算观看</span>
					</button>
				</div>

				{/* Real-time Card Preview */}
				<div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80">
					<div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2 px-1">
						<span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> 实时视图预览 (Live Preview)</span>
						<span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">PREVIEW</span>
					</div>

					<div className="pointer-events-none select-none">
						{activeTab === 'building' && (
							<div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 h-[140px] items-center">
								<div className="w-20 h-28 shrink-0 overflow-hidden rounded-lg shadow-sm relative bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 flex flex-col items-center justify-center p-2 text-center">
									<Hammer className="w-5 h-5 text-amber-500 mb-1" />
									<span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">Active</span>
								</div>
								<div className="flex flex-col justify-center flex-1">
									<span className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-1">正在折腾</span>
									<h4 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{editBuildingName || "未命名项目"}</h4>
									<p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">{editBuildingTech || "技术栈说明"}</p>
									<div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
										<div className="h-full bg-amber-500 rounded-full" style={{ width: `${editBuildingProgress}%` }} />
									</div>
								</div>
							</div>
						)}

						{activeTab === 'article' && (
							<div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 h-[140px] items-center">
								<div className="w-20 h-28 shrink-0 overflow-hidden rounded-lg shadow-sm relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
									{(editArticleCover || autoPost?.cover) ? (
										<Image src={editArticleCover || autoPost?.cover || ''} alt="" fill unoptimized className="object-cover" />
									) : (
										<FileText className="w-6 h-6 text-emerald-500" />
									)}
								</div>
								<div className="flex flex-col justify-center flex-1">
									<span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">最新文章</span>
									<h4 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{editArticleTitle || autoPost?.title || "文章标题"}</h4>
									<p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{editArticleDate || autoPost?.date?.split('T')[0] || "2026-05-28"}</p>
									<p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{editArticleSummary || autoPost?.summary || "文章摘要"}</p>
								</div>
							</div>
						)}

						{activeTab === 'book' && (
							<div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 h-[140px] items-center">
								<div className="w-20 h-28 shrink-0 overflow-hidden rounded-lg shadow-sm relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
									{(editBookCover || autoBook?.cover) ? (
										<Image src={editBookCover || autoBook?.cover || ''} alt="" fill unoptimized className="object-cover" />
									) : (
										<BookOpen className="w-6 h-6 text-blue-500" />
									)}
								</div>
								<div className="flex flex-col justify-center flex-1">
									<span className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">正在阅读</span>
									<h4 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{editBookName || autoBook?.name || "书名"}</h4>
									<p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{editBookAuthor || autoBook?.author || "作者"}</p>
									<div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
										<div className="h-full bg-blue-500 rounded-full" style={{ width: `${editBookProgress !== '' ? editBookProgress : (autoBook?.progress ?? 45)}%` }} />
									</div>
								</div>
							</div>
						)}

						{activeTab === 'movie' && (
							<div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 h-[140px] items-center">
								<div className="w-20 h-28 shrink-0 overflow-hidden rounded-lg shadow-sm relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
									{(editMoviePoster || autoMovie?.poster) ? (
										<Image src={editMoviePoster || autoMovie?.poster || ''} alt="" fill unoptimized className="object-cover" />
									) : (
										<Film className="w-6 h-6 text-purple-500" />
									)}
								</div>
								<div className="flex flex-col justify-center flex-1">
									<span className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-1">打算观看</span>
									<h4 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{editMovieName || autoMovie?.name || "影视名称"}</h4>
									<p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{editMovieDirector || autoMovie?.director || "导演"}</p>
									<p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{editMovieDescription || autoMovie?.description || "精彩描述"}</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Strictly Fixed-Height Form Panels Wrapper to Prevent Window Resizing Across Tabs */}
				<div className="space-y-3 text-sm min-h-[310px] h-[310px] flex flex-col justify-between">
					{/* TAB 1: BUILDING */}
					{activeTab === 'building' && (
						<div className="space-y-3 flex-1 flex flex-col justify-between">
							<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
								<label className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
									<Sparkles className="w-3.5 h-3.5" /> 快捷从【项目库】点选填入
								</label>
								<select
									onChange={(e) => handleSelectProject(e.target.value)}
									className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
								>
									<option value="">-- 请选择预设项目 --</option>
									<option value="__CUSTOM__">✨ 自由自定义（不从已库选择）</option>
									{allProjects.map((p, idx) => (
										<option key={idx} value={p.name}>{p.name}</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">项目名称</label>
									<input
										type="text"
										value={editBuildingName}
										onChange={(e) => setEditBuildingName(e.target.value)}
										className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">技术栈 / 简述</label>
									<input
										type="text"
										value={editBuildingTech}
										onChange={(e) => setEditBuildingTech(e.target.value)}
										className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
							</div>
							<div>
								<div className="flex justify-between items-center mb-1 text-xs text-[var(--color-secondary)]">
									<label className="font-medium">完成进度</label>
									<span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">{editBuildingProgress}%</span>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									value={editBuildingProgress}
									onChange={(e) => setEditBuildingProgress(parseInt(e.target.value) || 0)}
									className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
								/>
							</div>
						</div>
					)}

					{/* TAB 2: ARTICLE */}
					{activeTab === 'article' && (
						<div className="space-y-3 flex-1 flex flex-col justify-between">
							<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
								<label className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
									<Sparkles className="w-3.5 h-3.5" /> 快捷从【文章库】点选填入
								</label>
								<select
									onChange={(e) => handleSelectArticle(e.target.value)}
									className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
								>
									<option value="">-- 自动同步最新博文 (默认) --</option>
									<option value="__CUSTOM__">✨ 自由自定义（不从已库选择）</option>
									{validPosts.map((p, idx) => (
										<option key={idx} value={p.slug}>{p.title}</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">文章标题</label>
									<input
										type="text"
										value={editArticleTitle}
										onChange={(e) => setEditArticleTitle(e.target.value)}
										placeholder={autoPost?.title || "自动最新文章标题"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">发布日期</label>
									<input
										type="text"
										value={editArticleDate}
										onChange={(e) => setEditArticleDate(e.target.value)}
										placeholder={autoPost?.date?.split('T')[0] || "2026-05-28"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">跳转链接</label>
									<input
										type="text"
										value={editArticleLink}
										onChange={(e) => setEditArticleLink(e.target.value)}
										placeholder={autoPost ? `/blog/${autoPost.slug}` : '/blog'}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
								<div>
									<div className="flex items-center justify-between mb-1">
										<label className="block font-medium text-xs text-[var(--color-secondary)]">封面图 URL</label>
										<button
											onClick={() => triggerFilePick('article')}
											disabled={isUploading}
											className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
										>
											{isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
											<span>上传/拖入图片</span>
										</button>
									</div>
									<div 
										onDrop={(e) => handleDropFile(e, 'article')}
										onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
										className="w-full flex items-center gap-2"
									>
										<input
											type="text"
											value={editArticleCover}
											onChange={(e) => setEditArticleCover(e.target.value)}
											placeholder={autoPost?.cover || "/blogs/cover.jpg"}
											className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
										/>
									</div>
								</div>
							</div>

							<div>
								<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">文章摘要</label>
								<textarea
									rows={2}
									value={editArticleSummary}
									onChange={(e) => setEditArticleSummary(e.target.value)}
									placeholder={autoPost?.summary || "文章简短摘要..."}
									className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500 min-h-[55px]"
								/>
							</div>
						</div>
					)}

					{/* TAB 3: BOOK */}
					{activeTab === 'book' && (
						<div className="space-y-3 flex-1 flex flex-col justify-between">
							<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
								<label className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
									<Sparkles className="w-3.5 h-3.5" /> 快捷从【书单藏书】点选填入
								</label>
								<select
									onChange={(e) => handleSelectBook(e.target.value)}
									className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
								>
									<option value="">-- 自动同步在读图书 (默认) --</option>
									<option value="__CUSTOM__">✨ 自由自定义（不从已库选择）</option>
									{(booksData as Book[]).map((b, idx) => (
										<option key={idx} value={b.name}>{b.name} ({b.author})</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-1">
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">书名</label>
									<input
										type="text"
										value={editBookName}
										onChange={(e) => setEditBookName(e.target.value)}
										placeholder={autoBook?.name || "掌控习惯 (Atomic Habits)"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">作者</label>
									<input
										type="text"
										value={editBookAuthor}
										onChange={(e) => setEditBookAuthor(e.target.value)}
										placeholder={autoBook?.author || "詹姆斯·克莱尔"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<div className="flex items-center justify-between mb-1">
										<label className="block font-medium text-xs text-[var(--color-secondary)]">封面图 URL</label>
										<button
											onClick={() => triggerFilePick('book')}
											disabled={isUploading}
											className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
										>
											{isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
											<span>上传/拖入图片</span>
										</button>
									</div>
									<div 
										onDrop={(e) => handleDropFile(e, 'book')}
										onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
										className="w-full flex items-center gap-2"
									>
										<input
											type="text"
											value={editBookCover}
											onChange={(e) => setEditBookCover(e.target.value)}
											placeholder={autoBook?.cover || "/images/books/cover.jpg"}
											className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
										/>
									</div>
								</div>
								<div>
									<div className="flex justify-between items-center mb-1 text-xs text-[var(--color-secondary)]">
										<label className="font-medium">阅读进度 (%)</label>
										<span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">{editBookProgress !== '' ? editBookProgress : (autoBook?.progress ?? 45)}%</span>
									</div>
									<input
										type="range"
										min="0"
										max="100"
										value={editBookProgress !== '' ? editBookProgress : (autoBook?.progress ?? 45)}
										onChange={(e) => setEditBookProgress(e.target.value)}
										className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
									/>
								</div>
							</div>
						</div>
					)}

					{/* TAB 4: MOVIE */}
					{activeTab === 'movie' && (
						<div className="space-y-3 flex-1 flex flex-col justify-between">
							<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
								<label className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
									<Sparkles className="w-3.5 h-3.5" /> 快捷从【影视观影】点选填入
								</label>
								<select
									onChange={(e) => handleSelectMovie(e.target.value)}
									className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
								>
									<option value="">-- 自动同步观影推荐 (默认) --</option>
									<option value="__CUSTOM__">✨ 自由自定义（不从已库选择）</option>
									{(moviesData as Movie[]).map((m, idx) => (
										<option key={idx} value={m.name}>{m.name} ({m.director})</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-1">
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">影视名称</label>
									<input
										type="text"
										value={editMovieName}
										onChange={(e) => setEditMovieName(e.target.value)}
										placeholder={autoMovie?.name || "头号玩家"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
								<div>
									<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">导演 / 简述</label>
									<input
										type="text"
										value={editMovieDirector}
										onChange={(e) => setEditMovieDirector(e.target.value)}
										placeholder={autoMovie?.director || "史蒂文·斯皮尔伯格"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="block font-medium text-xs text-[var(--color-secondary)]">海报图 URL</label>
									<button
										onClick={() => triggerFilePick('movie')}
										disabled={isUploading}
										className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
									>
										{isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
										<span>上传/拖入图片</span>
									</button>
								</div>
								<div 
									onDrop={(e) => handleDropFile(e, 'movie')}
									onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
									className="w-full flex items-center gap-2"
								>
									<input
										type="text"
										value={editMoviePoster}
										onChange={(e) => setEditMoviePoster(e.target.value)}
										placeholder={autoMovie?.poster || "/images/movies/poster.jpg"}
										className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
							</div>

							<div>
								<label className="block font-medium mb-1 text-xs text-[var(--color-secondary)]">简介描述</label>
								<textarea
									rows={2}
									value={editMovieDescription}
									onChange={(e) => setEditMovieDescription(e.target.value)}
									placeholder={autoMovie?.description || "精彩影视简介..."}
									className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-emerald-500 min-h-[55px]"
								/>
							</div>
						</div>
					)}
				</div>

				{/* High-Visibility Footer Control Buttons with Bulletproof Solid Inline Styles */}
				<div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
					<button
						onClick={() => setIsEditOpen(false)}
						disabled={isSaving}
						className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
					>
						取消
					</button>
					<button
						onClick={handleSaveLiveStatus}
						disabled={isSaving}
						style={{ backgroundColor: '#059669', color: '#ffffff', opacity: isSaving ? 0.6 : 1 }}
						className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer border-0"
					>
						{isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
						<span style={{ color: '#ffffff', fontWeight: 'bold' }}>保存所有动态配置</span>
					</button>
				</div>
			</DialogModal>

			{/* Section Header */}
			<div className="mb-12 flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto relative z-10">
				<div className="flex items-center gap-3 mb-4">
					<StarBadge text="★ LIVE PULSE" />
					{isAuth && (
						<button
							onClick={handleOpenMasterEdit}
							className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full transition-all border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
							title="配置 Live Status 整个模块"
						>
							<Settings className="w-3.5 h-3.5" />
							<span>配置看板</span>
						</button>
					)}
				</div>
				<ScrollFloat
					animationDuration={1}
					ease='back.inOut(2)'
					scrollStart='center bottom+=50%'
					scrollEnd='bottom bottom-=40%'
					stagger={0.03}
					containerClassName="mb-4"
					textClassName="text-4xl md:text-5xl lg:text-6xl font-serif text-[var(--color-primary)] tracking-tight"
				>
					Current *State* & Focus
				</ScrollFloat>
				<p className="text-sm text-[var(--color-secondary)] mb-6 max-w-xl">
					实时汇聚当前工作、阅读、媒体状态与最新洞见。
				</p>
				<Link href="/report" className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-2xl transition-all shadow-md hover:shadow-lg">
					<span>✨ 查看年度报告</span>
				</Link>
			</div>

			{/* Main Grid Cards (Balanced Bento Grid) */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Card 1: Currently Building */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
					onMouseMove={handleCardMouseMove}
					onMouseLeave={handleCardMouseLeave}
					className="col-span-1 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group bento-card-glow"
				>
					<div className="flex flex-col h-full justify-between gap-4">
						<div>
							<div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
								<span className="flex items-center gap-1.5">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
									</span>
									Currently Building
								</span>
								<span className="font-mono text-zinc-400">4:5</span>
							</div>
							<h4 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug">Project: {buildingName}</h4>
							<p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{buildingTech}</p>
							<div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 flex flex-col gap-2">
								<span className="text-xs font-bold text-zinc-900 dark:text-white">Live Pulse Section Mockup</span>
								<span className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal line-clamp-3">Descript a modern-patch section building, and tech-emptes aclh with society and consumed cocks.</span>
							</div>
						</div>
						<div>
							<div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold mb-2">
								<span>Status: In Progress</span>
								<span className="text-blue-500 font-bold">{buildingProgress}%</span>
							</div>
							<div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
								<div 
									className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
									style={{ width: `${buildingProgress}%` }}
								/>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Card 2: Recent Reads & Movies Showcase (col-span-1 lg:col-span-2) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
					onMouseMove={handleCardMouseMove}
					onMouseLeave={handleCardMouseLeave}
					className="col-span-1 lg:col-span-2 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-visible bento-card-glow"
				>
					<div className="flex flex-col h-full justify-between gap-6">
						<div className="w-full">
							<div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
								<span className="flex items-center gap-1.5">
									<BookOpen className="w-3.5 h-3.5 text-zinc-400" />
									Media Showcase
								</span>
								<span className="font-mono text-zinc-400">2:1</span>
							</div>

							<h4 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug mb-6">Recent Reads & Watches</h4>
							
							{/* Double Marquee Simultaneous Display */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full overflow-hidden">
								
								{/* Books Marquee */}
								<div className="flex flex-col gap-3">
									<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2 flex items-center gap-1.5">
										📚 Books
									</span>
									<div className="relative w-full overflow-hidden py-2 mask-linear-marquee">
										<div className="flex gap-6 animate-marquee-left w-max">
											{booksMarqueeItems.map((book: any, idx: number) => (
												<div key={idx} className="flex flex-col items-center text-center w-36 shrink-0 select-none group/book">
													<motion.div 
														className="relative w-32 h-48 rounded shadow-lg overflow-hidden cursor-pointer origin-left bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-850/50"
														whileHover={{ 
															scale: 1.06, 
															rotateY: -15,
															z: 15,
															boxShadow: "-8px 12px 24px rgba(0,0,0,0.22)"
														}}
														style={{ 
															perspective: 800,
															transformStyle: "preserve-3d"
														}}
														transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
													>
														<Image 
															src={book.cover || "/images/books/atomic-habits.jpg"} 
															alt={book.name} 
															fill 
															unoptimized={true}
															className="object-cover" 
														/>
														{/* Book 3D Page Thickness Edge Overlay */}
														<div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-white/10 to-white/40 shadow-inner z-10" />
														{/* Spine crease line */}
														<div className="absolute left-1.5 top-0 bottom-0 w-[2px] bg-black/25 dark:bg-white/10 blur-[0.5px]" />
														<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/15 dark:bg-white/5" />
													</motion.div>
													<span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 w-full mt-2.5 px-1">{book.name}</span>
													<span className="text-[9px] text-zinc-400 dark:text-zinc-500 line-clamp-1 w-full px-1">{book.author}</span>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* Movies Marquee */}
								<div className="flex flex-col gap-3">
									<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2 flex items-center gap-1.5">
										🎬 Movies
									</span>
									<div className="relative w-full overflow-hidden py-2 mask-linear-marquee">
										<div className="flex gap-6 animate-marquee-right w-max">
											{moviesMarqueeItems.map((movie: any, idx: number) => (
												<div key={idx} className="flex flex-col items-center text-center w-36 shrink-0 select-none group/movie">
													<motion.div 
														className="relative w-32 h-48 rounded-lg shadow-lg overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-850/50"
														whileHover={{ 
															scale: 1.06, 
															rotateY: 10,
															rotateX: -5,
															z: 15,
															boxShadow: "0px 12px 24px rgba(0,0,0,0.22)"
														}}
														style={{ 
															perspective: 800,
															transformStyle: "preserve-3d"
														}}
														transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
													>
														<Image 
															src={movie.poster || "/images/movies/ready-player-one.jpg"} 
															alt={movie.name} 
															fill 
															unoptimized={true}
															className="object-cover" 
														/>
														{/* Cinema Glass reflection overlay */}
														<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none mix-blend-overlay" />
														{/* Fine inner border line */}
														<div className="absolute inset-1 border border-white/10 rounded-md pointer-events-none" />
													</motion.div>
													<span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 w-full mt-2.5 px-1">{movie.name}</span>
													<span className="text-[9px] text-zinc-400 dark:text-zinc-500 line-clamp-1 w-full px-1">{movie.director}</span>
												</div>
											))}
										</div>
									</div>
								</div>

							</div>
						</div>
					</div>
				</motion.div>



				{/* Card 4: Media Pulse */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
					onMouseMove={handleCardMouseMove}
					onMouseLeave={handleCardMouseLeave}
					className="col-span-1 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group bento-card-glow"
				>
					<div className="flex flex-col h-full justify-between gap-4">
						<div>
							<div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
								<span className="flex items-center gap-1.5">
									<Headphones className="w-3.5 h-3.5 text-zinc-400" />
									Media Pulse
								</span>
							</div>
							<div className="flex items-center gap-4 mt-2">
								<div className="relative w-16 h-16 rounded-full overflow-hidden shadow shrink-0 bg-slate-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800">
									<motion.div
										className="w-full h-full relative"
										animate={isPlaying ? { rotate: 360 } : {}}
										transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
									>
										<Image 
											src="/images/avatar.png" 
											alt="Album Art" 
											fill 
											unoptimized={true}
											className="object-cover" 
										/>
									</motion.div>
									{/* Inner Vinyl Ring */}
									<div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 shadow-inner flex items-center justify-center">
										<div className="w-1 h-1 rounded-full bg-zinc-400" />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider font-semibold">Listening to</span>
										{isPlaying && (
											<div className="flex items-end gap-[2px] h-2.5 shrink-0">
												{[0.1, 0.3, 0.2, 0.4].map((delay, idx) => (
													<motion.span
														key={idx}
														animate={{ height: ["20%", "100%", "20%"] }}
														transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay }}
														className="w-[2px] bg-blue-500 rounded-full"
													/>
												))}
											</div>
										)}
									</div>
									<span className="text-xs font-extrabold text-zinc-950 dark:text-white truncate block mt-0.5">22, A Million</span>
									<span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate block">Bon Iver</span>
								</div>
								<button 
									onClick={() => setIsPlaying(!isPlaying)}
									className="w-9 h-9 rounded-full bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shadow transition-all active:scale-90 shrink-0 cursor-pointer border-0"
								>
									{isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
								</button>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Card 5: Status & Links (col-span-1 lg:col-span-2) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
					onMouseMove={handleCardMouseMove}
					onMouseLeave={handleCardMouseLeave}
					className="col-span-1 lg:col-span-2 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group bento-card-glow"
				>
					<div className="flex flex-col h-full justify-between gap-6">
						<div>
							<div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
								<span className="flex items-center gap-1.5">
									<Sparkles className="w-3.5 h-3.5 text-zinc-400" />
									Status & Links
								</span>
							</div>
							<h4 className="text-base font-extrabold text-zinc-950 dark:text-white leading-snug">Right Now</h4>
							
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
								{/* Focus info */}
								<div className="space-y-3">
									<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Current Focus</span>
									<div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 text-xs font-semibold text-zinc-750 dark:text-zinc-300">
										Focused 🌱, Remote Developer
									</div>
								</div>
								
								{/* Location info */}
								<div className="space-y-3">
									<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Base Location</span>
									<div className="flex items-center gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 text-xs font-semibold text-zinc-750 dark:text-zinc-300">
										<MapPin className="w-4 h-4 text-blue-500 shrink-0" />
										<span>Location: Seattle, WA</span>
									</div>
								</div>
							</div>
						</div>
						
						<div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
							<span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono">UPDATED RECENTLY</span>
							<div className="flex gap-4 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
								<Link href="/blog" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Blog</Link>
								<span>•</span>
								<Link href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</Link>
								<span>•</span>
								<Link href="/projects" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Projects</Link>
							</div>
						</div>
					</div>
				</motion.div>


			</div>
			
			<style>{`
				@keyframes marquee-l {
					0% { transform: translateX(0); }
					100% { transform: translateX(-50%); }
				}
				@keyframes marquee-r {
					0% { transform: translateX(-50%); }
					100% { transform: translateX(0); }
				}
				.animate-marquee-left {
					animation: marquee-l 44s linear infinite;
				}
				.animate-marquee-right {
					animation: marquee-r 44s linear infinite;
				}
				.animate-marquee-left:hover,
				.animate-marquee-right:hover {
					animation-play-state: paused;
				}
				.mask-linear-marquee {
					mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
					-webkit-mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
				}

				/* Immersive Bento Grid Card Border Glow */
				.bento-card-glow {
					position: relative;
					--glow-x: 50%;
					--glow-y: 50%;
					--glow-intensity: 0;
					--glow-radius: 140px;
				}
				.bento-card-glow::after {
					content: '';
					position: absolute;
					inset: 0;
					padding: 1.5px;
					background: radial-gradient(
						var(--glow-radius) circle at var(--glow-x) var(--glow-y),
						rgba(59, 130, 246, calc(var(--glow-intensity) * 0.85)) 0%,
						rgba(147, 51, 234, calc(var(--glow-intensity) * 0.4)) 50%,
						transparent 70%
					);
					border-radius: inherit;
					-webkit-mask:
						linear-gradient(#fff 0 0) content-box,
						linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask:
						linear-gradient(#fff 0 0) content-box,
						linear-gradient(#fff 0 0);
					mask-composite: exclude;
					pointer-events: none;
					opacity: 0;
					transition: opacity 0.3s ease;
					z-index: 10;
				}
				.bento-card-glow:hover::after {
					opacity: 1;
				}


			`}</style>
		</div>
	)
}
