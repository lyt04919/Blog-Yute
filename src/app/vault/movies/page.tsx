'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Plus, Trophy, Pencil, Sparkles, BarChart3 } from 'lucide-react'
import MovieGridView from '@/app/favorite/movie-grid-view'
import dynamic from 'next/dynamic'
const MovieCreateDialog = dynamic(() => import('@/app/favorite/components/movie-create-dialog'), { ssr: false })
const MovieTop10Modal = dynamic(() => import('@/app/favorite/components/movie-top10-modal'), { ssr: false })
const MovieReportModal = dynamic(() => import('@/app/favorite/components/movie-report-modal'), { ssr: false })
import { useAuthStore } from '@/hooks/use-auth'
import { pushMovies } from '@/app/favorite/movies/services/push-movies'

import initialMovies from '@/data/movies.json'

import type { Movie } from '@/app/favorite/components/movie-card'
import type { LogoItem } from '@/app/favorite/components/logo-upload-dialog'

export default function VaultMoviesPage() {
	const { isAuth } = useAuthStore()

	if (!isAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-primary)]">
				<div className="text-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] max-w-md mx-6">
					<h2 className="text-xl font-bold mb-2">未授权访问</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-4">此页面是私人仓库管理，请先在右上角输入密码切换为作者模式。</p>
					<Link href="/favorite/movies" className="brand-btn px-4 py-2 rounded-full text-sm inline-block">
						返回精选页
					</Link>
				</div>
			</div>
		)
	}

	return <VaultMoviesContent />
}

