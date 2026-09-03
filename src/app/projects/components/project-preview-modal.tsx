'use client'

import { useState, useEffect } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import type { Project } from './project-card'
import {
	Monitor,
	Tablet,
	Smartphone,
	RotateCw,
	ExternalLink,
	X,
	Globe,
	Github,
	BookOpen,
	ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectPreviewModalProps {
	project: Project | null
	onClose: () => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export default function ProjectPreviewModal({
	project,
	onClose
}: ProjectPreviewModalProps) {
	const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
	const [iframeKey, setIframeKey] = useState(0)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setIsLoading(true)
		setIframeKey(prev => prev + 1)
	}, [project?.url, deviceMode])

	if (!project) return null

	const isGithubRepo =
		project.url.includes('github.com') ||
		Boolean(project.github && project.url === project.github)

	const displayDomain = project.url
		.replace(/^https?:\/\//, '')
		.replace(/\/.*$/, '')

	const deviceWidths: Record<DeviceMode, string> = {
		desktop: 'w-full max-w-6xl h-[78vh]',
		tablet: 'w-[768px] max-w-[95vw] h-[78vh]',
		mobile: 'w-[390px] max-w-[95vw] h-[78vh]'
	}

	return (
		<DialogModal
			open={Boolean(project)}
			onClose={onClose}
			className={cn(
				'rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300',
				deviceWidths[deviceMode]
			)}
		>
			{/* Top Mac Window Control Bar */}
			<div className="h-12 px-4 bg-zinc-100/90 dark:bg-zinc-950/90 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 select-none">
				{/* Left: Traffic Lights */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onClose}
						className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 hover:opacity-80 transition-opacity flex items-center justify-center group"
						title="关闭"
					>
						<X className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
					</button>
					<button
						type="button"
						onClick={() => {
							setIsLoading(true)
							setIframeKey(k => k + 1)
						}}
						className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 hover:opacity-80 transition-opacity flex items-center justify-center group"
						title="重新加载"
					>
						<RotateCw className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
					</button>
					<a
						href={project.url}
						target="_blank"
						rel="noreferrer"
						className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 hover:opacity-80 transition-opacity flex items-center justify-center group"
						title="在新标签页全屏打开"
					>
						<ExternalLink className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
					</a>
				</div>

				{/* Center: URL Bar & Device Switcher */}
				<div className="flex items-center gap-3">
					{/* Simulated Address Bar */}
					<div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 max-w-xs truncate shadow-xs">
						<span className="text-emerald-500">🔒</span>
						<span className="truncate">{displayDomain}</span>
					</div>

					{/* Device Switcher */}
					<div className="flex items-center p-0.5 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50">
						<button
							type="button"
							onClick={() => setDeviceMode('desktop')}
							className={cn(
								'p-1.5 rounded-lg transition-all',
								deviceMode === 'desktop'
									? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
									: 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
							)}
							title="桌面视口"
						>
							<Monitor className="w-3.5 h-3.5" />
						</button>
						<button
							type="button"
							onClick={() => setDeviceMode('tablet')}
							className={cn(
								'p-1.5 rounded-lg transition-all',
								deviceMode === 'tablet'
									? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
									: 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
							)}
							title="平板视口 (768px)"
						>
							<Tablet className="w-3.5 h-3.5" />
						</button>
						<button
							type="button"
							onClick={() => setDeviceMode('mobile')}
							className={cn(
								'p-1.5 rounded-lg transition-all',
								deviceMode === 'mobile'
									? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
									: 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
							)}
							title="手机视口 (390px)"
						>
							<Smartphone className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* Right: Actions */}
				<div className="flex items-center gap-2">
					<a
						href={project.url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-xs"
					>
						<span>打开新页</span>
						<ExternalLink className="w-3 h-3" />
					</a>
				</div>
			</div>

			{/* Main Canvas Viewport */}
			<div className="relative flex-1 w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden flex items-center justify-center">
				{/* Loading skeleton */}
				{isLoading && (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
						<RotateCw className="w-6 h-6 animate-spin text-[var(--color-brand)]" />
						<p className="text-xs text-zinc-500 font-medium">
							正在载入 {project.name} 运行环境...
						</p>
					</div>
				)}

				{isGithubRepo ? (
					/* GitHub Repo fallback card when iframe is restricted */
					<div className="max-w-md p-8 text-center flex flex-col items-center gap-4">
						<div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center shadow-lg">
							<Github className="w-8 h-8" />
						</div>
						<div>
							<h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
								{project.name}
							</h4>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
								该项目为 GitHub 开源仓库，因浏览器安全策略（X-Frame-Options）限制站内直接内嵌，建议在新窗口浏览完整源码与文档。
							</p>
						</div>
						<a
							href={project.url}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all"
						>
							<Github className="w-4 h-4" />
							<span>前往 GitHub 仓库</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</a>
					</div>
				) : (
					<iframe
						key={iframeKey}
						src={project.url}
						title={project.name}
						onLoad={() => setIsLoading(false)}
						className="w-full h-full border-none bg-white"
						sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
					/>
				)}
			</div>

			{/* Bottom Bar: Project Details & Context */}
			<div className="px-5 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs">
				<div className="flex items-center gap-3 min-w-0">
					<span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
						{project.name}
					</span>
					<span className="hidden sm:inline-block text-zinc-400 dark:text-zinc-500">
						|
					</span>
					<span className="hidden sm:inline-block text-zinc-500 dark:text-zinc-400 truncate max-w-md">
						{project.description}
					</span>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{project.blogSlug && (
						<a
							href={`/blog/${project.blogSlug}`}
							className="inline-flex items-center gap-1 text-[var(--color-brand)] font-semibold hover:underline"
						>
							<BookOpen className="w-3 h-3" />
							<span>阅读手记</span>
						</a>
					)}
					{project.github && (
						<a
							href={project.github}
							target="_blank"
							rel="noreferrer"
							className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
							title="查看 GitHub"
						>
							<Github className="w-4 h-4" />
						</a>
					)}
				</div>
			</div>
		</DialogModal>
	)
}
