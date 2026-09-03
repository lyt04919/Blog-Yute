import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSize } from '@/hooks/use-size'
import CreateDialog from './create-dialog'
import { toast } from 'sonner'
import {
	Globe,
	Github,
	Package,
	BookOpen,
	ArrowUpRight,
	Sparkles,
	Play,
	Copy,
	Check,
	Terminal
} from 'lucide-react'

export interface Project {
	name: string
	year: number
	description: string
	image: string
	url: string
	category?: 'Web 应用' | '开源工具' | '创意实验' | string
	tags: string[]
	github?: string
	npm?: string
	blogSlug?: string
	status?: string
	featured?: boolean
	banner?: string
}

interface ProjectCardProps {
	project: Project
	isEditMode?: boolean
	isFeatured?: boolean
	onPreview?: (project: Project) => void
	onTagClick?: (tag: string) => void
	onUpdate?: (project: Project, oldProject: Project) => void
	onDelete?: () => void
}

export function ProjectCard({
	project,
	isEditMode = false,
	isFeatured = false,
	onPreview,
	onTagClick,
	onUpdate,
	onDelete
}: ProjectCardProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [imageError, setImageError] = useState(false)
	const [copiedNpm, setCopiedNpm] = useState(false)
	const { maxSM } = useSize()
	const [localProject, setLocalProject] = useState(project)

	useEffect(() => {
		setLocalProject(project)
		setImageError(false)
	}, [project])

	const handleSave = (updatedProject: Project) => {
		setLocalProject(updatedProject)
		onUpdate?.(updatedProject, project)
		setIsEditing(false)
	}

	const displayHost = localProject.url
		? localProject.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
		: 'localhost'

	const isFullCover =
		Boolean(localProject.image) &&
		!localProject.image.includes('favicon') &&
		(localProject.image.endsWith('.png') ||
			localProject.image.endsWith('.jpg') ||
			localProject.image.endsWith('.jpeg') ||
			localProject.image.endsWith('.webp'))

	const npmPackageName = localProject.npm
		? localProject.npm
				.replace(/^https?:\/\/(www\.)?npmjs\.com\/package\//, '')
				.replace(/\/.*$/, '')
		: null

	const handleTriggerPreview = (e: React.MouseEvent) => {
		if (isEditMode) {
			setIsEditing(true)
			return
		}
		if (onPreview) {
			e.stopPropagation()
			onPreview(localProject)
		}
	}

	const handleCopyNpm = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!npmPackageName) return
		navigator.clipboard.writeText(`npm i ${npmPackageName}`)
		setCopiedNpm(true)
		toast.success(`已复制安装命令: npm i ${npmPackageName}`)
		setTimeout(() => setCopiedNpm(false), 2000)
	}

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 15 }}
				{...(maxSM ? { animate: { opacity: 1, y: 0 } } : { whileInView: { opacity: 1, y: 0 } })}
				transition={{ duration: 0.4 }}
				viewport={{ once: true, margin: '-40px' }}
				className={cn(
					'group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm hover:shadow-xl dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1',
					isFeatured && 'md:col-span-2'
				)}
			>
				{/* Admin Edit / Delete Floating Pill */}
				{isEditMode && (
					<div className="absolute top-3 right-3 z-30 flex gap-1.5 items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700">
						<button
							onClick={(e) => {
								e.stopPropagation()
								setIsEditing(true)
							}}
							className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors"
						>
							编辑
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation()
								onDelete?.()
							}}
							className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-600 text-white shadow-sm hover:bg-red-500 transition-colors"
						>
							删除
						</button>
					</div>
				)}

				<div>
					{/* Top Simulated Browser Mockup Viewport (Clickable for Live Preview) */}
					<div
						onClick={handleTriggerPreview}
						className="w-full bg-slate-50/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 cursor-pointer group/viewport relative"
						title={!isEditMode ? '点击快速试玩 / 演示' : undefined}
					>
						{/* Title Bar */}
						<div className="h-8 px-4 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs select-none">
							<div className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/90 border border-black/10 inline-block" />
								<span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/90 border border-black/10 inline-block" />
								<span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/90 border border-black/10 inline-block" />
							</div>

							<span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-[180px] sm:max-w-[260px]">
								{displayHost}
							</span>

							<div className="flex items-center gap-1.5">
								{localProject.category && (
									<span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
										{localProject.category === 'Web 应用' ? '🌐 ' : localProject.category === '开源工具' ? '🛠️ ' : '🎨 '}
										{localProject.category}
									</span>
								)}
								{localProject.status && (
									<span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
										{localProject.status}
									</span>
								)}
								<span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
									{localProject.year}
								</span>
							</div>
						</div>

						{/* Viewport Canvas */}
						<div
							className={cn(
								'relative w-full overflow-hidden flex items-center justify-center p-4 transition-colors',
								isFeatured ? 'h-44 sm:h-52' : 'h-36 sm:h-40',
								'bg-gradient-to-br from-slate-100/80 via-white to-slate-50 dark:from-zinc-900 dark:via-zinc-900/60 dark:to-zinc-950'
							)}
						>
							{/* Subtle background dot pattern */}
							<div className="absolute inset-0 opacity-[0.25] pointer-events-none [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] dark:[background-image:radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]" />

							{isFullCover && !imageError ? (
								<img
									src={localProject.image}
									alt={localProject.name}
									onError={() => setImageError(true)}
									className="relative z-10 max-h-full max-w-[90%] object-contain rounded-xl shadow-md border border-black/5 dark:border-white/10 group-hover:scale-105 transition-transform duration-500"
								/>
							) : !imageError && localProject.image && !localProject.image.startsWith('blob:') ? (
								<div className="relative z-10 flex items-center justify-center">
									<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-zinc-800 p-3 shadow-lg shadow-black/5 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-2 transition-all duration-300">
										<img
											src={localProject.image}
											alt={localProject.name}
											onError={() => setImageError(true)}
											className="w-full h-full object-contain"
										/>
									</div>
								</div>
							) : (
								<div className="relative z-10 flex items-center justify-center">
									<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
										{localProject.name.slice(0, 1).toUpperCase()}
									</div>
								</div>
							)}

							{isFeatured && (
								<div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 backdrop-blur-sm shadow-xs">
									<Sparkles className="w-3 h-3" />
									Featured
								</div>
							)}

							{/* Live Preview Hover Hint Pill */}
							{!isEditMode && onPreview && (
								<div className="absolute inset-0 z-20 bg-black/25 dark:bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/viewport:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
									<span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white text-xs font-bold shadow-xl border border-white/20 transform translate-y-2 group-hover/viewport:translate-y-0 transition-transform duration-200">
										<Play className="w-3.5 h-3.5 fill-current text-[var(--color-brand)]" />
										<span>快速试玩 / 演示</span>
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Card Body */}
					<div className="p-5 sm:p-6 flex flex-col gap-3">
						<div className="flex items-start justify-between gap-2">
							<h3
								onClick={handleTriggerPreview}
								className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--color-brand)] transition-colors leading-tight cursor-pointer inline-flex items-center gap-2"
							>
								<span>{localProject.name}</span>
							</h3>
						</div>

						<p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
							{localProject.description}
						</p>

						{/* Terminal-styled NPM Quick Install Component (For Open Source Packages) */}
						{npmPackageName && (
							<div
								onClick={handleCopyNpm}
								className="group/npm flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs select-none"
								title="点击复制 NPM 安装命令"
							>
								<div className="flex items-center gap-1.5 truncate">
									<Terminal className="w-3.5 h-3.5 text-zinc-400 select-none shrink-0" />
									<span className="text-[var(--color-brand)] font-bold select-none">$</span>
									<span className="truncate">npm i {npmPackageName}</span>
								</div>
								<span className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-500 group-hover/npm:text-zinc-900 dark:group-hover/npm:text-white">
									{copiedNpm ? (
										<>
											<Check className="w-3.5 h-3.5 text-emerald-500" />
											<span className="text-emerald-500 font-semibold">已复制</span>
										</>
									) : (
										<>
											<Copy className="w-3.5 h-3.5" />
											<span>复制</span>
										</>
									)}
								</span>
							</div>
						)}

						{/* Tags */}
						<div className="flex flex-wrap gap-1.5 pt-1">
							{localProject.tags.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										onTagClick?.(tag)
									}}
									className="rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Card Action Footer */}
				<div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 flex items-center gap-2 flex-wrap border-t border-zinc-100 dark:border-zinc-800/80 mt-auto">
					<Link
						href={localProject.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
					>
						<Globe className="w-3.5 h-3.5" />
						<span>Website</span>
						<ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
					</Link>

					{localProject.github && (
						<Link
							href={localProject.github}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 transition-all hover:scale-[1.02] active:scale-95"
						>
							<Github className="w-3.5 h-3.5" />
							<span>GitHub</span>
						</Link>
					)}

					{localProject.npm && (
						<Link
							href={localProject.npm.startsWith('http') ? localProject.npm : `https://www.npmjs.com/package/${localProject.npm}`}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 transition-all hover:scale-[1.02] active:scale-95"
						>
							<Package className="w-3.5 h-3.5" />
							<span>NPM</span>
						</Link>
					)}

					{localProject.blogSlug && (
						<Link
							href={`/blog/${localProject.blogSlug}`}
							onClick={(e) => e.stopPropagation()}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 hover:bg-[var(--color-brand)]/20 transition-all hover:scale-[1.02] active:scale-95 ml-auto"
						>
							<BookOpen className="w-3.5 h-3.5" />
							<span>深度解析</span>
						</Link>
					)}
				</div>
			</motion.div>

			{isEditing && (
				<CreateDialog
					project={localProject}
					onClose={() => setIsEditing(false)}
					onSave={handleSave}
				/>
			)}
		</>
	)
}
