import React, { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ExternalLink, Trash2, Pin, PinOff, Sparkles, Image as ImageIcon, Link2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import initialGearsData from '../gears.json'
import initialSoftwareData from '../software.json'
import { type FavoriteItem } from '../../favorite/components/favorite-item-card'
import { toast } from 'sonner'

const MagicInput = ({ targetType, onAdd }: { targetType: 'gears' | 'software', onAdd: (item: FavoriteItem) => void }) => {
	const [url, setUrl] = useState('')
	const [isParsing, setIsParsing] = useState(false)

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!url.trim()) return

		try {
			setIsParsing(true)
			const res = await fetch(`/api/og?url=${encodeURIComponent(url.trim())}`)
			if (!res.ok) throw new Error('解析失败')
			const data = await res.json()
			if (data.error) throw new Error(data.error)
			
			const newItem: FavoriteItem = {
				name: data.title || '',
				desc: data.description || data.desc || '',
				cover: targetType === 'software' 
					? (data.icon || data.image || data.cover || '') 
					: (data.image || data.cover || ''),
				subtitle: data.siteName || data.subtitle || '',
				link: data.embedLink || url.trim(),
				isShow: true,
				isPinned: false,
				category: 'Uncategorized'
			}
			onAdd(newItem)
			setUrl('')
			toast.success('✨ 魔法解析添加成功！')
		} catch (err: any) {
			toast.error(`解析失败: ${err.message || '未知错误'}`)
		} finally {
			setIsParsing(false)
		}
	}

	return (
		<div className="w-full relative mb-6 flex gap-2">
			<form onSubmit={handleAdd} className="relative flex-1">
				<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
					<Sparkles className={cn("w-4 h-4 text-[var(--color-brand)]", isParsing && "animate-spin")} />
				</div>
				<input
					type="url"
					placeholder={`✨ 粘贴 ${targetType === 'gears' ? '硬件' : '软件'} 官网链接并回车，系统将全自动解析并生成卡片...`}
					value={url}
					onChange={e => setUrl(e.target.value)}
					disabled={isParsing}
					className="w-full pl-11 pr-4 py-3 bg-[var(--color-card)] border border-[var(--color-brand)]/30 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] rounded-xl outline-none text-sm text-[var(--color-primary)] placeholder:text-[var(--color-secondary)]/50 transition-all shadow-sm shadow-[var(--color-brand)]/5"
				/>
			</form>
			<button 
				onClick={() => {
					onAdd({
						name: '新项目',
						desc: '点击此处修改描述...',
						cover: '',
						subtitle: '',
						link: '',
						isShow: true,
						isPinned: false,
						category: 'Uncategorized'
					})
				}}
				className="flex-shrink-0 px-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] rounded-xl text-sm font-medium transition-all"
			>
				+ 手动添加
			</button>
		</div>
	)
}

