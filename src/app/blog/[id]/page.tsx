'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { loadBlog, type BlogConfig } from '@/lib/load-blog'
import { useReadArticles } from '@/hooks/use-read-articles'
import LiquidGrass from '@/components/liquid-grass'
import { ShareCard } from '@/components/share-card'
import { PageTitle } from '@/components/page-title'
import { Breadcrumb } from '@/components/breadcrumb'
import { ArrowLeft, Clock, Calendar, List, ChevronUp, ChevronDown, X, Hammer } from 'lucide-react'
import Link from 'next/link'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { BlogSkeleton } from '@/components/blog-skeleton'
import { useAuthStore } from '@/hooks/use-auth'
import projectsData from '@/data/projects.json'

function estimateReadTime(markdown: string): number {
	const words = markdown.replace(/[#*`\[\]\(\)!\-_>]/g, '').split(/\s+/).length
	return Math.max(1, Math.ceil(words / 200))
}


export default function Page() {
	const params = useParams() as { id?: string | string[] }
	const slug = Array.isArray(params?.id) ? params.id[0] : params?.id || ''
	const router = useRouter()
	const { markAsRead } = useReadArticles()
	const { items: allBlogs } = useBlogIndex()
	const { isAuth } = useAuthStore()
	
	const matchedProjects = useMemo(() => {
		return (projectsData as any[]).filter(p => p.blogSlug === slug)
	}, [slug])

	const [activeHeading, setActiveHeading] = useState('')
	const [origin, setOrigin] = useState('')
	const [readingProgress, setReadingProgress] = useState(0)
	const [tocOpen, setTocOpen] = useState(false)

	const [blog, setBlog] = useState<{ config: BlogConfig; markdown: string; cover?: string } | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
	}, [])

	useEffect(() => {
		let cancelled = false
		async function run() {
			if (!slug) return
			try {
				setLoading(true)
				const blogData = await loadBlog(slug)

				if (!cancelled) {
					setBlog(blogData)
					setError(null)
					markAsRead(slug)
				}
			} catch (e: any) {
				if (!cancelled) setError(e?.message || '加载失败')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		run()
		return () => {
			cancelled = true
		}
	}, [slug, markAsRead])

	const title = useMemo(() => (blog?.config.title ? blog.config.title : slug), [blog?.config.title, slug])
	const date = useMemo(() => dayjs(blog?.config.date).format('YYYY年 M月 D日'), [blog?.config.date])
	const tags = blog?.config.tags || []
	const readTime = blog ? estimateReadTime(blog.markdown) : 0
	// 使用 markdown render hook，直接解构生成好的 toc
	const { content, toc, loading: mdLoading } = useMarkdownRender(blog?.markdown || '')

	// 相关文章：同标签或同分类的其他文章
	const relatedBlogs = useMemo(() => {
		if (!blog || !allBlogs.length) return []
		const currentTags = blog.config.tags || []
		const currentCategory = blog.config.category
		return allBlogs
			.filter(b => b.slug !== slug)
			.filter(b => {
				const bTags = b.tags || []
				const hasCommonTag = currentTags.some(t => bTags.includes(t))
				const sameCategory = currentCategory && b.category === currentCategory
				return hasCommonTag || sameCategory
			})
			.slice(0, 3)
	}, [blog, allBlogs, slug])

	// 上一篇/下一篇
	const currentIndex = useMemo(() => allBlogs.findIndex(b => b.slug === slug), [allBlogs, slug])
	const prevBlog = currentIndex > 0 ? allBlogs[currentIndex - 1] : null
	const nextBlog = currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null

	useEffect(() => {
		if (!toc || !toc.length) return
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						setActiveHeading(entry.target.id)
					}
				})
			},
			{ rootMargin: '-80px 0px -60% 0px' }
		)

		toc.forEach(h => {
			const el = document.getElementById(h.id)
			if (el) observer.observe(el)
		})

		return () => observer.disconnect()
	}, [toc])

	// Reading progress
	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY
			const docHeight = document.documentElement.scrollHeight - window.innerHeight
			const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0
			setReadingProgress(progress)
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll()
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const handleEdit = () => {
		router.push(`/write/${slug}`)
	}

	const handleBack = () => {
		if (window.history.length > 1) {
			router.back()
		} else {
			router.push('/blog')
		}
	}

	const scrollToHeading = (id: string) => {
		const el = document.getElementById(id)
		if (el) {
			const top = el.getBoundingClientRect().top + window.scrollY
			window.scrollTo({ top: top - 96, behavior: 'smooth' })
		}
	}

	if (!slug) {
		return <div className='text-[var(--color-secondary)] flex h-full items-center justify-center text-sm'>无效的链接</div>
	}

	if (loading) {
		return <BlogSkeleton />
	}

	if (error) {
		return <div className='flex h-full items-center justify-center text-sm text-zinc-500'>文章不存在或未公开</div>
	}

	if (!blog || (!isAuth && (blog.config.status === 'draft' || blog.config.hidden))) {
		return <div className='text-[var(--color-secondary)] flex h-full items-center justify-center text-sm'>文章不存在或未公开</div>
	}

	return (
		<>
			<PageTitle title={title} />

			{/* Reading Progress Bar */}
			<div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent">
				<motion.div
					className="h-full bg-[var(--color-brand)]"
					style={{ width: `${readingProgress}%` }}
					transition={{ duration: 0.1 }}
				/>
			</div>

			{/* Main Content */}
			<div className='mx-auto w-full max-w-6xl px-6 pt-24 pb-20'>
				<div className="flex flex-col gap-4 mb-8">
					<Breadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: title }]} />
					<motion.button
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						onClick={handleBack}
						className='w-fit rounded-xl border bg-[var(--color-bg)]/60 dark:bg-[var(--color-card)]/60 px-4 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-bg)] dark:hover:bg-[var(--color-card)] flex items-center gap-1.5 z-40'
					>
						<ArrowLeft className='h-4 w-4' />
						返回
					</motion.button>
				</div>
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
					{/* Left: Article Content */}
					<div className='lg:col-span-8'>
						{/* Article Header */}
						<header className='mb-10'>
							{blog.config.category && (
								<span className='text-xs uppercase tracking-wider text-[var(--color-secondary)] mb-3 block'>
									{blog.config.category}
								</span>
							)}
							<h1 className='font-serif text-3xl md:text-4xl font-medium text-[var(--color-primary)] mb-4 leading-tight'>
								{title}
							</h1>
							<div className='flex items-center justify-between flex-wrap gap-4'>
								<div className='flex flex-col gap-2'>
									<div className='flex items-center gap-4 text-sm text-[var(--color-secondary)]'>
										<span className='flex items-center gap-1.5'>
											<Calendar className='w-3.5 h-3.5' />
											{date}
										</span>
										<span>·</span>
										<span className='flex items-center gap-1.5'>
											<Clock className='w-3.5 h-3.5' />
											{readTime} min read
										</span>
									</div>
									{matchedProjects.length > 0 ? (
										<div className='flex items-center gap-2 mt-1 flex-wrap'>
											<span className='text-xs text-[var(--color-secondary)]'>关联项目:</span>
											{matchedProjects.map(project => (
												<Link
													key={project.name}
													href={`/projects?search=${encodeURIComponent(project.name)}`}
													className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 transition-colors'
												>
													<Hammer className='w-3 h-3' />
													{project.name}
												</Link>
											))}
										</div>
									) : blog.config.projectUrl ? (
										<div className='flex items-center gap-2 mt-1'>
											<span className='text-xs text-[var(--color-secondary)]'>关联项目:</span>
											<a
												href={blog.config.projectUrl}
												target='_blank'
												rel='noopener noreferrer'
												className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 transition-colors'
											>
												<Hammer className='w-3 h-3' />
												{blog.config.projectName || '查看项目'}
											</a>
										</div>
									) : null}
								</div>
								
								<div className='flex items-center gap-3'>
									<ShareCard
										title={title}
										date={date}
										tags={tags}
										slug={slug}
										cover={blog.cover ? (blog.cover.startsWith('http') ? blog.cover : `${origin}${blog.cover}`) : undefined}
										summary={blog.config.summary}
									/>
									{isAuth && (
										<motion.button
											initial={{ opacity: 0, scale: 0.6 }}
											animate={{ opacity: 1, scale: 1 }}
											onClick={handleEdit}
											className='rounded-xl border bg-[var(--color-bg)]/60 dark:bg-[var(--color-card)]/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-bg)] dark:hover:bg-[var(--color-card)] flex items-center gap-1.5'>
											编辑
										</motion.button>
									)}
								</div>
							</div>
						</header>



						{/* Article Body - Direct markdown render */}
						<article className='prose max-w-none cursor-text'>
							{mdLoading ? (
								<div className='text-[var(--color-secondary)] text-sm'>渲染中...</div>
							) : (
								content
							)}
						</article>

						{/* Tags */}
						{tags.length > 0 && (
							<div className='mt-12 pt-8 border-t border-[var(--color-border)]'>
								<div className='flex items-center gap-2 flex-wrap'>
									<span className='text-xs text-[var(--color-secondary)] mr-2'>Tags:</span>
									{tags.map(tag => (
										<Link
											key={tag}
											href={`/blog?tag=${encodeURIComponent(tag)}`}
											className='text-xs px-3 py-1 rounded-full bg-[var(--color-card)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 border border-[var(--color-border)] transition-colors'
										>
											{tag}
										</Link>
									))}
								</div>
							</div>
						)}

						{/* Prev/Next Navigation */}
						<div className='mt-12 pt-8 border-t border-[var(--color-border)]'>
							<div className='grid grid-cols-2 gap-6'>
								{prevBlog ? (
									<Link href={`/blog/${prevBlog.slug}`} className='group'>
										<div className='text-xs text-[var(--color-secondary)] mb-1'>← Previous</div>
										<div className='font-serif text-sm font-medium text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-2'>
											{prevBlog.title || prevBlog.slug}
										</div>
									</Link>
								) : (
									<div />
								)}
								{nextBlog ? (
									<Link href={`/blog/${nextBlog.slug}`} className='group text-right'>
										<div className='text-xs text-[var(--color-secondary)] mb-1'>Next →</div>
										<div className='font-serif text-sm font-medium text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-2'>
											{nextBlog.title || nextBlog.slug}
										</div>
									</Link>
								) : (
									<div />
								)}
							</div>
						</div>
					</div>

					{/* Right: Sidebar */}
					<div className='lg:col-span-4 hidden lg:block'>
						<div className='sticky top-24 space-y-8'>
							{/* Cover Image */}
							{blog.cover && (
								<div className='rounded-xl overflow-hidden shadow-sm border border-[var(--color-border)]'>
									<img
										src={blog.cover.startsWith('http') ? blog.cover : `${origin}${blog.cover}`}
										alt={title}
										className='w-full object-cover aspect-video hover:scale-105 transition-transform duration-500'
									/>
								</div>
							)}

							{/* Related Project Card */}
							{blog.config.projectUrl && (
								<div className='rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-card)]/50 backdrop-blur-sm shadow-sm space-y-3 hover:shadow-md transition-all duration-300 group'>
									<div className='flex items-center justify-between'>
										<span className='text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--color-brand)]'>
											关联项目
										</span>
										<Hammer className='w-3.5 h-3.5 text-[var(--color-secondary)] group-hover:text-[var(--color-brand)] transition-colors' />
									</div>
									<div className='space-y-1.5'>
										<h4 className='font-bold text-sm text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors truncate'>
											{blog.config.projectName || '未知项目'}
										</h4>
										<p className='text-xs text-[var(--color-secondary)] truncate font-mono'>
											{blog.config.projectUrl}
										</p>
									</div>
									<a
										href={blog.config.projectUrl}
										target='_blank'
										rel='noopener noreferrer'
										className='block w-full text-center bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/90 text-white rounded-xl py-2 text-xs font-semibold shadow-sm transition-colors'
									>
										访问项目主页
									</a>
								</div>
							)}

							{/* Table of Contents */}
							{toc && toc.length > 0 && (
								<div>
									<h3 className='text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--color-secondary)] mb-4'>
										Contents
									</h3>
									<nav className='space-y-2'>
										{toc.map((heading) => (
											<button
												key={heading.id}
												onClick={() => scrollToHeading(heading.id)}
												className={`block text-left w-full text-sm transition-colors ${
													heading.level === 1 ? 'font-medium' : ''
												} ${
													activeHeading === heading.id
														? 'text-[var(--color-brand)]'
														: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
												} ${
													heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : ''
												}`}
											>
												{heading.text}
											</button>
										))}
									</nav>
								</div>
							)}

							{/* Related Articles */}
							{relatedBlogs.length > 0 && (
								<div>
									<h3 className='text-[10px] uppercase tracking-[0.15em] font-medium text-[var(--color-secondary)] mb-4'>
										Related Everything
									</h3>
									<div className='space-y-4'>
										{relatedBlogs.map(blog => (
											<Link
												key={blog.slug}
												href={`/blog/${blog.slug}`}
												className='group flex gap-3'
											>
												{blog.cover ? (
													<div className='w-14 h-14 rounded-lg overflow-hidden shrink-0'>
														<img
															src={blog.cover}
															alt={blog.title}
															className='w-full h-full object-cover'
														/>
													</div>
												) : (
													<div className='w-14 h-14 rounded-lg bg-[var(--color-card)] flex items-center justify-center shrink-0'>
														<span className='text-[10px] text-[var(--color-secondary)]'>Blog</span>
													</div>
												)}
												<div className='min-w-0'>
													<div className='text-sm text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-2 leading-snug'>
														{blog.title || blog.slug}
													</div>
													<div className='text-[10px] text-[var(--color-secondary)] mt-1'>
														{dayjs(blog.date).format('MMM DD, YYYY')}
													</div>
												</div>
											</Link>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>



			{/* Floating TOC Button (mobile) */}
			{toc && toc.length > 0 && (
				<>
					<motion.button
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						onClick={() => setTocOpen(true)}
						className='fixed right-4 bottom-24 z-50 lg:hidden flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors'
						aria-label='目录'>
						<List className='h-5 w-5' />
					</motion.button>

					{/* Mobile TOC Drawer */}
					{tocOpen && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-[70] lg:hidden'
							onClick={() => setTocOpen(false)}>
							<div className='absolute inset-0 bg-black/30 backdrop-blur-sm' />
							<motion.div
								initial={{ x: '100%' }}
								animate={{ x: 0 }}
								exit={{ x: '100%' }}
								transition={{ type: 'spring', damping: 25, stiffness: 300 }}
								onClick={e => e.stopPropagation()}
								className='absolute right-0 top-0 bottom-0 w-72 max-w-[80vw] bg-[var(--color-bg)] border-l border-[var(--color-border)] p-6 overflow-auto'>
								<div className='flex items-center justify-between mb-6'>
									<h3 className='text-sm font-medium text-[var(--color-primary)]'>目录</h3>
									<button
										onClick={() => setTocOpen(false)}
										className='p-1 rounded-lg hover:bg-[var(--color-card)] transition-colors text-[var(--color-secondary)]'>
										<X className='h-4 w-4' />
									</button>
								</div>
								<nav className='space-y-2'>
									{toc.map((heading) => (
										<button
											key={heading.id}
											onClick={() => {
												scrollToHeading(heading.id)
												setTocOpen(false)
											}}
											className={`block text-left w-full text-sm transition-colors ${
												heading.level === 1 ? 'font-medium' : ''
											} ${
												activeHeading === heading.id
													? 'text-[var(--color-brand)]'
													: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
											} ${
												heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : ''
											}`}>
											{heading.text}
										</button>
									))}
								</nav>
							</motion.div>
						</motion.div>
					)}
				</>
			)}

			{/* Floating Prev/Next Navigation */}
			{(prevBlog || nextBlog) && (
				<div className='fixed right-4 bottom-12 z-50 flex flex-col gap-2 lg:hidden'>
					{prevBlog && (
						<Link href={`/blog/${prevBlog.slug}`}>
							<motion.button
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								className='flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors'
								aria-label='上一篇'>
								<ChevronUp className='h-5 w-5' />
							</motion.button>
						</Link>
					)}
					{nextBlog && (
						<Link href={`/blog/${nextBlog.slug}`}>
							<motion.button
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								className='flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors'
								aria-label='下一篇'>
								<ChevronDown className='h-5 w-5' />
							</motion.button>
						</Link>
					)}
				</div>
			)}

			{slug === 'liquid-grass' && <LiquidGrass />}
		</>
	)
}
