'use client'

import { useState, useEffect, useRef } from 'react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { AnimatedList } from '@/components/ui/animated-list'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { Marquee } from '@/components/ui/marquee'
import { 
	BookOpen, 
	Sparkles, 
	Compass, 
	CalendarDays, 
	Music, 
	Film, 
	Gamepad2, 
	Star,
	Disc3,
	Bookmark
} from 'lucide-react'

// Curated items from Favorites data
const featuredFavorites = [
	{ 
		name: '小王子', 
		sub: '安东尼·圣-埃克苏佩里', 
		tag: '文学', 
		cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80',
		color: 'from-amber-500/20 to-orange-500/10'
	},
	{ 
		name: '光辉岁月', 
		sub: 'Beyond', 
		tag: '黑胶', 
		cover: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=300&q=80',
		color: 'from-rose-500/20 to-pink-500/10'
	},
	{ 
		name: '星际穿越', 
		sub: '克里斯托弗·诺兰', 
		tag: '电影', 
		cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80',
		color: 'from-blue-500/20 to-cyan-500/10'
	},
	{ 
		name: '掌控习惯', 
		sub: '詹姆斯·克莱尔', 
		tag: '成长', 
		cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&q=80',
		color: 'from-emerald-500/20 to-teal-500/10'
	},
	{ 
		name: '艾尔登法环', 
		sub: 'FromSoftware', 
		tag: '游戏', 
		cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&q=80',
		color: 'from-purple-500/20 to-indigo-500/10'
	},
]

const activityLogs = [
	{
		id: 1,
		title: '单曲循环 · 光辉岁月 (Beyond)',
		time: '刚刚',
		description: '精选粤语经典 · 殿堂级摇滚旋律',
		icon: Disc3,
		color: 'text-rose-500 bg-rose-500/10',
		badge: '音乐'
	},
	{
		id: 2,
		title: '深度重温 · 《掌控习惯》',
		time: '2小时前',
		description: '詹姆斯·克莱尔 · 评分 5.0 ★★★★★',
		icon: BookOpen,
		color: 'text-amber-500 bg-amber-500/10',
		badge: '书籍'
	},
	{
		id: 3,
		title: '观影打卡 · 《星际穿越》',
		time: '昨天',
		description: '科幻神作 · 诺兰硬核宇宙浪漫',
		icon: Film,
		color: 'text-blue-500 bg-blue-500/10',
		badge: '电影'
	},
	{
		id: 4,
		title: '通关沉浸 · 艾尔登法环',
		time: '3天前',
		description: '年度最佳开放世界 · 极客探索之旅',
		icon: Gamepad2,
		color: 'text-emerald-500 bg-emerald-500/10',
		badge: '游戏'
	},
]

