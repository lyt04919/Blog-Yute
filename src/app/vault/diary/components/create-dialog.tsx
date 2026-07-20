import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { X, Image as ImageIcon, MapPin, Tag as TagIcon, Smile, CloudSun, Sparkles, Send } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { Diary } from './diary-card'
import dayjs from 'dayjs'

interface CreateDialogProps {
	diary?: Diary | null
	onClose: () => void
	onSave: (diary: Diary) => void
}

const TEMPLATES = [
	{ name: '空白页', content: '' },
	{ name: '感恩日记', content: '🌟 今天发生的三件好事：\n1. \n2. \n3. \n\n💭 我的感受：\n' },
	{ name: '每日复盘', content: '✅ 今日完成：\n\n❌ 待改进：\n\n🎯 明日计划：\n' },
]

const MOODS = [
	{ label: '开心', emoji: '😄' },
	{ label: '平静', emoji: '😐' },
	{ label: '难过', emoji: '😢' },
	{ label: '生气', emoji: '😡' },
	{ label: '疲惫', emoji: '😫' },
	{ label: '活力', emoji: '✨' },
	{ label: '焦虑', emoji: '😰' },
	{ label: '感动', emoji: '🥺' },
	{ label: '无聊', emoji: '🥱' },
	{ label: '得意', emoji: '😎' },
	{ label: '崩溃', emoji: '🤯' }
]

const WEATHERS = [
	{ label: '晴朗', emoji: '☀️' },
	{ label: '多云', emoji: '⛅' },
	{ label: '阴天', emoji: '☁️' },
	{ label: '小雨', emoji: '🌧️' },
	{ label: '大雨', emoji: '⛈️' },
	{ label: '雷雨', emoji: '🌩️' },
	{ label: '下雪', emoji: '❄️' },
	{ label: '大风', emoji: '💨' },
	{ label: '雾霾', emoji: '🌫️' }
]

