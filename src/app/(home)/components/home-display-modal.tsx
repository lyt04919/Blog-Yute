'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import { useConfigStore } from '../stores/config-store'
import { pushSiteContent } from '../services/push-site-content'
import type { SiteContent } from '../stores/config-store'
import { Settings } from 'lucide-react'

import projectsData from '@/data/projects.json'
import blogIndex from '@/../public/blogs/index.json'

export function HomeDisplayModal() {
	const { siteContent, setSiteContent, cardStyles, homeDisplayModalOpen, setHomeDisplayModalOpen, regenerateBubbles } = useConfigStore()
	const [formData, setFormData] = useState<SiteContent>(siteContent)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (homeDisplayModalOpen) {
			setFormData({ ...siteContent })
		}
	}, [homeDisplayModalOpen, siteContent])

	const allProjects = projectsData.map(p => p.name)
	const allBlogs = (blogIndex as { slug: string; title: string; hidden?: boolean; status?: string }[]).filter(
		p => !p.hidden && p.status !== 'draft'
	)

	const toggleProject = (projectName: string) => {
		const current = formData.featuredProjects || []
		const updated = current.includes(projectName)
			? current.filter(n => n !== projectName)
			: [...current, projectName]
		setFormData({ ...formData, featuredProjects: updated })
	}

	const toggleBlog = (blogSlug: string) => {
		const current = formData.featuredBlogs || []
		const updated = current.includes(blogSlug)
			? current.filter(s => s !== blogSlug)
			: [...current, blogSlug]
		setFormData({ ...formData, featuredBlogs: updated })
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushSiteContent(formData, cardStyles)
			setSiteContent(formData)
			regenerateBubbles()
			setHomeDisplayModalOpen(false)
			toast.success('首页展示配置保存成功')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<DialogModal 
			open={homeDisplayModalOpen} 
			onClose={() => setHomeDisplayModalOpen(false)} 
			className='card scrollbar-none max-h-[90vh] min-h-[400px] w-[540px] overflow-y-auto p-6 flex flex-col gap-4 rounded-3xl'
		>
			<div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
				<h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
					<Settings className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
					主页内容展示管理
				</h3>
			</div>

			<div className='flex-1 space-y-6 mt-2'>
				<div>
					<label className='mb-3 block text-sm font-bold text-slate-700 dark:text-zinc-300'>✨ 首页代表作展示点选</label>
					<div className='grid grid-cols-2 gap-2.5'>
						{allProjects.map(projectName => (
							<label key={projectName} className='flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-600 transition-colors'>
								<input
									type='checkbox'
									checked={(formData.featuredProjects || []).includes(projectName)}
									onChange={() => toggleProject(projectName)}
									className='accent-brand h-4 w-4 rounded shrink-0'
								/>
								<span className='text-xs truncate font-medium text-slate-700 dark:text-zinc-200' title={projectName}>{projectName}</span>
							</label>
						))}
					</div>
				</div>

				<div>
					<label className='mb-3 block text-sm font-bold text-slate-700 dark:text-zinc-300'>📰 首页 Blog 展示点选（置空则默认展示最新）</label>
					<div className='grid grid-cols-2 gap-2.5'>
						{allBlogs.map(blog => (
							<label key={blog.slug} className='flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-600 transition-colors'>
								<input
									type='checkbox'
									checked={(formData.featuredBlogs || []).includes(blog.slug)}
									onChange={() => toggleBlog(blog.slug)}
									className='accent-brand h-4 w-4 rounded shrink-0'
								/>
								<span className='text-xs truncate font-medium text-slate-700 dark:text-zinc-200' title={blog.title}>{blog.title}</span>
							</label>
						))}
					</div>
				</div>
			</div>

			<div className="flex justify-end gap-3 pt-3 mt-4 border-t border-slate-100 dark:border-zinc-800">
				<button 
					onClick={() => setHomeDisplayModalOpen(false)}
					disabled={isSaving}
					className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
				>
					取消
				</button>
				<button 
					onClick={handleSave}
					disabled={isSaving}
					className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
				>
					{isSaving ? '保存中...' : '保存更改并同步'}
				</button>
			</div>
		</DialogModal>
	)
}
