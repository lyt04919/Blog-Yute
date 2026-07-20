'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUpRight, Github, ExternalLink, Sparkles, Award, Laptop, Plus, Settings, Trash2, Check, Monitor, AppWindow, Code } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ScrollFloat from '@/components/scroll-float/ScrollFloat'
import projectsData from '@/data/projects.json'
import initialGearsData from '@/app/about/gears.json'
import initialSoftwareData from '@/app/about/software.json'
import StarBadge from '@/components/ui/star-badge'
import { DialogModal } from '@/components/dialog-modal'
import { toast } from 'sonner'
import { CardSpotlight } from '@/components/ui/card-spotlight'

import { useConfigStore } from '../stores/config-store'
import { useAuthStore } from '@/hooks/use-auth'
import { RollingTextButton } from '@/components/ui/rolling-text-button'

export default function FeaturedProjects() {
	const siteContent = useConfigStore(state => state.siteContent)
	const isAuth = useAuthStore(state => state.isAuth)
	const featuredProjectsList = siteContent.featuredProjects || ['Pixel Motion', 'Path Motion', 'JSON Viewer', '箭头生成小工具']

	// Pick featured projects
	const featured = projectsData.filter(p => 
		featuredProjectsList.includes(p.name)
	)

	// Build initial full preset list (hardware + software)
	const fullPresets = useMemo(() => {
		const hw = initialGearsData.map((item: any) => ({ ...item, itemType: 'hardware' }))
		const sw = initialSoftwareData.map((item: any) => ({ ...item, itemType: 'software' }))
		return [...hw, ...sw]
	}, [])

	// Gears & DevTools State with LocalStorage persistence support
	const [activeItems, setActiveItems] = useState<any[]>([])
	
	// Dialog state
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [activeModalTab, setActiveModalTab] = useState<'preset' | 'custom'>('preset')
	
	// Custom Form states
	const [formName, setFormName] = useState('')
	const [formType, setFormType] = useState<'hardware' | 'software'>('software')
	const [formCategory, setFormCategory] = useState('')
	const [formDesc, setFormDesc] = useState('')
	const [formCover, setFormCover] = useState('')
	const [formLink, setFormLink] = useState('')

	useEffect(() => {
		try {
			const saved = localStorage.getItem('yysuni_custom_dev_setup_v3')
			if (saved) {
				setActiveItems(JSON.parse(saved))
			} else {
				// Default focus on core hardware & software
				const defaultDevNames = [
					'Macbook Air M4', 
					'狼蛛 F99', 
					'Visual Studio Code', 
					'Google Antigravity'
				]
				const defaults = fullPresets.filter(i => defaultDevNames.some(d => i.name.includes(d) || d.includes(i.name)))
				setActiveItems(defaults.length > 0 ? defaults : fullPresets.slice(0, 4))
			}
		} catch (e) {
			console.error(e)
			setActiveItems(fullPresets.slice(0, 4))
		}
	}, [fullPresets])

	const saveActiveItems = (newList: any[]) => {
		setActiveItems(newList)
		try {
			localStorage.setItem('yysuni_custom_dev_setup_v3', JSON.stringify(newList))
		} catch (e) {
			console.error(e)
		}
	}

	const handleTogglePreset = (presetItem: any) => {
		const existsIndex = activeItems.findIndex(i => i.name === presetItem.name)
		if (existsIndex >= 0) {
			const updated = activeItems.filter((_, idx) => idx !== existsIndex)
			saveActiveItems(updated)
			toast.success(`已移出展示：${presetItem.name}`)
		} else {
			const updated = [presetItem, ...activeItems]
			saveActiveItems(updated)
			toast.success(`已加入编程Setup展示：${presetItem.name}`)
		}
	}

	const handleSaveCustom = () => {
		if (!formName.trim()) {
			toast.error('请填写名称')
			return
		}

		const newItem = {
			name: formName.trim(),
			itemType: formType,
			category: formCategory.trim() || (formType === 'hardware' ? '硬件' : '编程软件'),
			desc: formDesc.trim(),
			cover: formCover.trim() || (formType === 'software' ? 'https://code.visualstudio.com/favicon.ico' : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=800&auto=format&fit=crop'),
			link: formLink.trim(),
			isShow: true
		}

		const updated = [newItem, ...activeItems]
		saveActiveItems(updated)
		toast.success('自定义编程软硬件添加成功！')
		setIsEditModalOpen(false)
	}

	const handleDeleteItem = (name: string, e: any) => {
		e.preventDefault()
		e.stopPropagation()
		const updated = activeItems.filter(i => i.name !== name)
		saveActiveItems(updated)
		toast.success('已移除显示')
	}

	// Split active items into hardware and software for separated presentation
	const hardwareItems = useMemo(() => activeItems.filter(i => i.itemType === 'hardware').slice(0, 2), [activeItems])
	const softwareItems = useMemo(() => activeItems.filter(i => i.itemType === 'software').slice(0, 2), [activeItems])

	return (
		<section className="mx-auto w-full max-w-7xl px-6 py-12">
			{/* Manage / Preset Picker Dialog Modal */}
			<DialogModal
				open={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				className="card p-6 flex flex-col gap-4 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50"
			>
				<div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
					<h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
						<Code className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
						编程软硬件点选与管理控制台
					</h3>
				</div>

				<div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl text-xs font-semibold">
					<button
						onClick={() => setActiveModalTab('preset')}
						className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeModalTab === 'preset' ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow' : 'text-slate-600 dark:text-zinc-400'}`}
					>
						<Sparkles className="w-4 h-4" /> 自由打勾点选全量库 ({fullPresets.length})
					</button>
					<button
						onClick={() => setActiveModalTab('custom')}
						className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeModalTab === 'custom' ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow' : 'text-slate-600 dark:text-zinc-400'}`}
					>
						<Plus className="w-4 h-4" /> 自定义添加编程神器
					</button>
				</div>

				{activeModalTab === 'preset' && (
					<div className="space-y-3">
						<p className="text-xs text-slate-500 dark:text-zinc-400">
							勾选的编程硬件与软件将实时呈现在首页控制台（支持自由勾选与取消）：
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
							{fullPresets.map((item, idx) => {
								const isSelected = activeItems.some(i => i.name === item.name)
								return (
									<div 
										key={idx}
										onClick={() => handleTogglePreset(item)}
										className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-slate-100 dark:bg-zinc-800 border-slate-400 dark:border-zinc-500' : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 opacity-70 hover:opacity-100'}`}
									>
										<div className="flex items-center gap-2.5 overflow-hidden">
											<div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-600 flex items-center justify-center p-1">
												{item.cover ? (
													<img src={item.cover} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
												) : (
													item.itemType === 'software' ? <AppWindow className="w-4 h-4 text-slate-700 dark:text-zinc-300" /> : <Monitor className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
												)}
											</div>
											<div className="truncate">
												<h5 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{item.name}</h5>
												<span className="text-[10px] text-slate-400 font-mono">
													[{item.itemType === 'software' ? '软件' : '硬件'}] {item.category || ''}
												</span>
											</div>
										</div>

										<div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white text-white dark:text-zinc-900' : 'border-slate-300 dark:border-zinc-600'}`}>
											{isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{activeModalTab === 'custom' && (
					<div className="space-y-3 text-xs font-medium">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-slate-500 dark:text-zinc-400 mb-1">类型 *</label>
								<select 
									value={formType}
									onChange={(e: any) => setFormType(e.target.value)}
									className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none"
								>
									<option value="software">🚀 编程软件 / IDE</option>
									<option value="hardware">💻 编程硬件 / 设备</option>
								</select>
							</div>
							<div>
								<label className="block text-slate-500 dark:text-zinc-400 mb-1">名称 *</label>
								<input 
									type="text" 
									value={formName}
									onChange={e => setFormName(e.target.value)}
									placeholder="例如：VS Code / Antigravity" 
									className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-slate-500 dark:text-zinc-400 mb-1">分类</label>
								<input 
									type="text" 
									value={formCategory}
									onChange={e => setFormCategory(e.target.value)}
									placeholder="例如：AI Agent / 编辑器" 
									className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none"
								/>
							</div>
							<div>
								<label className="block text-slate-500 dark:text-zinc-400 mb-1">官网链接</label>
								<input 
									type="text" 
									value={formLink}
									onChange={e => setFormLink(e.target.value)}
									placeholder="https://..." 
									className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none"
								/>
							</div>
						</div>

						<div>
							<label className="block text-slate-500 dark:text-zinc-400 mb-1">图标 URL</label>
							<input 
								type="text" 
								value={formCover}
								onChange={e => setFormCover(e.target.value)}
								placeholder="图标链接..." 
								className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none"
							/>
						</div>
					</div>
				)}

				<div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
					<button 
						onClick={() => setIsEditModalOpen(false)}
						className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
					>
						完成关闭
					</button>
					{activeModalTab === 'custom' && (
						<button 
							onClick={handleSaveCustom}
							className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-md cursor-pointer flex items-center gap-1.5"
						>
							添加编程工具
						</button>
					)}
				</div>
			</DialogModal>

			{/* Unified Section Header */}
			<div className="mb-12 flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto relative z-10">
				<div className="flex items-center gap-3 mb-4">
					<StarBadge text="★ PORTFOLIO" />
					{isAuth && (
						<button
							onClick={() => useConfigStore.getState().setHomeDisplayModalOpen(true)}
							className="p-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-zinc-700"
							title="主页内容展示管理"
						>
							<Settings className="w-3.5 h-3.5" />
							<span>展示管理</span>
						</button>
					)}
				</div>
				<ScrollFloat
					animationDuration={1}
					ease='back.inOut(2)'
					scrollStart='center bottom+=50%'
					scrollEnd='bottom bottom-=40%'
					stagger={0.03}
					containerClassName="mb-4"
					textClassName="text-4xl md:text-5xl lg:text-6xl font-serif text-[var(--color-primary)] tracking-tight"
				>
					Selected *Works* Archive
				</ScrollFloat>
				<p className="text-sm text-[var(--color-secondary)] mb-6 max-w-xl">
					展示近年来用心打造的核心开源项目与设计作品。
				</p>
				<RollingTextButton href="/projects" text="查看所有代表作" secondaryText="View All Works →" variant="primary" />
			</div>

			{/* 3-Column Card Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
				{featured.map((project, idx) => (
					<CardSpotlight
						key={project.name}
						className="h-full rounded-[32px]"
						glowColor="rgba(124, 58, 237, 0.08)"
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
							className="group relative rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 bg-transparent p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden h-full cursor-pointer"
						>
							<a
								href={project.url}
								target="_blank"
								rel="noreferrer"
								className="relative z-10 flex flex-col h-full justify-between"
							>
								<div>
									{/* Thumbnail Image Container */}
									<div className="relative w-full h-44 rounded-2xl overflow-hidden mb-5 bg-slate-50 dark:bg-zinc-850/20 shrink-0">
										{project.image ? (
											<Image 
												src={project.image} 
												alt={project.name} 
												fill 
												unoptimized={true}
												className="object-cover transition-transform duration-700 group-hover:scale-105" 
											/>
										) : (
											<div className="w-full h-full bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
												<Laptop className="w-8 h-8" />
											</div>
										)}

										{/* Floating Direct Links: GitHub / NPM */}
										<div className="absolute top-3 right-3 flex items-center gap-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
											{(project as any).github && (
												<span
													onClick={(e) => {
														e.stopPropagation()
														e.preventDefault()
														window.open((project as any).github, '_blank', 'noreferrer')
													}}
													className="w-7 h-7 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 hover:border-white/30 text-white flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer"
													title="View GitHub Repository"
												>
													<Github className="w-3.5 h-3.5" />
												</span>
											)}
											{(project as any).npm && (
												<span
													onClick={(e) => {
														e.stopPropagation()
														e.preventDefault()
														window.open((project as any).npm, '_blank', 'noreferrer')
													}}
													className="h-7 px-2 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 hover:border-white/30 text-white flex items-center justify-center hover:scale-110 transition-all duration-200 text-[8px] font-mono font-black cursor-pointer"
													title="View NPM Package"
												>
													NPM
												</span>
											)}
										</div>
									</div>

									{/* Tags */}
									<div className="flex flex-wrap gap-2 mb-3">
										{project.tags?.slice(0, 3).map((tag, tIdx) => (
											<span key={tIdx} className="text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider bg-white dark:bg-zinc-900">
												{tag}
											</span>
										))}
									</div>

									{/* Title */}
									<h3 className="text-base font-extrabold text-zinc-950 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300 leading-snug line-clamp-1">
										{project.name}
									</h3>

									{/* Description */}
									<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed line-clamp-3">
										{project.description}
									</p>
								</div>

								{/* Minimalist Arrow Button for SaaS look */}
								<div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-purple-500 transition-colors duration-300">
									<span>Explore Project</span>
									<div className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shrink-0">
										<ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
									</div>
								</div>
							</a>
						</motion.div>
					</CardSpotlight>
				))}
			</div>
		</section>
	)
}
