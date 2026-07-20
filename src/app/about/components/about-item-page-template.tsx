'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Search, Trash2, Pin, PinOff, Sparkles, ExternalLink, Link2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { type FavoriteItem } from '../../favorite/components/favorite-item-card'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LogoUploadDialog, { type LogoItem } from '@/app/favorite/components/logo-upload-dialog'

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
		<div className="w-full relative mb-8 flex gap-2">
			<form onSubmit={handleAdd} className="relative flex-1">
				<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
					<Sparkles className={cn("w-4 h-4 text-[var(--color-brand)]", isParsing && "animate-spin")} />
				</div>
				<input
					type="text"
					placeholder={`✨ 输入 ${targetType === 'gears' ? '硬件名称' : '软件名称'} 或 官网链接，按回车全自动解析...`}
					value={url}
					onChange={e => setUrl(e.target.value)}
					disabled={isParsing}
					className="w-full pl-11 pr-4 py-4 bg-[var(--color-card)]/80 backdrop-blur-sm border border-[var(--color-brand)]/30 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] rounded-2xl outline-none text-sm text-[var(--color-primary)] placeholder:text-[var(--color-secondary)]/50 transition-all shadow-sm shadow-[var(--color-brand)]/5"
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
				className="flex-shrink-0 px-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] rounded-2xl text-sm font-medium transition-all"
			>
				+ 手动添加
			</button>
		</div>
	)
}

interface AboutItemPageTemplateProps {
	initialItems: FavoriteItem[]
	targetType: 'gears' | 'software'
	pageTitle: string
	pageDescription: string
	backUrl?: string
	backLabel?: string
}

