'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { X, Image as ImageIcon, MapPin, Tag as TagIcon, Smile, CloudSun, Sparkles, Send, BookOpen } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { Diary } from '@/types/diary'
import dayjs from 'dayjs'
import { MOOD_LIST, WEATHER_LIST, TEMPLATES, calculateReadingStats } from '../constants/meta'

interface CreateDialogProps {
	diary?: Diary | null
	onClose: () => void
	onSave: (diary: Diary) => void
}

export default function CreateDialog({ diary, onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Diary>({
		id: diary?.id || Date.now().toString(),
		date: dayjs(diary?.date || undefined).format('YYYY-MM-DD'),
		content: diary?.content || '',
		image: diary?.image || '',
		media: diary?.media || (diary?.image ? [diary.image] : []),
		mood: diary?.mood || '',
		weather: diary?.weather || '',
		tags: diary?.tags || [],
		location: diary?.location || ''
	})

	const [isUploadingImage, setIsUploadingImage] = useState(false)
	const [activePopover, setActivePopover] = useState<'mood' | 'weather' | 'location' | 'tag' | null>(null)
	const [tagInput, setTagInput] = useState('')
	const [isFocused, setIsFocused] = useState(false)
	const [isDragging, setIsDragging] = useState(false)

	const imageInputRef = useRef<HTMLInputElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (diary) {
			setFormData({
				...diary,
				date: dayjs(diary.date).format('YYYY-MM-DD'),
				media: diary.media || (diary.image ? [diary.image] : [])
			})
		} else {
			setFormData({
				id: Date.now().toString(),
				date: dayjs().format('YYYY-MM-DD'),
				content: '',
				media: [],
				mood: '',
				weather: '',
				tags: [],
				location: ''
			})
		}
	}, [diary])

	const handleFieldChange = (field: keyof Diary, value: unknown) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	const handleFileUpload = async (file: File, folder: string) => {
		const uploadFormData = new FormData()
		uploadFormData.append('file', file)
		uploadFormData.append('folder', folder)
		const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData })
		if (!res.ok) throw new Error('Upload failed')
		const data = await res.json()
		return data.url
	}

	const uploadFiles = async (files: File[]) => {
		try {
			setIsUploadingImage(true)
			const newMedia = [...(formData.media || [])]
			
			for (let i = 0; i < files.length; i++) {
				if (newMedia.length >= 15) {
					toast.error('最多只能上传15张图片/视频')
					break
				}
				const url = await handleFileUpload(files[i], 'images/uploads')
				newMedia.push(url)
			}
			
			handleFieldChange('media', newMedia)
		} catch (err) {
			console.error(err)
			toast.error('上传失败')
		} finally {
			setIsUploadingImage(false)
			if (imageInputRef.current) imageInputRef.current.value = ''
		}
	}

	const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return
		await uploadFiles(Array.from(files))
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
		const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
		if (files.length > 0) {
			await uploadFiles(files)
		} else {
			toast.error('不支持的文件类型')
		}
	}

	const removeMedia = (index: number) => {
		const newMedia = [...(formData.media || [])]
		newMedia.splice(index, 1)
		handleFieldChange('media', newMedia)
	}

	const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && tagInput.trim()) {
			e.preventDefault()
			const val = tagInput.trim()
			if (!formData.tags?.includes(val)) {
				handleFieldChange('tags', [...(formData.tags || []), val])
			}
			setTagInput('')
		}
	}

	const removeTag = (tagToRemove: string) => {
		handleFieldChange('tags', formData.tags?.filter(t => t !== tagToRemove))
	}

	const handleSubmit = () => {
		if (!formData.content.trim() || !formData.date.trim()) {
			toast.error('请填写日期和正文内容')
			return
		}
		onSave({
			...formData,
			image: formData.media?.[0] || ''
		})
		onClose()
		toast.success(diary ? '更新成功' : '发布成功')
	}

	const selectedMood = MOOD_LIST.find(m => m.label === formData.mood)
	const selectedWeather = WEATHER_LIST.find(w => w.label === formData.weather)
	const { wordCount, readingTime } = calculateReadingStats(formData.content)

	const ToolbarButton = ({ 
		icon, 
		label, 
		active, 
		onClick, 
		hasValue 
	}: { 
		icon: React.ReactElement<{ className?: string }>
		label: string
		active?: boolean
		onClick: () => void
		hasValue?: boolean 
	}) => (
		<button 
			type="button"
			onClick={onClick} 
			className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium transition-all ${
				active 
					? 'bg-neutral-900 text-white shadow-md dark:bg-white dark:text-neutral-900' 
					: hasValue 
						? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
						: 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
			}`}
		>
			{React.cloneElement(icon, { 
				className: `w-4 h-4 ${active ? 'text-white/90 dark:text-neutral-900' : hasValue ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}` 
			})}
			<span className="max-sm:hidden">{label}</span>
		</button>
	)

	return (
		<DialogModal open onClose={onClose} className="card max-w-3xl w-full h-[85vh] p-0 relative flex flex-col shadow-2xl overflow-hidden rounded-3xl bg-white dark:bg-[#1e1e21] border border-black/5 dark:border-white/10">
			{/* Drop Zone Layer */}
			<div 
				className="absolute inset-0 z-0 pointer-events-auto"
				onDragOver={handleDragOver} 
				onDragLeave={handleDragLeave} 
				onDrop={handleDrop}
			/>

			{/* Top Bar */}
			<motion.div className={`shrink-0 flex items-center justify-between px-6 md:px-8 py-5 border-b border-neutral-100 dark:border-neutral-800/80 transition-opacity duration-500 z-20 ${isFocused && formData.content.length > 50 ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
				<div className='flex flex-wrap items-center gap-3'>
					<input
						type='date'
						value={formData.date}
						onChange={e => handleFieldChange('date', e.target.value)}
						className='font-bold text-lg md:text-xl text-[var(--color-primary)] focus:outline-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity shrink-0'
					/>
					
					{/* Stats Badge */}
					{wordCount > 0 && (
						<span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
							<BookOpen className="w-3 h-3" />
							{wordCount} 字 · {readingTime} 分钟
						</span>
					)}

					{(formData.location || (formData.tags && formData.tags.length > 0)) && <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1 hidden sm:block" />}
					
					{formData.location && (
						<span className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
							<MapPin className="w-3.5 h-3.5 text-neutral-400" /> {formData.location}
						</span>
					)}
					{formData.tags?.map(tag => (
						<span key={tag} className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
							<TagIcon className="w-3.5 h-3.5 text-neutral-400" /> {tag}
						</span>
					))}
				</div>
				<button onClick={onClose} className='p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors bg-neutral-100 dark:bg-neutral-800 rounded-full'>
					<X className='w-5 h-5' />
				</button>
			</motion.div>

			{/* Scrollable Content Area */}
			<div className='flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 py-6 pb-32 flex flex-col z-10'>
				<div className="relative flex-1 flex flex-col min-h-[300px]">
					<textarea
						ref={textareaRef}
						value={formData.content}
						onChange={e => handleFieldChange('content', e.target.value)}
						onClick={() => setActivePopover(null)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						placeholder='记录今天的想法与故事，支持 Markdown 与短篇长文...'
						className='w-full flex-1 text-[16px] md:text-[17px] text-[var(--color-primary)] leading-relaxed font-light bg-transparent focus:outline-none resize-none z-10 relative placeholder:text-neutral-400'
					/>
					
					{/* Ghost Templates for inspiration */}
					{formData.content === '' && !diary && (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="absolute bottom-4 left-0 flex flex-wrap items-center gap-2.5 z-20">
							<span className="text-neutral-400 text-xs flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500"/> 灵感模板：</span>
							{TEMPLATES.slice(1).map(t => (
								<button 
									key={t.name}
									type="button"
									onClick={() => { 
										handleFieldChange('content', t.content)
										setTimeout(() => textareaRef.current?.focus(), 50) 
									}}
									className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-medium transition-all shadow-xs"
								>
									{t.name}
								</button>
							))}
						</motion.div>
					)}
				</div>

				{/* Image Grid */}
				{(formData.media && formData.media.length > 0) && (
					<div className='mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800'>
						<div className='flex flex-wrap gap-3'>
							{formData.media.map((url, i) => (
								<div key={i} className='relative group w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-xs'>
									{url.endsWith('.mp4') || url.endsWith('.webm') ? (
										<video src={url} className='w-full h-full object-cover bg-neutral-100 dark:bg-neutral-800' />
									) : (
										<img src={url} alt={`Media ${i + 1}`} className='w-full h-full object-cover bg-neutral-100 dark:bg-neutral-800' />
									)}
									<button 
										type="button"
										onClick={(e) => { e.stopPropagation(); removeMedia(i) }} 
										className='absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110 shadow-sm'
									>
										<X className='w-3.5 h-3.5' />
									</button>
								</div>
							))}
							
							{formData.media.length < 15 && (
								<button 
									type="button"
									onClick={() => imageInputRef.current?.click()}
									className='flex flex-col items-center justify-center w-28 h-28 md:w-32 md:h-32 text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-2xl font-medium border border-dashed border-neutral-200 dark:border-neutral-700'
								>
									{isUploadingImage ? (
										<span className='text-xs animate-pulse text-brand'>上传中...</span>
									) : (
										<>
											<ImageIcon className='w-6 h-6 mb-1.5 opacity-50' />
											<span className='text-xs'>添加媒体</span>
										</>
									)}
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Drag Overlay */}
			<AnimatePresence>
				{isDragging && (
					<motion.div 
						initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
						className="absolute inset-0 z-[100] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-4 border-dashed border-brand/50 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
					>
						<div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-full shadow-xl flex items-center justify-center mb-4">
							<ImageIcon className="w-8 h-8 text-brand" />
						</div>
						<h3 className="text-xl font-bold text-[var(--color-primary)]">松开鼠标添加媒体文件</h3>
						<p className="text-neutral-500 mt-1 text-sm font-medium">支持图片与视频，最多15个文件</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Floating Bottom Toolbar */}
			<div 
				className={`absolute z-50 transition-opacity duration-500 ${isFocused && formData.content.length > 50 && !activePopover ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}
				style={{ bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)' }}
			>
				{/* Popovers */}
				<AnimatePresence>
					{activePopover && (
						<motion.div 
							initial={{ opacity: 0, y: 10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 bg-white dark:bg-[#27272a] p-3.5 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 origin-bottom"
						>
							{activePopover === 'mood' && (
								<div className="grid grid-cols-4 gap-1.5">
									{MOOD_LIST.map(m => (
										<button 
											key={m.label} 
											type="button"
											onClick={() => { 
												handleFieldChange('mood', formData.mood === m.label ? '' : m.label)
												setActivePopover(null) 
											}} 
											className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
												formData.mood === m.label 
													? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900' 
													: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
											}`}
										>
											<span className="text-xl mb-0.5">{m.emoji}</span>
											<span className="text-[10px] font-medium">{m.label}</span>
										</button>
									))}
								</div>
							)}

							{activePopover === 'weather' && (
								<div className="grid grid-cols-4 gap-1.5">
									{WEATHER_LIST.map(w => (
										<button 
											key={w.label} 
											type="button"
											onClick={() => { 
												handleFieldChange('weather', formData.weather === w.label ? '' : w.label)
												setActivePopover(null) 
											}} 
											className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
												formData.weather === w.label 
													? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900' 
													: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
											}`}
										>
											<span className="text-xl mb-0.5">{w.emoji}</span>
											<span className="text-[10px] font-medium">{w.label}</span>
										</button>
									))}
								</div>
							)}

							{activePopover === 'location' && (
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
										<MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
										<input 
											autoFocus 
											type="text" 
											value={formData.location} 
											onChange={e => handleFieldChange('location', e.target.value)} 
											placeholder="你在哪里？" 
											className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-[var(--color-primary)]" 
											onKeyDown={e => { if (e.key === 'Enter') setActivePopover(null) }} 
										/>
									</div>
									{formData.location && (
										<button 
											type="button"
											onClick={() => { handleFieldChange('location', ''); setActivePopover(null) }} 
											className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 py-2 rounded-xl text-center transition-colors"
										>
											清除位置
										</button>
									)}
								</div>
							)}

							{activePopover === 'tag' && (
								<div className="flex flex-col gap-2.5">
									{(formData.tags && formData.tags.length > 0) && (
										<div className="flex flex-wrap gap-1.5">
											{formData.tags.map(tag => (
												<span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-xl">
													{tag} 
													<button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
														<X className="w-3 h-3"/>
													</button>
												</span>
											))}
										</div>
									)}
									<div className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
										<TagIcon className="w-4 h-4 text-neutral-400 shrink-0" />
										<input 
											autoFocus 
											type="text" 
											value={tagInput} 
											onChange={e => setTagInput(e.target.value)} 
											onKeyDown={addTag} 
											placeholder="输入标签按回车..." 
											className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-[var(--color-primary)]" 
										/>
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Bar Controls */}
				<div className="flex items-center p-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 rounded-full shadow-2xl ring-1 ring-black/5">
					<div className="flex items-center gap-0.5 px-1">
						<ToolbarButton icon={<Smile/>} label={selectedMood?.emoji || '心情'} active={activePopover === 'mood'} hasValue={!!formData.mood} onClick={() => setActivePopover(activePopover === 'mood' ? null : 'mood')} />
						<ToolbarButton icon={<CloudSun/>} label={selectedWeather?.emoji || '天气'} active={activePopover === 'weather'} hasValue={!!formData.weather} onClick={() => setActivePopover(activePopover === 'weather' ? null : 'weather')} />
						<ToolbarButton icon={<MapPin/>} label={formData.location ? '已定位' : '位置'} active={activePopover === 'location'} hasValue={!!formData.location} onClick={() => setActivePopover(activePopover === 'location' ? null : 'location')} />
						<ToolbarButton icon={<TagIcon/>} label={(formData.tags?.length || 0) > 0 ? `${formData.tags?.length} 标签` : '标签'} active={activePopover === 'tag'} hasValue={(formData.tags?.length || 0) > 0} onClick={() => setActivePopover(activePopover === 'tag' ? null : 'tag')} />
						<input type="file" accept="image/*,video/*" multiple className="hidden" ref={imageInputRef} onChange={onImageChange} />
						<ToolbarButton icon={<ImageIcon/>} label="图片" active={false} hasValue={false} onClick={() => imageInputRef.current?.click()} />
					</div>
					
					<div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1.5" />
					
					<button 
						type="button"
						onClick={handleSubmit} 
						className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-full text-xs font-bold hover:brightness-110 transition-all active:scale-95 shadow-md mr-0.5"
					>
						<Send className="w-3.5 h-3.5" />
						<span className="max-sm:hidden">{diary ? '保存' : '记录'}</span>
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