export function UsesBento({ isEditMode = false }: { isEditMode?: boolean }) {
	const [gears, setGears] = useState<FavoriteItem[]>(initialGearsData as FavoriteItem[])
	const [software, setSoftware] = useState<FavoriteItem[]>(initialSoftwareData as FavoriteItem[])
	const [uploadingItem, setUploadingItem] = useState<{ item: FavoriteItem; targetType: 'gears' | 'software' } | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const displayGears = gears.filter(item => isEditMode || item.isShow)
	const displaySoftware = software.filter(item => isEditMode || item.isShow)

	const handleSaveData = async (targetType: 'gears' | 'software', updatedList: FavoriteItem[]) => {
		try {
			const filePath = `src/app/about/${targetType}.json`
			const contentBase64 = Buffer.from(JSON.stringify(updatedList, null, '\t'), 'utf-8').toString('base64')
			
			const res = await fetch('/api/save-local', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					files: [{ path: filePath, contentBase64 }]
				})
			})

			if (!res.ok) throw new Error('保存到本地失败')
		} catch (error: any) {
			console.error(error)
			toast.error(`保存失败: ${error.message}`)
		}
	}

	const handleAddItem = async (item: FavoriteItem, targetType: 'gears' | 'software') => {
		const currentList = targetType === 'gears' ? gears : software
		const setList = targetType === 'gears' ? setGears : setSoftware
		const newList = [...currentList, item]
		setList(newList)
		await handleSaveData(targetType, newList)
	}

	const handleUpdateField = (originalItem: FavoriteItem, field: keyof FavoriteItem, value: any, targetType: 'gears' | 'software') => {
		const currentList = targetType === 'gears' ? gears : software
		const setList = targetType === 'gears' ? setGears : setSoftware
		setList(currentList.map(i => i === originalItem ? { ...i, [field]: value } : i))
	}

	const handleBlurItem = async (targetType: 'gears' | 'software') => {
		const currentList = targetType === 'gears' ? gears : software
		await handleSaveData(targetType, currentList)
	}

	const handleDeleteItem = async (item: FavoriteItem, targetType: 'gears' | 'software') => {
		if (!confirm(`确定要删除 ${item.name} 吗？`)) return
		const currentList = targetType === 'gears' ? gears : software
		const setList = targetType === 'gears' ? setGears : setSoftware
		const newList = currentList.filter(i => i !== item)
		setList(newList)
		await handleSaveData(targetType, newList)
	}

	const handleTogglePin = async (item: FavoriteItem, targetType: 'gears' | 'software') => {
		const currentList = targetType === 'gears' ? gears : software
		const setList = targetType === 'gears' ? setGears : setSoftware
		const newList = currentList.map(i => i === item ? { ...i, isPinned: !i.isPinned } : i)
		setList(newList)
		await handleSaveData(targetType, newList)
	}

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || !uploadingItem) return

		if (!file.type.startsWith('image/')) {
			toast.error('请选择图片文件')
			return
		}

		try {
			const formData = new FormData()
			formData.append('file', file)
			
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			})
			
			if (!res.ok) throw new Error('上传失败')
			const data = await res.json()
			
			// Update state and save
			const currentList = uploadingItem.targetType === 'gears' ? gears : software
			const setList = uploadingItem.targetType === 'gears' ? setGears : setSoftware
			const newList = currentList.map(i => i === uploadingItem.item ? { ...i, cover: data.url } : i)
			setList(newList)
			await handleSaveData(uploadingItem.targetType, newList)
			
			toast.success('封面更新成功')
		} catch (err: any) {
			console.error(err)
			toast.error('上传图片失败，请重试')
		} finally {
			setUploadingItem(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleToggleShow = async (item: FavoriteItem, targetType: 'gears' | 'software') => {
		const currentList = targetType === 'gears' ? gears : software
		const setList = targetType === 'gears' ? setGears : setSoftware
		const newList = currentList.map(i => i === item ? { ...i, isShow: !i.isShow } : i)
		setList(newList)
		await handleSaveData(targetType, newList)
	}

	const renderEditOverlay = (item: FavoriteItem, targetType: 'gears' | 'software') => {
		if (!isEditMode) return null
		return (
			<div className="absolute top-2 right-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-md rounded-full p-1">
				<button onClick={(e) => { e.preventDefault(); const newLink = prompt('输入链接:', item.link); if (newLink !== null) { handleUpdateField(item, 'link', newLink, targetType); handleBlurItem(targetType); } }} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="Edit Link">
					<Link2 className="w-3 h-3" />
				</button>
				<button onClick={(e) => { e.preventDefault(); setUploadingItem({ item, targetType }); fileInputRef.current?.click(); }} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="Edit Cover">
					<ImageIcon className="w-3 h-3" />
				</button>
				<button onClick={(e) => { e.preventDefault(); handleTogglePin(item, targetType) }} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title={item.isPinned ? "Unpin" : "Pin"}>
					{item.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
				</button>
				<button onClick={(e) => { e.preventDefault(); handleToggleShow(item, targetType) }} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title={item.isShow ? "Hide" : "Show"}>
					<span className="text-[10px] font-bold">{item.isShow ? 'ON' : 'OFF'}</span>
				</button>
				<button onClick={(e) => { e.preventDefault(); handleDeleteItem(item, targetType) }} className="p-1.5 hover:bg-red-500 rounded-full text-white transition-colors" title="Delete">
					<Trash2 className="w-3 h-3" />
				</button>
			</div>
		)
	}

	return (
		<div className="w-full mt-12 pt-12 border-t border-[var(--color-border)]/10">
			
			{/* GEARS SECTION */}
			<div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h2 className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
						Gears & Hardware
					</h2>
					<p className="text-[var(--color-secondary)] text-base">
						Physical tools that help me build things.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Link
						href='/about/gears'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
						View All <ArrowRight className='w-4 h-4' />
					</Link>
				</div>
			</div>

			{isEditMode && <MagicInput targetType="gears" onAdd={(item) => handleAddItem(item, 'gears')} />}
			
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
				{displayGears.map((item, index) => {
					const primaryIconUrl = item.cover || '/images/default-app.png'

					return (
						<motion.div
							key={`gear-${item.name}-${index}`}
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true, margin: '-50px' }}
							transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
							className={cn(
								"group relative flex flex-col items-center justify-center p-5 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)]/50 hover:bg-[var(--color-card)]/80 hover:shadow-lg transition-all duration-300",
								isEditMode && !item.isShow && "opacity-50 grayscale"
							)}
						>
							<div className="relative w-14 h-14 rounded-2xl bg-white/10 shadow-sm flex items-center justify-center mb-3 overflow-hidden group-hover:scale-110 transition-transform duration-300">
								<img 
									src={primaryIconUrl}
									alt={item.name}
									className="w-full h-full object-cover"
									onError={(e) => { 
										const target = e.target as HTMLImageElement
										target.src = '/images/default-app.png'
									}}
								/>
								{uploadingItem?.item === item && (
									<div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
										<Loader2 className="w-5 h-5 text-white animate-spin" />
									</div>
								)}
							</div>

							{isEditMode ? (
								<div className="flex flex-col w-full gap-1 items-center z-20">
									<input 
										value={item.name}
										onChange={e => handleUpdateField(item, 'name', e.target.value, 'gears')}
										onBlur={() => handleBlurItem('gears')}
										className="text-[var(--color-primary)] font-semibold text-sm text-center bg-transparent border border-transparent focus:bg-[var(--color-brand)]/10 focus:border-[var(--color-brand)]/50 focus:ring-1 focus:ring-[var(--color-brand)]/50 rounded-md outline-none w-full px-2 py-0.5 transition-all"
									/>
									<input 
										value={item.desc}
										onChange={e => handleUpdateField(item, 'desc', e.target.value, 'gears')}
										onBlur={() => handleBlurItem('gears')}
										className="text-[var(--color-secondary)] text-[11px] text-center bg-transparent border border-transparent focus:bg-[var(--color-brand)]/10 focus:border-[var(--color-brand)]/50 focus:ring-1 focus:ring-[var(--color-brand)]/50 rounded-md outline-none w-full px-2 py-0.5 transition-all"
									/>
								</div>
							) : (
								<>
									<h3 className="text-[var(--color-primary)] font-semibold text-sm text-center line-clamp-1 w-full">
										{item.name}
									</h3>
									<p className="text-[var(--color-secondary)] text-[11px] text-center mt-1 line-clamp-1 w-full">
										{item.desc}
									</p>
								</>
							)}

							{item.link && !isEditMode && (
								<a href={item.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 rounded-3xl" aria-label={item.name} />
							)}
							{renderEditOverlay(item, 'gears')}
						</motion.div>
					)
				})}
			</div>

			{/* SOFTWARE SECTION */}
			<div className="mt-20 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h2 className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
						App Library
					</h2>
					<p className="text-[var(--color-secondary)] text-base">
						Software I use daily.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Link
						href='/about/software'
						className='flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'
					>
						View All <ArrowRight className='w-4 h-4' />
					</Link>
				</div>
			</div>

			{isEditMode && <MagicInput targetType="software" onAdd={(item) => handleAddItem(item, 'software')} />}

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
				{displaySoftware.map((item, index) => {
					let domain = ''
					if (item.link) {
						try { domain = new URL(item.link).hostname } catch (e) { }
					}
					const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}` : '/images/default-app.png'
					const googleFaviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '/images/default-app.png'
					const primaryIconUrl = item.cover || clearbitUrl

					return (
						<motion.div
							key={`software-${item.name}-${index}`}
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true, margin: '-50px' }}
							transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
							className={cn(
								"group relative flex flex-col items-center justify-center p-5 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)]/50 hover:bg-[var(--color-card)]/80 hover:shadow-lg transition-all duration-300",
								isEditMode && !item.isShow && "opacity-50 grayscale"
							)}
						>
							<div className="relative w-14 h-14 rounded-2xl bg-white/10 shadow-sm flex items-center justify-center mb-3 overflow-hidden group-hover:scale-110 transition-transform duration-300">
								<img 
									src={primaryIconUrl}
									alt={item.name}
									className="w-10 h-10 object-contain"
									onError={(e) => { 
										const target = e.target as HTMLImageElement
										if (target.src === primaryIconUrl && !item.cover) {
											target.src = googleFaviconUrl
										} else {
											target.src = '/images/default-app.png'
										}
									}}
								/>
								{uploadingItem?.item === item && (
									<div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
										<Loader2 className="w-5 h-5 text-white animate-spin" />
									</div>
								)}
							</div>

							{isEditMode ? (
								<div className="flex flex-col w-full gap-1 items-center z-20">
									<input 
										value={item.name}
										onChange={e => handleUpdateField(item, 'name', e.target.value, 'software')}
										onBlur={() => handleBlurItem('software')}
										className="text-[var(--color-primary)] font-semibold text-sm text-center bg-transparent border border-transparent focus:bg-[var(--color-brand)]/10 focus:border-[var(--color-brand)]/50 focus:ring-1 focus:ring-[var(--color-brand)]/50 rounded-md outline-none w-full px-2 py-0.5 transition-all"
									/>
									<input 
										value={item.desc}
										onChange={e => handleUpdateField(item, 'desc', e.target.value, 'software')}
										onBlur={() => handleBlurItem('software')}
										className="text-[var(--color-secondary)] text-[11px] text-center bg-transparent border border-transparent focus:bg-[var(--color-brand)]/10 focus:border-[var(--color-brand)]/50 focus:ring-1 focus:ring-[var(--color-brand)]/50 rounded-md outline-none w-full px-2 py-0.5 transition-all"
									/>
								</div>
							) : (
								<>
									<h3 className="text-[var(--color-primary)] font-semibold text-sm text-center line-clamp-1 w-full">
										{item.name}
									</h3>
									<p className="text-[var(--color-secondary)] text-[11px] text-center mt-1 line-clamp-1 w-full">
										{item.desc}
									</p>
								</>
							)}

							{item.link && !isEditMode && (
								<a href={item.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 rounded-3xl" aria-label={item.name} />
							)}
							{renderEditOverlay(item, 'software')}
						</motion.div>
					)
				})}
			</div>
			
			<div className="flex gap-4 mt-12 justify-center">
				<Link href="/about/gears" className="text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1 px-4 py-2 rounded-full border border-[var(--color-border)]/30 hover:border-[var(--color-brand)] bg-[var(--color-card)]">
					View All Gears <ArrowRight className="w-4 h-4" />
				</Link>
				<Link href="/about/software" className="text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1 px-4 py-2 rounded-full border border-[var(--color-border)]/30 hover:border-[var(--color-brand)] bg-[var(--color-card)]">
					View All Software <ArrowRight className="w-4 h-4" />
				</Link>
			</div>

			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept="image/*"
				onChange={handleFileUpload}
			/>
		</div>
	)
}
