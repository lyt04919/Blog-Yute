'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Bookmark } from 'lucide-react'
import { TagSelector } from '@/components/ui/tag-selector'
import { UniversalEditorShell } from '@/components/ui/universal-editor-shell'

const BOOKMARK_TAG_OPTIONS = ['工具', '设计', '开发', 'AI', '灵感', '社区', '资源']
import EditableStarRating from '@/components/editable-star-rating'
import { toast } from 'sonner'
import type { Share } from './share-card'

interface ShareEditModalProps {
	share: Share
	onClose: () => void
	onSave: (share: Share) => void
}

export default function ShareEditModal({ share, onClose, onSave }: ShareEditModalProps) {
	const [localShare, setLocalShare] = useState(share)
	const [isUploadingLogo, setIsUploadingLogo] = useState(false)
	
	const logoInputRef = useRef<HTMLInputElement>(null)

	const handleFieldChange = (field: keyof Share, value: any) => {
		setLocalShare(prev => ({ ...prev, [field]: value }))
	}

	const handleTagsChange = (tagsStr: string) => {
		const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t)
		handleFieldChange('tags', tags)
	}

	const handleFileUpload = async (file: File, folder: string) => {
		const formData = new FormData()
		formData.append('file', file)
		formData.append('folder', folder)
		const res = await fetch('/api/upload', { method: 'POST', body: formData })
		if (!res.ok) throw new Error('Upload failed')
		const data = await res.json()
		return data.url
	}

	const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setIsUploadingLogo(true)
			const url = await handleFileUpload(file, 'images/uploads')
			handleFieldChange('logo', url)
		} catch (err) {
			console.error(err)
			toast.error('上传失败')
		} finally {
			setIsUploadingLogo(false)
		}
	}

	return (
		<UniversalEditorShell
			isOpen={true}
			onClose={onClose}
			title="Edit Bookmark"
			description="Manage site metadata and recommendation details"
			icon={<Bookmark className="w-5 h-5" />}
			onSave={() => onSave(localShare)}
			saveText="Update Bookmark"
			maxWidth="max-w-4xl"
		>
			<div className='flex flex-col sm:flex-row gap-6 md:gap-8'>
				{/* Top Left: Logo Image (Uploadable) */}
				<div className='shrink-0 w-[140px] sm:w-[220px] mt-2 flex flex-col gap-4'>
					<input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={onLogoChange} />
					<div 
						className='group relative w-full aspect-square cursor-pointer rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform hover:scale-[1.02]'
						onClick={() => logoInputRef.current?.click()}
					>
						{localShare.logo ? (
							<img src={localShare.logo} alt="Logo" className='w-full h-full object-cover' />
						) : (
							<div className='w-full h-full p-4 flex flex-col items-center justify-center text-slate-400 text-xs text-center gap-2'>
								<UploadCloud className="w-6 h-6"/>
								点击上传Logo
							</div>
						)}
						<div className='absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
							<span className='text-white text-sm font-medium flex items-center gap-1.5'>
								<UploadCloud className="w-4 h-4"/> {isUploadingLogo ? '上传中...' : '更换Logo'}
							</span>
						</div>
					</div>
				</div>

				{/* Right: Form Sections */}
				<div className='flex-1 flex flex-col min-w-0 pr-2 overflow-y-auto custom-scrollbar pb-6'>
					
					{/* SECTION 1: Basic Info */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							基础信息 (Basic)
						</h4>
						
						<input
							type='text'
							value={localShare.name}
							onChange={e => handleFieldChange('name', e.target.value)}
							placeholder='网站名称 (必填)'
							className='w-full text-xl sm:text-2xl font-extrabold leading-tight tracking-tight bg-transparent border-b focus:outline-none transition-colors pb-2 border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
						/>
						
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>网站链接</span>
							<input
								type='url'
								value={localShare.url}
								onChange={e => handleFieldChange('url', e.target.value)}
								placeholder='例如：https://example.com'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>

						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>分类标签</span>
							<TagSelector
								options={BOOKMARK_TAG_OPTIONS}
								selectedTags={localShare.tags}
								onChange={tags => handleFieldChange('tags', tags)}
							/>
						</div>

						<div className='flex flex-wrap items-center gap-6 mt-2 pt-4 border-t border-slate-200 dark:border-[#30363D]'>
							<div className='flex items-center gap-3'>
								<span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">推荐评分</span>
								<EditableStarRating stars={localShare.stars} editable={true} onChange={stars => handleFieldChange('stars', stars)} />
							</div>

							<label className='flex items-center gap-2 cursor-pointer ml-auto px-3 py-1.5 rounded-md border transition-colors' style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.3)' }}>
								<input 
									type='checkbox' 
									checked={localShare.isShow || false} 
									onChange={e => handleFieldChange('isShow', e.target.checked)}
									className='w-3.5 h-3.5 text-blue-500 rounded focus:ring-blue-500 accent-blue-500'
								/>
								<span className="text-[11px] text-blue-400 font-bold tracking-wider uppercase">展示到主页</span>
							</label>
						</div>
					</div>

					{/* SECTION 2: Description */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							网站简介 (Description)
						</h4>
						
						<div className='flex flex-col gap-1.5'>
							<textarea
								value={localShare.description}
								onChange={e => handleFieldChange('description', e.target.value)}
								placeholder='描述一下这个网站为什么值得推荐...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>
					</div>

				</div>
			</div>
		</UniversalEditorShell>
	)
}
