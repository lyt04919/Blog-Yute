import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { UploadCloud, Github, Package, Hammer, BookOpen } from 'lucide-react'
import ImageUploadDialog, { type ImageItem } from './image-upload-dialog'
import type { Project } from './project-card'
import { UniversalEditorShell } from '@/components/ui/universal-editor-shell'
import { TagSelector } from '@/components/ui/tag-selector'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { Select } from '@/components/select'

const PROJECT_TAG_OPTIONS = ['React', 'Next.js', 'Vue', 'SVG / 图形', '开源工具', 'Web 应用']

interface CreateDialogProps {
	project: Project | null
	onClose: () => void
	onSave: (project: Project) => void
}

export default function CreateDialog({ project, onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Project>({
		name: '',
		year: new Date().getFullYear(),
		image: '',
		url: '',
		description: '',
		tags: [],
		github: undefined,
		npm: undefined,
		blogSlug: undefined,
		status: undefined,
		featured: false
	})
	const [showImageDialog, setShowImageDialog] = useState(false)
	const [tagsInput, setTagsInput] = useState('')

	const { items: blogsList } = useBlogIndex()
	const [showCustomBlogField, setShowCustomBlogField] = useState(false)

	useEffect(() => {
		if (formData.blogSlug) {
			const matched = blogsList.some(b => b.slug === formData.blogSlug)
			if (!matched) {
				setShowCustomBlogField(true)
			}
		}
	}, [formData.blogSlug, blogsList])

	const blogOptions = [
		{ value: '', label: '无关联博客' },
		...blogsList.map(b => ({ value: b.slug, label: `博客: ${b.title}` })),
		{ value: 'custom_blog', label: '自定义博客 Slug...' }
	]

	const blogSelectValue = formData.blogSlug
		? (blogsList.some(b => b.slug === formData.blogSlug) ? formData.blogSlug : 'custom_blog')
		: (showCustomBlogField ? 'custom_blog' : '')

	const handleBlogSelect = (val: string) => {
		if (val === 'custom_blog') {
			setShowCustomBlogField(true)
			setFormData({ ...formData, blogSlug: '' })
		} else if (val === '') {
			setShowCustomBlogField(false)
			setFormData({ ...formData, blogSlug: undefined })
		} else {
			setShowCustomBlogField(false)
			setFormData({ ...formData, blogSlug: val })
		}
	}

	useEffect(() => {
		if (project) {
			setFormData({ ...project, featured: project.featured || false })
			setTagsInput(project.tags.join(', '))
		} else {
			setFormData({
				name: '',
				year: new Date().getFullYear(),
				image: '',
				url: '',
				description: '',
				tags: [],
				github: undefined,
				npm: undefined,
				blogSlug: undefined,
				status: undefined,
				featured: false
			})
			setTagsInput('')
		}
	}, [project])

	const handleImageSubmit = (image: ImageItem) => {
		const imageUrl = image.type === 'url' ? image.url : image.previewUrl
		setFormData({ ...formData, image: imageUrl })
	}

	const handleTagsChange = (value: string) => {
		setTagsInput(value)
		const tags = value
			.split(',')
			.map(t => t.trim())
			.filter(t => t)
		setFormData({ ...formData, tags })
	}

	const handleSubmit = () => {
		if (!formData.name.trim() || !formData.image.trim() || !formData.url.trim() || !formData.description.trim()) {
			toast.error('请填写所有必填项')
			return
		}

		if (formData.tags.length === 0) {
			toast.error('请至少添加一个标签')
			return
		}

		onSave(formData)
		onClose()
		toast.success(project ? '更新成功' : '添加成功')
	}

	return (
		<>
			<UniversalEditorShell
				isOpen={true}
				onClose={onClose}
				title={project ? 'Edit Project' : 'New Project'}
				description="Manage project details and links"
				icon={<Hammer className="w-5 h-5" />}
				onSave={handleSubmit}
				saveText={project ? 'Update Project' : 'Create Project'}
				maxWidth="max-w-3xl"
			>
				<div className='flex flex-col sm:flex-row gap-8'>
					{/* Top Left: Cover Image (Uploadable) */}
					<div className='shrink-0 w-[140px] sm:w-[200px] mt-2'>
						<div 
							className='group relative w-full aspect-square cursor-pointer rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center'
							onClick={() => setShowImageDialog(true)}
						>
							{formData.image ? (
								<img src={formData.image} alt="Project Logo" className='w-full h-full object-cover' />
							) : (
								<div className='text-slate-400 text-sm font-medium flex flex-col items-center gap-2'>
									<UploadCloud className="w-8 h-8 opacity-50"/>
									点击上传图标
								</div>
							)}
							<div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
								<span className='text-white text-sm font-medium flex items-center gap-1'>
									<UploadCloud className="w-4 h-4"/> 更换图标
								</span>
							</div>
						</div>
					</div>

					{/* Right: Details & Resources */}
					<div className='flex-1 flex flex-col min-w-0 space-y-4'>
						
						<div className="space-y-4">
							<input
								type='text'
								value={formData.name}
								onChange={e => setFormData({ ...formData, name: e.target.value })}
								placeholder='项目名称 (必填)'
								className='w-full text-2xl font-bold bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none transition-colors pb-1 text-slate-900 dark:text-white placeholder:text-slate-400'
							/>
							
							<div className='flex items-center gap-4'>
								<input
									type='number'
									value={formData.year}
									onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
									placeholder='年份'
									className='w-20 text-slate-600 dark:text-slate-300 font-medium text-sm bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none transition-colors pb-1 placeholder:text-slate-400'
								/>
								<input
									type='text'
									value={formData.status || ''}
									onChange={e => setFormData({ ...formData, status: e.target.value || undefined })}
									placeholder='状态 (自定义)'
									className='w-28 text-slate-600 dark:text-slate-300 font-medium text-sm bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none transition-colors pb-1 placeholder:text-slate-400'
								/>
								<input
									type='url'
									value={formData.url}
									onChange={e => setFormData({ ...formData, url: e.target.value })}
									placeholder='主页 URL (必填)'
									className='flex-1 text-slate-600 dark:text-slate-300 font-medium text-sm bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none transition-colors pb-1 placeholder:text-slate-400'
								/>
							</div>

							<div className='flex items-center justify-between gap-2 pt-1'>
								<label className='inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none'>
									<input
										type='checkbox'
										checked={formData.featured || false}
										onChange={e => setFormData({ ...formData, featured: e.target.checked })}
										className='rounded accent-blue-600 dark:accent-blue-500 w-3.5 h-3.5'
									/>
									<span>精选项目 (Bento 宽卡片优先展示)</span>
								</label>
							</div>

							<div>
								<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1.5'>项目技术栈标签</span>
								<TagSelector
									options={PROJECT_TAG_OPTIONS}
									selectedTags={formData.tags}
									onChange={tags => setFormData({ ...formData, tags })}
								/>
							</div>
						</div>

						<div className='flex flex-col gap-4 mt-2'>
							<textarea
								value={formData.description}
								onChange={e => setFormData({ ...formData, description: e.target.value })}
								placeholder='详细项目介绍 (必填)...'
								className='w-full text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-400 transition-colors resize-none min-h-[120px] placeholder:text-slate-400'
							/>

							<div className='space-y-3'>
								<div className='relative flex items-center'>
									<div className='absolute text-slate-400 left-3'><Github className="w-4 h-4"/></div>
									<input
										type='url'
										value={formData.github || ''}
										onChange={e => setFormData({ ...formData, github: e.target.value || undefined })}
										placeholder='GitHub URL (可选)'
										className='w-full py-2.5 pl-10 pr-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm rounded-xl font-medium transition-all border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-400 placeholder:text-slate-400'
									/>
								</div>
								<div className='relative flex items-center'>
									<div className='absolute text-slate-400 left-3'><Package className="w-4 h-4"/></div>
									<input
										type='url'
										value={formData.npm || ''}
										onChange={e => setFormData({ ...formData, npm: e.target.value || undefined })}
										placeholder='NPM URL (可选)'
										className='w-full py-2.5 pl-10 pr-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm rounded-xl font-medium transition-all border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-400 placeholder:text-slate-400'
									/>
								</div>
								<div className='relative flex items-center z-50'>
									<div className='absolute text-slate-400 left-3'><BookOpen className="w-4 h-4"/></div>
									<div className='w-full pl-10'>
										<Select
											value={blogSelectValue}
											onChange={handleBlogSelect}
											options={blogOptions}
											className='w-full text-sm'
										/>
									</div>
								</div>
								{showCustomBlogField && (
									<div className='relative flex items-center'>
										<div className='absolute text-slate-400 left-3'><BookOpen className="w-4 h-4"/></div>
										<input
											type='text'
											value={formData.blogSlug || ''}
											onChange={e => setFormData({ ...formData, blogSlug: e.target.value || undefined })}
											placeholder='自定义关联博客 Slug (如: my-awesome-post)'
											className='w-full py-2.5 pl-10 pr-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm rounded-xl font-medium transition-all border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-400 placeholder:text-slate-400'
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</UniversalEditorShell>

			{showImageDialog && (
				<ImageUploadDialog
					currentImage={formData.image}
					onClose={() => setShowImageDialog(false)}
					onSubmit={(image) => {
						handleImageSubmit(image)
						setShowImageDialog(false)
					}}
				/>
			)}
		</>
	)
}
