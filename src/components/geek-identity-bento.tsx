'use client'

import { useState, useEffect, useRef } from 'react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { AnimatedList } from '@/components/ui/animated-list'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { Marquee } from '@/components/ui/marquee'
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
	Cpu,
	Sparkles,
	Layers,
	FileText,
	Terminal
} from 'lucide-react'

const files = [
	{ name: 'agent.core.ts', ext: '.ts', icon: FileCode2, color: 'text-blue-500', size: '2.4 KB' },
	{ name: 'architecture.config', ext: '.config', icon: Code2, color: 'text-purple-500', size: '1.8 KB' },
	{ name: 'schema.prisma', ext: '.prisma', icon: Cpu, color: 'text-emerald-500', size: '3.1 KB' },
	{ name: 'tailwind.config.ts', ext: '.ts', icon: Layers, color: 'text-cyan-500', size: '4.2 KB' },
	{ name: 'route.edge.ts', ext: '.ts', icon: Zap, color: 'text-amber-500', size: '1.2 KB' },
]

const notifications = [
	{
		id: 1,
		title: 'Production Deployed',
		time: '2m ago',
		description: 'All static assets synced to global edge CDN',
		icon: CheckCircle2,
		color: 'text-emerald-500 bg-emerald-500/10',
	},
	{
		id: 2,
		title: 'Edge Latency: 12ms',
		time: '5m ago',
		description: 'Cloudflare cached with 100% performance score',
		icon: Zap,
		color: 'text-blue-500 bg-blue-500/10',
	},
	{
		id: 3,
		title: 'Nomad Base Station',
		time: 'LIVE',
		description: 'Hangzhou · GMT+8 Active Digital Nomad',
		icon: MapPin,
		color: 'text-rose-500 bg-rose-500/10',
	},
	{
		id: 4,
		title: 'GitHub Commit Pushed',
		time: 'Just now',
		description: 'main branch updated with zero downtime',
		icon: GitBranch,
		color: 'text-purple-500 bg-purple-500/10',
	},
]

