'use client'

import { X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import StarRating from '@/components/star-rating'
import { DialogModal } from '@/components/dialog-modal'
import type { Share } from './share-card'

interface ShareDetailModalProps {
	share: Share
	onClose: () => void
}

export default function ShareDetailModal({ share, onClose }: ShareDetailModalProps) {
	const handleResourceClick = (url?: string) => {
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer')
		} else {
			toast.error('暂无链接')
		}
	}

	return (
		<DialogModal open onClose={onClose} className='max-w-6xl w-full max-h-[90vh] overflow-y-auto p-0 md:p-0 relative flex flex-col shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar'>
			{/* Sticky Top Nav within Modal */}
			<div className='sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800'>
				<div className='flex items-center gap-2'>
					<span className="text-blue-400 text-lg font-mono font-bold">&lt;{share.name}/&gt;</span>
				</div>
				<button onClick={onClose} className='p-2 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors group'>
					<X className='w-5 h-5 group-hover:scale-110 transition-transform' />
				</button>
			</div>

			<div className="px-6 sm:px-8 lg:px-12 py-8">
				{/* Top Section: Logo + Info */}
				<div className="flex flex-col md:flex-row items-start gap-8">
					<div className="shrink-0 mx-auto md:mx-0 w-[160px] md:w-[220px] relative group">
						{share.logo ? (
							<>
								<div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
								<img
									src={share.logo}
									alt={share.name}
									className="relative w-full aspect-square object-cover rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 transition-transform duration-500 group-hover:scale-[1.02] z-10"
								/>
							</>
						) : (
							<div className="w-full aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
								暂无Logo
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight text-slate-900 dark:text-white">
							{share.name}
						</h1>
						
						<div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
							<div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800">
								<StarRating stars={share.stars} />
							</div>
						</div>

						<div className="flex flex-wrap gap-2 mb-8">
							{share.tags.map(tag => (
								<span key={tag} className="px-3 py-1 bg-slate-800/80 text-blue-400 text-xs sm:text-sm font-medium rounded-full border border-blue-900/50">
									{tag}
								</span>
							))}
						</div>

						<div className="mb-8">
							<h2 className="text-xl font-bold mb-3 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100">
								Overview
							</h2>
							<p className="text-slate-700 dark:text-slate-300 leading-relaxed font-light text-[15px] whitespace-pre-wrap">
								{share.description || '暂无简介'}
							</p>
						</div>
					</div>
				</div>

				{/* Bottom Section: Action & Developer Insights */}
				<div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						
						{/* Left: Preview Placeholder */}
						<div className="lg:col-span-2">
							<h2 className="text-xl font-bold mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100">
								Website URL
							</h2>
							<div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full p-6 rounded-lg flex flex-col items-start justify-center group cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" onClick={() => handleResourceClick(share.url)}>
								<p className="text-blue-400 font-mono text-sm sm:text-base group-hover:text-blue-300 transition-colors break-all underline underline-offset-4">{share.url}</p>
							</div>
						</div>

						{/* Right: Sidebar Actions */}
						<div className="lg:col-span-1 space-y-6">
							<div className="bg-slate-50 dark:bg-slate-100 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
								<h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Visit Website</h3>
								<button
									onClick={() => handleResourceClick(share.url)}
									className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] active:scale-95"
								>
									<ExternalLink className="w-4 h-4" />
									Open Link
								</button>
							</div>
						</div>

					</div>
				</div>

			</div>
		</DialogModal>
	)
}
