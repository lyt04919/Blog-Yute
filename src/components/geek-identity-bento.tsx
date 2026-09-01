'use client'

import { useState, useEffect } from 'react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { 
	FileCode2, 
	Bell, 
	Share2, 
	CalendarDays, 
	Zap, 
	CheckCircle2, 
	MapPin, 
	Clock,
	Code2,
	GitBranch,
	Music,
	Cpu
} from 'lucide-react'
import { motion } from 'motion/react'

export function GeekIdentityBento({ className }: { className?: string }) {
	const [timeString, setTimeString] = useState<string>('')
	const [currentDay, setCurrentDay] = useState<number>(1)
	const [currentMonth, setCurrentMonth] = useState<string>('September')
	const [currentYear, setCurrentYear] = useState<number>(2026)
	const [mounted, setMounted] = useState<boolean>(false)

	useEffect(() => {
		setMounted(true)
		const update = () => {
			const now = new Date()
			setTimeString(
				now.toLocaleTimeString('en-US', {
					hour12: false,
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
				})
			)
			setCurrentDay(now.getDate())
			setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long' }))
			setCurrentYear(now.getFullYear())
		}
		update()
		const timer = setInterval(update, 1000)
		return () => clearInterval(timer)
	}, [])

	return (
		<div className={className}>
			<BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[22rem]">
				{/* ════════════════ 1. File Stack (Col 1, Row 1 - like "Save your files") ════════════════ */}
				<BentoCard
					name="Save your architecture"
					description="模块化、高可维护的 TypeScript 与 Next.js 边缘架构设计。"
					Icon={FileCode2}
					href="https://github.com/lyt04919"
					cta="查看仓库源码"
					className="col-span-1"
					background={
						<div className="absolute top-4 inset-x-4 flex items-center justify-center gap-2.5 overflow-hidden select-none pointer-events-none">
							{/* File Card 1 */}
							<div className="w-28 h-32 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 p-3 shadow-md flex flex-col justify-between transform -rotate-3 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
								<div className="flex items-center justify-between text-zinc-400">
									<FileCode2 className="size-4 text-blue-500" />
									<span className="text-[9px] font-mono font-bold">.ts</span>
								</div>
								<div className="space-y-1">
									<div className="h-1.5 w-16 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
									<div className="h-1.5 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
								</div>
								<span className="text-[9.5px] font-mono font-bold text-zinc-600 dark:text-zinc-300 truncate">
									agent.core.ts
								</span>
							</div>

							{/* File Card 2 (Center highlight) */}
							<div className="w-32 h-36 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 shadow-xl flex flex-col justify-between z-10 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1">
								<div className="flex items-center justify-between">
									<Code2 className="size-4 text-purple-500" />
									<span className="text-[9px] font-mono font-bold text-purple-500">PROD</span>
								</div>
								<div className="space-y-1.5">
									<div className="h-2 w-20 bg-purple-500/20 rounded-full" />
									<div className="h-1.5 w-14 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
									<div className="h-1.5 w-18 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
								</div>
								<span className="text-[10px] font-mono font-extrabold text-zinc-800 dark:text-zinc-100 truncate">
									architecture.config
								</span>
							</div>

							{/* File Card 3 */}
							<div className="w-28 h-32 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 p-3 shadow-md flex flex-col justify-between transform rotate-3 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
								<div className="flex items-center justify-between text-zinc-400">
									<Cpu className="size-4 text-emerald-500" />
									<span className="text-[9px] font-mono font-bold">.env</span>
								</div>
								<div className="space-y-1">
									<div className="h-1.5 w-14 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
									<div className="h-1.5 w-8 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
								</div>
								<span className="text-[9.5px] font-mono font-bold text-zinc-600 dark:text-zinc-300 truncate">
									edge.worker.js
								</span>
							</div>
						</div>
					}
				/>

				{/* ════════════════ 2. Notifications (Col 2-3, Row 1 - like "Notifications") ════════════════ */}
				<BentoCard
					name="Real-time Pulse & Notifications"
					description="全自动边缘构建、毫秒级响应分发与全天候在线的数字游民基站。"
					Icon={Bell}
					href="https://github.com/lyt04919"
					cta="查看系统运行日志"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute top-3 inset-x-6 flex flex-col gap-2.5 overflow-hidden select-none pointer-events-none">
							{/* Notification Item 1 */}
							<div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm transition-all duration-300 group-hover:translate-x-1">
								<div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
									<CheckCircle2 className="size-4" />
								</div>
								<div className="flex flex-col flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">Production Deployed</span>
										<span className="text-[10px] text-zinc-400 font-mono">2m ago</span>
									</div>
									<span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">All static assets synced to global edge</span>
								</div>
							</div>

							{/* Notification Item 2 */}
							<div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm transition-all duration-300 group-hover:translate-x-1 delay-75">
								<div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
									<Zap className="size-4" />
								</div>
								<div className="flex flex-col flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">Edge Latency: 12ms</span>
										<span className="text-[10px] text-zinc-400 font-mono">5m ago</span>
									</div>
									<span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Cloudflare CDN cached with 100% score</span>
								</div>
							</div>

							{/* Notification Item 3 */}
							<div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm transition-all duration-300 group-hover:translate-x-1 delay-150">
								<div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
									<MapPin className="size-4" />
								</div>
								<div className="flex flex-col flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">Nomad Base Station</span>
										<span className="text-[10px] text-zinc-400 font-mono">LIVE</span>
									</div>
									<span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Hangzhou · GMT+8 Active Nomad</span>
								</div>
							</div>
						</div>
					}
				/>

				{/* ════════════════ 3. Integrations (Col 1-2, Row 2 - like "Integrations") ════════════════ */}
				<BentoCard
					name="Integrations & Stack"
					description="深度整合 Next.js 16、TypeScript、React 19、Tailwind CSS、GitHub 与现代 AI 工具链。"
					Icon={Share2}
					href="https://github.com/lyt04919"
					cta="探索完整生态集成"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
							<svg className="w-full h-full max-w-[360px] max-h-[140px]" viewBox="0 0 360 140" fill="none">
								{/* Curved Connector Lines */}
								<path d="M 60 70 C 120 70, 120 30, 180 30" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700 stroke-dasharray-[4_4] animate-pulse" />
								<path d="M 60 70 C 120 70, 120 70, 180 70" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700" />
								<path d="M 60 70 C 120 70, 120 110, 180 110" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700 stroke-dasharray-[4_4]" />
								
								<path d="M 180 30 C 240 30, 240 25, 300 25" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700" />
								<path d="M 180 70 C 240 70, 240 60, 300 55" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700 stroke-dasharray-[4_4]" />
								<path d="M 180 70 C 240 70, 240 85, 300 85" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700" />
								<path d="M 180 110 C 240 110, 240 115, 300 115" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-700 stroke-dasharray-[4_4]" />

								{/* Left Origin Node */}
								<g transform="translate(40, 50)">
									<rect width="40" height="40" rx="12" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1.5" />
									<text x="20" y="25" textAnchor="middle" className="fill-zinc-800 dark:fill-zinc-100 font-bold text-xs font-mono">YOU</text>
								</g>

								{/* Center Core Node */}
								<g transform="translate(160, 50)">
									<rect width="40" height="40" rx="12" className="fill-purple-600 text-white shadow-lg" />
									<text x="20" y="25" textAnchor="middle" fill="white" className="font-extrabold text-xs font-mono">HUB</text>
								</g>

								{/* Right Stack Nodes */}
								<g transform="translate(285, 8)">
									<rect width="34" height="34" rx="10" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1.5" />
									<text x="17" y="21" textAnchor="middle" className="fill-blue-500 font-bold text-[10px] font-mono">React</text>
								</g>
								<g transform="translate(285, 42)">
									<rect width="34" height="34" rx="10" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1.5" />
									<text x="17" y="21" textAnchor="middle" className="fill-zinc-800 dark:fill-zinc-100 font-bold text-[10px] font-mono">Next</text>
								</g>
								<g transform="translate(285, 72)">
									<rect width="34" height="34" rx="10" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1.5" />
									<text x="17" y="21" textAnchor="middle" className="fill-blue-600 font-bold text-[10px] font-mono">TS</text>
								</g>
								<g transform="translate(285, 102)">
									<rect width="34" height="34" rx="10" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1.5" />
									<text x="17" y="21" textAnchor="middle" className="fill-emerald-500 font-bold text-[10px] font-mono">Git</text>
								</g>
							</svg>
						</div>
					}
				/>

				{/* ════════════════ 4. Calendar & Time (Col 3, Row 2 - like "Calendar") ════════════════ */}
				<BentoCard
					name="Calendar & Nomad Clock"
					description="全球时区与数字日程基站，保持高能心流专注。"
					Icon={CalendarDays}
					href="/about"
					cta="查看时区基站"
					className="col-span-1"
					background={
						<div className="absolute top-3 inset-x-6 flex flex-col items-center justify-center select-none pointer-events-none">
							{/* Mini Apple Calendar Widget */}
							<div className="w-full max-w-[200px] rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 shadow-md">
								<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/80 pb-2 mb-2">
									<span className="text-xs font-bold text-rose-500 font-mono">{currentMonth} {currentYear}</span>
									<span className="text-[10px] font-mono font-bold text-zinc-400">{timeString || '00:00'}</span>
								</div>
								<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-400 mb-1">
									<span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
								</div>
								<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
									<span className="opacity-30">30</span>
									<span className="opacity-30">31</span>
									<span className="font-semibold">1</span>
									<span className="size-5 mx-auto rounded-full bg-rose-500 text-white font-bold flex items-center justify-center shadow-xs">
										{mounted ? currentDay : 2}
									</span>
									<span className="font-semibold">3</span>
									<span className="font-semibold">4</span>
									<span className="font-semibold">5</span>
								</div>
							</div>
						</div>
					}
				/>
			</BentoGrid>
		</div>
	)
}
