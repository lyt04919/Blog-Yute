'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import LogoUploadDialog, { type LogoItem } from './logo-upload-dialog'
import type { Share } from './share-card'
import { DialogModal } from '@/components/dialog-modal'
import { TagSelector } from '@/components/ui/tag-selector'

const BOOKMARK_TAG_OPTIONS = ['工具', '设计', '开发', 'AI', '灵感', '社区', '资源']

interface CreateDialogProps {
	share: Share | null
	onClose: () => void
	onSave: (share: Share) => void
}

export default function CreateDialog({ share, onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Share>({
		name: '',
		logo: '',
		url: '',
		description: '',
		tags: [],
		stars: 3
	})
	const [showLogoDialog, setShowLogoDialog] = useState(false)
	const [isParsing, setIsParsing] = useState(false)
	const [autoUrl, setAutoUrl] = useState('')

	const handleAutoParse = async (inputUrl?: string | React.MouseEvent) => {
		const targetUrl = typeof inputUrl === 'string' ? inputUrl : autoUrl;
		if (!targetUrl.trim()) {
			toast.error('请输入有效的链接')
			return
		}
		try {
			setIsParsing(true)
			const res = await fetch(`/api/og?url=${encodeURIComponent(targetUrl.trim())}`)
			if (!res.ok) {
				throw new Error('解析失败')
			}
			const data = await res.json()
			if (data.error) {
				throw new Error(data.error)
			}
			
			setFormData(prev => ({
				...prev,
				name: data.title || prev.name,
				description: data.description || data.desc || prev.description,
				logo: data.image || data.logo || prev.logo,
				url: targetUrl || prev.url
			}))
			toast.success('解析成功，已自动填充！')
		} catch (err: any) {
			toast.error(`解析失败: ${err.message || '未知错误'}`)
		} finally {
			setIsParsing(false)
		}
	}

	useEffect(() => {
		if (share) {
			setFormData(share)
		} else {
			setFormData({
				name: '',
				logo: '',
				url: '',
				description: '',
				tags: [],
				stars: 3
			})
		}
	}, [share])

	const handleLogoSubmit = (logo: LogoItem) => {
		const logoUrl = logo.type === 'url' ? logo.url : logo.previewUrl
		setFormData({ ...formData, logo: logoUrl })
	}

	const handleSubmit = () => {
		if (!formData.name.trim() || !formData.logo.trim() || !formData.url.trim() || !formData.description.trim()) {
			toast.error('请填写所有必填项')
			return
		}

		if (formData.tags.length === 0) {
			toast.error('请至少选择一个标签')
			return
		}

		onSave(formData)
		onClose()
		toast.success(share ? '更新成功' : '添加成功')
	}

	return (
		<DialogModal open onClose={onClose} className='card max-h-[90vh] w-sm overflow-y-auto max-w-lg'>
			{/* 卡片样式的内容 */}
			<div className='flex flex-col p-2'>
				{/* URL Auto-parse helper (Hero Action) */}
				<div className='mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-3'>
					<label className='text-[11px] text-purple-600 dark:text-purple-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
						书签链接智能解析
					</label>
					<div className='flex gap-2'>
						<input
							type='url'
							value={autoUrl}
							onChange={e => setAutoUrl(e.target.value)}
							onPaste={e => {
								const pastedText = e.clipboardData.getData('text')
								if (pastedText.startsWith('http')) {
									setAutoUrl(pastedText)
									handleAutoParse(pastedText)
								}
							}}
							placeholder='粘贴网址例如：https://example.com'
							className='flex-1 rounded-lg border border-purple-500/30 bg-white/80 dark:bg-black/40 px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500 transition-colors'
						/>
						<button
							onClick={handleAutoParse}
							disabled={isParsing}
							className='px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1 shadow-sm'
						>
							{isParsing ? '解析中...' : '一键抓取'}
						</button>
					</div>
				</div>

				{/* 顶部图片和基本信息 */}
				<div className='mb-4 flex gap-4'>
					<div className='group relative shrink-0 cursor-pointer' onClick={() => setShowLogoDialog(true)}>
						{formData.logo ? (
							<img src={formData.logo} alt={formData.name} className='h-16 w-16 rounded-xl object-cover border border-gray-200' />
						) : (
							<div className='flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400'>
								<Plus className='h-6 w-6' />
							</div>
						)}
						<div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
							<span className='text-xs text-white'>更换</span>
						</div>
					</div>
					<div className='flex-1 min-w-0'>
						<input
							type='text'
							value={formData.name}
							onChange={e => setFormData({ ...formData, name: e.target.value })}
							placeholder='资源名称'
							className='w-full text-lg font-bold focus:outline-none'
						/>
						<input
							type='url'
							value={formData.url}
							onChange={e => setFormData({ ...formData, url: e.target.value })}
							placeholder='https://example.com'
							className='text-secondary mt-1 w-full truncate text-xs focus:outline-none'
						/>
					</div>
				</div>

				{/* 星级评分 */}
				<div className='flex items-center gap-0.5 mb-3'>
					{[1, 2, 3, 4, 5].map(index => (
						<div key={index} onClick={() => setFormData({ ...formData, stars: index })} className='cursor-pointer'>
							<svg width='16' height='16' viewBox='0 0 24 24' className={index <= formData.stars ? 'fill-yellow-400' : 'fill-gray-300'}>
								<path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
							</svg>
						</div>
					))}
				</div>

				{/* 标签选择器 */}
				<div className='mt-2 mb-3'>
					<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1.5'>选择分类标签</span>
					<TagSelector
						options={BOOKMARK_TAG_OPTIONS}
						selectedTags={formData.tags}
						onChange={tags => setFormData({ ...formData, tags })}
					/>
				</div>

				<textarea
					value={formData.description}
					onChange={e => setFormData({ ...formData, description: e.target.value })}
					placeholder='资源介绍...'
					className='mt-2 w-full resize-none text-sm leading-relaxed focus:outline-none border-t border-gray-100 pt-3'
					rows={4}
				/>
			</div>

			{/* 操作按钮 */}
			<div className='mt-6 flex gap-3'>
				<button onClick={onClose} className='flex-1 rounded-lg border border-gray-300 bg-white dark:bg-[#27272a] px-4 py-2 text-sm transition-colors hover:bg-gray-50'>
					取消
				</button>
				<button onClick={handleSubmit} className='brand-btn flex-1 justify-center px-4'>
					{share ? '保存' : '添加'}
				</button>
			</div>

			{showLogoDialog && <LogoUploadDialog currentLogo={formData.logo} onClose={() => setShowLogoDialog(false)} onSubmit={handleLogoSubmit} />}
		</DialogModal>
	)
}
