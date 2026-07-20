'use client'

import { X, ExternalLink, Film, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import StarRating from '@/components/star-rating'
import { DialogModal } from '@/components/dialog-modal'
import type { Movie } from './movie-card'

interface MovieDetailModalProps {
	movie: Movie
	onClose: () => void
}

export default function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
	const handleResourceClick = (url?: string) => {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer')
		} else {
			toast.error('暂无链接')
		}
	}

	return (
		<DialogModal open onClose={onClose} className='max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 md:p-0 relative flex flex-col shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar'>
			{/* Sticky Top Nav within Modal */}
			<div className='sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800'>
				<div className='flex items-center gap-2'>
					<span className="text-blue-400 text-lg font-mono font-bold">&lt;{movie.name}/&gt;</span>
				</div>
				<button onClick={onClose} className='p-2 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors group'>
					<X className='w-5 h-5 group-hover:scale-110 transition-transform' />
				</button>
			</div>

			<div className="px-6 sm:px-8 lg:px-12 py-8">
				{/* Content Layout: Left Sidebar + Right Main */}
				<div className="flex flex-col md:flex-row gap-8 lg:gap-12">
					
					{/* Left Sidebar: Poster + Metadata */}
					<div className="shrink-0 mx-auto md:mx-0 w-48 sm:w-56 md:w-60 space-y-6">
						<div className="relative group rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
							{movie.poster ? (
								<>
									<div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
									<img
										src={movie.poster}
										alt={movie.name}
										className="relative w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-[1.03] z-10"
										referrerPolicy="no-referrer"
									/>
								</>
							) : (
								<div className="w-full aspect-[2/3] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
									暂无海报
								</div>
							)}
						</div>

						{/* Properties / Metadata List */}
						<div className="space-y-4 pt-2">
							<h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
								Properties
							</h3>
							
							<div className="space-y-3 text-sm">
								<div className="flex flex-col gap-1">
									<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🎬</span> Director</span>
									<span className="font-medium text-slate-900 dark:text-slate-100">{movie.director || '未知'}</span>
								</div>

								{movie.status && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🎯</span> Status</span>
										<span className="font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded w-fit">
											{movie.status === 'watched' ? '已观看' : '打算看'}
										</span>
									</div>
								)}

								{movie.watchDate && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🗓️</span> Watch Date</span>
										<span className="font-mono font-medium text-slate-700 dark:text-slate-300">{movie.watchDate}</span>
									</div>
								)}

								<div className="flex flex-col gap-1">
									<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">⭐</span> Rating</span>
									<div className="scale-90 origin-left">
										<StarRating stars={movie.stars} />
									</div>
								</div>
								
								{movie.rating && (
									<div className="flex flex-col gap-1">
										<span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className="text-base">🌟</span> Personal Score</span>
										<span className="font-mono font-bold text-amber-500">{movie.rating} / 5.0</span>
									</div>
								)}
							</div>
						</div>

						{movie.doubanUrl && (
							<button
								onClick={() => handleResourceClick(movie.doubanUrl)}
								className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm mt-6"
							>
								<ExternalLink className="w-4 h-4" />
								在豆瓣查看
							</button>
						)}
					</div>

					{/* Right Main Content */}
					<div className="flex-1 min-w-0">
						<div className="mb-8">
							<h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white">
								{movie.name}
							</h1>
							
							{movie.tags && movie.tags.length > 0 && (
								<div className="flex flex-wrap gap-2 mb-2">
									{movie.tags.map(tag => (
										<span key={tag} className="px-3 py-1 bg-slate-800/80 text-blue-400 text-xs sm:text-sm font-medium rounded-full border border-blue-900/50">
											{tag}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Overview Section */}
						<div className="prose prose-slate dark:prose-invert max-w-none mb-10">
							<div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
								{movie.description || '暂无剧情简介'}
							</div>
						</div>

						{/* Personal Review Section */}
						{movie.myReview && (
							<div className="mt-8 mb-10">
								<h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
									<Sparkles className="w-5 h-5 text-amber-500" />
									影评 / 随想笔记
								</h3>
								<div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
									<p className="text-[15px] text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap font-serif">
										{movie.myReview}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</DialogModal>
	)
}
