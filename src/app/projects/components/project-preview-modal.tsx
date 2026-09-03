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
	Maximize2,
	Minimize2,
	Github,
	BookOpen
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
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [iframeKey, setIframeKey] = useState(0)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setIsLoading(true)
		setIframeKey(prev => prev + 1)

		const timer = setTimeout(() => {
			setIsLoading(false)
		}, 5000)

		return () => clearTimeout(timer)
	}, [project?.url, deviceMode])

	if (!project) return null

	const isGithubRepo =
		project.url.includes('github.com') ||
		Boolean(project.github && project.url === project.github)

	const displayDomain = project.url
		.replace(/^https?:\/\//, '')
		.replace(/\/.*$/, '')

	const deviceWidthClasses: Record<DeviceMode, string> = {
		desktop: isFullscreen ? 'w-[98vw] max-w-[98vw]' : 'w-[95vw] max-w-7xl',
		tablet: 'w-[768px] max-w-[95vw]',
		mobile: 'w-[390px] max-w-[95vw]'
	}

	const modalHeight = isFullscreen ? '95vh' : '88vh'

	return (
		<DialogModal
			open={Boolean(project)}
			onClose={onClose}
			overlayClassName="p-2 sm:p-4 md:p-6"
			style={{ height: modalHeight, maxHeight: '96vh' }}
			className={cn(
				'rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300',
				deviceWidthClasses[deviceMode]
			)}
		>
			{/* Top Mac Window Control Bar */}
			<div className="h-12 px-4 bg-zinc-100/90 dark:bg-zinc-950/90 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 select-none">
				{/* Left: Traffic Lights */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onClose}
						className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10 hover:opacity-80 transition-opacity flex items-center justify-center group cursor-pointer"
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
						className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10 hover:opacity-80 transition-opacity flex items-center justify-center group cursor-pointer"
						title="重新加载"
					>
						<RotateCw className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
					</button>
					<button
						type="button"
						onClick={() => setIsFullscreen(prev => !prev)}
						className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10 hover:opacity-80 transition-opacity flex items-center justify-center group cursor-pointer"
						title={isFullscreen ? '退出全屏' : '全屏模式'}
					>
						{isFullscreen ? (
							<Minimize2 className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
						) : (
							<Maximize2 className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
						)}
					</button>
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
								'p-1.5 rounded-lg transition-all cursor-pointer',
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
								'p-1.5 rounded-lg transition-all cursor-pointer',
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
								'p-1.5 rounded-lg transition-all cursor-pointer',
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
					<button
						type="button"
						onClick={() => setIsFullscreen(prev => !prev)}
						className="hidden sm:inline-flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
						title={isFullscreen ? '还原窗口' : '最大化窗口'}
					>
						{isFullscreen ? (
							<Minimize2 className="w-3.5 h-3.5" />
						) : (
							<Maximize2 className="w-3.5 h-3.5" />
						)}
					</button>

					<a
						href={project.url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-xs cursor-pointer"
					>
						<span>打开新页</span>
						<ExternalLink className="w-3 h-3" />
					</a>
				</div>
			</div>

			{/* Main Canvas Viewport (Explicitly flex-1 and takes full remaining height) */}
			<div className="relative flex-1 min-h-0 w-full h-full bg-slate-50 dark:bg-zinc-950 overflow-hidden flex items-center justify-center">
				{/* Loading skeleton */}
				{isLoading && (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-4 text-center">
						<RotateCw className="w-7 h-7 animate-spin text-[var(--color-brand)]" />
						<p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
							正在载入 {project.name} 运行环境...
						</p>
						<a
							href={project.url}
							target="_blank"
							rel="noreferrer"
							className="text-xs text-[var(--color-brand)] font-semibold hover:underline pt-1"
						>
							加载较慢或提示受限？点击直接打开原网页 ↗
						</a>
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
						className="w-full h-full border-none bg-white dark:bg-zinc-900"
						sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
					/>
				)}
			</div>

			{/* Bottom Bar: Project Details & Context */}
			<div className="h-11 px-5 bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs shrink-0 select-none">
				<div className="flex items-center gap-3 min-w-0">
					<span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
						{project.name}
					</span>
					<span className="hidden sm:inline-block text-zinc-400 dark:text-zinc-500">
						|
					</span>
					<span className="hidden sm:inline-block text-zinc-500 dark:text-zinc-400 truncate max-w-lg">
						{project.description}
					</span>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					{project.blogSlug && (
						<a
							href={`/blog/${project.blogSlug}`}
							className="inline-flex items-center gap-1 text-[var(--color-brand)] font-semibold hover:underline"
						>
							<BookOpen className="w-3.5 h-3.5" />
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
