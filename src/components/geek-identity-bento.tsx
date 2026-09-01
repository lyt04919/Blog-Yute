'use client'

import { useState, useEffect } from 'react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { 
	Terminal, 
	Globe, 
	Disc3, 
	GitBranch, 
	Laptop, 
	Sparkles, 
	Clock, 
	MapPin, 
	Code2,
	Cpu,
	Music2,
	Flame
} from 'lucide-react'
import { motion } from 'motion/react'
import gearsData from '@/app/about/gears.json'
import musicData from '@/app/favorite/music.json'

export function GeekIdentityBento({ className }: { className?: string }) {
	const [timeString, setTimeString] = useState<string>('')
	const [mounted, setMounted] = useState<boolean>(false)

	useEffect(() => {
		setMounted(true)
		const updateTime = () => {
			const now = new Date()
			setTimeString(
				now.toLocaleTimeString('en-US', {
					hour12: false,
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
				})
			)
		}
		updateTime()
		const timer = setInterval(updateTime, 1000)
		return () => clearInterval(timer)
	}, [])

	const currentMusic = musicData[0] || { name: 'Sunset Flow', subtitle: 'Lofi Vibes' }
	const topGears = (gearsData as any[]).filter((g) => g.isShow !== false).slice(0, 6)

	return (
		<div className={className}>
			<BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[20rem] sm:auto-rows-[22rem]">
				{/* ════════════════ Card 1: 🛠️ 全栈工程与架构哲学 (Col 1-2, Row 1) ════════════════ */}
				<BentoCard
					name="Full Stack Craftsman & System Architect"
					description="精通 Next.js 16、React 19、TypeScript 与 AI Agent 架构，专注于高性能 Web 系统设计与优雅交互体验。"
					Icon={Terminal}
					href="https://github.com/lyt04919"
					cta="探索开源与架构哲学"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-0 flex flex-col justify-between p-6 opacity-30 dark:opacity-20 select-none pointer-events-none">
							<div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
								<div className="size-2.5 rounded-full bg-rose-500/80" />
								<div className="size-2.5 rounded-full bg-amber-500/80" />
								<div className="size-2.5 rounded-full bg-emerald-500/80" />
								<span className="ml-2 font-semibold text-zinc-400">~/architecture/philosophy.ts</span>
							</div>
							<div className="font-mono text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 pl-2 border-l border-zinc-300 dark:border-zinc-700">
								<p><span className="text-purple-500">const</span> <span className="text-blue-500">craftsman</span> = &#123;</p>
								<p className="pl-4">principles: [<span className="text-emerald-500">'Clean Architecture'</span>, <span className="text-emerald-500">'Ultra-Low Latency'</span>, <span className="text-emerald-500">'Zero Bloat'</span>],</p>
								<p className="pl-4">stack: [<span className="text-emerald-500">'Next.js'</span>, <span className="text-emerald-500">'TypeScript'</span>, <span className="text-emerald-500">'Tailwind'</span>, <span className="text-emerald-500">'Motion'</span>, <span className="text-emerald-500">'LLM Agent'</span>],</p>
								<p className="pl-4">status: <span className="text-amber-500">'Shipping production-grade software'</span></p>
								<p>&#125;</p>
							</div>
							{/* Floating Tech Badges */}
							<div className="flex flex-wrap gap-2 pt-2">
								{['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Motion/React', 'Cloudflare', 'AI SDK'].map((tech) => (
									<span key={tech} className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/50">
										{tech}
									</span>
								))}
							</div>
						</div>
					}
				/>

				{/* ════════════════ Card 2: 🌍 数字游民与基站时区 (Col 3, Row 1-2 双高卡) ════════════════ */}
				<BentoCard
					name="Nomad Station & World Time"
					description="跨越地理维度的全球协同探索，随时随地开启沉浸式高效编码。"
					Icon={Globe}
					href="/#trajectory-map"
					cta="查看游民足迹地图"
					className="col-span-1 md:col-span-1 md:row-span-2 auto-rows-auto"
					background={
						<div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
							{/* Radar pulse ripples */}
							<div className="absolute size-48 rounded-full border border-blue-500/20 animate-ping opacity-25" />
							<div className="absolute size-36 rounded-full border border-blue-500/30" />
							<div className="absolute size-24 rounded-full border border-blue-500/40 bg-blue-500/5" />
							
							{/* Ambient globe grid */}
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0,transparent_70%)]" />
						</div>
					}
				>
					{/* Live Time Display */}
					<div className="my-auto py-6 flex flex-col items-center justify-center text-center">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-4 backdrop-blur-md">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span>LIVE ONLINE</span>
						</div>
						<div className="font-mono text-3xl sm:text-4xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight flex items-center justify-center gap-2">
							<Clock className="size-6 text-blue-500 animate-pulse" />
							<span>{mounted ? timeString || '00:00:00' : '00:00:00'}</span>
						</div>
						<div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
							<MapPin className="size-3.5 text-rose-500" />
							<span>Hangzhou · GMT+8 / Earth Base</span>
						</div>
					</div>
				</BentoCard>

				{/* ════════════════ Card 3: 🎵 黑胶唱片与声浪律动 (Col 1, Row 2) ════════════════ */}
				<BentoCard
					name="Sonic Sanctuary"
					description="黑胶低鸣与电子声浪，在沉浸音乐氛围中构筑纯粹心流代码世界。"
					Icon={Disc3}
					href="/#favorites-lounge"
					cta="进入视听室聆听"
					className="col-span-1"
					background={
						<div className="absolute inset-0 flex items-center justify-end pr-4 opacity-25 dark:opacity-20 overflow-hidden">
							{/* Rotating Vinyl Record */}
							<div className="size-36 rounded-full bg-zinc-950 border-4 border-zinc-800 shadow-2xl flex items-center justify-center animate-[spin_12s_linear_infinite]">
								<div className="size-24 rounded-full border border-zinc-700/60 flex items-center justify-center">
									<div className="size-12 rounded-full bg-amber-500/80 flex items-center justify-center text-[8px] font-bold text-black font-mono">
										VINYL
									</div>
								</div>
							</div>
						</div>
					}
				>
					{/* Music Equalizer Visualizer */}
					<div className="flex items-center gap-3 pt-2">
						<div className="flex items-end gap-1 h-6">
							{[40, 75, 100, 50, 90, 65, 80].map((h, i) => (
								<motion.div
									key={i}
									animate={{ height: ['20%', `${h}%`, '30%'] }}
									transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15, ease: 'easeInOut' }}
									className="w-1 rounded-full bg-[var(--color-brand)] opacity-80"
								/>
							))}
						</div>
						<div className="text-xs truncate">
							<p className="font-semibold text-zinc-700 dark:text-zinc-200 truncate">{currentMusic.name}</p>
							<p className="text-[10px] text-zinc-400 truncate">{currentMusic.subtitle || 'Now Playing'}</p>
						</div>
					</div>
				</BentoCard>

				{/* ════════════════ Card 4: 🚀 GitHub 脉冲与开源贡献 (Col 2, Row 2) ════════════════ */}
				<BentoCard
					name="Open Source Pulse"
					description="坚持代码开源与知识共享，构建纯静态、零运维的高性能现代化架构。"
					Icon={GitBranch}
					href="https://github.com/lyt04919"
					cta="查看 GitHub 仓库"
					className="col-span-1"
					background={
						<div className="absolute inset-0 flex items-center justify-center p-6 opacity-25 dark:opacity-20">
							{/* Matrix Contribution Dots */}
							<div className="grid grid-cols-8 gap-1.5">
								{Array.from({ length: 32 }).map((_, i) => {
									const levels = [
										'bg-zinc-300 dark:bg-zinc-800',
										'bg-emerald-300 dark:bg-emerald-900/60',
										'bg-emerald-400 dark:bg-emerald-700',
										'bg-emerald-500 dark:bg-emerald-500',
									]
									const level = levels[i % 4]
									return (
										<div
											key={i}
											className={`size-3 rounded-xs ${level} transition-all duration-300`}
										/>
									)
								})}
							</div>
						</div>
					}
				>
					<div className="flex items-center gap-4 pt-2">
						<div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-center">
							<span className="block text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">100%</span>
							<span className="text-[9px] text-zinc-400 font-mono">OPEN SOURCE</span>
						</div>
						<div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-center">
							<span className="block text-xs font-mono font-bold text-purple-600 dark:text-purple-400">0 SERVER</span>
							<span className="text-[9px] text-zinc-400 font-mono">EDGE STATIC</span>
						</div>
					</div>
				</BentoCard>

				{/* ════════════════ Card 5: 💻 极客数字装备与生产力工作流 (Col 1-3, Row 3 全宽卡) ════════════════ */}
				<BentoCard
					name="Desk Setup & Hardware Workspace"
					description="MacBook Air M4、ROG 旗舰、AirPods Pro 2 与定制机械键盘，构筑全天候数字生产力系统。"
					Icon={Laptop}
					href="/about"
					cta="探索完整装备清单与工作流"
					className="col-span-1 md:col-span-3"
					background={
						<div className="absolute inset-0 flex items-center justify-end pr-6 opacity-30 dark:opacity-25 overflow-hidden pointer-events-none">
							<div className="flex gap-3 translate-x-12 sm:translate-x-0">
								{topGears.map((gear: any, idx: number) => (
									<div
										key={gear.name || idx}
										className="w-28 sm:w-36 h-28 rounded-2xl overflow-hidden border border-zinc-300/60 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/90 shadow-lg shrink-0 flex flex-col items-center justify-center p-2 text-center"
									>
										{gear.cover ? (
											<img
												src={gear.cover}
												alt={gear.name}
												className="size-16 object-contain mb-1 rounded-lg"
											/>
										) : (
											<Laptop className="size-8 text-zinc-400 mb-1" />
										)}
										<span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 truncate w-full">
											{gear.name}
										</span>
									</div>
								))}
							</div>
						</div>
					}
				>
					{/* Fast Gear Tags */}
					<div className="flex flex-wrap gap-2 pt-2">
						{['MacBook Air M4', 'ROG 魔霸 2023 (RTX 4060)', 'iPad Pro 12.9', 'AirPods Pro 2', '狼蛛 F99 Gasket', 'Apple Watch S11'].map((item) => (
							<span
								key={item}
								className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-semibold bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs"
							>
								⚡ {item}
							</span>
						))}
					</div>
				</BentoCard>
			</BentoGrid>
		</div>
	)
}
