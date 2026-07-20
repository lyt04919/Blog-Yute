'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { X, UploadCloud, Save, Sparkles } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { TagSelector } from '@/components/ui/tag-selector'
import EditableStarRating from '@/components/editable-star-rating'
import type { Movie } from './movie-card'

const MOVIE_TAG_OPTIONS = ['科幻', '文艺', '剧情', '动作', '动画', '悬疑', '纪录片', '喜剧', '奇幻', '犯罪', 'AI', 'Coding', 'Hacker']

interface CreateDialogProps {
	movieList: Movie[]
	movies: Movie | null
	onClose: () => void
	onSave: (movies: Movie) => void
}

export default function CreateDialog({ movieList, movies, onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Movie>({
		name: movies?.name || '',
		director: movies?.director || '',
		poster: movies?.poster || '',
		description: movies?.description || '',
		tags: [],
		stars: 3,
		isPinned: movies?.isPinned || false,
		isShow: movies?.isShow || false,
		isShowOnHome: movies?.isShowOnHome !== false,
		doubanUrl: movies?.doubanUrl || '',
		releaseDate: movies?.releaseDate || ''
	})
	
	const [isUploadingPoster, setIsUploadingPoster] = useState(false)
	const [isFetching, setIsFetching] = useState(false)
	const posterInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (movies) {
			setFormData({
				...movies,
				isShowOnHome: movies.isShowOnHome !== false
			})
		} else {
			setFormData({
				name: '',
				director: '',
				poster: '',
				description: '',
				tags: [],
				stars: 3,
				isPinned: false,
				isShow: false,
				isShowOnHome: true,
				doubanUrl: '',
				releaseDate: ''
			})
		}
	}, [movies])

	const handleFieldChange = (field: keyof Movie, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	const handleTagsChange = (tagsStr: string) => {
		const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t)
		handleFieldChange('tags', tags)
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

	const onPosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setIsUploadingPoster(true)
			const url = await handleFileUpload(file, 'images/uploads')
			handleFieldChange('poster', url)
		} catch (err) {
			console.error(err)
		} finally {
			setIsUploadingPoster(false)
		}
	}

	const handleSubmit = () => {
		if (!formData.name.trim() || !formData.poster.trim() || !formData.director.trim() || !formData.description.trim()) {
			toast.error('请填写所有必填项')
			return
		}

		if (formData.tags.length === 0) {
			toast.error('请至少添加一个标签')
			return
		}

		onSave(formData)
		onClose()
		toast.success(movies ? '更新成功' : '添加成功')
	}

	const handleAutoFetch = async () => {
		if (!formData.name.trim()) {
			toast.error('请先输入影视名称再解析')
			return
		}
		setIsFetching(true)
		try {
			const res = await fetch(`/api/tmdb?query=${encodeURIComponent(formData.name)}`)
			const data = await res.json()
			
			if (!res.ok) {
				toast.error(`获取失败: ${data.error || '未知错误'}`)
				return
			}
			
			if (data.results && data.results.length > 0) {
				const movieInfo = data.results[0]
				let directorName = formData.director
				let newTags = [...formData.tags]
				
				try {
					const creditsRes = await fetch(`/api/tmdb?movieId=${movieInfo.id}`)
					const creditsData = await creditsRes.json()
					
					// Get director
					if (creditsData.credits && creditsData.credits.crew) {
						const directorData = creditsData.credits.crew.find((c: any) => c.job === 'Director')
						if (directorData) directorName = directorData.name
					}
					
					// Get genres
					if (creditsData.genres && creditsData.genres.length > 0) {
						const fetchedGenres = creditsData.genres.map((g: any) => g.name)
						// merge with existing tags without duplicates
						newTags = Array.from(new Set([...newTags, ...fetchedGenres]))
					}
				} catch (e) {
					console.error('Failed to fetch detailed movie info', e)
				}

				setFormData(prev => ({
					...prev,
					description: movieInfo.overview || prev.description,
					poster: movieInfo.poster_path ? `https://image.tmdb.org/t/p/w500${movieInfo.poster_path}` : prev.poster,
					director: directorName,
					tags: newTags,
					releaseDate: movieInfo.release_date || prev.releaseDate
				}))
				toast.success('已自动获取电影信息与标签')
			} else {
				toast.error('未找到相关电影，请检查名称')
			}
		} catch (error) {
			toast.error('请求出错，请重试')
		} finally {
			setIsFetching(false)
		}
	}

	return (
		<DialogModal open onClose={onClose} className='max-w-4xl w-full max-h-[90vh] p-6 md:p-8 relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]' style={{ backgroundColor: '#161B22', color: '#ffffff', border: '1px solid #30363D', borderRadius: '1.5rem' }}>
			{/* Mobile-only Absolute Close/Save Buttons */}
			<div className='sm:hidden absolute top-4 right-4 z-20 flex items-center gap-3 bg-black/40 rounded-full px-2 py-1 border border-white/10'>
				<button 
					onClick={handleSubmit} 
					className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]'
				>
					<Save className='w-3.5 h-3.5' /> 保存
				</button>
				<button onClick={onClose} className='p-1.5 text-slate-400 hover:text-white transition-colors'>
					<X className='w-5 h-5' />
				</button>
			</div>

			{/* Desktop-only Close Button */}
			<button 
				onClick={onClose} 
				className='hidden sm:flex absolute top-6 right-6 z-20 p-2 rounded-full bg-black/40 text-slate-400 hover:text-white hover:bg-black/60 transition-all border border-white/10'
			>
				<X className='w-5 h-5' />
			</button>

			<div className='flex flex-col sm:flex-row gap-6 md:gap-8 h-full min-h-0 pt-4 sm:pt-0'>
				{/* Top Left: Poster Image (Uploadable) */}
				<div className='shrink-0 w-[140px] sm:w-[220px] mt-4 flex flex-col gap-4'>
					<input type="file" accept="image/*" className="hidden" ref={posterInputRef} onChange={onPosterChange} />
					<div 
						className='group relative w-full aspect-[2/3] cursor-pointer rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden bg-[#0D1117] flex items-center justify-center transition-transform hover:scale-[1.02]'
						onClick={() => posterInputRef.current?.click()}
					>
						{formData.poster ? (
							<img src={formData.poster} alt="Poster" className='w-full h-full object-cover' />
						) : (
							<div className='w-full h-full p-4 flex flex-col items-center justify-center text-slate-500 text-xs text-center gap-2'>
								<UploadCloud className="w-6 h-6"/>
								点击上传海报
							</div>
						)}
						<div className='absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
							<span className='text-white text-sm font-medium flex items-center gap-1.5'>
								<UploadCloud className="w-4 h-4"/> {isUploadingPoster ? '上传中...' : '上传海报'}
							</span>
						</div>
					</div>
					
					{/* Desktop-only Save Button */}
					<div className='hidden sm:flex mt-auto'>
						<button 
							onClick={handleSubmit} 
							className='w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all'
						>
							<Save className='w-4 h-4' /> {movies ? '保存更改' : '立即添加电影'}
						</button>
					</div>
				</div>

				{/* Right: Form Sections */}
				<div className='flex-1 flex flex-col min-w-0 pr-2 overflow-y-auto custom-scrollbar pb-6'>
					
					{/* HERO ACTION: TMDB Fetch */}
					<div className='mb-6 p-4 rounded-2xl flex flex-col gap-3 shrink-0' style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
						<label className='text-[11px] text-blue-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
							<Sparkles className='w-3.5 h-3.5 animate-pulse' />
							TMDB 智能数据补全
						</label>
						<div className='flex gap-2'>
							<input
								type='text'
								value={formData.name}
								onChange={e => handleFieldChange('name', e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAutoFetch();
									}
								}}
								placeholder='输入影视名称，例如: 星际穿越'
								className='flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:font-normal'
								style={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#ffffff' }}
							/>
							<button
								type='button'
								disabled={isFetching}
								onClick={handleAutoFetch}
								className='px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 shrink-0'
							>
								{isFetching ? '搜索中...' : '智能提取'}
							</button>
						</div>
					</div>

					{/* HERO ACTION 2: Douban Auto Parse */}
					<div className='mb-6 p-4 rounded-2xl flex flex-col gap-3 shrink-0' style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
						<label className='text-[11px] text-emerald-400 font-bold uppercase flex items-center gap-1.5 tracking-wider'>
							<Sparkles className='w-3.5 h-3.5 animate-pulse' />
							豆瓣影视链接 / 智能解析
						</label>
						<div className='flex gap-2'>
							<input
								type='url'
								value={formData.doubanUrl || ''}
								onChange={e => handleFieldChange('doubanUrl', e.target.value)}
								onKeyDown={async e => {
									if (e.key === 'Enter') {
										e.preventDefault();
										if (!formData.doubanUrl) return;
										setIsFetching(true);
										try {
											const res = await fetch(`/api/og?url=${encodeURIComponent(formData.doubanUrl)}`);
											const data = await res.json();
											if (data.title) {
												setFormData(prev => ({
													...prev,
													name: data.title || prev.name,
													director: data.director || prev.director,
													description: data.description || data.desc || prev.description,
													poster: data.image || data.cover || prev.poster,
													releaseDate: data.releaseDate || prev.releaseDate,
													tags: data.tags ? Array.from(new Set([...prev.tags, ...data.tags])) : prev.tags
												}));
												toast.success('豆瓣解析成功');
											}
										} catch (err) {
											toast.error('豆瓣解析失败');
										} finally {
											setIsFetching(false);
										}
									}
								}}
								placeholder='粘贴来源网页链接，例如 https://movie.douban.com/...'
								className='flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:font-normal'
								style={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#ffffff' }}
							/>
							<button
								type='button'
								disabled={isFetching}
								onClick={async () => {
									if (!formData.doubanUrl) return;
									setIsFetching(true);
									try {
										const res = await fetch(`/api/og?url=${encodeURIComponent(formData.doubanUrl)}`);
										const data = await res.json();
										if (data.title) {
											setFormData(prev => ({
												...prev,
												name: data.title || prev.name,
												director: data.director || prev.director,
												description: data.description || data.desc || prev.description,
												poster: data.image || data.cover || prev.poster,
												releaseDate: data.releaseDate || prev.releaseDate,
												tags: data.tags ? Array.from(new Set([...prev.tags, ...data.tags])) : prev.tags
											}));
											toast.success('豆瓣解析成功');
										}
									} catch (err) {
										toast.error('豆瓣解析失败');
									} finally {
										setIsFetching(false);
									}
								}}
								className='px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 shrink-0'
							>
								{isFetching ? '解析中...' : '提取数据'}
							</button>
						</div>
					</div>

					{/* SECTION 1: Basic Info */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0' style={{ backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							基础信息 (Basic)
						</h4>
						
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='flex flex-col gap-1.5'>
								<span className='text-slate-400 text-[11px] font-medium'>导演 (必填)</span>
								<input
									type='text'
									value={formData.director}
									onChange={e => handleFieldChange('director', e.target.value)}
									placeholder='导演姓名'
									className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors'
									style={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#ffffff' }}
								/>
							</div>
							
							<div className='flex flex-col gap-1.5 md:col-span-2 mt-2'>
								<span className='text-slate-400 text-[11px] font-medium'>分类标签</span>
								<TagSelector
									options={MOVIE_TAG_OPTIONS}
									selectedTags={formData.tags}
									onChange={tags => handleFieldChange('tags', tags)}
								/>
							</div>
						</div>

						<div className='flex flex-col gap-1.5 mt-4'>
							<span className='text-slate-400 text-[11px] font-medium'>上映时间 (选填)</span>
							<input
								type='date'
								value={formData.releaseDate || ''}
								onChange={e => handleFieldChange('releaseDate', e.target.value)}
								className='w-full md:w-1/2 px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors'
								style={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#ffffff' }}
							/>
						</div>

						<div className='flex flex-wrap items-center gap-6 mt-2 pt-4 border-t border-[#30363D]'>
							<div className='flex items-center gap-3'>
								<span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">评分</span>
								<EditableStarRating stars={formData.stars} editable={true} onChange={stars => handleFieldChange('stars', stars)} />
							</div>
							
							<div className='flex items-center gap-3'>
								<span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">状态</span>
								<select
									value={formData.status || ''}
									onChange={e => handleFieldChange('status', e.target.value || undefined)}
									className='border text-xs rounded-md px-2.5 py-1.5 focus:outline-none cursor-pointer'
									style={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#ffffff' }}
								>
									<option value="">-- 选择状态 --</option>
									<option value="watched">已看</option>
									<option value="wishlist">想看</option>
								</select>
							</div>

							<div className="flex flex-wrap items-center gap-2 ml-auto">
								<label className='flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors border-slate-700 bg-blue-500/10'>
									<input 
										type='checkbox' 
										checked={formData.isShow || false} 
										onChange={e => {
											const val = e.target.checked
											handleFieldChange('isShow', val)
											if (!val) {
												handleFieldChange('isShowOnHome', false)
											} else {
												handleFieldChange('isShowOnHome', true)
											}
										}}
										className='w-3.5 h-3.5 text-blue-500 rounded focus:ring-blue-500 accent-blue-500 bg-transparent border-slate-700'
									/>
									<span className="text-[11px] text-blue-400 font-bold tracking-wider uppercase">公开到 Favorites</span>
								</label>

								{formData.isShow && (
									<label className='flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border transition-colors border-slate-700 bg-emerald-500/10'>
										<input 
											type='checkbox' 
											checked={formData.isShowOnHome !== false} 
											onChange={e => handleFieldChange('isShowOnHome', e.target.checked)}
											className='w-3.5 h-3.5 text-emerald-500 rounded focus:ring-emerald-500 accent-emerald-500 bg-transparent border-slate-700'
										/>
										<span className="text-[11px] text-emerald-400 font-bold tracking-wider uppercase">展示到主页</span>
									</label>
								)}
							</div>
						</div>
					</div>

					{/* SECTION 2: Description & Review */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0' style={{ backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-blue-500 rounded-full'></span>
							剧情简介与评价 (Content & Review)
						</h4>

						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-400 text-[11px] font-medium'>剧情简介</span>
							<textarea
								value={formData.description}
								onChange={e => handleFieldChange('description', e.target.value)}
								placeholder='影视的详细剧情...'
								className='w-full text-sm leading-[1.7] p-3 rounded-lg border focus:outline-none transition-colors resize-vertical min-h-[120px]'
								style={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#ffffff' }}
							/>
						</div>
						
						<div className='flex flex-col gap-1.5 mt-2'>
							<span className='text-slate-400 text-[11px] font-medium'>影评 / 个人随想笔记</span>
							<textarea
								rows={3}
								value={formData.myReview || ''}
								onChange={e => handleFieldChange('myReview', e.target.value)}
								placeholder='撰写您的观影感悟或私人笔记...'
								className='w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors min-h-[75px]'
								style={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#ffffff' }}
							/>
						</div>
					</div>

					{/* SECTION 4: Notion Recording */}
					<div className='flex flex-col gap-4 p-5 rounded-2xl mb-4 shrink-0' style={{ backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
						<h4 className='text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2'>
							<span className='w-1 h-3 bg-purple-500 rounded-full'></span>
							个人记录 (Notion Recording)
						</h4>
						<div className='flex flex-col gap-1.5'>
							<span className='text-slate-400 text-[11px] font-medium'>观影完成时间</span>
							<input
								type='date'
								value={formData.watchDate || ''}
								onChange={e => handleFieldChange('watchDate', e.target.value)}
								className='w-full md:w-1/2 px-3 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors'
								style={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#ffffff' }}
							/>
						</div>
					</div>
					
				</div>
			</div>
		</DialogModal>
	)
}