export default function CreateDialog({ diary, onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Diary>({
		id: diary?.id || Date.now().toString(),
		date: diary?.date || dayjs().format('YYYY-MM-DD'),
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

	const handleFieldChange = (field: keyof Diary, value: any) => {
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
			if (!formData.tags?.includes(tagInput.trim())) {
				handleFieldChange('tags', [...(formData.tags || []), tagInput.trim()])
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

	const selectedMood = MOODS.find(m => m.label === formData.mood)
	const selectedWeather = WEATHERS.find(w => w.label === formData.weather)

	const getBackgroundStyle = () => {
		const mood = formData.mood
		const weather = formData.weather

		const moodColors: Record<string, string> = {
			'开心': '#ffedd5', '得意': '#ffedd5', '活力': '#ffedd5',
			'难过': '#e2e8f0', '焦虑': '#e2e8f0', '崩溃': '#e2e8f0',
			'疲惫': '#f5f5f4', '无聊': '#f5f5f4',
			'平静': '#ccfbf1', '感动': '#ccfbf1',
			'生气': '#fee2e2'
		}

		const weatherColors: Record<string, string> = {
			'晴朗': '#fef3c7',
			'多云': '#f1f5f9', '阴天': '#f1f5f9', '雾霾': '#f1f5f9',
			'小雨': '#dbeafe', '大雨': '#dbeafe', '雷雨': '#dbeafe',
			'下雪': '#e0f2fe',
			'大风': '#ccfbf1'
		}

		if (mood && !weather) {
			const color = moodColors[mood] || '#ffffff'
			return { backgroundColor: color, backgroundImage: 'none' }
		} else if (!mood && weather) {
			const color = weatherColors[weather] || '#fafafa'
			return { backgroundColor: color, backgroundImage: 'none' }
		} else if (mood && weather) {
			const from = moodColors[mood] || '#ffffff'
			const to = weatherColors[weather] || '#fafafa'
			return { backgroundImage: `linear-gradient(to bottom right, ${from}, ${to})` }
		}

		return { backgroundColor: '#ffffff', backgroundImage: 'none' }
	}

	const ToolbarButton = ({ icon, label, active, onClick, hasValue }: any) => (
		<button 
			onClick={onClick} 
			className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium transition-all ${active ? 'bg-[#18181b] text-white shadow-md' : hasValue ? 'bg-[#f4f4f5] text-[#18181b]' : 'text-[#71717a] hover:bg-[#fafafa] hover:text-[#18181b]'}`}
		>
			{React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-white/80' : hasValue ? 'text-[#18181b]' : 'text-[#a1a1aa]'}` })}
			<span className="max-sm:hidden">{label}</span>
		</button>
	)

	return (
		<DialogModal open onClose={onClose} className="card max-w-3xl w-full h-[85vh] p-0 relative flex flex-col shadow-2xl overflow-hidden">
			<div 
				className="absolute inset-0 z-0 transition-all duration-1000" 
				style={getBackgroundStyle()}
				onDragOver={handleDragOver} 
				onDragLeave={handleDragLeave} 
				onDrop={handleDrop}
			/>

			{/* Top Bar */}
			<motion.div className={`shrink-0 flex items-center justify-between px-8 py-5 transition-opacity duration-700 z-20 ${isFocused && formData.content.length > 50 ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
				<div className='flex flex-wrap items-center gap-3'>
					<input
						type='date'
						value={formData.date}
						onChange={e => handleFieldChange('date', e.target.value)}
						className='font-bold text-xl text-[#18181b] focus:outline-none bg-transparent cursor-pointer hover:text-[#52525b] transition-colors shrink-0'
					/>
					{(formData.location || (formData.tags && formData.tags.length > 0)) && <div className="w-px h-4 bg-black/10 mx-1" />}
					{formData.location && (
						<span className="flex items-center gap-1 text-xs font-medium text-[#52525b] bg-black/5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
							<MapPin className="w-3.5 h-3.5" /> {formData.location}
						</span>
					)}
					{formData.tags?.map(tag => (
						<span key={tag} className="flex items-center gap-1 text-xs font-medium text-[#52525b] bg-black/5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
							<TagIcon className="w-3.5 h-3.5" /> {tag}
						</span>
					))}
				</div>
				<button onClick={onClose} className='p-2 text-[#a1a1aa] hover:text-[#18181b] transition-colors bg-white/50 hover:bg-white dark:bg-[#27272a] rounded-full shadow-sm'>
					<X className='w-5 h-5' />
				</button>
			</motion.div>

			{/* Scrollable Content Area */}
			<div className='flex-1 overflow-y-auto custom-scrollbar px-8 md:px-12 pb-32 flex flex-col z-10'>
				<div className="relative flex-1 flex flex-col min-h-[300px]">
					<textarea
						ref={textareaRef}
						value={formData.content}
						onChange={e => handleFieldChange('content', e.target.value)}
						onClick={() => setActivePopover(null)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						placeholder='记录今天的想法，长篇大论也装得下...'
						className='w-full flex-1 text-[17px] text-[#27272a] leading-loose font-light bg-transparent focus:outline-none resize-none z-10 relative'
					/>
					
					{/* Ghost Templates */}
					{formData.content === '' && !diary && (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="absolute bottom-4 left-0 flex flex-wrap items-center gap-3 z-20">
							<span className="text-[#a1a1aa] text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4"/> 灵感模板：</span>
							{TEMPLATES.slice(1).map(t => (
								<button 
									key={t.name}
									onClick={() => { handleFieldChange('content', t.content); setTimeout(() => textareaRef.current?.focus(), 50) }}
									className="px-4 py-2 bg-white/60 dark:bg-[#27272a]/60 hover:bg-white dark:bg-[#27272a] text-[#52525b] rounded-xl text-sm font-medium transition-all shadow-sm backdrop-blur-md border border-white/50"
								>
									{t.name}
								</button>
							))}
						</motion.div>
					)}
				</div>

				{/* Image Grid */}
				{(formData.media && formData.media.length > 0) && (
					<div className='mt-8 pt-6 border-t border-[#e4e4e7]/30'>
						<div className='flex flex-wrap gap-3'>
							{formData.media.map((url, i) => (
								<div key={i} className='relative group w-32 h-32 rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-sm'>
									{url.endsWith('.mp4') || url.endsWith('.webm') ? (
										<video src={url} className='w-full h-full object-cover bg-[#f4f4f5]' />
									) : (
										<img src={url} className='w-full h-full object-cover bg-[#f4f4f5]' />
									)}
									<button 
										onClick={(e) => { e.stopPropagation(); removeMedia(i) }} 
										className='absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110 shadow-sm'
									>
										<X className='w-3.5 h-3.5' />
									</button>
								</div>
							))}
							
							{formData.media.length < 15 && (
								<button 
									onClick={() => imageInputRef.current?.click()}
									className='flex flex-col items-center justify-center w-32 h-32 text-[#a1a1aa] bg-white/50 hover:bg-white dark:bg-[#27272a] transition-colors rounded-2xl font-medium border border-[#e4e4e7]/50 shadow-sm hover:shadow-md'
								>
									{isUploadingImage ? (
										<span className='text-sm animate-pulse'>上传中...</span>
									) : (
										<>
											<ImageIcon className='w-8 h-8 mb-2 opacity-50' />
											<span className='text-xs'>继续添加</span>
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
						className="absolute inset-0 z-[100] bg-white dark:bg-[#27272a]/60 backdrop-blur-sm border-4 border-dashed border-[#a1a1aa]/50 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
					>
						<div className="w-20 h-20 bg-white dark:bg-[#27272a] rounded-full shadow-2xl flex items-center justify-center mb-6">
							<ImageIcon className="w-10 h-10 text-[#18181b]" />
						</div>
						<h3 className="text-2xl font-bold text-[#18181b] drop-shadow-md">松开鼠标添加媒体文件</h3>
						<p className="text-[#71717a] mt-2 font-medium">支持图片与视频，最高15个文件</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Floating Bottom Toolbar */}
			<div 
				className={`absolute z-50 transition-opacity duration-700 ${isFocused && formData.content.length > 50 && !activePopover ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}
				style={{ bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}
			>
				{/* Popovers */}
				<AnimatePresence>
					{activePopover && (
						<motion.div 
							initial={{ opacity: 0, y: 10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-80 bg-white dark:bg-[#27272a] p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#f4f4f5] origin-bottom"
						>
							{activePopover === 'mood' && (
								<div className="grid grid-cols-4 gap-2">
									{MOODS.map(m => (
										<button key={m.label} onClick={() => { handleFieldChange('mood', formData.mood === m.label ? '' : m.label); setActivePopover(null) }} className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all ${formData.mood === m.label ? 'bg-[#18181b] text-white shadow-md' : 'hover:bg-[#f4f4f5] text-[#52525b]'}`}>
											<span className="text-2xl mb-1">{m.emoji}</span>
											<span className="text-[11px] font-medium">{m.label}</span>
										</button>
									))}
								</div>
							)}
							{activePopover === 'weather' && (
								<div className="grid grid-cols-4 gap-2">
									{WEATHERS.map(w => (
										<button key={w.label} onClick={() => { handleFieldChange('weather', formData.weather === w.label ? '' : w.label); setActivePopover(null) }} className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all ${formData.weather === w.label ? 'bg-[#18181b] text-white shadow-md' : 'hover:bg-[#f4f4f5] text-[#52525b]'}`}>
											<span className="text-2xl mb-1">{w.emoji}</span>
											<span className="text-[11px] font-medium">{w.label}</span>
										</button>
									))}
								</div>
							)}
							{activePopover === 'location' && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center gap-2 px-4 py-3 bg-[#f4f4f5]/80 rounded-2xl">
										<MapPin className="w-5 h-5 text-[#a1a1aa] shrink-0" />
										<input autoFocus type="text" value={formData.location} onChange={e => handleFieldChange('location', e.target.value)} placeholder="你在哪里？" className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-[#27272a]" onKeyDown={e => { if(e.key === 'Enter') setActivePopover(null) }} />
									</div>
									{formData.location && <button onClick={() => { handleFieldChange('location', ''); setActivePopover(null) }} className="text-xs font-bold text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-center transition-colors">清除位置</button>}
								</div>
							)}
							{activePopover === 'tag' && (
								<div className="flex flex-col gap-3">
									{(formData.tags && formData.tags.length > 0) && (
										<div className="flex flex-wrap gap-2">
											{formData.tags.map(tag => (
												<span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f4f5] text-[#3f3f46] text-xs font-medium rounded-xl">
													{tag} <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5"/></button>
												</span>
											))}
										</div>
									)}
									<div className="flex items-center gap-2 px-4 py-3 bg-[#f4f4f5]/80 rounded-2xl">
										<TagIcon className="w-5 h-5 text-[#a1a1aa] shrink-0" />
										<input autoFocus type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="输入标签按回车..." className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-[#27272a]" />
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				<div className="flex items-center p-1.5 bg-white dark:bg-[#27272a]/90 backdrop-blur-2xl border border-[#e4e4e7]/50 rounded-full shadow-2xl ring-1 ring-black/5">
					<div className="flex items-center gap-0.5 px-1">
						<ToolbarButton icon={<Smile/>} label={selectedMood?.emoji || '心情'} active={activePopover === 'mood'} hasValue={!!formData.mood} onClick={() => setActivePopover(activePopover === 'mood' ? null : 'mood')} />
						<ToolbarButton icon={<CloudSun/>} label={selectedWeather?.emoji || '天气'} active={activePopover === 'weather'} hasValue={!!formData.weather} onClick={() => setActivePopover(activePopover === 'weather' ? null : 'weather')} />
						<ToolbarButton icon={<MapPin/>} label={formData.location ? '已定位' : '位置'} active={activePopover === 'location'} hasValue={!!formData.location} onClick={() => setActivePopover(activePopover === 'location' ? null : 'location')} />
						<ToolbarButton icon={<TagIcon/>} label={(formData.tags?.length || 0) > 0 ? `${formData.tags?.length} 标签` : '标签'} active={activePopover === 'tag'} hasValue={(formData.tags?.length || 0) > 0} onClick={() => setActivePopover(activePopover === 'tag' ? null : 'tag')} />
						<input type="file" accept="image/*,video/*" multiple className="hidden" ref={imageInputRef} onChange={onImageChange} />
						<ToolbarButton icon={<ImageIcon/>} label="图片" active={false} hasValue={false} onClick={() => imageInputRef.current?.click()} />
					</div>
					
					<div className="w-px h-6 bg-[#e4e4e7] mx-1.5" />
					
					<button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2.5 bg-[#18181b] text-white rounded-full text-sm font-bold hover:bg-[#27272a] transition-all active:scale-95 shadow-md mr-0.5">
						<Send className="w-4 h-4" />
						<span className="max-sm:hidden">{diary ? '保存' : '记录'}</span>
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
