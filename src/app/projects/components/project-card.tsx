import { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSize } from '@/hooks/use-size'
import CreateDialog from './create-dialog'
import { Globe, Github, Package, BookOpen } from 'lucide-react'

export interface Project {
	name: string
	year: number
	description: string
	image: string
	url: string
	tags: string[]
	github?: string
	npm?: string
	blogSlug?: string
	status?: string
}

interface ProjectCardProps {
	project: Project
	isEditMode?: boolean
	onUpdate?: (project: Project, oldProject: Project) => void
	onDelete?: () => void
}

export function ProjectCard({ project, isEditMode = false, onUpdate, onDelete }: ProjectCardProps) {
	const [isEditing, setIsEditing] = useState(false)
	const { maxSM } = useSize()
	const [localProject, setLocalProject] = useState(project)

	const handleSave = (updatedProject: Project) => {
		setLocalProject(updatedProject)
		onUpdate?.(updatedProject, project)
		setIsEditing(false)
	}

	return (
		<>
		<motion.div
			initial={{ opacity: 0, y: 15 }}
			{...(maxSM ? { animate: { opacity: 1, y: 0 } } : { whileInView: { opacity: 1, y: 0 } })}
			transition={{ duration: 0.4 }}
			viewport={{ once: true, margin: '-40px' }}
			className='relative flex flex-col justify-between gap-6 p-6 rounded-2xl border border-[var(--color-border)] shadow-sm bg-[var(--color-card)] transition-all duration-300 hover:shadow-xl hover:border-[var(--color-brand)]/20 hover:-translate-y-1 group'
			onClick={() => {
				if (isEditMode) {
					setIsEditing(true)
				}
			}}
		>
			{isEditMode && (
				<div className='absolute top-3 right-3 z-30 flex gap-1.5 items-center'>
					<button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} className='rounded-lg px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors'>
						编辑
					</button>
					<button onClick={(e) => { e.stopPropagation(); onDelete?.() }} className='rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-600 text-white shadow-sm hover:bg-red-500 transition-colors'>
						删除
					</button>
				</div>
			)}

			<div className='flex flex-col gap-4'>
				<div className='flex items-start gap-4'>
					<div className='group-hover:scale-105 transition-transform duration-300 relative shrink-0'>
						<img
							src={localProject.image}
							alt={localProject.name}
							className='h-14 w-14 rounded-2xl object-cover border border-[var(--color-border)] bg-[var(--color-bg)] shadow-inner'
						/>
					</div>
					<div className={cn('flex flex-col gap-1 flex-1 min-w-0 pt-0.5', isEditMode && 'pr-24')}>
						<div className='flex items-center gap-2.5 flex-wrap'>
							<h3 className='text-base sm:text-lg font-bold text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors truncate leading-tight'>
								{localProject.name}
							</h3>
							<span className='text-[var(--color-secondary)] text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)]'>
								{localProject.year}
							</span>
						</div>
					</div>
				</div>

				<p className='text-sm text-[var(--color-secondary)] leading-relaxed line-clamp-3'>
					{localProject.description}
				</p>

				<div className='flex flex-wrap gap-1.5'>
					{localProject.tags.map(tag => (
						<span key={tag} className='rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs text-[var(--color-secondary)] border border-[var(--color-border)]'>
							{tag}
						</span>
					))}
				</div>
			</div>

			<div className='flex items-center gap-2 pt-3 border-t border-[var(--color-border)]/60 mt-auto flex-wrap'>
				<Link
					href={localProject.url}
					target='_blank'
					rel='noopener noreferrer'
					onClick={(e) => e.stopPropagation()}
					className='flex items-center gap-1.5 bg-[var(--color-bg)] hover:bg-[var(--color-border)]/50 text-[var(--color-secondary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-sm hover:scale-[1.02]'
				>
					<Globe className="w-3.5 h-3.5" />
					Website
				</Link>
				{localProject.github && (
					<Link
						href={localProject.github}
						target='_blank'
						rel='noopener noreferrer'
						onClick={(e) => e.stopPropagation()}
						className='flex items-center gap-1.5 bg-[var(--color-bg)] hover:bg-[var(--color-border)]/50 text-[var(--color-secondary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-sm hover:scale-[1.02]'
					>
						<Github className="w-3.5 h-3.5" />
						GitHub
					</Link>
				)}
				{localProject.npm && (
					<Link
						href={localProject.npm}
						target='_blank'
						rel='noopener noreferrer'
						onClick={(e) => e.stopPropagation()}
						className='flex items-center gap-1.5 bg-[var(--color-bg)] hover:bg-[var(--color-border)]/50 text-[var(--color-secondary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-sm hover:scale-[1.02]'
					>
						<Package className="w-3.5 h-3.5" />
						NPM
					</Link>
				)}
				{localProject.blogSlug && (
					<Link
						href={`/blog/${localProject.blogSlug}`}
						onClick={(e) => e.stopPropagation()}
						className='flex items-center gap-1.5 bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 hover:bg-[var(--color-brand)]/20 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm hover:scale-[1.02]'
					>
						<BookOpen className="w-3.5 h-3.5 animate-pulse" />
						深度解析
					</Link>
				)}
				{localProject.status && (
					<div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-secondary)] text-xs font-medium shadow-sm">
						<div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] opacity-60 animate-pulse"></div>
						{localProject.status}
					</div>
				)}
			</div>
		</motion.div>

		{isEditing && (
			<CreateDialog project={localProject} onClose={() => setIsEditing(false)} onSave={handleSave} />
		)}
		</>
	)
}

