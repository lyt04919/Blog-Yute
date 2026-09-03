'use client'
import { PageTitle } from '@/components/page-title'
import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { ProjectCard, type Project } from './components/project-card'
import dynamic from 'next/dynamic'
import ScrollStack, { ScrollStackItem } from '@/components/ui/scroll-stack'
const CreateDialog = dynamic(() => import('./components/create-dialog'), { ssr: false })
const ProjectPreviewModal = dynamic(() => import('./components/project-preview-modal'), { ssr: false })
import { pushProjects } from './services/push-projects'
import { saveProjectsLocal } from './services/save-projects-local'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialList from '@/data/projects.json'
import type { ImageItem } from './components/image-upload-dialog'
import { StandardPageHeader } from '@/components/ui/standard-page-header'
import { StandardToolbar } from '@/components/ui/standard-toolbar'

function getProjectCategory(p: Project): string {
	if (p.category) return p.category
	if (p.tags?.some(t => t.toLowerCase() === 'web 应用' || t.toLowerCase() === 'web app')) return 'Web 应用'
	if (p.tags?.some(t => t.toLowerCase() === '开源工具' || t.toLowerCase() === 'tool') || p.npm) return '开源工具'
	return 'Web 应用'
}

export default function Page() {
	const [projects, setProjects] = useState<Project[]>(initialList as Project[])
	const [originalProjects, setOriginalProjects] = useState<Project[]>(initialList as Project[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editingProject, setEditingProject] = useState<Project | null>(null)
	const [previewProject, setPreviewProject] = useState<Project | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())

	// Search, Category & Cascading Tag filter states
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [selectedTag, setSelectedTag] = useState('all')
	const [viewMode, setViewMode] = useState<'grid' | 'stack'>('grid')

	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search)
			const search = params.get('search')
			if (search) {
				setSearchTerm(search)
			}
		}
	}, [])

	const handleUpdate = (updatedProject: Project, oldProject: Project, imageItem?: ImageItem) => {
		setProjects(prev => prev.map(p => (p.url === oldProject.url ? updatedProject : p)))
		if (imageItem) {
			setImageItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedProject.url, imageItem)
				return newMap
			})
		}
	}

	const handleAdd = () => {
		setEditingProject(null)
		setIsCreateDialogOpen(true)
	}

	const handleSaveProject = (updatedProject: Project) => {
		if (editingProject) {
			setProjects(prev => prev.map(p => (p.url === editingProject.url ? updatedProject : p)))
		} else {
			setProjects(prev => [...prev, updatedProject])
		}
	}

	const handleDelete = (project: Project) => {
		setProjects(prev => prev.filter(p => p.url !== project.url))
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			toast.error('未授权，请先在顶部导航栏登录作者账户')
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushProjects({
				projects,
				imageItems
			})
			setOriginalProjects(projects)
			setImageItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleLocalSave = async () => {
		setIsSaving(true)
		try {
			await saveProjectsLocal({
				projects,
				imageItems
			})
			setOriginalProjects(projects)
			setImageItems(new Map())
			setIsEditMode(false)
		} catch (error: any) {
			console.error('Failed to save locally:', error)
			toast.error(`本地保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setProjects(originalProjects)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	const buttonText = '保存'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isAuth && !isEditMode && (e.ctrlKey || e.metaKey) && e.key === 'e' && e.shiftKey) {
				e.preventDefault()
				setIsEditMode(true)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode, isAuth])

	// Level 1: Category Tabs (形态大类)
	const categoryTabs = useMemo(() => {
		const webCount = projects.filter(p => getProjectCategory(p) === 'Web 应用').length
		const toolCount = projects.filter(p => getProjectCategory(p) === '开源工具').length
		const labCount = projects.filter(p => getProjectCategory(p) === '创意实验').length

		const tabs = [
			{ label: '全部', value: 'all', count: projects.length },
			{ label: '🌐 Web 应用', value: 'Web 应用', count: webCount },
			{ label: '🛠️ 开源工具', value: '开源工具', count: toolCount }
		]

		if (labCount > 0) {
			tabs.push({ label: '🎨 创意实验', value: '创意实验', count: labCount })
		}

		return tabs
	}, [projects])

	const handleSelectCategory = (cat: string) => {
		setSelectedCategory(cat)
		setSelectedTag('all')
	}

	// Level 2: Cascading Dynamic Tags (根据所选大类智能联动的技术标签)
	const cascadingToolbarTags = useMemo(() => {
		const categoryProjects = projects.filter(
			p => selectedCategory === 'all' || getProjectCategory(p) === selectedCategory
		)

		const counts: Record<string, number> = {}
		categoryProjects.forEach((p) => {
			p.tags?.forEach((t) => {
				if (t === 'Web 应用' || t === '开源工具' || t === '创意实验') return
				counts[t] = (counts[t] || 0) + 1
			})
		})

		const dynamicTags = Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.map(([cat, count]) => ({
				label: cat,
				value: cat,
				count
			}))

		return [{ label: '全部标签', value: 'all', count: categoryProjects.length }, ...dynamicTags]
	}, [projects, selectedCategory])

	// Filtered project stream
	const filteredProjects = useMemo(() => {
		const query = searchTerm.trim().toLowerCase()
		return projects.filter(p => {
			const projectCat = getProjectCategory(p)
			const matchesCategory =
				selectedCategory === 'all' || projectCat === selectedCategory
			const matchesTag =
				selectedTag === 'all' ||
				p.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase())
			const matchesSearch =
				!query ||
				p.name.toLowerCase().includes(query) ||
				p.description.toLowerCase().includes(query) ||
				p.tags?.some(t => t.toLowerCase().includes(query)) ||
				projectCat.toLowerCase().includes(query)

			return matchesCategory && matchesTag && matchesSearch
		})
	}, [projects, selectedCategory, selectedTag, searchTerm])

	const headerActions = (
		<div className="flex items-center gap-2">
			{isEditMode ? (
				<>
					<button
						onClick={handleCancel}
						disabled={isSaving}
						className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'
					>
						取消
					</button>
					<button
						onClick={handleAdd}
						className='px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors'
					>
						+ 添加项目
					</button>
					{process.env.NODE_ENV === 'development' && (
						<button
							onClick={handleLocalSave}
							disabled={isSaving}
							className='px-4 py-2 text-xs font-medium rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors shadow-sm'
						>
							本地保存
						</button>
					)}
					<button
						onClick={handleSaveClick}
						disabled={isSaving}
						className='px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm'
					>
						{isSaving ? '保存中...' : buttonText}
					</button>
				</>
			) : (
				!hideEditButton && isAuth && (
					<button
						onClick={() => setIsEditMode(true)}
						className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
					>
						编辑模式
					</button>
				)
			)}
		</div>
	)

	const viewModeToggle = (
		<div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold shrink-0 border border-slate-200 dark:border-slate-700/60">
			<button
				type="button"
				onClick={() => setViewMode('grid')}
				className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
					viewMode === 'grid'
						? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
						: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
				}`}
			>
				网格 (Grid)
			</button>
			<button
				type="button"
				onClick={() => setViewMode('stack')}
				className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
					viewMode === 'stack'
						? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
						: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
				}`}
			>
				堆叠 (Stack)
			</button>
		</div>
	)

	return (
		<>
			<PageTitle title="Projects" />

			{/* Extra bottom padding (pb-48 md:pb-56) ensures content is never obscured by the bottom Dock */}
			<div className='min-h-screen relative pb-48 md:pb-56'>
				<StandardPageHeader
					title="Projects"
					badge={`${projects.length} ITEMS`}
					subtitle="A collection of things I've built and experimented with."
					actions={headerActions}
				/>

				{/* Two-level Toolbar: Status/Category Tabs + Cascading Tech Stack Tags */}
				<StandardToolbar
					statusTabs={categoryTabs}
					selectedStatus={selectedCategory}
					onSelectStatus={handleSelectCategory}
					tags={cascadingToolbarTags}
					selectedTag={selectedTag}
					onSelectTag={setSelectedTag}
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					searchPlaceholder="搜索项目名称、技术栈或特性..."
					extraRightActions={viewModeToggle}
				/>

				<div className='mx-auto w-full max-w-7xl px-6'>
					{filteredProjects.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-20 text-slate-400 gap-3'>
							<p className='text-base font-medium'>暂无匹配项目</p>
							{(searchTerm || selectedTag !== 'all' || selectedCategory !== 'all') && (
								<button
									type="button"
									onClick={() => {
										setSearchTerm('')
										setSelectedCategory('all')
										setSelectedTag('all')
									}}
									className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
								>
									重置所有筛选
								</button>
							)}
						</div>
					) : viewMode === 'stack' ? (
						<div className="w-full relative py-6">
							<ScrollStack useWindowScroll={true} itemDistance={60} baseScale={0.92} itemScale={0.02}>
								{filteredProjects.map((project) => (
									<ScrollStackItem key={project.url}>
										<ProjectCard
											project={project}
											isEditMode={isEditMode}
											onPreview={setPreviewProject}
											onTagClick={(tag) => setSelectedTag(tag)}
											onUpdate={handleUpdate}
											onDelete={() => handleDelete(project)}
										/>
									</ScrollStackItem>
								))}
							</ScrollStack>
						</div>
					) : (
						<div className='grid w-full grid-cols-1 md:grid-cols-2 gap-6'>
							{filteredProjects.map((project) => {
								const isFeatured =
									Boolean(project.featured) &&
									selectedTag === 'all' &&
									selectedCategory === 'all' &&
									!searchTerm
								return (
									<ProjectCard
										key={project.url}
										project={project}
										isFeatured={isFeatured}
										isEditMode={isEditMode}
										onPreview={setPreviewProject}
										onTagClick={(tag) => setSelectedTag(tag)}
										onUpdate={handleUpdate}
										onDelete={() => handleDelete(project)}
									/>
								)
							})}
						</div>
					)}
				</div>
			</div>

			{isCreateDialogOpen && (
				<CreateDialog
					project={editingProject}
					onClose={() => setIsCreateDialogOpen(false)}
					onSave={handleSaveProject}
				/>
			)}

			{previewProject && (
				<ProjectPreviewModal
					project={previewProject}
					onClose={() => setPreviewProject(null)}
				/>
			)}
		</>
	)
}
