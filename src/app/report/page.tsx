'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Book, Film, MapPin, PenTool, Hammer, Star, Calendar } from 'lucide-react'

import booksData from '@/data/books.json'
import moviesData from '@/data/movies.json'
import footprintsData from '@/data/footprints.json'
import blogIndex from '@/../public/blogs/index.json'
import projectsData from '@/data/projects.json'

import type { Book as BookType } from '@/app/favorite/components/book-card'
import type { Movie as MovieType } from '@/app/favorite/components/movie-card'

export default function ReportPage() {
	const [selectedYear, setSelectedYear] = useState<string>('All Time')

	const { availableYears, stats } = useMemo(() => {
		const books = booksData as (BookType & { readDate?: string })[]
		const movies = moviesData as (MovieType & { watchDate?: string })[]
		const footprints = footprintsData as any[]
		const blogs = blogIndex as any[]
		const projects = projectsData as any[]

		// Extract all available years
		const yearsSet = new Set<string>()
		books.forEach(b => { if (b.readDate) yearsSet.add(b.readDate.substring(0, 4)) })
		movies.forEach(m => { if (m.watchDate) yearsSet.add(m.watchDate.substring(0, 4)) })
		footprints.forEach(f => { if (f.date) yearsSet.add(f.date.substring(0, 4)) })
		blogs.forEach(b => { if (b.date) yearsSet.add(b.date.substring(0, 4)) })
		projects.forEach(p => { if (p.year) yearsSet.add(String(p.year)) })

		const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))

		// Filter datasets by selected year
		const filterByYear = (dateStr: string | number | undefined) => {
			if (selectedYear === 'All Time') return true
			if (!dateStr) return false
			return String(dateStr).startsWith(selectedYear)
		}

		const filteredBooks = books.filter(b => b.status === 'finished' && filterByYear(b.readDate))
		const filteredMovies = movies.filter(m => m.status === 'watched' && filterByYear(m.watchDate))
		const filteredFootprints = footprints.filter(f => filterByYear(f.date))
		const filteredBlogs = blogs.filter(b => !b.hidden && b.status !== 'draft' && filterByYear(b.date))
		const filteredProjects = projects.filter(p => filterByYear(p.year))

		// Metrics
		const totalBooks = filteredBooks.length
		const totalMovies = filteredMovies.length
		const totalArticles = filteredBlogs.length
		const totalProjects = filteredProjects.length

		const totalCities = Array.from(new Set(filteredFootprints.map(fp => fp.city))).length
		const totalCountries = Array.from(new Set(filteredFootprints.map(fp => fp.country).filter(Boolean))).length
		const travelDays = filteredFootprints
			.filter(fp => fp.type !== 'live' && fp.type !== 'work' && !fp.isCurrent)
			.reduce((sum: number, fp: any) => sum + fp.days, 0)

		// Highlights
		const booksFiveStars = filteredBooks.filter(b => b.stars === 5)
		const moviesFiveStars = filteredMovies.filter(m => m.stars === 5)

		return {
			availableYears: ['All Time', ...sortedYears],
			stats: {
				totalBooks,
				totalMovies,
				totalArticles,
				totalProjects,
				totalCities,
				totalCountries,
				travelDays,
				booksFiveStars,
				moviesFiveStars,
				projects: filteredProjects,
				blogs: filteredBlogs
			}
		}
	}, [selectedYear])

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-32">
			{/* Header */}
			<div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm">
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<Link
								href="/"
								className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
							>
								<ArrowLeft className="w-5 h-5" />
							</Link>
							<div>
								<h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
									<Calendar className="w-5 h-5 text-blue-500" />
									Yearly Statistics
								</h1>
								<p className="text-xs text-slate-500 dark:text-slate-400">年度全量数据统计面板</p>
							</div>
						</div>

						{/* Year Selector */}
						<div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
							{availableYears.map(year => (
								<button
									key={year}
									onClick={() => setSelectedYear(year)}
									className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
										selectedYear === year
											? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
											: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
									}`}
								>
									{year}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-6 pt-10">
				
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-2">Overview in {selectedYear}</h2>
					<p className="text-slate-500 dark:text-slate-400 text-sm">核心数据概览</p>
				</div>

				{/* Simple Metric Grid */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
					
					{/* Footprints */}
					<div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
						<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-4">
							<MapPin className="w-5 h-5" />
							<span className="font-semibold text-sm">Footprints</span>
						</div>
						<div>
							<div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stats.totalCities}</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">Cities visited</p>
							{stats.totalCountries > 0 && (
								<p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stats.totalCountries} Countries · {stats.travelDays} Days</p>
							)}
						</div>
					</div>

					{/* Projects */}
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
						<div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-4">
							<Hammer className="w-5 h-5" />
							<span className="font-semibold text-sm">Projects</span>
						</div>
						<div>
							<div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stats.totalProjects}</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">Shipped</p>
						</div>
					</div>

					{/* Articles */}
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
						<div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-4">
							<PenTool className="w-5 h-5" />
							<span className="font-semibold text-sm">Articles</span>
						</div>
						<div>
							<div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stats.totalArticles}</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">Published</p>
						</div>
					</div>

					{/* Books */}
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
						<div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
							<Book className="w-5 h-5" />
							<span className="font-semibold text-sm">Books</span>
						</div>
						<div>
							<div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stats.totalBooks}</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">Finished</p>
						</div>
					</div>

					{/* Movies */}
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
						<div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4">
							<Film className="w-5 h-5" />
							<span className="font-semibold text-sm">Movies</span>
						</div>
						<div>
							<div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stats.totalMovies}</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">Watched</p>
						</div>
					</div>

				</div>

				{/* Highlight Section */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-2">Highlights of {selectedYear}</h2>
					<p className="text-slate-500 dark:text-slate-400 text-sm">年度重点产出与五星佳作</p>
				</div>

				<div className="flex flex-col gap-12">
					
					{/* Projects Highlights */}
					{stats.projects.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
								<Hammer className="w-5 h-5 text-orange-500" />
								<h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Shipped Projects</h3>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{stats.projects.map((project, idx) => (
									<a 
										key={idx} 
										href={project.url || project.github} 
										target="_blank" 
										rel="noreferrer"
										className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all block"
									>
										<div className="flex items-center gap-4 mb-3">
											{project.image ? (
												<img src={project.image} alt={project.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
											) : (
												<div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
													<Hammer className="w-5 h-5 text-slate-400" />
												</div>
											)}
											<h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{project.name}</h4>
										</div>
										<p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{project.description}</p>
									</a>
								))}
							</div>
						</div>
					)}

					{/* 5-Star Books */}
					{stats.booksFiveStars.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
								<Book className="w-5 h-5 text-blue-500" />
								<h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">5-Star Books</h3>
							</div>
							<div className="flex flex-wrap gap-4">
								{stats.booksFiveStars.map((b, i) => (
									<div 
										key={b.name}
										className="group relative w-24 h-36 md:w-32 md:h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
									>
										<Image src={b.cover} alt={b.name} fill unoptimized={true} className="object-cover group-hover:scale-105 transition-transform duration-500" />
										<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
											<span className="text-xs font-bold text-white line-clamp-2">{b.name}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 5-Star Movies */}
					{stats.moviesFiveStars.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
								<Film className="w-5 h-5 text-purple-500" />
								<h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">5-Star Movies</h3>
							</div>
							<div className="flex flex-wrap gap-4">
								{stats.moviesFiveStars.map((m, i) => (
									<div 
										key={m.name}
										className="group relative w-24 h-36 md:w-32 md:h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
									>
										<Image src={m.poster} alt={m.name} fill unoptimized={true} className="object-cover group-hover:scale-105 transition-transform duration-500" />
										<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
											<span className="text-xs font-bold text-white line-clamp-2">{m.name}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Empty State when no highlights */}
					{stats.projects.length === 0 && stats.booksFiveStars.length === 0 && stats.moviesFiveStars.length === 0 && (
						<div className="text-center py-12 text-slate-500">
							<p>这一年比较平淡，没有找到突出的年度重点产出或五星佳作哦～</p>
						</div>
					)}

				</div>

			</div>
		</div>
	)
}