export function GeekIdentityBento({ className }: { className?: string }) {
	const [timeString, setTimeString] = useState<string>('')
	const [currentDay, setCurrentDay] = useState<number>(1)
	const [currentMonth, setCurrentMonth] = useState<string>('September')
	const [currentYear, setCurrentYear] = useState<number>(2026)
	const [mounted, setMounted] = useState<boolean>(false)

	// Animated Beam Refs
	const containerRef = useRef<HTMLDivElement>(null)
	const div1Ref = useRef<HTMLDivElement>(null)
	const div2Ref = useRef<HTMLDivElement>(null)
	const div3Ref = useRef<HTMLDivElement>(null)
	const div4Ref = useRef<HTMLDivElement>(null)
	const div5Ref = useRef<HTMLDivElement>(null)
	const div6Ref = useRef<HTMLDivElement>(null)

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
				{/* ════════════════ 1. Save your files (Live Marquee) ════════════════ */}
				<BentoCard
					name="Save your files"
					description="We automatically save your files as you type."
					Icon={FileCode2}
					href="https://github.com/lyt04919"
					cta="Learn more"
					className="col-span-1"
					background={
						<div className="size-full flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
							<Marquee pauseOnHover duration="18s" className="py-2">
								{files.map((file, idx) => {
									const IconComp = file.icon
									return (
										<div
											key={idx}
											className="w-28 h-32 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 p-3 shadow-md flex flex-col justify-between shrink-0 select-none transition-all duration-300 hover:scale-105 hover:shadow-lg"
										>
											<div className="flex items-center justify-between">
												<IconComp className={`size-4 ${file.color}`} />
												<span className="text-[9px] font-mono font-bold text-zinc-400">{file.ext}</span>
											</div>
											<div className="space-y-1">
												<div className="h-1.5 w-14 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
												<div className="h-1.5 w-8 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
											</div>
											<span className="text-[9.5px] font-mono font-bold text-zinc-700 dark:text-zinc-200 truncate">
												{file.name}
											</span>
										</div>
									)
								})}
							</Marquee>
						</div>
					}
				/>

				{/* ════════════════ 2. Notifications (Live AnimatedList) ════════════════ */}
				<BentoCard
					name="Notifications"
					description="Get notified when something happens."
					Icon={Bell}
					href="https://github.com/lyt04919"
					cta="Learn more"
					className="col-span-1 md:col-span-2"
					background={
						<div className="size-full flex flex-col justify-start px-6 pt-3 overflow-hidden select-none">
							<AnimatedList delay={2000}>
								{notifications.map((item) => {
									const IconComp = item.icon
									return (
										<div
											key={item.id}
											className="flex items-center gap-3 p-2.5 px-4 rounded-xl bg-white/95 dark:bg-zinc-800/95 border border-zinc-200/90 dark:border-zinc-700/90 shadow-sm"
										>
											<div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
												<IconComp className="size-4" />
											</div>
											<div className="flex flex-col flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{item.title}</span>
													<span className="text-[10px] text-zinc-400 font-mono">{item.time}</span>
												</div>
												<span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{item.description}</span>
											</div>
										</div>
									)
								})}
							</AnimatedList>
						</div>
					}
				/>

				{/* ════════════════ 3. Integrations (Live AnimatedBeam) ════════════════ */}
				<BentoCard
					name="Integrations"
					description="Supports 100+ integrations and counting."
					Icon={Share2}
					href="https://github.com/lyt04919"
					cta="Learn more"
					className="col-span-1 md:col-span-2"
					background={
						<div
							ref={containerRef}
							className="relative size-full flex items-center justify-between px-10 overflow-hidden select-none"
						>
							{/* Left Node: YOU */}
							<div
								ref={div1Ref}
								className="size-11 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 shadow-lg flex items-center justify-center text-xs font-bold font-mono text-zinc-800 dark:text-zinc-100 z-10"
							>
								YOU
							</div>

							{/* Center Hub Node */}
							<div
								ref={div2Ref}
								className="size-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl flex items-center justify-center text-xs font-extrabold font-mono z-10"
							>
								HUB
							</div>

							{/* Right Stack Column Nodes */}
							<div className="flex flex-col gap-2 z-10">
								<div
									ref={div3Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-blue-500 font-mono"
								>
									React
								</div>
								<div
									ref={div4Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-zinc-800 dark:text-zinc-100 font-mono"
								>
									Next
								</div>
								<div
									ref={div5Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-blue-600 font-mono"
								>
									TS
								</div>
								<div
									ref={div6Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-emerald-500 font-mono"
								>
									Git
								</div>
							</div>

							{/* Animated Beams connecting nodes */}
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div1Ref}
								toRef={div2Ref}
								duration={2.5}
								gradientStartColor="#3b82f6"
								gradientStopColor="#8b5cf6"
							/>
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div2Ref}
								toRef={div3Ref}
								duration={3}
								delay={0.2}
								curvature={-25}
								gradientStartColor="#8b5cf6"
								gradientStopColor="#3b82f6"
							/>
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div2Ref}
								toRef={div4Ref}
								duration={3}
								delay={0.4}
								curvature={-8}
								gradientStartColor="#8b5cf6"
								gradientStopColor="#06b6d4"
							/>
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div2Ref}
								toRef={div5Ref}
								duration={3}
								delay={0.6}
								curvature={8}
								gradientStartColor="#8b5cf6"
								gradientStopColor="#3b82f6"
							/>
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div2Ref}
								toRef={div6Ref}
								duration={3}
								delay={0.8}
								curvature={25}
								gradientStartColor="#8b5cf6"
								gradientStopColor="#10b981"
							/>
						</div>
					}
				/>

				{/* ════════════════ 4. Calendar & Time (Interactive Calendar) ════════════════ */}
				<BentoCard
					name="Calendar"
					description="Use the calendar to filter your files by date."
					Icon={CalendarDays}
					href="/about"
					cta="Learn more"
					className="col-span-1"
					background={
						<div className="size-full flex flex-col items-center justify-center pt-2 select-none">
							<div className="w-full max-w-[200px] rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 shadow-md">
								<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/80 pb-2 mb-2">
									<span className="text-xs font-bold text-rose-500 font-mono">{currentMonth} {currentYear}</span>
									<span className="text-[10px] font-mono font-bold text-zinc-400">{timeString || '00:00:00'}</span>
								</div>
								<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-400 mb-1">
									<span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
								</div>
								<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
									<span className="opacity-30">30</span>
									<span className="opacity-30">31</span>
									<span className="font-semibold">1</span>
									<span className="size-5 mx-auto rounded-full bg-rose-500 text-white font-bold flex items-center justify-center shadow-xs animate-pulse">
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
