'use client'
import { PageTitle } from '@/components/page-title'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'
import { UsesBento } from './components/uses-bento'
import { ProfileBento } from './components/profile-bento'
import { useTheme } from '@/hooks/use-theme'
import { useBlogIndex } from '@/hooks/use-blog-index'
import projectsData from '@/data/projects.json'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('./components/rich-editor'), { ssr: false })

export default function Page() {
	const [data, setData] = useState<AboutData>(initialData as AboutData)
	const [originalData, setOriginalData] = useState<AboutData>(initialData as AboutData)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const [activeTab, setActiveTab] = useState<'site' | 'uses'>('site')
	const { resolvedTheme } = useTheme()

	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const [location, setLocation] = useState(siteContent.bentoConfig?.location || '')
	const { content, loading } = useMarkdownRender(data.content)
	const { items: blogsList } = useBlogIndex()
	const hideEditButton = siteContent.hideEditButton ?? false

	const stats = useMemo(() => {
		const totalBlogs = blogsList.length
		const totalProjects = (projectsData as any[]).length
		const allTags = new Set<string>()
		blogsList.forEach(b => b.tags?.forEach((t: string) => allTags.add(t)))
		;(projectsData as any[]).forEach(p => p.tags?.forEach((t: string) => allTags.add(t)))
		const totalTags = allTags.size
		return { totalBlogs, totalProjects, totalTags }
	}, [blogsList])

	const handleSaveClick = () => {
		if (process.env.NODE_ENV === 'development' || isAuth) {
			handleSave()
		} else {
			toast.error('未授权，请先在顶部导航栏登录作者账户')
		}
	}

	const handleEnterEditMode = () => {
		setIsEditMode(true)
		setIsPreviewMode(false)
	}

	const handleSave = async () => {
		if (!data.title?.trim() || !data.content?.trim()) {
			toast.error('错误', {
				description: '标题和内容不能为空'
			})
			return
		}

		if (process.env.NODE_ENV === 'development') {
			try {
				setIsSaving(true)
				const jsonContent = JSON.stringify(data, null, '\t')
				const base64Content = btoa(unescape(encodeURIComponent(jsonContent)))

				const newSiteContent = { ...siteContent }
				if (location !== siteContent.bentoConfig?.location) {
					if (newSiteContent.bentoConfig) {
						newSiteContent.bentoConfig.location = location
					}
				}

				await fetch('/api/save-local', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						siteContent: location !== siteContent.bentoConfig?.location ? newSiteContent : undefined,
						files: [{ path: 'src/app/about/list.json', contentBase64: base64Content }]
					})
				})

				setOriginalData({ ...data })
				setIsEditMode(false)
				setIsPreviewMode(false)
				toast.success('本地保存成功', {
					description: '开发环境下内容已直接写入本地文件'
				})
			} catch (error: any) {
				toast.error('本地保存失败', { description: error.message })
			} finally {
				setIsSaving(false)
			}
			return
		}

		if (!isAuth) {
			toast.error('未授权', {
				description: '请先提供正确的 Private Key'
			})
			return
		}

		try {
			setIsSaving(true)
			await pushAbout(data)

			// Save location via /api/save-local
			if (location !== siteContent.bentoConfig?.location) {
				const newSiteContent = { ...siteContent }
				if (newSiteContent.bentoConfig) {
					newSiteContent.bentoConfig.location = location
				}
				await fetch('/api/save-local', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ siteContent: newSiteContent })
				})
			}

			setOriginalData({ ...data })
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('保存成功', {
				description: '内容已提交并同步'
			})
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error('保存失败', {
				description: error.message || '请检查网络连接后重试'
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setData(originalData)
		setIsEditMode(false)
		setIsPreviewMode(false)
	}

	const buttonText = !isAuth ? '验证并保存' : '保存'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault()
				if (isEditMode && !isSaving) {
					handleSaveClick()
				}
			}
			if (e.key === 'Escape' && isEditMode) {
				handleCancel()
			}
		}

		if (isEditMode) {
			window.addEventListener('keydown', handleKeyDown)
			return () => window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode])

	return (
		<>
			<PageTitle title="About" />

			<div className='mx-auto max-w-5xl px-6 pt-32 pb-12 flex flex-col gap-12 max-sm:px-0'>
				{/* 顶部：个人资料 Bento 矩阵 */}
				<ProfileBento isEditMode={isEditMode} onLocationChange={setLocation} locationValue={location} />

				{/* Segmented Tab Switcher */}
				<div className="flex justify-center -mt-4 mb-2 z-10 relative">
					<div className="inline-flex p-1 bg-[var(--color-card)]/80 backdrop-blur-sm border border-[var(--color-border)]/50 rounded-2xl relative shadow-sm">
						{[
							{ id: 'site', label: '📄 关于本站' },
							{ id: 'uses', label: '🛠️ 工具装备' }
						].map(tab => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id as 'site' | 'uses')}
								className={`relative px-6 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
									activeTab === tab.id
										? 'text-[var(--color-brand)] z-10'
										: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
								}`}
							>
								{activeTab === tab.id && (
									<motion.div
										layoutId="about-active-tab"
										className="absolute inset-0 bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm rounded-xl -z-10"
										transition={{ type: 'spring', stiffness: 300, damping: 30 }}
									/>
								)}
								{tab.label}
							</button>
						))}
					</div>
				</div>

				<div className='w-full'>
					{activeTab === 'site' ? (
						isEditMode ? (
							isPreviewMode ? (
								<div className='w-full relative rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)]/50 backdrop-blur-md p-8 shadow-sm'>
									<div className='relative pl-5 border-l-4 border-[var(--color-brand)] mb-8 text-left'>
										<h2 className='text-3xl font-extrabold text-[var(--color-primary)] tracking-tight mb-2'>
											{data.title || '标题预览'}
										</h2>
										<p className='text-[var(--color-secondary)] text-base font-medium opacity-80'>
											{data.description || '描述预览'}
										</p>
									</div>

									{loading ? (
										<div className='text-[var(--color-secondary)] text-center py-12'>预览渲染中...</div>
									) : (
										<div className='prose prose-sm max-w-none dark:prose-invert'>{content}</div>
									)}
								</div>
							) : (
								<div className='w-full relative rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-8 shadow-sm space-y-6'>
									<div className='relative pl-5 border-l-4 border-[var(--color-brand)] space-y-3 mb-6'>
										<input
											type='text'
											placeholder='关于页标题'
											className='w-full text-3xl font-extrabold bg-transparent border-b border-transparent focus:border-[var(--color-border)] outline-none transition-colors pb-1 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)]/40'
											value={data.title}
											onChange={e => setData({ ...data, title: e.target.value })}
										/>
										<input
											type='text'
											placeholder='简短说明描述'
											className='w-full text-base font-medium text-[var(--color-secondary)] bg-transparent border-b border-transparent focus:border-[var(--color-border)] outline-none transition-colors pb-1 placeholder:text-[var(--color-secondary)]/30'
											value={data.description}
											onChange={e => setData({ ...data, description: e.target.value })}
										/>
									</div>

									<div className='w-full'>
										<RichEditor 
											markdown={data.content} 
											onChange={(val) => setData({ ...data, content: val })} 
										/>
									</div>
								</div>
							)
						) : (
							<div className='w-full relative overflow-hidden rounded-3xl border border-[var(--color-border)]/50 bg-gradient-to-br from-[var(--color-card)]/70 to-[var(--color-card)]/30 backdrop-blur-md p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/20 hover:border-[var(--color-brand)]/20 transition-all duration-500'>
								{/* Ambient Glows */}
								<div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--color-brand)]/10 rounded-full blur-[80px] pointer-events-none" />
								<div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[var(--color-brand)]/15 rounded-full blur-[80px] pointer-events-none" />

								{/* Title Section with brand gradient indicator */}
								<motion.div 
									initial={{ opacity: 0, x: -10 }} 
									animate={{ opacity: 1, x: 0 }} 
									transition={{ duration: 0.5 }}
									className='relative pl-5 mb-8 text-left z-10'
								>
									<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-brand)] to-[var(--color-brand)]/30 rounded-full" />
									<h2 className='text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight mb-2 flex items-center gap-2'>
										{data.title}
										<Sparkles className="w-5 h-5 text-[var(--color-brand)] animate-pulse" />
									</h2>
									<p className='text-[var(--color-secondary)] text-sm sm:text-base font-medium opacity-85 max-w-2xl leading-relaxed'>
										{data.description}
									</p>
								</motion.div>

								{/* Dynamic Statistics Grid */}
								<div className="grid grid-cols-3 gap-4 p-4 mb-8 rounded-2xl bg-[var(--color-bg)]/80 border border-[var(--color-border)]/50 text-center relative z-10 backdrop-blur-sm">
									<div>
										<div className="text-2xl sm:text-3xl font-black text-[var(--color-brand)]">{stats.totalBlogs}</div>
										<div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[var(--color-secondary)] mt-0.5">博客文章</div>
									</div>
									<div>
										<div className="text-2xl sm:text-3xl font-black text-[var(--color-brand)]">{stats.totalProjects}</div>
										<div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[var(--color-secondary)] mt-0.5">开源项目</div>
									</div>
									<div>
										<div className="text-2xl sm:text-3xl font-black text-[var(--color-brand)]">{stats.totalTags}</div>
										<div className="text-[10px] sm:text-xs font-semibold tracking-wider text-[var(--color-secondary)] mt-0.5">技术标签</div>
									</div>
								</div>

								{loading ? (
									<div className='text-[var(--color-secondary)] text-center py-12 z-10 relative'>
										<Loader2 className="inline-block size-6 text-[var(--color-brand)] animate-spin" />
										<p className="mt-2 text-xs">加载中...</p>
									</div>
								) : (
									<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='prose prose-sm max-w-none dark:prose-invert prose-headings:text-[var(--color-primary)] prose-a:text-[var(--color-brand)] hover:prose-a:underline z-10 relative'>
										{content}
									</motion.div>
								)}

								{/* Actions Panel inside the Card */}
								<div className='mt-10 pt-6 border-t border-[var(--color-border)]/40 flex items-center justify-between flex-wrap gap-4 z-10 relative'>
									<div className="flex items-center gap-3">
										<span className="text-xs font-semibold text-[var(--color-secondary)] opacity-70">
											项目源码:
										</span>
										<motion.a
											href='https://github.com/lyt04919/Blog-Yute'
											target='_blank'
											rel='noreferrer'
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className='flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-border)]/50 text-[var(--color-secondary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] transition-all shadow-sm'
										>
											<GithubSVG className="w-4 h-4 fill-current" />
											GitHub Repository
										</motion.a>
									</div>

									<LikeButton slug='open-source' delay={0} />
								</div>
							</div>
						)
					) : (
						<motion.div 
							initial={{ opacity: 0, y: 15 }} 
							animate={{ opacity: 1, y: 0 }} 
							transition={{ duration: 0.4 }}
						>
							<UsesBento isEditMode={isEditMode} />
						</motion.div>
					)}
				</div>
			</div>

			<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='fixed right-6 z-40 flex gap-3 max-sm:hidden' style={{ top: '6rem' }}>
				{isEditMode ? (
					<>
						<motion.button
							
							onClick={handleCancel}
							disabled={isSaving}
							className='rounded-xl border bg-[var(--color-bg)] dark:bg-[var(--color-card)]/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button
							
							onClick={() => setIsPreviewMode(prev => !prev)}
							disabled={isSaving}
							className={`rounded-xl border bg-white/60 px-6 py-2 text-sm`}>
							{isPreviewMode ? '继续编辑' : '预览'}
						</motion.button>
						<motion.button   onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && isAuth && (
						<motion.button
							
							onClick={handleEnterEditMode}
							className='rounded-xl border bg-white/60 dark:bg-[var(--color-card)]/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-bg)] dark:hover:bg-[var(--color-card)]/80'>
							编辑
						</motion.button>
					)
				)}
			</motion.div>
		</>
	)
}
