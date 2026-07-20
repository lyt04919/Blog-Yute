'use client'

import { useState, useRef } from 'react'
import { X, BookOpen, FileText, ExternalLink, Save, UploadCloud, Sparkles } from 'lucide-react'
import { UniversalEditorShell } from '@/components/ui/universal-editor-shell'
import { TagSelector } from '@/components/ui/tag-selector'

const BOOK_TAG_OPTIONS = ['Tech', 'Design', 'Fiction', 'Biography', '个人成长', '心理学', 'Non-Tech Learning']
import EditableStarRating from '@/components/editable-star-rating'
import { toast } from 'sonner'
import type { Book } from './book-card'

interface BookEditModalProps {
	book: Book
	onClose: () => void
	onSave: (book: Book) => void
}

export default function BookEditModal({ book, onClose, onSave }: BookEditModalProps) {
	const [localBook, setLocalBook] = useState(book)
	const [isUploadingCover, setIsUploadingCover] = useState(false)
	const [isUploadingEpub, setIsUploadingEpub] = useState(false)
	const [isUploadingPdf, setIsUploadingPdf] = useState(false)
	
	// Auto Parse states
	const [autoUrl, setAutoUrl] = useState(book.doubanUrl || '')
	const [isParsing, setIsParsing] = useState(false)

	const coverInputRef = useRef<HTMLInputElement>(null)
	const epubInputRef = useRef<HTMLInputElement>(null)
	const pdfInputRef = useRef<HTMLInputElement>(null)

	const handleFieldChange = (field: keyof Book, value: any) => {
		setLocalBook(prev => ({ ...prev, [field]: value }))
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

	const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setIsUploadingCover(true)
			const url = await handleFileUpload(file, 'images/uploads')
			handleFieldChange('cover', url)
		} catch (err) {
			console.error(err)
		} finally {
			setIsUploadingCover(false)
		}
	}

	const onEpubChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setIsUploadingEpub(true)
			const url = await handleFileUpload(file, 'files/books')
			handleFieldChange('epubUrl', url)
		} catch (err) {
			console.error(err)
		} finally {
			setIsUploadingEpub(false)
		}
	}

	const onPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setIsUploadingPdf(true)
			const url = await handleFileUpload(file, 'files/books')
			handleFieldChange('pdfUrl', url)
		} catch (err) {
			console.error(err)
		} finally {
			setIsUploadingPdf(false)
		}
	}

	const handleAutoParse = async () => {
		if (!autoUrl.trim()) {
			toast.error('请输入有效的链接')
			return
		}
		try {
			setIsParsing(true)
			const res = await fetch(`/api/og?url=${encodeURIComponent(autoUrl.trim())}&type=book`)
			if (!res.ok) throw new Error('解析失败')
			const data = await res.json()
			if (data.error) throw new Error(data.error)
			
			setLocalBook(prev => ({
				...prev,
				name: data.title || prev.name,
				author: data.author || prev.author,
				description: data.description || prev.description,
				cover: data.image || prev.cover,
				doubanUrl: autoUrl || prev.doubanUrl
			}))
			toast.success('书籍元数据提取成功！')
		} catch (err: any) {
			toast.error(`解析失败: ${err.message}`)
		} finally {
			setIsParsing(false)
		}
	}

	return (
		<UniversalEditorShell
			isOpen={true}
			onClose={onClose}
			title="Edit Book"
			description="Manage book details, covers, and reading status"
			icon={<BookOpen className="w-5 h-5" />}
			onSave={() => onSave(localBook)}
			saveText="Update Book"
			maxWidth="max-w-4xl"
		>
			<div className='flex flex-col sm:flex-row gap-6 md:gap-8'>
				{/* Top Left: Cover Image (Uploadable) */}
				<div className='shrink-0 w-[140px] sm:w-[220px] mt-2 flex flex-col gap-4'>
					<input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={onCoverChange} />
					<div 
						className='group relative w-full aspect-[2/3] cursor-pointer rounded-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform hover:scale-[1.02]'
						onClick={() => coverInputRef.current?.click()}
					>
						{localBook.cover ? (
							<img src={localBook.cover} alt="Cover" className='w-full h-full object-cover' referrerPolicy="no-referrer" />
						) : (
							<div className='w-full h-full p-4 flex flex-col items-center justify-center text-slate-400 text-xs text-center gap-2'>
								<UploadCloud className="w-6 h-6"/>
								点击上传封面
							</div>
						)}
						<div className='absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
							<span className='text-white text-sm font-medium flex items-center gap-1.5'>
								<UploadCloud className="w-4 h-4"/> {isUploadingCover ? '上传中...' : '更换封面'}
							</span>
						</div>
					</div>
				</div>

				{/* Right: Form Sections */}
				<div className='flex-1 flex flex-col min-w-0 pr-2 overflow-y-auto custom-scrollbar pb-6'>
					
					{/* HERO ACTION: Auto-Parse */}
					<div className='mb-6 p-4 rounded-2xl flex flex-col gap-3 shrink-0 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20'>
						<label className='text-[11px] text-blue-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
							<Sparkles className='w-3.5 h-3.5 animate-pulse' />
							豆瓣书籍链接 / 智能解析
						</label>
						<div className='flex gap-2'>
							<input
								type='url'
								value={autoUrl}
								onChange={e => setAutoUrl(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAutoParse();
									}
								}}
								placeholder='粘贴书籍介绍页面，例如 https://book.douban.com/...'
								className='flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:font-normal'
								style={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#ffffff' }}
							/>
							<button
								type='button'
								disabled={isParsing}
								onClick={() => handleAutoParse()}
								className='px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 shrink-0'
							>
								{isParsing ? '解析中...' : '提取数据'}
							</button>
						</div>
					</div>

					{/* SECTION 1: Basic Info */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							基础信息 (Basic)
						</h4>
						
						<input
							type='text'
							value={localBook.name}
							onChange={e => handleFieldChange('name', e.target.value)}
							placeholder='书名 (必填)'
							className='w-full text-xl sm:text-2xl font-extrabold leading-tight tracking-tight bg-transparent border-b focus:outline-none transition-colors pb-2 border-slate-200 dark:border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
						/>
						
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
							<div className='flex flex-col gap-1.5'>
								<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>作者</span>
								<input
									type='text'
									value={localBook.author}
									onChange={e => handleFieldChange('author', e.target.value)}
									placeholder='书籍作者'
									className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
								/>
							</div>
							
							<div className='flex flex-col gap-1.5 md:col-span-2'>
								<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>分类标签</span>
								<TagSelector
									options={BOOK_TAG_OPTIONS}
									selectedTags={localBook.tags}
									onChange={tags => handleFieldChange('tags', tags)}
								/>
							</div>
						</div>

						<div className='flex flex-wrap items-center gap-6 mt-2 pt-4 border-t' style={{ borderColor: '#30363D' }}>
							<div className='flex items-center gap-3'>
								<span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">评分</span>
								<EditableStarRating stars={localBook.stars} editable={true} onChange={stars => handleFieldChange('stars', stars)} />
							</div>
							
							<div className='flex items-center gap-3'>
								<span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">状态</span>
								<select
									value={localBook.status || ''}
									onChange={e => handleFieldChange('status', e.target.value || undefined)}
									className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
								>
									<option value="">-- 选择状态 --</option>
									<option value="reading">正在阅读</option>
									<option value="finished">已读</option>
									<option value="wishlist">想读</option>
								</select>
							</div>

							{localBook.status === 'reading' && (
								<div className='flex items-center gap-2'>
									<span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">进度</span>
									<input
										type='number'
										min="0"
										max="100"
										value={localBook.progress || 0}
										onChange={e => handleFieldChange('progress', Number(e.target.value))}
										className='w-16 px-2 py-1.5 rounded-md border text-xs focus:outline-none transition-colors text-center bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
									/>
									<span className="text-[11px] text-slate-500 dark:text-slate-400">%</span>
								</div>
							)}

							<div className="flex flex-wrap items-center gap-2 ml-auto">
								<label className='flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors' style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.3)' }}>
									<input 
										type='checkbox' 
										checked={localBook.isShow || false} 
										onChange={e => {
											const val = e.target.checked
											handleFieldChange('isShow', val)
											if (!val) {
												handleFieldChange('isShowOnHome', false)
											} else {
												handleFieldChange('isShowOnHome', true)
											}
										}}
										className='w-3.5 h-3.5 text-blue-500 rounded focus:ring-blue-500 accent-blue-500'
									/>
									<span className="text-[11px] text-blue-400 font-bold tracking-wider uppercase">公开到 Favorites</span>
								</label>

								{localBook.isShow && (
									<label className='flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors' style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>
										<input 
											type='checkbox' 
											checked={localBook.isShowOnHome !== false} 
											onChange={e => handleFieldChange('isShowOnHome', e.target.checked)}
											className='w-3.5 h-3.5 text-emerald-500 rounded focus:ring-emerald-500 accent-emerald-500'
										/>
										<span className="text-[11px] text-emerald-400 font-bold tracking-wider uppercase">展示到主页</span>
									</label>
								)}
							</div>
						</div>
					</div>

					{/* SECTION 2: Description & Review */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							内容与评价 (Content & Review)
						</h4>
						
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>金句摘抄 / 推荐语</span>
							<textarea
								value={localBook.recommendation || ''}
								onChange={e => handleFieldChange('recommendation', e.target.value)}
								placeholder='写一句极具吸引力的短评...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
								rows={2}
							/>
						</div>

						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>详细介绍</span>
							<textarea
								value={localBook.description}
								onChange={e => handleFieldChange('description', e.target.value)}
								placeholder='书籍的详细简介...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>
						
						<div className='flex flex-col gap-1.5 mt-2'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>读后感 / 个人随想笔记</span>
							<textarea
								rows={3}
								value={localBook.myReview || ''}
								onChange={e => handleFieldChange('myReview', e.target.value)}
								placeholder='撰写您的个人读书心得或私人笔记...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white min-h-[75px]'
							/>
						</div>
					</div>

					{/* SECTION 3: Assets & Links */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-emerald-500 rounded-full'></span>
							书籍资源 (Assets)
						</h4>
						
						<div className='flex flex-col sm:flex-row gap-3'>
							<input type="file" accept=".epub" className="hidden" ref={epubInputRef} onChange={onEpubChange} />
							<button
								onClick={() => epubInputRef.current?.click()}
								className='flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all active:scale-[0.98]'
								style={{ backgroundColor: '#1E293B', color: '#E2E8F0', border: '1px solid #334155' }}
							>
								{isUploadingEpub ? <UploadCloud className="w-4 h-4 animate-bounce" /> : <BookOpen className='w-4 h-4' />}
								<span className='truncate'>{isUploadingEpub ? '上传中...' : localBook.epubUrl ? '重新上传 EPUB' : '上传 EPUB 文件'}</span>
							</button>

							<input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={onPdfChange} />
							<button
								onClick={() => pdfInputRef.current?.click()}
								className='flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all active:scale-[0.98]'
								style={{ backgroundColor: '#1E293B', color: '#E2E8F0', border: '1px solid #334155' }}
							>
								{isUploadingPdf ? <UploadCloud className="w-4 h-4 animate-bounce" /> : <FileText className='w-4 h-4' />}
								<span className='truncate'>{isUploadingPdf ? '上传中...' : localBook.pdfUrl ? '重新上传 PDF' : '上传 PDF 文件'}</span>
							</button>
						</div>

						<div className='flex flex-col gap-1.5 mt-2'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>外部链接</span>
							<input
								type='text'
								value={localBook.doubanUrl || ''}
								onChange={e => handleFieldChange('doubanUrl', e.target.value)}
								placeholder='豆瓣链接...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>
					</div>

					{/* SECTION 4: Notion Recording */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-amber-500 rounded-full'></span>
							个人记录 (Notion Recording)
						</h4>
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>阅读完成/出版记录日期</span>
							<input
								type='date'
								value={localBook.readDate || ''}
								onChange={e => handleFieldChange('readDate', e.target.value)}
								className='w-full md:w-1/2 px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>
					</div>
					
				</div>
			</div>
		</UniversalEditorShell>
	)
}