export function AboutItemPageTemplate({
	initialItems,
	targetType,
	pageTitle,
	pageDescription,
	backUrl = '/about',
	backLabel = 'About'
}: AboutItemPageTemplateProps) {
	const [items, setItems] = useState<FavoriteItem[]>(initialItems)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeCategory, setActiveCategory] = useState('All')
	const [isEditMode, setIsEditMode] = useState(false)
	const [editingCoverItem, setEditingCoverItem] = useState<FavoriteItem | null>(null)
	
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const categories = useMemo(() => {
		const cats = new Set<string>()
		items.forEach(item => {
			if (item.category?.trim()) cats.add(item.category.trim())
		})
		return ['All', ...Array.from(cats)]
	}, [items])

	const filteredItems = useMemo(() => {
		let result = [...items]
		if (!isEditMode) result = result.filter(i => i.isShow)

		if (activeCategory !== 'All') {
			result = result.filter(item => item.category?.trim() === activeCategory)
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim()
			result = result.filter(
				item =>
					item.name.toLowerCase().includes(query) ||
					item.desc.toLowerCase().includes(query) ||
					item.category?.toLowerCase().includes(query)
			)
		}

		return result.sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1
			if (!a.isPinned && b.isPinned) return 1
			return 0
		})
	}, [items, activeCategory, searchQuery, isEditMode])

	const handleSaveData = async (updatedList: FavoriteItem[]) => {
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

	const handleAddItem = async (item: FavoriteItem) => {
		const newList = [...items, item]
		setItems(newList)
		await handleSaveData(newList)
	}

	const handleUpdateField = (originalItem: FavoriteItem, field: keyof FavoriteItem, value: any) => {
		setItems(items.map(i => i === originalItem ? { ...i, [field]: value } : i))
	}

	const handleBlurItem = async () => {
		await handleSaveData(items)
	}

	const handleDeleteItem = async (item: FavoriteItem) => {
		if (!confirm(`确定要删除 ${item.name} 吗？`)) return
		const newList = items.filter(i => i !== item)
		setItems(newList)
		await handleSaveData(newList)
	}

	const handleTogglePin = async (item: FavoriteItem) => {
		const newList = items.map(i => i === item ? { ...i, isPinned: !i.isPinned } : i)
		setItems(newList)
		await handleSaveData(newList)
	}

	const handleToggleShow = async (item: FavoriteItem) => {
		const newList = items.map(i => i === item ? { ...i, isShow: !i.isShow } : i)
		setItems(newList)
		await handleSaveData(newList)
	}

	return (
		<div className='min-h-screen relative pb-32 bg-bg'>
			{/* Top Hero Section */}
			<div className='mx-auto w-full max-w-7xl px-6 pt-32 pb-8'>
				<div className='flex items-center gap-2 mb-4'>
					<Link
						href={backUrl}
						className='flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] hover:scale-105 active:scale-95 transition-all text-[var(--color-secondary)] hover:text-[var(--color-primary)] shadow-sm'
					>
						<ArrowLeft className='w-4 h-4' />
					</Link>
					<span className='text-xs text-[var(--color-secondary)] font-semibold tracking-widest uppercase'>{backLabel}</span>
				</div>

				<div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
					<div>
						<h1 className='text-3xl font-extrabold tracking-tight lg:text-4xl mb-2 font-serif text-[var(--color-primary)]'>
							{pageTitle}
						</h1>
						<p className='text-[var(--color-secondary)] text-sm max-w-xl leading-relaxed'>
							{pageDescription}
						</p>
					</div>

					<div className='flex items-center gap-3'>
						{isEditMode ? (
							<motion.button onClick={() => setIsEditMode(false)} className='rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] px-5 py-2 text-sm shadow-md font-semibold hover:opacity-90 active:scale-95 transition-all'>
								退出编辑
							</motion.button>
						) : (
							!hideEditButton && (
								<motion.button onClick={() => setIsEditMode(true)} className='rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 px-5 py-2 text-sm shadow-sm font-medium transition-all'>
									进入编辑
								</motion.button>
							)
						)}
					</div>
				</div>
			</div>

			<div className='mx-auto w-full max-w-7xl px-6 pb-12 sticky top-4 z-40'>
				<div className='flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-[var(--color-border)]/50 shadow-sm'>
					{/* Category Filter */}
					<div className='flex gap-1 overflow-x-auto scrollbar-hide p-1'>
						{categories.map((category) => (
							<button
								key={category}
								onClick={() => setActiveCategory(category)}
								className={cn(
									'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 select-none',
									activeCategory === category
										? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-md scale-100'
										: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-card)] scale-95 hover:scale-100'
								)}
							>
								{category}
							</button>
						))}
					</div>

					{/* Search */}
					<div className='relative flex-shrink-0 p-1 md:w-64'>
						<div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
							<Search className='h-4 w-4 text-[var(--color-secondary)]' />
						</div>
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={`Search in ${pageTitle}...`}
							className='w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border border-[var(--color-border)]/50 focus:border-[var(--color-primary)]/30 rounded-xl text-sm outline-none transition-all placeholder:text-[var(--color-secondary)]/50 shadow-inner'
						/>
					</div>
				</div>
			</div>

			<div className='mx-auto w-full max-w-7xl px-6'>
				<AnimatePresence>
					{isEditMode && (
						<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
							<MagicInput targetType={targetType} onAdd={handleAddItem} />
						</motion.div>
					)}
				</AnimatePresence>

				{filteredItems.length === 0 ? (
					<div className='py-32 flex flex-col items-center justify-center text-center opacity-50'>
						<Search className='w-12 h-12 text-[var(--color-secondary)] mb-4' />
						<p className='text-lg font-medium text-[var(--color-primary)]'>No items found</p>
						<p className='text-sm text-[var(--color-secondary)]'>Try adjusting your search or filter.</p>
					</div>
				) : (
					<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{filteredItems.map((item, index) => {
							let domain = ''
							if (item.link) {
								try { domain = new URL(item.link).hostname } catch (e) { }
							}
							const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}` : '/images/default-app.png'
							const googleFaviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '/images/default-app.png'
							const primaryIconUrl = item.cover || (targetType === 'software' ? clearbitUrl : '/images/default-app.png')

							return (
								<motion.div
									key={`${targetType}-${item.name}-${index}`}
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
											className={targetType === 'gears' ? "w-full h-full object-cover" : "w-10 h-10 object-contain"}
											onError={(e) => { 
												const target = e.target as HTMLImageElement
												if (targetType === 'software' && target.src === primaryIconUrl && !item.cover) {
													target.src = googleFaviconUrl
												} else {
													target.src = '/images/default-app.png'
												}
											}}
										/>
									</div>

									{isEditMode ? (
										<div className="flex flex-col w-full gap-1 items-center z-20">
											<input 
												value={item.category || ''}
												onChange={e => handleUpdateField(item, 'category', e.target.value)}
												onBlur={handleBlurItem}
												placeholder="Tag"
												className="text-[var(--color-secondary)] text-[10px] text-center bg-transparent border-b border-[var(--color-brand)]/30 focus:border-[var(--color-brand)] outline-none w-full px-1"
											/>
											<input 
												value={item.name}
												onChange={e => handleUpdateField(item, 'name', e.target.value)}
												onBlur={handleBlurItem}
												className="text-[var(--color-primary)] font-semibold text-sm text-center bg-transparent border-b border-[var(--color-brand)]/30 focus:border-[var(--color-brand)] outline-none w-full px-1"
											/>
											<input 
												value={item.desc}
												onChange={e => handleUpdateField(item, 'desc', e.target.value)}
												onBlur={handleBlurItem}
												className="text-[var(--color-secondary)] text-[11px] text-center bg-transparent border-b border-[var(--color-brand)]/30 focus:border-[var(--color-brand)] outline-none w-full px-1"
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
									
									{isEditMode && (
										<div className="absolute top-2 right-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-md rounded-full p-1">
											<button onClick={(e) => { 
												e.preventDefault(); 
												const newLink = window.prompt('输入该项目的相关链接（可选）：', item.link);
												if (newLink !== null) {
													handleUpdateField(item, 'link', newLink);
													handleBlurItem();
												}
											}} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="Edit Link">
												<Link2 className="w-3 h-3" />
											</button>
											<button onClick={(e) => { 
												e.preventDefault(); 
												setEditingCoverItem(item);
											}} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="Edit Cover">
												<ImageIcon className="w-3 h-3" />
											</button>
											<button onClick={(e) => { e.preventDefault(); handleTogglePin(item) }} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title={item.isPinned ? "Unpin" : "Pin"}>
												{item.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
											</button>
											<button onClick={(e) => { e.preventDefault(); handleToggleShow(item) }} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title={item.isShow ? "Hide" : "Show"}>
												<span className="text-[10px] font-bold">{item.isShow ? 'ON' : 'OFF'}</span>
											</button>
											<button onClick={(e) => { e.preventDefault(); handleDeleteItem(item) }} className="p-1.5 hover:bg-red-500 rounded-full text-white transition-colors" title="Delete">
												<Trash2 className="w-3 h-3" />
											</button>
										</div>
									)}
								</motion.div>
							)
						})}
					</div>
				)}
			</div>

			{editingCoverItem && (
				<LogoUploadDialog
					currentLogo={editingCoverItem.cover}
					onClose={() => setEditingCoverItem(null)}
					onSubmit={async (logo: LogoItem) => {
						if (logo.type === 'url') {
							const newList = items.map(i => i === editingCoverItem ? { ...i, cover: logo.url } : i)
							setItems(newList)
							await handleSaveData(newList)
						}
						setEditingCoverItem(null)
					}}
				/>
			)}
		</div>
	)
}
