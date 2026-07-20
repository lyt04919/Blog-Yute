'use client'

import { useState } from 'react'
import Link from 'next/link'
import MovieGridView from '../movie-grid-view'
import { useAuthStore } from '@/hooks/use-auth'
import { StandardPageHeader } from '@/components/ui/standard-page-header'

import initialMovies from '@/data/movies.json'

import type { Movie } from '../components/movie-card'

export default function FavoriteMoviesPage() {
	const [movies] = useState<Movie[]>(initialMovies as Movie[])
	const { isAuth } = useAuthStore()

	// Filter: Showcase page only sees isShow === true.
	const displayedMovies = movies.filter(m => m.isShow)

	const sortedMovies = [...displayedMovies].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		
		const timeA = a.watchDate ? new Date(a.watchDate).getTime() : 0
		const timeB = b.watchDate ? new Date(b.watchDate).getTime() : 0
		return timeB - timeA
	})

	const headerActions = isAuth ? (
		<Link
			href='/vault/movies'
			className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm'
		>
			管理电影仓库 ({movies.length}) →
		</Link>
	) : undefined

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

			<div>
				<MovieGridView 
					movies={sortedMovies} 
					isEditMode={false} 
				/>
			</div>
		</div>
	)
}
