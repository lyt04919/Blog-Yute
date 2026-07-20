'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Calendar, Sparkles, BookOpen, Newspaper, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ScrollFloat from '@/components/scroll-float/ScrollFloat'
import blogIndex from '@/../public/blogs/index.json'
import StarBadge from '@/components/ui/star-badge'
import { CardSpotlight } from '@/components/ui/card-spotlight'

interface BlogItem {
	slug: string
	title: string
	date: string
	summary?: string
	cover?: string
	tags?: string[]
	hidden?: boolean
	status?: string
}

import { toast } from 'sonner'
import { useConfigStore } from '../stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'

function RollingTextButton({ href, text, secondaryText, variant = 'primary' }: { href: string; text: string; secondaryText: string; variant?: 'primary' | 'secondary' }) {
	return (
		<Link 
			href={href} 
			className={`group relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden rounded-full font-bold text-xs transition-all duration-500 shadow-md active:scale-95 ${
				variant === 'primary' 
					? 'bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950' 
					: 'bg-white text-zinc-900 hover:bg-zinc-50 border border-slate-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 dark:border-zinc-700'
			}`}
		>
			<div className="relative flex flex-col items-center justify-center h-4 overflow-hidden">
				<span className="transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full flex items-center gap-1">
					{text}
				</span>
				<span className="absolute transform translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 whitespace-nowrap flex items-center gap-1">
					{secondaryText}
				</span>
			</div>
		</Link>
	)
}

export default function RecentInsights() {
	const siteContent = useConfigStore(state => state.siteContent)
	const isAuth = useAuthStore(state => state.isAuth)
	const featuredBlogsList = siteContent.featuredBlogs || []

	// All unhidden posts
	const allPosts = (blogIndex as BlogItem[]).filter(p => !p.hidden)
	
	let displayPosts: BlogItem[] = []
	
	if (featuredBlogsList.length > 0) {
		displayPosts = featuredBlogsList.map(slug => allPosts.find(p => p.slug === slug)).filter(Boolean) as BlogItem[]
	}
	
	// Fallback to published posts if nothing selected, or if selected array somehow ended up empty
	if (displayPosts.length === 0) {
		displayPosts = allPosts.filter(p => p.status !== 'draft')
	}

	// Featured Post (First post) & Editor's Picks (Next 3 posts)
	const featuredPost = displayPosts[0] || null
	const sidePosts = displayPosts.slice(1, 4)

	return (
		<section className="mx-auto w-full max-w-7xl px-6 py-12">
			{/* Section Header */}
			<div className="mb-12 flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto relative z-10">
				<div className="flex items-center gap-3 mb-4">
					<StarBadge text="★ INSIGHTS" />
					{isAuth && (
						<button
							onClick={() => useConfigStore.getState().setHomeDisplayModalOpen(true)}
							className="p-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-zinc-700"
							title="主页内容展示管理"
						>
							<Settings className="w-3.5 h-3.5" />
							<span>展示管理</span>
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
					Digital *Garden* Notes
				</ScrollFloat>
				<p className="text-sm text-[var(--color-secondary)] mb-6 max-w-xl">
					记录前端探索、深度思考与工具设计的杂志风内容汇聚。
				</p>
				<RollingTextButton href="/blog" text="探索全部文章" secondaryText="Explore All →" variant="primary" />
			</div>

			{/* 3-Column Articles Card Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
				{displayPosts.slice(0, 3).map((post, idx) => (
					<CardSpotlight
						key={post.slug}
						className="h-full rounded-[32px]"
						glowColor="rgba(245, 158, 11, 0.07)"
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
							className="group relative rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 bg-transparent p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden h-full cursor-pointer"
						>
							<Link
								href={`/blog/${post.slug}`}
								className="relative z-10 flex flex-col h-full justify-between"
							>
								<div>
									{/* Thumbnail Cover Image */}
									<div className="relative w-full h-44 rounded-2xl overflow-hidden mb-5 bg-slate-50 dark:bg-zinc-850/20 shrink-0">
										{post.cover ? (
											<Image 
												src={post.cover} 
												alt={post.title} 
												fill 
												unoptimized={true}
												className="object-cover transition-transform duration-700 group-hover:scale-105" 
											/>
										) : (
											<div className="w-full h-full bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
												<Newspaper className="w-8 h-8" />
											</div>
										)}
									</div>

									{/* Tags and Date */}
									<div className="flex items-center justify-between gap-2 mb-3">
										<div className="flex flex-wrap gap-1.5 min-w-0">
											{post.tags?.slice(0, 2).map((tag, tIdx) => (
												<span key={tIdx} className="text-[9px] font-bold px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider bg-white dark:bg-zinc-900">
													{tag}
												</span>
											))}
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<span className="text-[9px] text-zinc-400 font-mono flex items-center gap-0.5" title="Estimated Reading Time">
												<BookOpen className="w-2.5 h-2.5" />
												{Math.max(3, Math.ceil((post.summary?.length || 120) / 45))}m
											</span>
											<span className="text-zinc-300 dark:text-zinc-850 text-[8px]">•</span>
											<span className="text-[9px] text-zinc-400 font-mono font-bold">
												{post.date?.split('T')[0] || "Recently"}
											</span>
										</div>
									</div>

									{/* Title */}
									<h3 className="text-base font-extrabold text-zinc-950 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300 leading-snug line-clamp-1">
										{post.title}
									</h3>

									{/* Description */}
									{post.summary && (
										<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed line-clamp-3">
											{post.summary}
										</p>
									)}
								</div>

								{/* Minimalist Arrow Button for SaaS look */}
								<div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500 transition-colors duration-300">
									<span>Read Article</span>
									<div className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shrink-0">
										<ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
									</div>
								</div>
							</Link>
						</motion.div>
					</CardSpotlight>
				))}
			</div>
		</section>
	)
}
