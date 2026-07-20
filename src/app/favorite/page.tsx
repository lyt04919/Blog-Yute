'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BookCard } from './components/book-card'
import { MovieCard } from './components/movie-card'
import { ShareCard } from './share/components/share-card'
import { FavoriteItemCard, type FavoriteItem } from './components/favorite-item-card'

import booksData from '@/data/books.json'
import moviesData from '@/data/movies.json'
import shareData from './share/list.json'

import musicData from './music.json'
import gamesData from './games.json'
import videosData from './videos.json'

import { StandardPageHeader } from '@/components/ui/standard-page-header'
import Folder from '@/components/folder/Folder'
import Masonry from '@/components/masonry/Masonry'

import type { Book } from './components/book-card'
import type { Movie } from './components/movie-card'
import type { Share } from './share/components/share-card'

export default function FavoriteDashboard() {
	const topBooks = [...(booksData as Book[])].reverse().sort((a, b) => {
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
		const tA = a.readDate ? new Date(a.readDate).getTime() : 0
		const tB = b.readDate ? new Date(b.readDate).getTime() : 0
		return tB - tA
	}).filter(b => b.isShow && b.isShowOnHome !== false)

	const topMovies = [...(moviesData as Movie[])].reverse().sort((a, b) => {
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
		const tA = a.watchDate ? new Date(a.watchDate).getTime() : 0
		const tB = b.watchDate ? new Date(b.watchDate).getTime() : 0
		return tB - tA
	}).filter(m => m.isShow && m.isShowOnHome !== false)

	// Top items for newly added categories
	const topMusic = [...(musicData as FavoriteItem[])].reverse().sort((a, b) => {
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
		const tA = a.playDate ? new Date(a.playDate).getTime() : 0
		const tB = b.playDate ? new Date(b.playDate).getTime() : 0
		return tB - tA
	}).filter(m => m.isShow && m.isShowOnHome !== false)

	const topGames = [...(gamesData as FavoriteItem[])].reverse().sort((a, b) => {
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
		const tA = a.playDate ? new Date(a.playDate).getTime() : 0
		const tB = b.playDate ? new Date(b.playDate).getTime() : 0
		return tB - tA
	}).filter(g => g.isShow && g.isShowOnHome !== false)

	const topVideos = [...(videosData as FavoriteItem[])].reverse().sort((a, b) => {
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
		const tA = a.playDate ? new Date(a.playDate).getTime() : 0
		const tB = b.playDate ? new Date(b.playDate).getTime() : 0
		return tB - tA
	}).filter(v => v.isShow && v.isShowOnHome !== false)

	// Top 4 shares to fit perfectly in a 4-column grid
	const topShares = [...(shareData as Share[])].reverse().filter(s => s.isShow && s.isShowOnHome !== false).slice(0, 8)

	// Map to Masonry format with estimated heights based on content length
	const masonryShares = topShares.map(share => {
		const calculatedHeight = 200 + (share.description?.length || 0) * 0.6 + (share.tags?.length || 0) * 10
		return {
			id: share.url,
			height: Math.min(340, calculatedHeight),
			share
		}
	})

	const renderPaperCover = (cover: string | undefined, title: string, link: string) => (
		<Link 
			key={title}
			href={link} 
			className="relative w-full h-full block rounded-[6px] overflow-hidden group/paper-item shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-805"
		>
			{cover ? (
				<img src={cover} alt={title} className="w-full h-full object-cover" />
			) : (
				<div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold p-1 text-center">
					{title}
				</div>
			)}
			<div className="absolute inset-0 bg-black/60 opacity-0 group-hover/paper-item:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
				<span className="text-[8px] sm:text-[9px] text-white font-bold leading-tight line-clamp-2">{title}</span>
			</div>
		</Link>
	)

	const bookFolderItems = [
		topBooks[2] ? renderPaperCover(topBooks[2].cover, topBooks[2].name, '/favorite/books') : null,
		topBooks[1] ? renderPaperCover(topBooks[1].cover, topBooks[1].name, '/favorite/books') : null,
		topBooks[0] ? renderPaperCover(topBooks[0].cover, topBooks[0].name, '/favorite/books') : null,
	]

	const movieFolderItems = [
		topMovies[2] ? renderPaperCover(topMovies[2].poster, topMovies[2].name, '/favorite/movies') : null,
		topMovies[1] ? renderPaperCover(topMovies[1].poster, topMovies[1].name, '/favorite/movies') : null,
		topMovies[0] ? renderPaperCover(topMovies[0].poster, topMovies[0].name, '/favorite/movies') : null,
	]

	const videoFolderItems = [
		topVideos[2] ? renderPaperCover(topVideos[2].cover, topVideos[2].name, '/favorite/videos') : null,
		topVideos[1] ? renderPaperCover(topVideos[1].cover, topVideos[1].name, '/favorite/videos') : null,
		topVideos[0] ? renderPaperCover(topVideos[0].cover, topVideos[0].name, '/favorite/videos') : null,
	]

	const gameFolderItems = [
		topGames[2] ? renderPaperCover(topGames[2].cover, topGames[2].name, '/favorite/games') : null,
		topGames[1] ? renderPaperCover(topGames[1].cover, topGames[1].name, '/favorite/games') : null,
		topGames[0] ? renderPaperCover(topGames[0].cover, topGames[0].name, '/favorite/games') : null,
	]

	const musicFolderItems = [
		topMusic[2] ? renderPaperCover(topMusic[2].cover, topMusic[2].name, '/favorite/music') : null,
		topMusic[1] ? renderPaperCover(topMusic[1].cover, topMusic[1].name, '/favorite/music') : null,
		topMusic[0] ? renderPaperCover(topMusic[0].cover, topMusic[0].name, '/favorite/music') : null,
	]

	const shareFolderItems = [
		topShares[2] ? renderPaperCover(topShares[2].logo, topShares[2].name, '/favorite/share') : null,
		topShares[1] ? renderPaperCover(topShares[1].logo, topShares[1].name, '/favorite/share') : null,
		topShares[0] ? renderPaperCover(topShares[0].logo, topShares[0].name, '/favorite/share') : null,
	]

	return (
		<div className='min-h-screen relative pb-32 bg-bg'>
			<StandardPageHeader
				title="Favorites"
				subtitle="A minimalist collection of my inspirations."
			/>

			<div className='flex flex-col gap-24'>

				{/* Category Portal Grid */}
				<section className='mx-auto w-full max-w-7xl px-6 pt-4'>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-16 py-12 justify-items-center bg-[var(--color-card)]/30 border border-[var(--color-border)]/50 rounded-3xl shadow-sm">
						
						{/* Category 1: Books */}
						<div className="flex flex-col items-center gap-4 group/portal select-none w-full max-w-[160px]">
							<div className="h-32 flex items-center justify-center relative">
								<Folder 
									color="#10b981" 
									size={1.3} 
									items={bookFolderItems} 
								/>
							</div>
							<div className="text-center mt-2">
								<h3 className="text-sm font-bold text-[var(--color-primary)]">Books</h3>
								<Link href="/favorite/books" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)] hover:text-emerald-500 transition-colors mt-1">
									View All <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
						</div>

						{/* Category 2: Movies */}
						<div className="flex flex-col items-center gap-4 group/portal select-none w-full max-w-[160px]">
							<div className="h-32 flex items-center justify-center relative">
								<Folder 
									color="#f59e0b" 
									size={1.3} 
									items={movieFolderItems} 
								/>
							</div>
							<div className="text-center mt-2">
								<h3 className="text-sm font-bold text-[var(--color-primary)]">Movies</h3>
								<Link href="/favorite/movies" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)] hover:text-amber-500 transition-colors mt-1">
									View All <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
						</div>

						{/* Category 3: Videos */}
						<div className="flex flex-col items-center gap-4 group/portal select-none w-full max-w-[160px]">
							<div className="h-32 flex items-center justify-center relative">
								<Folder 
									color="#ef4444" 
									size={1.3} 
									items={videoFolderItems} 
								/>
							</div>
							<div className="text-center mt-2">
								<h3 className="text-sm font-bold text-[var(--color-primary)]">Videos</h3>
								<Link href="/favorite/videos" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)] hover:text-red-500 transition-colors mt-1">
									View All <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
						</div>

						{/* Category 4: Games */}
						<div className="flex flex-col items-center gap-4 group/portal select-none w-full max-w-[160px]">
							<div className="h-32 flex items-center justify-center relative">
								<Folder 
									color="#8b5cf6" 
									size={1.3} 
									items={gameFolderItems} 
								/>
							</div>
							<div className="text-center mt-2">
								<h3 className="text-sm font-bold text-[var(--color-primary)]">Games</h3>
								<Link href="/favorite/games" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)] hover:text-purple-500 transition-colors mt-1">
									View All <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
						</div>

						{/* Category 5: Music */}
						<div className="flex flex-col items-center gap-4 group/portal select-none w-full max-w-[160px]">
							<div className="h-32 flex items-center justify-center relative">
								<Folder 
									color="#3b82f6" 
									size={1.3} 
									items={musicFolderItems} 
								/>
							</div>
							<div className="text-center mt-2">
								<h3 className="text-sm font-bold text-[var(--color-primary)]">Music</h3>
								<Link href="/favorite/music" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)] hover:text-blue-500 transition-colors mt-1">
									View All <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
						</div>

						{/* Category 6: Bookmarks */}
						<div className="flex flex-col items-center gap-4 group/portal select-none w-full max-w-[160px]">
							<div className="h-32 flex items-center justify-center relative">
								<Folder 
									color="#6b7280" 
									size={1.3} 
									items={shareFolderItems} 
								/>
							</div>
							<div className="text-center mt-2">
								<h3 className="text-sm font-bold text-[var(--color-primary)]">Bookmarks</h3>
								<Link href="/favorite/share" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)] hover:text-gray-500 transition-colors mt-1">
									View All <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
						</div>

					</div>
				</section>

				{/* Books Section */}
				<section className='mx-auto w-full max-w-7xl px-6'>
					<div className='flex items-end justify-between mb-8'>
						<h2 className='text-2xl font-medium tracking-tight text-[var(--color-primary)]'>
						Books
					</h2>
					<Link
						href='/favorite/books'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
							View All <ArrowRight className='w-4 h-4' />
						</Link>
					</div>
					<div className='flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:gap-6 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0'>
						{topBooks.map((book, i) => (
							<div key={`book-${i}`} className='snap-center shrink-0 carousel-item-w'>
								<BookCard book={book} />
							</div>
						))}
					</div>
				</section>

				{/* Movies Section */}
				<section className='mx-auto w-full max-w-7xl px-6'>
					<div className='flex items-end justify-between mb-8'>
						<h2 className='text-2xl font-medium tracking-tight text-[var(--color-primary)]'>
						Movies
					</h2>
					<Link
						href='/favorite/movies'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
							View All <ArrowRight className='w-4 h-4' />
						</Link>
					</div>
					<div className='flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:gap-6 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0'>
						{topMovies.map((movie, i) => (
							<div key={`movie-${i}`} className='snap-center shrink-0 carousel-item-w'>
								<MovieCard movie={movie} />
							</div>
						))}
					</div>
				</section>

				{/* Videos Section */}
				<section className='mx-auto w-full max-w-7xl px-6'>
					<div className='flex items-end justify-between mb-8'>
						<h2 className='text-2xl font-medium tracking-tight text-[var(--color-primary)]'>
						Videos
					</h2>
					<Link
						href='/favorite/videos'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
							View All <ArrowRight className='w-4 h-4' />
						</Link>
					</div>
					<div className='flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:gap-6 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0'>
						{topVideos.map((item, i) => (
							<div key={`video-${i}`} className='snap-center shrink-0 w-[280px] sm:w-[calc(60%-16px)] lg:w-[calc(40%-18px)] xl:w-[calc(33.333%-19.2px)]'>
								<FavoriteItemCard item={item} targetType="videos" />
							</div>
						))}
					</div>
				</section>

				{/* Games Section */}
				<section className='mx-auto w-full max-w-7xl px-6'>
					<div className='flex items-end justify-between mb-8'>
						<h2 className='text-2xl font-medium tracking-tight text-[var(--color-primary)]'>
						Games
					</h2>
					<Link
						href='/favorite/games'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
							View All <ArrowRight className='w-4 h-4' />
						</Link>
					</div>
					<div className='flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:gap-6 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0'>
						{topGames.map((item, i) => (
							<div key={`game-${i}`} className='snap-center shrink-0 carousel-item-w'>
								<FavoriteItemCard item={item} targetType="games" />
							</div>
						))}
					</div>
				</section>

				{/* Music & Podcasts Section */}
				<section className='mx-auto w-full max-w-7xl px-6'>
					<div className='flex items-end justify-between mb-8'>
						<h2 className='text-2xl font-medium tracking-tight text-[var(--color-primary)]'>
						Music & Podcasts
					</h2>
					<Link
						href='/favorite/music'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
							View All <ArrowRight className='w-4 h-4' />
						</Link>
					</div>
					<div className='flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:gap-6 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0'>
						{topMusic.map((item, i) => (
							<div key={`music-${i}`} className='snap-center shrink-0 carousel-item-w'>
								<FavoriteItemCard item={item} targetType="music" />
							</div>
						))}
					</div>
				</section>

				{/* Bookmarks (Share) Section */}
				<section className='mx-auto w-full max-w-7xl px-6'>
					<div className='flex items-end justify-between mb-8'>
						<h2 className='text-2xl font-medium tracking-tight text-[var(--color-primary)]'>
						Bookmarks
					</h2>
					<Link
						href='/favorite/share'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
							View All <ArrowRight className='w-4 h-4' />
						</Link>
					</div>
					<div className='w-full relative mt-4 h-[600px] sm:h-[400px]'>
						<Masonry 
							items={masonryShares}
							renderItem={(item) => (
								<ShareCard share={item.share} />
							)}
						/>
					</div>
				</section>

			</div>
		</div>
	)
}
