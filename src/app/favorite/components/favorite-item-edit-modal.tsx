'use client'

import { useState, useRef } from 'react'
import { X, Save, UploadCloud, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import { UniversalEditorShell } from '@/components/ui/universal-editor-shell'
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

interface FavoriteItemEditModalProps {
	item: FavoriteItem
	targetType: 'gears' | 'software' | 'music' | 'games' | 'videos'
	onClose: () => void
	onSave: (item: FavoriteItem) => void
}

export function FavoriteItemEditModal({ item, targetType, onClose, onSave }: FavoriteItemEditModalProps) {
	const [localItem, setLocalItem] = useState<FavoriteItem>(item)
	const [isUploading, setIsUploading] = useState(false)
	const [autoUrl, setAutoUrl] = useState(item.link || '')
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
					playDate: (game.release_date && game.release_date.date && !game.release_date.coming_soon) ? new Date(game.release_date.date).toISOString().split('T')[0] : prev.playDate
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
			
			// Use different API based on target type
			const apiRoute = targetType === 'videos' ? '/api/parse-video-url' : '/api/og';
			const res = await fetch(`${apiRoute}?url=${encodeURIComponent(targetUrl.trim())}`)
			
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
				subtitle: data.siteName || data.subtitle || prev.subtitle,
				link: data.embedLink || targetUrl || prev.link
			}))
			toast.success('魔法解析成功，已自动填充！')
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

	// Subtitle labels and placeholder helper
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
		<DialogModal open onClose={onClose} className='max-w-4xl w-full max-h-[90vh] p-6 md:p-8 relative flex flex-col shadow-2xl bg-white dark:bg-[#161B22] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-200 dark:border-[#30363D] rounded-3xl'>
			{/* Mobile Close/Save Buttons */}
			<div className='sm:hidden absolute top-4 right-4 z-20 flex items-center gap-3 bg-slate-200/50 dark:bg-black/40 rounded-full px-2 py-1 border border-slate-300 dark:border-white/10'>
				<button 
					onClick={() => onSave(localItem)} 
					className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-slate-900 dark:text-white text-xs font-bold rounded-full hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]'
				>
					<Save className='w-3.5 h-3.5' /> 保存
				</button>
				<button onClick={onClose} className='p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors'>
					<X className='w-5 h-5' />
				</button>
			</div>

			{/* Desktop Close Button */}
			<button 
				onClick={onClose} 
				className='hidden sm:flex absolute top-6 right-6 z-20 p-2 rounded-full bg-slate-200/50 dark:bg-black/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-300/50 dark:bg-black/60 transition-all border border-slate-300 dark:border-white/10'
			>
				<X className='w-5 h-5' />
			</button>

			<div className='flex flex-col sm:flex-row gap-6 md:gap-8 h-full min-h-0 pt-4 sm:pt-0'>
				{/* Left Side: Cover Image Upload */}
				<div className='shrink-0 w-[140px] sm:w-[220px] mt-4 flex flex-col gap-4'>
					<input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onCoverChange} />
					<div 
						className={`group relative w-full cursor-pointer rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden bg-slate-50 dark:bg-[#0D1117] flex items-center justify-center transition-transform hover:scale-[1.02] ${(targetType === 'videos' || targetType === 'games') ? 'aspect-[16/9]' : 'aspect-square'}`}
						onClick={() => fileInputRef.current?.click()}
					>
						{localItem.cover ? (
							<img src={localItem.cover} alt="Cover" className='w-full h-full object-cover' referrerPolicy='no-referrer' />
						) : (
							<div className='w-full h-full p-4 flex flex-col items-center justify-center text-slate-500 text-xs text-center gap-2'>
								<UploadCloud className="w-6 h-6"/>
								点击上传封面
							</div>
						)}
						<div className='absolute inset-0 bg-slate-300/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
							<span className='text-slate-900 dark:text-white text-sm font-medium flex items-center gap-1.5'>
								<UploadCloud className="w-4 h-4"/> {isUploading ? '上传中...' : '更换封面'}
							</span>
						</div>
					</div>
					
					{/* Desktop Save Button */}
					<div className='hidden sm:flex mt-auto'>
						<button 
							onClick={() => onSave(localItem)} 
							className='w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 text-slate-900 dark:text-white text-sm font-bold rounded-xl hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all'
						>
							<Save className='w-4 h-4' /> 保存修改
						</button>
					</div>
				</div>

				{/* Right Side: Form Sections */}
				<div className='flex-1 flex flex-col min-w-0 pr-2 overflow-y-auto custom-scrollbar pb-6'>
					
					{targetType === 'games' ? (
						<div className='mb-6 p-4 rounded-2xl flex flex-col gap-3 shrink-0 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20'>
							<label className='text-[11px] text-blue-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
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
									className='flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:font-normal'
									style={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#ffffff' }}
								/>
								<button
									type='button'
									disabled={isSearchingSteam || isFetchingSteamDetails}
									onClick={handleSteamSearch}
									className='px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 shrink-0 flex items-center gap-1.5'
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
								<div className="mt-2 max-h-48 overflow-y-auto border rounded-xl divide-y custom-scrollbar shadow-lg bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] divide-slate-200 dark:divide-[#30363D]">
									{steamResults.map(game => (
										<button
											key={game.id}
											type="button"
											disabled={isFetchingSteamDetails}
											onClick={() => handleSteamSelect(game.id)}
											className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:bg-[#0D1117] text-left transition-colors disabled:opacity-50 border-b border-slate-200 dark:border-[#30363D]"
										>
											<img src={game.tiny_image} alt={game.name} className="w-12 h-6 object-cover rounded shadow-sm shrink-0" />
											<div className="flex-1 min-w-0">
												<div className="text-xs font-bold text-slate-900 dark:text-white truncate">{game.name}</div>
												{game.price && (
													<div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
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
						<div className='mb-6 p-4 rounded-2xl flex flex-col gap-3 shrink-0 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 dark:border-purple-500/20'>
							<label className='text-[11px] text-purple-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
								<Sparkles className='w-3.5 h-3.5 animate-pulse' />
								Magic Extract / 智能链接解析
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
									placeholder='粘贴来源网页链接，例如 https://www.bilibili.com...'
									className='flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:font-normal'
									style={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#ffffff' }}
								/>
								<button
									type='button'
									disabled={isParsing}
									onClick={() => handleAutoParse()}
									className='px-5 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 shrink-0'
								>
									{isParsing ? '解析中...' : '提取数据'}
								</button>
							</div>
						</div>
					)}

					{/* SECTION 1: Basic Info */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							基础信息 (Basic)
						</h4>
						
						<input
							type='text'
							value={localItem.name}
							onChange={e => handleFieldChange('name', e.target.value)}
							placeholder='项目名称 (必填)'
							className='w-full text-xl sm:text-2xl font-extrabold leading-tight tracking-tight bg-transparent border-b focus:outline-none transition-colors pb-2 border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
						/>
						
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='flex flex-col gap-1.5'>
								<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>{subtitleLabel}</span>
								<input
									type='text'
									value={localItem.subtitle || ''}
									onChange={e => handleFieldChange('subtitle', e.target.value)}
									placeholder={`请输入${subtitleLabel}`}
									className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
								/>
							</div>
							
							<div className='flex flex-col gap-1.5 md:col-span-2 mt-2'>
								<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>分类标签</span>
								<TagSelector
									options={TARGET_CATEGORY_MAP[targetType] || ['Tech', 'Life']}
									selectedTags={localItem.category ? [localItem.category] : []}
									onChange={tags => handleFieldChange('category', tags[tags.length - 1] || '')}
								/>
							</div>
						</div>

						<div className='flex flex-wrap items-center gap-6 mt-2 pt-4 border-t border-slate-200 dark:border-[#30363D]'>
							{showStars && (
								<div className='flex items-center gap-3'>
									<span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">评分</span>
									<EditableStarRating 
										stars={localItem.stars || 5} 
										editable={true} 
										onChange={stars => handleFieldChange('stars', stars)} 
									/>
								</div>
							)}
							{showStatusSelect && (
								<div className='flex items-center gap-3'>
									<span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">状态</span>
									<select
										value={localItem.status || ''}
										onChange={e => handleFieldChange('status', e.target.value || undefined)}
										className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
									>
										<option value="">-- 选择状态 --</option>
										<option value="正在玩">正在玩</option>
										<option value="已通关">已通关</option>
										<option value="想玩">想玩</option>
									</select>
								</div>
							)}
							<div className="flex flex-wrap items-center gap-2 ml-auto">
								<label className='flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors' style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.3)' }}>
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
										className='w-3.5 h-3.5 text-blue-500 rounded focus:ring-blue-500 accent-blue-500'
									/>
									<span className="text-[11px] text-blue-400 font-bold tracking-wider uppercase">公开到 Favorites</span>
								</label>

								{localItem.isShow && (
									<label className='flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors' style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>
										<input 
											type='checkbox' 
											checked={localItem.isShowOnHome !== false} 
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
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							内容与评语 (Content & Review)
						</h4>
						
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>一句话简评 / 推荐语</span>
							<textarea
								value={localItem.review || ''}
								onChange={e => handleFieldChange('review', e.target.value)}
								placeholder='写一句极具吸引力的推荐语 (选填)...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
								rows={2}
							/>
						</div>

						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>详细介绍</span>
							<textarea
								value={localItem.desc || ''}
								onChange={e => handleFieldChange('desc', e.target.value)}
								placeholder='输入详细的描述信息...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
								rows={4}
							/>
						</div>
						
						<div className='flex flex-col gap-1.5 mt-2'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>体验心得 / 随想笔记</span>
							<textarea
								rows={3}
								value={localItem.myReview || ''}
								onChange={e => handleFieldChange('myReview', e.target.value)}
								placeholder='撰写您的个人体验心得或私人笔记...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white min-h-[75px]'
							/>
						</div>

						<div className='flex flex-col gap-1.5 mt-4'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>发售/发布时间 (选填)</span>
							<input
								type='date'
								value={localItem.releaseDate || ''}
								onChange={e => handleFieldChange('releaseDate', e.target.value)}
								className='w-full md:w-1/2 px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>
					</div>

					{/* SECTION 3: Assets & Links */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-emerald-500 rounded-full'></span>
							链接与嵌入 (Assets)
						</h4>
						
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>官方网站 / 详情链接</span>
							<input
								type='url'
								value={localItem.link || ''}
								onChange={e => handleFieldChange('link', e.target.value)}
								placeholder='例如产品官网、购买链接等'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>

						{showEmbedCode && (
							<div className='flex flex-col gap-1.5'>
								<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>音乐播放器代码 (Iframe)</span>
								<textarea
									value={localItem.embedCode || ''}
									onChange={e => handleFieldChange('embedCode', e.target.value)}
									placeholder='<iframe src="..."></iframe>'
									className='w-full p-3 text-xs rounded-lg border focus:outline-none font-mono resize-none bg-slate-100 dark:bg-[#090B0F] border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#a3b3cc]'
									rows={3}
								/>
							</div>
						)}
					</div>

					{/* SECTION 4: Notion Recording */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-[#30363D]'>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-emerald-500 rounded-full'></span>
							个人记录 (Notion Recording)
						</h4>
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-500 dark:text-slate-400 text-[11px] font-medium'>体验/通关完成时间</span>
							<input
								type='date'
								value={localItem.playDate || ''}
								onChange={e => handleFieldChange('playDate', e.target.value)}
								className='w-full md:w-1/2 px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-900 dark:text-white'
							/>
						</div>
					</div>
					
				</div>
			</div>
		</DialogModal>
	)
}
