'use client'

import { useState, useEffect } from 'react'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { 
	Terminal, 
	Globe, 
	Disc3, 
	GitBranch, 
	Laptop, 
	MapPin, 
	Clock,
	Sparkles,
	Layers
} from 'lucide-react'
import { motion } from 'motion/react'
import dynamic from 'next/dynamic'
import gearsData from '@/app/about/gears.json'
import musicData from '@/app/favorite/music.json'

const LocationMap = dynamic(() => import('./location-map'), { ssr: false })

// Import SVG Icons
import GithubSVG from '@/svgs/github.svg'
import EmailSVG from '@/svgs/email.svg'
import WechatSVG from '@/svgs/wechat.svg'
import QqSVG from '@/svgs/qq.svg'

const iconMap: Record<string, any> = {
	github: GithubSVG,
	email: EmailSVG,
	wechat: WechatSVG,
	qq: QqSVG
}

export function ProfileBento({ 
	isEditMode = false,
	onLocationChange,
	locationValue,
}: {
	isEditMode?: boolean
	onLocationChange?: (location: string) => void
	locationValue?: string
}) {
	const { siteContent } = useConfigStore()
	const { meta, bentoConfig, socialButtons } = siteContent
	const avatarUrl = '/images/avatar.png'
	const sortedSocials = [...(socialButtons || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

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
		<div className="w-full">
			<BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[20rem] sm:auto-rows-[22rem]">
				{/* ════════════════ 1. Profile & Full Stack Engineering (2x1) ════════════════ */}
				<BentoCard
					name={meta.title || meta.username || 'Full Stack Craftsman'}
					description={meta.description || '专注于现代 Web 全栈工程、高可用系统设计与优雅交互体验。'}
					Icon={Terminal}
					href="https://github.com/lyt04919"
					cta="探索技术架构与代码"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-0 flex flex-col justify-between p-6 opacity-25 dark:opacity-20 select-none pointer-events-none">
							<div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
								<div className="size-2.5 rounded-full bg-rose-500/80" />
								<div className="size-2.5 rounded-full bg-amber-500/80" />
								<div className="size-2.5 rounded-full bg-emerald-500/80" />
								<span className="ml-2 font-semibold text-zinc-400">~/profile/architecture.ts</span>
							</div>
							<div className="font-mono text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 pl-2 border-l border-zinc-300 dark:border-zinc-700">
								<p><span className="text-purple-500">const</span> <span className="text-blue-500">craftsman</span> = &#123;</p>
								<p className="pl-4">role: <span className="text-emerald-500">'Full Stack & AI Engineer'</span>,</p>
								<p className="pl-4">stack: [<span className="text-emerald-500">'Next.js 16'</span>, <span className="text-emerald-500">'React 19'</span>, <span className="text-emerald-500">'TypeScript'</span>, <span className="text-emerald-500">'Tailwind'</span>],</p>
								<p className="pl-4">mission: <span className="text-amber-500">'Building delightful web experiences'</span></p>
								<p>&#125;</p>
							</div>
							<div className="flex flex-wrap gap-2 pt-2">
								{['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Motion/React', 'Cloudflare'].map((tech) => (
									<span key={tech} className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/50">
										{tech}
									</span>
								))}
							</div>
						</div>
					}
				>
					<div className="flex items-center gap-4 pt-1">
						<div className="size-16 rounded-2xl overflow-hidden ring-4 ring-[var(--color-brand)]/15 border-2 border-[var(--color-border)] shadow-xl bg-[var(--color-bg)] shrink-0">
							<img src={avatarUrl} alt={meta.username} className="size-full object-cover" />
						</div>
						<div className="flex flex-col">
							<div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
								<span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
								<span>ACTIVE NOW</span>
							</div>
							<span className="text-xs text-zinc-400 font-mono mt-1">Ready to create & build</span>
						</div>
					</div>
				</BentoCard>

				{/* ════════════════ 2. Nomad Station & World Clock (1x2 纵向双高卡) ════════════════ */}
				<BentoCard
					name="Nomad Station & Time"
					description="全球时区协同探索，数字基站与游民足迹。"
					Icon={Globe}
					href="/#trajectory-map"
					cta="查看全球足迹地图"
					className="col-span-1 md:col-span-1 md:row-span-2"
					background={
						<div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30">
							<LocationMap location={locationValue ?? bentoConfig?.location ?? 'New Zealand'} />
							<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-card)]/80" />
						</div>
					}
				>
					<div className="my-auto py-4 flex flex-col items-center justify-center text-center z-10">
						<div className="font-mono text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight flex items-center justify-center gap-2">
							<Clock className="size-5 text-blue-500 animate-pulse" />
							<span>{mounted ? timeString || '00:00:00' : '00:00:00'}</span>
						</div>
						<div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-600 dark:text-zinc-300 font-bold bg-white/70 dark:bg-zinc-800/70 px-3 py-1 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 backdrop-blur-md">
							<MapPin className="size-3.5 text-rose-500 animate-bounce" />
							{isEditMode ? (
								<input
									type="text"
									value={locationValue ?? bentoConfig?.location ?? ''}
									onChange={(e) => onLocationChange?.(e.target.value)}
									className="bg-transparent border-b border-[var(--color-border)] outline-none text-center w-28 text-xs font-bold"
								/>
							) : (
								<span>{bentoConfig?.location || 'Hangzhou / Earth Base'}</span>
							)}
						</div>
					</div>
				</BentoCard>

				{/* ════════════════ 3. Sonic Sanctuary (1x1) ════════════════ */}
				<BentoCard
					name="Sonic Sanctuary"
					description="沉浸于精选黑胶与律动声浪，构筑深度思考心流。"
					Icon={Disc3}
					href="/#favorites-lounge"
					cta="进入视听室"
					className="col-span-1"
					background={
						<div className="absolute inset-0 flex items-center justify-end pr-4 opacity-25 dark:opacity-20 overflow-hidden">
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

				{/* ════════════════ 4. Connect & Socials (1x1) ════════════════ */}
				<BentoCard
					name="Social & Pulse"
					description="开放协作与数字网络连接，随时随地保持沟通。"
					Icon={GitBranch}
					className="col-span-1"
					background={
						<div className="absolute inset-0 flex items-center justify-center p-6 opacity-20 dark:opacity-15">
							<div className="grid grid-cols-8 gap-1.5">
								{Array.from({ length: 32 }).map((_, i) => (
									<div
										key={i}
										className={`size-3 rounded-xs ${i % 3 === 0 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
									/>
								))}
							</div>
						</div>
					}
				>
					<div className="grid grid-cols-2 gap-2 pt-1">
						{sortedSocials.slice(0, 4).map(social => {
							const Icon = iconMap[social.type] || GithubSVG
							let href = social.value
							if (social.type === 'email') href = `mailto:${social.value}`
							else if (!href.startsWith('http') && social.type !== 'wechat' && social.type !== 'qq') href = `https://${social.value}`
							const label = social.type === 'email' ? 'EMAIL' : social.type.toUpperCase()

							return (
								<a
									key={social.id}
									href={social.type === 'wechat' || social.type === 'qq' ? '#' : href}
									target="_blank"
									rel="noreferrer"
									onClick={(e) => {
										if (social.type === 'wechat' || social.type === 'qq') {
											e.preventDefault()
											alert(`${social.type.toUpperCase()}: ${social.value}`)
										}
									}}
									className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-[var(--color-brand)]/10 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:text-[var(--color-brand)] text-[10px] font-bold font-mono transition-colors"
								>
									<Icon className="size-3.5 shrink-0" />
									<span className="truncate">{label}</span>
								</a>
							)
						})}
					</div>
				</BentoCard>

				{/* ════════════════ 5. Desk Setup & Hardware Workspace (3x1 全宽卡) ════════════════ */}
				<BentoCard
					name="Desk Setup & Hardware Workspace"
					description="MacBook Air M4、ROG 旗舰、AirPods Pro 2 与定制机械键盘，构筑全天候数字生产力系统。"
					Icon={Laptop}
					href="/about"
					cta="探索完整装备清单与生产力配置"
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
