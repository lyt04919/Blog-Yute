'use client'

import { useState, useRef } from 'react'
import { X, Save, UploadCloud, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import { TagSelector } from '@/components/ui/tag-selector'
import EditableStarRating from '@/components/editable-star-rating'
import type { FavoriteItem } from './favorite-item-card'

const TARGET_CATEGORY_MAP: Record<string, string[]> = {
	videos: ['演讲', '科技', '纪录片', '产品概念', '视觉艺术', '动画'],
	games: ['RPG', '动作', '冒险', '独立游戏', '策略', '模拟', '射击'],
	music: ['Music', 'Podcast', '摇滚', '电子', '流行', '硬核谈话'],
	gears: ['键盘', '显示器', '主机', '音频', '数码配件', '桌面搭配'],
	software: ['开发工具', '效率软件', '设计应用', '系统插件', 'AI 辅助']
}

interface FavoriteItemCreateDialogProps {
	targetType: 'gears' | 'software' | 'music' | 'games' | 'videos'
	onClose: () => void
	onSave: (item: FavoriteItem) => void
	initialData?: Partial<FavoriteItem>
}

export function FavoriteItemCreateDialog({ targetType, onClose, onSave, initialData }: FavoriteItemCreateDialogProps) {
	const [localItem, setLocalItem] = useState<FavoriteItem>({
		name: initialData?.name || '',
		cover: initialData?.cover || '',
		subtitle: initialData?.subtitle || '',
		desc: initialData?.desc || '',
		review: initialData?.review || '',
		link: initialData?.link || '',
		isPinned: initialData?.isPinned ?? false,
		isShow: initialData?.isShow ?? true,
		isShowOnHome: initialData?.isShowOnHome ?? true,
		stars: initialData?.stars ?? (targetType === 'games' ? 5 : undefined),
		status: initialData?.status ?? (targetType === 'games' ? '正在玩' : undefined),
		embedCode: initialData?.embedCode ?? (targetType === 'music' ? '' : undefined),
		category: initialData?.category || ''
	})
	const [isUploading, setIsUploading] = useState(false)
	const [autoUrl, setAutoUrl] = useState('')
	const [isParsing, setIsParsing] = useState(false)
	const [steamQuery, setSteamQuery] = useState('')
	const [steamResults, setSteamResults] = useState<any[]>([])
	const [isSearchingSteam, setIsSearchingSteam] = useState(false)
	const [isFetchingSteamDetails, setIsFetchingSteamDetails] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleSteamSearch = async () => {
		if (!steamQuery.trim()) {
			toast.error('请输入游戏名称')
			return
		}
		try {
			setIsSearchingSteam(true)
			setSteamResults([])
			const res = await fetch(`/api/steam?query=${encodeURIComponent(steamQuery.trim())}`)
			if (!res.ok) throw new Error('搜索失败')
			const data = await res.json()
			if (data.items && data.items.length > 0) {
				setSteamResults(data.items)
				toast.success(`找到 ${data.items.length} 个匹配的游戏`)
			} else {
				toast.error('未找到相关游戏，请检查名称')
			}
		} catch (err: any) {
			toast.error(`搜索失败: ${err.message || '未知错误'}`)
		} finally {
			setIsSearchingSteam(false)
		}
	}

	const handleSteamSelect = async (appid: number) => {
		try {
			setIsFetchingSteamDetails(true)
			const res = await fetch(`/api/steam?appid=${appid}`)
			if (!res.ok) throw new Error('获取游戏详情失败')
			const data = await res.json()
			const appData = data[appid]
			if (appData && appData.success && appData.data) {
				const game = appData.data
				setLocalItem(prev => ({
					...prev,
					name: game.name || prev.name,
					desc: game.short_description || game.detailed_description || prev.desc,
					cover: game.header_image || prev.cover,
					category: game.genres ? game.genres.map((g: any) => g.description).join('/') : prev.category,
					link: `https://store.steampowered.com/app/${appid}/`,
					subtitle: 'PC',
					releaseDate: (game.release_date && game.release_date.date && !game.release_date.coming_soon) ? new Date(game.release_date.date).toISOString().split('T')[0] : prev.releaseDate
				}))
				setSteamResults([])
				setSteamQuery('')
				toast.success('Steam 游戏信息获取成功，已自动填充！')
			} else {
				throw new Error('Steam 未返回有效数据')
			}
		} catch (err: any) {
			toast.error(`获取详情失败: ${err.message || '未知错误'}`)
		} finally {
			setIsFetchingSteamDetails(false)
		}
	}

	const handleAutoParse = async (inputUrl?: string | React.MouseEvent) => {
		const targetUrl = typeof inputUrl === 'string' ? inputUrl : autoUrl;
		if (!targetUrl.trim()) {
			toast.error('请输入有效的链接')
			return
		}
		try {
			setIsParsing(true)
			// Decide which API to use based on URL
			const isVideoUrl = targetUrl.includes('bilibili.com') || targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')
			const endpoint = isVideoUrl ? `/api/parse-video-url?url=${encodeURIComponent(targetUrl.trim())}` : `/api/og?url=${encodeURIComponent(targetUrl.trim())}`
			
			const res = await fetch(endpoint)
			if (!res.ok) {
				throw new Error('解析失败')
			}
			const data = await res.json()
			if (data.error) {
				throw new Error(data.error)
			}
			
			setLocalItem(prev => ({
				...prev,
				name: data.title || prev.name,
				desc: data.description || data.desc || prev.desc,
				cover: data.image || data.cover || prev.cover,
				subtitle: data.subtitle || prev.subtitle,
				link: data.embedLink || targetUrl || prev.link
			}))
			toast.success('解析成功，已自动填充！')
		} catch (err: any) {
			toast.error(`解析失败: ${err.message || '未知错误'}`)
		} finally {
			setIsParsing(false)
		}
	}

	const handleFieldChange = (field: keyof FavoriteItem, value: any) => {
		setLocalItem(prev => ({ ...prev, [field]: value }))
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
			setIsUploading(true)
			const url = await handleFileUpload(file, 'images/uploads')
			handleFieldChange('cover', url)
		} catch (err) {
			console.error(err)
		} finally {
			setIsUploading(false)
		}
	}

	const handleSaveClick = () => {
		if (!localItem.name.trim()) {
			alert('请输入项目名称')
			return
		}
		onSave(localItem)
	}

	const subtitleLabel = {
		gears: '品牌 / 厂商',
		software: '开发者 / 团队',
		music: '艺术家 / 栏目',
		games: '平台 (例如 Switch, PC)',
		videos: '作者 / Up主'
	}[targetType]

	const showStars = targetType === 'games'
	const showEmbedCode = targetType === 'music'
	const showStatusSelect = targetType === 'games'

	return (
		<DialogModal open onClose={onClose} className='card max-w-3xl w-full max-h-[90vh] p-8 md:p-10 relative bg-white dark:bg-[#27272a] flex flex-col shadow-2xl overflow-y-auto'>
			{/* Close Button */}
			<button 
				onClick={onClose} 
				className='absolute top-8 right-8 md:top-10 md:right-10 z-20 p-2 text-[#a1a1aa] hover:text-[#18181b] bg-[#fafafa] hover:bg-[#f4f4f5] rounded-full transition-colors'
			>
				<X className='w-5 h-5' />
			</button>

			<div className='flex flex-col sm:flex-row gap-8 md:gap-12 h-full'>
				{/* Left Side: Cover Image Upload */}
				<div className='shrink-0 w-[140px] sm:w-[200px] mt-2 flex flex-col'>
					<input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onCoverChange} />
					<div 
						className={`group relative w-full cursor-pointer rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden bg-[#fafafa] flex items-center justify-center ${(targetType === 'videos' || targetType === 'games') ? 'aspect-[16/9]' : 'aspect-square'}`}
						onClick={() => fileInputRef.current?.click()}
					>
						{localItem.cover ? (
							<img src={localItem.cover} alt="Cover" className='w-full h-full object-cover' referrerPolicy='no-referrer' />
						) : (
							<div className='w-full h-full p-4 flex flex-col items-center justify-center text-[#a1a1aa] text-xs text-center gap-2'>
								<UploadCloud className="w-6 h-6"/>
								点击上传封面图片
							</div>
						)}
						<div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
							<span className='text-white text-xs font-medium flex items-center gap-1'>
								<UploadCloud className="w-3.5 h-3.5"/> {isUploading ? '上传中...' : '更换封面'}
							</span>
						</div>
					</div>
					
					{/* Save Button - Desktop */}
					<div className='hidden sm:flex mt-auto pt-6'>
						<button
							onClick={handleSaveClick}
							className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-bold rounded-xl hover:bg-[var(--color-accent)] active:scale-[0.98] transition-all'
						>
							<Save className='w-4 h-4' /> 创建并保存
						</button>
					</div>
				</div>

				{/* Right Side: Form Inputs */}
				<div className='flex-1 flex flex-col min-w-0'>
					<div className='shrink-0 mb-6' style={{ paddingRight: '2.5rem' }}>
						{/* Steam Search (for games) / URL Auto-parse helper (for others) */}
						{targetType === 'games' ? (
							<div className='mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-3 shrink-0'>
								<label className='text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
									<Sparkles className='w-3.5 h-3.5 animate-pulse' />
									Steam 智能数据导入 (游戏)
								</label>
								<div className='flex gap-2'>
									<input
										type='text'
										value={steamQuery}
										onChange={e => setSteamQuery(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleSteamSearch();
											}
										}}
										placeholder='输入游戏名称，例如: Cyberpunk 2077'
										className='flex-1 bg-white/80 dark:bg-[#18181b]/80 px-4 py-2.5 rounded-xl border border-[#e4e4e7] dark:border-[#27272a] text-sm text-[#52525b] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-[#a1a1aa] placeholder:font-normal'
									/>
									<button
										type='button'
										disabled={isSearchingSteam || isFetchingSteamDetails}
										onClick={handleSteamSearch}
										className='px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 shrink-0 flex items-center gap-1.5'
									>
										{isSearchingSteam ? (
											<>
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
												搜索中
											</>
										) : '搜索 Steam'}
									</button>
								</div>
								
								{/* Steam search results */}
								{steamResults.length > 0 && (
									<div className="mt-2 max-h-48 overflow-y-auto border border-blue-500/20 rounded-xl bg-white dark:bg-[#1c1c1e] divide-y divide-[#e4e4e7] dark:divide-[#27272a] shadow-lg">
										{steamResults.map(game => (
											<button
												key={game.id}
												type="button"
												disabled={isFetchingSteamDetails}
												onClick={() => handleSteamSelect(game.id)}
												className="w-full flex items-center gap-3 p-2 hover:bg-blue-500/5 text-left transition-colors disabled:opacity-50"
											>
												<img src={game.tiny_image} alt={game.name} className="w-12 h-6 object-cover rounded shadow-sm shrink-0" />
												<div className="flex-1 min-w-0">
													<div className="text-xs font-bold text-[#18181b] dark:text-[#fafafa] truncate">{game.name}</div>
													{game.price && (
														<div className="text-[10px] text-[#a1a1aa] mt-0.5">
															{game.price.final === 0 ? '免费' : `${game.price.currency} ${(game.price.final / 100).toFixed(2)}`}
														</div>
													)}
												</div>
												<span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-500/10 rounded-lg shrink-0">
													{isFetchingSteamDetails ? '获取中...' : '选择'}
												</span>
											</button>
										))}
									</div>
								)}
							</div>
						) : (
							<div className='mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-3 shrink-0'>
								<label className='text-[11px] text-purple-600 dark:text-purple-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
									<Sparkles className='w-3.5 h-3.5 animate-pulse' />
									链接智能解析 (网站 / 视频 / 资源)
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
										placeholder='粘贴网址，例如 https://www.bilibili.com/...'
										className='flex-1 bg-white/80 dark:bg-[#18181b]/80 px-4 py-2.5 rounded-xl border border-[#e4e4e7] dark:border-[#27272a] text-sm text-[#52525b] font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-[#a1a1aa] placeholder:font-normal'
									/>
									<button
										type='button'
										disabled={isParsing}
										onClick={handleAutoParse}
										className='px-5 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 shrink-0'
									>
										{isParsing ? '解析中...' : '智能提取'}
									</button>
								</div>
							</div>
						)}

						{/* Category selector */}
						<div className='mb-3 flex flex-col gap-1.5 w-full'>
							<span className='text-[11px] text-[#a1a1aa] font-medium'>选择分类标签</span>
							<TagSelector
								options={TARGET_CATEGORY_MAP[targetType] || ['Tech', 'Life']}
								selectedTags={localItem.category ? [localItem.category] : []}
								onChange={tags => handleFieldChange('category', tags[tags.length - 1] || '')}
							/>
						</div>

						{/* Title/Name */}
						<input
							type='text'
							value={localItem.name}
							onChange={e => handleFieldChange('name', e.target.value)}
							placeholder='项目名称'
							className='w-full text-xl sm:text-2xl font-extrabold text-[#18181b] leading-tight mb-2 tracking-tight bg-transparent border-b border-transparent focus:border-[#e4e4e7] focus:outline-none transition-colors pb-1'
						/>
						
						{/* Subtitle / Creator */}
						<div className='flex items-center gap-2 mb-4'>
							<span className='text-[#a1a1aa] text-xs font-medium shrink-0'>{subtitleLabel}:</span>
							<input
								type='text'
								value={localItem.subtitle || ''}
								onChange={e => handleFieldChange('subtitle', e.target.value)}
								placeholder={`请输入 ${subtitleLabel}`}
								className='flex-1 text-[#52525b] font-medium text-sm bg-transparent border-b border-transparent focus:border-[#e4e4e7] focus:outline-none transition-colors pb-1'
							/>
						</div>
						
						{/* Rating & Display Options */}
						<div className='mb-2 flex flex-wrap items-center gap-6'>
							{showStars && (
								<div className='flex items-center gap-3'>
									<span className="text-xs text-[#a1a1aa] font-medium">评分</span>
									<EditableStarRating 
										stars={localItem.stars || 5} 
										editable={true} 
										onChange={stars => handleFieldChange('stars', stars)} 
									/>
								</div>
							)}
							<div className="flex flex-wrap items-center gap-4">
								<label className='flex items-center gap-2 cursor-pointer'>
									<input 
										type='checkbox' 
										checked={localItem.isShow || false} 
										onChange={e => {
											const val = e.target.checked
											handleFieldChange('isShow', val)
											if (!val) {
												handleFieldChange('isShowOnHome', false)
											} else {
												handleFieldChange('isShowOnHome', true)
											}
										}}
										className='w-4 h-4 text-blue-500 border-[#d4d4d8] rounded focus:ring-blue-500 accent-blue-500 bg-transparent'
									/>
									<span className="text-xs text-[#a1a1aa] font-medium hover:text-[#18181b] dark:hover:text-white transition-colors">公开到 Favorites</span>
								</label>

								{localItem.isShow && (
									<label className='flex items-center gap-2 cursor-pointer'>
										<input 
											type='checkbox' 
											checked={localItem.isShowOnHome !== false} 
											onChange={e => handleFieldChange('isShowOnHome', e.target.checked)}
											className='w-4 h-4 text-emerald-500 border-[#d4d4d8] rounded focus:ring-emerald-500 accent-emerald-500 bg-transparent'
										/>
										<span className="text-xs text-[#a1a1aa] font-medium hover:text-[#18181b] dark:hover:text-white transition-colors">展示到主页</span>
									</label>
								)}
							</div>
						</div>

						{/* Release Date */}
						<div className='flex flex-col gap-1.5 mt-4'>
							<span className='text-[#a1a1aa] text-[11px] font-medium'>发售/发布时间 (选填)</span>
							<input
								type='date'
								value={localItem.releaseDate || ''}
								onChange={e => handleFieldChange('releaseDate', e.target.value)}
								className='w-full md:w-1/2 px-3 py-2 rounded-lg border border-[#e4e4e7] bg-white text-xs focus:outline-none transition-colors'
							/>
						</div>

						{/* Game status selection */}
						{showStatusSelect && (
							<div className='mt-4 mb-4 flex items-center gap-4'>
								<select
									value={localItem.status || ''}
									onChange={e => handleFieldChange('status', e.target.value || undefined)}
									className='bg-[#fafafa] border border-[#e4e4e7] text-[#52525b] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#a1a1aa]'
								>
									<option value="正在玩">正在玩</option>
									<option value="已通关">已通关</option>
									<option value="想玩">想玩</option>
								</select>
							</div>
						)}
					</div>

					{/* Description Areas */}
					<div className='flex-1 pr-4 pb-4 flex flex-col gap-4 min-h-[220px]'>
						{/* Short Review */}
						<div className='pl-4 border-l-2 border-[#e4e4e7] focus-within:border-[#27272a] transition-colors py-1'>
							<textarea
								value={localItem.review || ''}
								onChange={e => handleFieldChange('review', e.target.value)}
								placeholder='写一句推荐语/简评 (选填)...'
								className='w-full text-sm text-[#52525b] leading-relaxed italic bg-transparent focus:outline-none resize-none'
								rows={2}
							/>
						</div>

						{/* Long Description */}
						<div className='flex-1 flex flex-col min-h-[100px]'>
							<h4 className='text-xs font-semibold tracking-widest text-[#a1a1aa] uppercase mb-2'>详细介绍</h4>
							<textarea
								value={localItem.desc || ''}
								onChange={e => handleFieldChange('desc', e.target.value)}
								placeholder='输入详细描述与推荐理由...'
								className='w-full text-sm text-[#52525b] leading-[1.7] bg-[#fafafa] p-3 rounded-xl border border-[#f4f4f5] focus:outline-none focus:border-[#d4d4d8] transition-colors resize-none'
								rows={4}
							/>
						</div>

						{/* My Review */}
						<div className='flex-1 flex flex-col min-h-[75px]'>
							<h4 className='text-xs font-semibold tracking-widest text-[#a1a1aa] uppercase mb-2'>体验心得 / 随想笔记</h4>
							<textarea
								value={localItem.myReview || ''}
								onChange={e => handleFieldChange('myReview', e.target.value)}
								placeholder='撰写您的个人体验心得或私人笔记...'
								className='w-full text-sm text-[#52525b] leading-[1.7] bg-[#fafafa] p-3 rounded-xl border border-[#f4f4f5] focus:outline-none focus:border-[#d4d4d8] transition-colors resize-none'
								rows={3}
							/>
						</div>

						{/* Notion Recording Section */}
						<div className='mt-3 p-3 rounded-xl bg-[#fafafa] border border-[#f4f4f5] flex flex-col gap-2'>
							<h4 className='text-[10px] font-bold tracking-widest text-emerald-600 uppercase flex items-center gap-1'>
								<span>✨</span> 个人记录 (Notion Recording)
							</h4>
							<div className='text-xs'>
								<span className='text-[10px] text-[#a1a1aa] block mb-1'>体验/通关完成时间</span>
								<input
									type='date'
									value={localItem.playDate || ''}
									onChange={e => handleFieldChange('playDate', e.target.value)}
									className='w-full md:w-1/2 p-2 text-xs rounded-lg border border-[#e4e4e7] bg-white focus:outline-none'
								/>
							</div>
						</div>
					</div>

					{/* Links / Audio Player Code embeds */}
					<div className='pt-4 mt-auto bg-white dark:bg-[#27272a] flex flex-col gap-3 shrink-0 border-t border-[#f4f4f5]'>
						{/* Embed code for music */}
						{showEmbedCode && (
							<div className='flex flex-col gap-1'>
								<label className='text-[10px] text-[#a1a1aa] font-bold uppercase'>播放器内嵌代码 (例如 Spotify/网易云 iframe，选填)</label>
								<textarea
									value={localItem.embedCode || ''}
									onChange={e => handleFieldChange('embedCode', e.target.value)}
									placeholder='<iframe ...></iframe>'
									className='w-full bg-[#fafafa] p-2 text-xs rounded border focus:outline-none focus:border-[#a1a1aa] font-mono'
									rows={2}
								/>
							</div>
						)}

						{/* Hyperlink */}
						<div className='flex gap-2 items-center mb-1'>
							<input
								type='url'
								value={localItem.link || ''}
								onChange={e => handleFieldChange('link', e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAutoParse(localItem.link || '');
									}
								}}
								placeholder={targetType === 'videos' ? '视频播放嵌入链接 (如 Bilibili iframe 页面地址, YouTube embed)' : '产品购买链接 / 官网地址 (选填)'}
								className='flex-1 py-2.5 px-4 bg-white dark:bg-[#27272a] text-[#18181b] text-xs rounded-xl transition-all border border-[#e4e4e7] shadow-sm focus:outline-none placeholder:text-[#a1a1aa]'
							/>
							{localItem.link && (
								<button
									type='button'
									disabled={isParsing}
									onClick={() => handleAutoParse(localItem.link || '')}
									className='px-3 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl active:scale-95 transition-all shadow disabled:opacity-50 shrink-0 flex items-center gap-1 font-sans'
								>
									{isParsing ? '解析中...' : '自动解析'}
								</button>
							)}
						</div>

						{/* Mobile Save Button */}
						<div className='sm:hidden mt-4'>
							<button
								onClick={handleSaveClick}
								className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-bold rounded-xl hover:bg-[var(--color-accent)] active:scale-[0.98] transition-all'
							>
								<Save className='w-4 h-4' /> 创建并保存
							</button>
						</div>
					</div>
				</div>
			</div>
		</DialogModal>
	)
}