function VaultMoviesContent() {
	const [movies, setMovies] = useState<Movie[]>(initialMovies as Movie[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false)
	const [isTop10DialogOpen, setIsTop10DialogOpen] = useState(false)
	const [isReportOpen, setIsReportOpen] = useState(false)
	const [isStatsOpen, setIsStatsOpen] = useState(false)
	const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [hasModalOpen, setHasModalOpen] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		const checkModal = () => {
			const isLocked = document.body.style.overflow === 'hidden'
			const hasDialog = Boolean(document.querySelector('[role="dialog"], .fixed.inset-0.z-\\[100\\]'))
			setHasModalOpen(isLocked || hasDialog)
		}

		checkModal()
		const observer = new MutationObserver(checkModal)
		observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true, subtree: true })
		return () => observer.disconnect()
	}, [])

	const persistMovies = async (newMovies: Movie[]) => {
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: 'movies', data: newMovies })
			})
			const data = await res.json()
			if (!data.success) {
				console.error('Failed to save movies:', data.error)
				toast.error(`保存失败: ${data.error || '未知错误'}`)
			}
		} catch (e) {
			console.error('Auto save error:', e)
			toast.error('保存出错了')
		}
	}

	const handleSaveMovie = (movieData: Movie) => {
		// Check for duplicates
		const targetName = movieData.name.trim().toLowerCase()
		const targetEnglishName = movieData.englishName ? movieData.englishName.trim().toLowerCase() : ''
		const targetDouban = movieData.doubanUrl ? movieData.doubanUrl.trim() : ''

		const duplicate = movies.find(m => {
			if (editingMovie && m.name === editingMovie.name) return false

			const nameMatch = m.name.trim().toLowerCase() === targetName
			const englishMatch = Boolean(targetEnglishName && m.englishName && m.englishName.trim().toLowerCase() === targetEnglishName)
			const doubanMatch = Boolean(targetDouban && m.doubanUrl && m.doubanUrl.trim() === targetDouban)

			return nameMatch || englishMatch || doubanMatch
		})

		if (duplicate) {
			if (duplicate.status === 'wishlist') {
				toast.info(`电影《${duplicate.name}》在【想看清单】中已存在！您可以直接在想看列表中将其标记为已看。`, { duration: 6000 })
			} else if (duplicate.isShow === false) {
				toast.info(`电影《${duplicate.name}》在【私密/隐藏列表】中已存在！`, { duration: 6000 })
			} else {
				toast.error(`电影《${duplicate.name}》在影库中已存在，无法重复保存！`)
			}
			setIsMovieDialogOpen(false)
			setEditingMovie(null)
			return
		}

		let updated: Movie[]
		if (editingMovie) {
			updated = movies.map(m => m.name === editingMovie.name ? movieData : m)
		} else {
			updated = [...movies, movieData]
		}
		setMovies(updated)
		setIsMovieDialogOpen(false)
		setEditingMovie(null)
		persistMovies(updated)
		toast.success(editingMovie ? '更新成功' : '添加成功')
	}

	const handleDeleteMovie = (movie: Movie) => {
		if (!confirm(`确定要删除 ${movie.name} 吗？`)) return
		const updated = movies.filter(m => m.name !== movie.name)
		setMovies(updated)
		persistMovies(updated)
		toast.success('删除成功')
	}

	const handleUpdateMovie = (updatedMovie: Movie, oldMovie?: Movie) => {
		const targetName = (oldMovie?.name || updatedMovie.name).trim().toLowerCase()
		const targetEnglish = (oldMovie?.englishName || updatedMovie.englishName || '').trim().toLowerCase()

		const exists = movies.some(m => {
			const nameMatch = m.name.trim().toLowerCase() === targetName
			const englishMatch = Boolean(targetEnglish && m.englishName && m.englishName.trim().toLowerCase() === targetEnglish)
			return nameMatch || englishMatch
		})

		let updated: Movie[]
		if (exists) {
			updated = movies.map(m => {
				const nameMatch = m.name.trim().toLowerCase() === targetName
				const englishMatch = Boolean(targetEnglish && m.englishName && m.englishName.trim().toLowerCase() === targetEnglish)
				return (nameMatch || englishMatch) ? updatedMovie : m
			})
		} else {
			updated = [...movies, updatedMovie]
		}

		setMovies(updated)
		persistMovies(updated)
	}

	const handleTogglePin = async (movie: Movie) => {
		const pinCount = movies.filter(m => m.isPinned).length
		if (!movie.isPinned && pinCount >= 5) {
			toast.error('最多只能置顶 5 个电影')
			return
		}
		const updated = movies.map(m => m.name === movie.name ? { ...m, isPinned: !m.isPinned } : m)
		setMovies(updated)
		persistMovies(updated)
		toast.success(movie.isPinned ? '已取消置顶' : '已置顶')
	}

	const handleSaveTop10 = (updatedMovies: Movie[]) => {
		setMovies(updatedMovies)
		persistMovies(updatedMovies)
	}

	const handlePublishCloudClick = async () => {
		setIsSaving(true)
		try {
			await pushMovies({
				movies,
				categories: [],
				logoItems: new Map()
			})
		} catch (e: any) {
			toast.error(`发布过程出错: ${e?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const sortedMovies = [...movies].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		
		const timeA = a.watchDate ? new Date(a.watchDate).getTime() : 0
		const timeB = b.watchDate ? new Date(b.watchDate).getTime() : 0
		return timeB - timeA
	})

	return (
		<div className='min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]'>
			<div className='mx-auto max-w-7xl px-6 pt-12 pb-8'>
				<div className='flex items-center gap-3 mb-6'>
					<Link
						href='/favorite/movies'
						className='flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:scale-105 active:scale-95 transition-all shadow-sm'
					>
						<ArrowLeft className='w-4 h-4' />
					</Link>
					<span className='text-xs font-semibold tracking-widest uppercase text-[var(--color-secondary)]'>返回公开页</span>
				</div>

				<div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
					<div>
						<h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl mb-3 font-sans flex items-center gap-3'>
							Movies 仓库管理
							<span className='text-lg font-medium font-mono hidden sm:inline-block px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-secondary)]'>Vault</span>
							<span className='text-sm font-medium font-mono hidden sm:inline-block px-3 py-1 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand)]'>共 {movies.length} 项</span>
						</h1>
						<p className='text-sm max-w-xl leading-relaxed text-[var(--color-secondary)]'>
							在这里管理你的所有电影记录。可以新增、编辑、删除以及控制哪些项目公开到 Favorites 精选和主页展示。
						</p>
					</div>

					<div className='flex items-center gap-2.5 flex-wrap'>
						<button
							type="button"
							onClick={() => setIsReportOpen(true)}
							className='rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 px-3.5 py-2 text-sm shadow-2xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95'
							title="生成年度观影报告战报"
						>
							<Sparkles className="w-4 h-4 text-amber-500" />
							<span>观影年报</span>
						</button>

						<button
							type="button"
							onClick={() => setIsStatsOpen(!isStatsOpen)}
							className={`rounded-xl border px-3.5 py-2 text-sm shadow-2xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
								isStatsOpen
									? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
									: 'border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200'
							}`}
							title="展开/收起 365天打卡热力图与口味雷达图"
						>
							<BarChart3 className="w-4 h-4" />
							<span>{isStatsOpen ? '收起图表' : '统计图表'}</span>
						</button>

						<button
							type="button"
							onClick={() => setIsTop10DialogOpen(true)}
							className='rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 px-3.5 py-2 text-sm shadow-2xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95'
						>
							<Trophy className="w-4 h-4 text-amber-500" />
							<span>TOP 10 榜</span>
						</button>
					</div>
				</div>
			</div>

			{/* Permanently Pinned Floating Action Bar at Top Right (Mounted via Portal into document.body, hidden when any modal/detail is open) */}
			{mounted && !hasModalOpen && !isMovieDialogOpen && !isTop10DialogOpen && !isReportOpen && createPortal(
				<div
					className="fixed right-20 top-6 z-40 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl"
					style={{ position: 'fixed', top: '1.5rem', right: '5rem', zIndex: 40 }}
				>
					{isEditMode ? (
						<>
							<span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-500 bg-amber-500/10 rounded-xl border border-amber-500/20">
								<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
								编辑中
							</span>

							<button
								type="button"
								onClick={() => { setEditingMovie(null); setIsMovieDialogOpen(true); }}
								className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
								title="快速新增电影"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>新增</span>
							</button>

							<button
								type="button"
								onClick={() => setIsEditMode(false)}
								className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
							>
								退出编辑
							</button>

							<button
								type="button"
								onClick={handlePublishCloudClick}
								disabled={isSaving}
								className="brand-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
							>
								{isSaving ? '发布中...' : '发布云端'}
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => { setEditingMovie(null); setIsMovieDialogOpen(true); }}
								className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
								title="快速新增电影"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>新增</span>
							</button>

							<button
								type="button"
								onClick={() => setIsEditMode(true)}
								className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
								title="开启编辑模式，可随时对下方电影进行编辑、置顶、删除"
							>
								<Pencil className="w-3.5 h-3.5" />
								<span>批量编辑</span>
							</button>
						</>
					)}
				</div>,
				document.body
			)}

			<div>
				<MovieGridView 
					movies={sortedMovies} 
					isEditMode={isEditMode} 
					isManagement={true}
					isStatsOpen={isStatsOpen}
					onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
					onUpdate={handleUpdateMovie} 
					onDelete={handleDeleteMovie} 
					onTogglePin={handleTogglePin}
				/>
			</div>

			{isMovieDialogOpen && <MovieCreateDialog movieList={movies} movies={editingMovie} onClose={() => setIsMovieDialogOpen(false)} onSave={handleSaveMovie} />}
			{isTop10DialogOpen && <MovieTop10Modal movies={movies} onClose={() => setIsTop10DialogOpen(false)} onSave={handleSaveTop10} />}
			{isReportOpen && <MovieReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} movies={movies} />}
		</div>
	)
}
