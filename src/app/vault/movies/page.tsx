'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MovieGridView from '@/app/favorite/movie-grid-view'
import MovieCreateDialog from '@/app/favorite/components/movie-create-dialog'
import { useConfigStore } from '@/app/(home)/stores/config-store'
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
	const [originalMovies, setOriginalMovies] = useState<Movie[]>(initialMovies as Movie[])
	const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
	const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false)

	const { isAuth } = useAuthStore()

	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())

	const { siteContent } = useConfigStore()

	const handleUpdateMovie = (updatedMovie: Movie, oldMovie: Movie, logoItem?: LogoItem) => {
		const updated = movies.map(s => (s.name === oldMovie.name ? updatedMovie : s))
		setMovies(updated)
		if (logoItem) {
			setLogoItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedMovie.name, logoItem)
				return newMap
			})
		}
		autoSave(updated)
	}

	const handleSaveMovie = (updatedMovie: Movie) => {
		let updated: Movie[] = []
		if (editingMovie) {
			updated = movies.map(s => (s.name === editingMovie.name ? updatedMovie : s))
		} else {
			updated = [...movies, updatedMovie]
		}
		setMovies(updated)
		autoSave(updated)
	}

	const handleDeleteMovie = (movie: Movie) => {
		if (confirm(`确定要删除《${movie.name}》吗？`)) {
			const updated = movies.filter(s => s.name !== movie.name)
			setMovies(updated)
			autoSave(updated)
		}
	}

	const handleTogglePin = async (movie: Movie) => {
		const pinCount = movies.filter(m => m.isPinned).length
		if (!movie.isPinned && pinCount >= 5) {
			toast.error('最多只能置顶 5 个电影')
			return
		}

		const updatedMovie = { ...movie, isPinned: !movie.isPinned }
		const newMovies = movies.map(s => (s.name === movie.name ? updatedMovie : s))
		setMovies(newMovies)
		setOriginalMovies(newMovies)

		try {
			const res = await fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'movies', data: newMovies }) })
			const data = await res.json()
			if (data.success) {
				toast.success(updatedMovie.isPinned ? '已置顶' : '已取消置顶')
			}
		} catch (err) {
			console.error(err)
		}
	}

	const autoSave = async (updatedMovies: Movie[]) => {
		setIsSaving(true)
		try {
			const res = await fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'movies', data: updatedMovies }) })
			const data = await res.json()
			if (!data.success) throw new Error(data.error)

			setOriginalMovies(updatedMovies)
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
			await pushMovies({
				movies,
				categories: [],
				logoItems
			})

			setOriginalMovies(movies)
			setLogoItems(new Map())
			setIsEditMode(false)
		} catch (error: any) {
			console.error('Failed to push:', error)
			toast.error(`云端发布失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	// In the vault, we always see ALL movies
	const sortedMovies = [...movies].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		
		// Then sort by watchDate (newest first)
		const timeA = a.watchDate ? new Date(a.watchDate).getTime() : 0
		const timeB = b.watchDate ? new Date(b.watchDate).getTime() : 0
		return timeB - timeA
	})

	return (
		<div className='min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]'>
			<div className='mx-auto w-full max-w-7xl px-6 pt-32 pb-8'>
				<div className='flex items-center gap-2 mb-4'>
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

					<div className='flex items-center gap-3'>
						{isEditMode ? (
							<>
								<motion.button onClick={() => setIsEditMode(false)} className='rounded-full border bg-[var(--color-bg)] dark:bg-[var(--color-card)] px-4 py-2 text-sm shadow-sm font-medium text-[var(--color-primary)]'>
									退出编辑
								</motion.button>
								<motion.button onClick={() => { setEditingMovie(null); setIsMovieDialogOpen(true); }} className='rounded-full border bg-[var(--color-bg)] dark:bg-[var(--color-card)] px-4 py-2 text-sm shadow-sm font-medium text-[var(--color-primary)]'>
									+ 添加
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
				<MovieGridView 
					movies={sortedMovies} 
					isEditMode={isEditMode} 
					isManagement={true}
					onUpdate={handleUpdateMovie} 
					onDelete={handleDeleteMovie} 
					onTogglePin={handleTogglePin}
				/>
			</div>

			{isMovieDialogOpen && <MovieCreateDialog movieList={movies} movies={editingMovie} onClose={() => setIsMovieDialogOpen(false)} onSave={handleSaveMovie} />}
		</div>
	)
}
