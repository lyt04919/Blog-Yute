'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import MovieGridView from '../movie-grid-view'
import MovieTop10Section from '../components/movie-top10-section'
import MovieDetailModal from '../components/movie-detail-modal'
import { useAuthStore } from '@/hooks/use-auth'
import { StandardPageHeader } from '@/components/ui/standard-page-header'

import initialMovies from '@/data/movies.json'

import type { Movie } from '../components/movie-card'

import dynamic from 'next/dynamic'
const MovieReportModal = dynamic(() => import('../components/movie-report-modal'), { ssr: false })
import { Sparkles, Film, BarChart3 } from 'lucide-react'

export default function FavoriteMoviesPage() {
	const [movies, setMovies] = useState<Movie[]>(initialMovies as Movie[])
	const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
	const [isReportOpen, setIsReportOpen] = useState(false)
	const [isStatsOpen, setIsStatsOpen] = useState(false)
	const { isAuth } = useAuthStore()

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

	// Filter: Showcase page only sees isShow === true.
	const displayedMovies = movies.filter(m => m.isShow)

	const sortedMovies = [...displayedMovies].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		
		const timeA = a.watchDate ? new Date(a.watchDate).getTime() : 0
		const timeB = b.watchDate ? new Date(b.watchDate).getTime() : 0
		return timeB - timeA
	})

	const headerActions = (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={() => setIsReportOpen(true)}
				className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
			>
				<Sparkles className="w-3.5 h-3.5" />
				<span>观影年报</span>
			</button>
			<button
				type="button"
				onClick={() => setIsStatsOpen(!isStatsOpen)}
				className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
					isStatsOpen
						? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
						: 'border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
				}`}
			>
				<BarChart3 className="w-3.5 h-3.5" />
				<span>{isStatsOpen ? '收起图表' : '统计图表'}</span>
			</button>
			{isAuth && (
				<Link
					href='/vault/movies'
					className='px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm'
				>
					管理仓库 ({movies.length}) →
				</Link>
			)}
		</div>
	)

	const handleDeleteMovie = (movie: Movie) => {
		const updated = movies.filter(m => m.name !== movie.name && (m.englishName ? m.englishName !== movie.englishName : true))
		setMovies(updated)
		persistMovies(updated)
	}

	return (
		<div className='min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]'>
			<StandardPageHeader
				backHref='/favorite'
				backLabel='FAVORITES'
				title='Movies'
				badge='for devs'
				subtitle='A curated collection of movies, exploring the intersection of technology, humanity, and the future.'
				actions={headerActions}
			/>

			<MovieTop10Section 
				movies={movies} 
				onSelectMovie={(movie) => setSelectedMovie(movie)} 
			/>

			<div>
				<MovieGridView 
					movies={sortedMovies} 
					isEditMode={false} 
					isStatsOpen={isStatsOpen}
					onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
					onUpdate={handleUpdateMovie}
					onDelete={handleDeleteMovie}
				/>
			</div>

			{selectedMovie && (
				<MovieDetailModal
					movie={selectedMovie}
					onClose={() => setSelectedMovie(null)}
				/>
			)}

			{isReportOpen && (
				<MovieReportModal
					isOpen={isReportOpen}
					onClose={() => setIsReportOpen(false)}
					movies={movies}
				/>
			)}
		</div>
	)
}