export function GeekIdentityBento({ className }: { className?: string }) {
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
		const now = new Date()
		setCurrentDay(now.getDate())
		setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long' }))
		setCurrentYear(now.getFullYear())
	}, [])

	return (
		<div className={className}>
			<BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
				{/* ════════════════ 1. 灵感书影音 (Live Marquee) ════════════════ */}
				<BentoCard
					name="灵感书影音"
					description="精选人文经典、高保真黑胶与硬核科幻。"
					Icon={BookOpen}
					href="/favorite"
					cta="探索书影音"
					className="col-span-1 md:col-span-1"
					background={
						<div className="absolute inset-x-0 top-0 h-[210px] [mask-image:linear-gradient(to_bottom,#000_50%,transparent_100%)] overflow-hidden">
							<Marquee pauseOnHover duration="20s" className="py-2.5">
								{featuredFavorites.map((item, idx) => (
									<div
										key={idx}
										className="w-28 h-32 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 p-2.5 shadow-md flex flex-col justify-between shrink-0 select-none transition-all duration-300 hover:scale-105 hover:shadow-lg"
									>
										<div className="flex items-center justify-between">
											<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 font-mono">
												{item.tag}
											</span>
											<div className="flex items-center text-amber-500">
												<Star className="size-2.5 fill-current" />
												<span className="text-[8.5px] font-bold ml-0.5 font-mono">5.0</span>
											</div>
										</div>
										<div className="space-y-0.5">
											<p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-100 truncate">
												{item.name}
											</p>
											<p className="text-[8.5px] text-zinc-400 dark:text-zinc-400 truncate">
												{item.sub}
											</p>
										</div>
									</div>
								))}
							</Marquee>
						</div>
					}
				/>

				{/* ════════════════ 2. 收藏动态脉冲 (Live AnimatedList) ════════════════ */}
				<BentoCard
					name="收藏脉冲"
					description="持续记录阅读、观影、黑胶与极客探索动态。"
					Icon={Sparkles}
					href="/favorite"
					cta="查看全部收藏"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-x-0 top-0 h-[210px] [mask-image:linear-gradient(to_bottom,#000_55%,transparent_100%)] px-6 overflow-hidden pt-2">
							<AnimatedList delay={2200}>
								{activityLogs.map((item) => {
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
													<span className="text-[9.5px] text-zinc-400 font-mono">{item.time}</span>
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

				{/* ════════════════ 3. 全景灵感矩阵 (Live AnimatedBeam) ════════════════ */}
				<BentoCard
					name="灵感矩阵"
					description="连接书影音游多维世界，构建完整的数字精神领域。"
					Icon={Compass}
					href="/favorite"
					cta="探索灵感矩阵"
					className="col-span-1 md:col-span-2"
					background={
						<div
							ref={containerRef}
							className="absolute inset-x-0 top-0 h-[210px] [mask-image:linear-gradient(to_bottom,#000_65%,transparent_100%)] flex items-center justify-between px-10 overflow-hidden"
						>
							{/* Left Node: Explorer */}
							<div
								ref={div1Ref}
								className="size-11 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 shadow-lg flex items-center justify-center text-xs font-bold font-mono text-zinc-800 dark:text-zinc-100 z-10"
							>
								ME
							</div>

							{/* Center Hub Node */}
							<div
								ref={div2Ref}
								className="size-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl flex items-center justify-center text-xs font-extrabold font-mono z-10"
							>
								HUB
							</div>

							{/* Right Category Nodes */}
							<div className="flex flex-col gap-2 z-10">
								<div
									ref={div3Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-amber-500 font-mono"
								>
									Books
								</div>
								<div
									ref={div4Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-blue-500 font-mono"
								>
									Films
								</div>
								<div
									ref={div5Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-rose-500 font-mono"
								>
									Music
								</div>
								<div
									ref={div6Ref}
									className="size-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-[10px] font-bold text-emerald-500 font-mono"
								>
									Games
								</div>
							</div>

							{/* Animated Beams */}
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div1Ref}
								toRef={div2Ref}
								duration={2.5}
								gradientStartColor="#f59e0b"
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
								gradientStopColor="#f59e0b"
							/>
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div2Ref}
								toRef={div4Ref}
								duration={3}
								delay={0.4}
								curvature={-8}
								gradientStartColor="#8b5cf6"
								gradientStopColor="#3b82f6"
							/>
							<AnimatedBeam
								containerRef={containerRef}
								fromRef={div2Ref}
								toRef={div5Ref}
								duration={3}
								delay={0.6}
								curvature={8}
								gradientStartColor="#8b5cf6"
								gradientStopColor="#f43f5e"
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

				{/* ════════════════ 4. 时光轨迹日历 (Live Calendar) ════════════════ */}
				<BentoCard
					name="时光轨迹"
					description="按时间维度回溯精神体验与阅读脉络。"
					Icon={CalendarDays}
					href="/favorite"
					cta="时光归档"
					className="col-span-1 md:col-span-1"
					background={
						<div className="absolute inset-x-0 top-0 h-[210px] [mask-image:linear-gradient(to_bottom,#000_65%,transparent_100%)] flex items-start justify-center pt-3 overflow-hidden">
							<div className="w-full max-w-[210px] rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 shadow-md">
								<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/80 pb-2 mb-2">
									<span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 font-mono">{currentMonth} {currentYear}</span>
									<span className="text-[10px] font-mono font-bold text-zinc-400">FAVORITES</span>
								</div>
								<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-400 mb-1">
									<span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
								</div>
								<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
									<span className="opacity-30">30</span>
									<span className="opacity-30">31</span>
									<span className="font-semibold">1</span>
									<span className="size-5 mx-auto rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold flex items-center justify-center shadow-xs">
										{mounted ? currentDay : 2}
									</span>
									<span className="font-semibold">3</span>
									<span className="font-semibold text-rose-500 font-bold">4</span>
									<span className="font-semibold">5</span>
									<span className="font-semibold text-blue-500 font-bold">6</span>
									<span className="font-semibold">7</span>
									<span className="font-semibold">8</span>
									<span className="font-semibold text-emerald-500 font-bold">9</span>
									<span className="font-semibold">10</span>
									<span className="font-semibold">11</span>
									<span className="font-semibold">12</span>
								</div>
							</div>
						</div>
					}
				/>
			</BentoGrid>
		</div>
	)
}
