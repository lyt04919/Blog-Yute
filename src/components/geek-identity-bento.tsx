'use client'

import { useState, useEffect, useRef } from 'react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { Marquee } from '@/components/ui/marquee'
import DriftWall, { type DriftWallItem } from '@/components/ui/drift-wall'
import { getPosterUrl } from '@/app/favorite/components/movie-card'
import { 
	BookOpen, 
	Film, 
	Compass, 
	CalendarDays
} from 'lucide-react'

// Import user's authentic data
import moviesData from '@/data/movies.json'
import booksData from '@/data/books.json'

interface BookItem {
	name: string
	author?: string
	cover: string
}

// Extract real books with full covers (strictly original vertical book proportions)
const realBooks: BookItem[] = (booksData as any[])
	.filter((b) => Boolean(b.cover))
	.map((b) => ({
		name: b.name.replace(/\s*\(.*?\)/g, ''), // clean name
		author: b.author || '',
		cover: getPosterUrl(b.cover)
	}))

// Curated top 30 movies for full-bleed 5-column 3D DriftWall (strictly 2:3 vertical posters)
const movieDriftItems: DriftWallItem[] = (moviesData as any[])
	.filter((m) => Boolean(m.poster) && m.isShow !== false)
	.sort((a, b) => (b.stars || b.doubanRating || 0) - (a.stars || a.doubanRating || 0))
	.slice(0, 30)
	.map((m) => ({
		title: m.name,
		image: getPosterUrl(m.poster),
		href: '/favorite'
	}))

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
				{/* ════════════════ 1. 灵感书影音 (Pure Uncropped Book Covers) ════════════════ */}
				<BentoCard
					name="灵感书影音"
					description="精选人文经典、高保真黑胶与硬核科幻。"
					Icon={BookOpen}
					href="/favorite"
					cta="探索书影音"
					className="col-span-1 md:col-span-1"
					background={
						<div className="absolute inset-x-0 top-0 h-[220px] [mask-image:linear-gradient(to_bottom,#000_65%,transparent_100%)] overflow-hidden">
							<Marquee pauseOnHover duration="25s" className="py-3 px-2 [gap:14px]">
								{realBooks.map((item, idx) => (
									<div
										key={idx}
										className="group/book relative w-28 h-40 rounded-xl overflow-hidden shadow-md border border-zinc-200/80 dark:border-zinc-700/80 shrink-0 select-none bg-zinc-100 dark:bg-zinc-800 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
									>
										<img 
											src={item.cover} 
											alt={item.name} 
											referrerPolicy="no-referrer"
											loading="lazy"
											decoding="async"
											className="w-full h-full object-cover transition-transform duration-300 group-hover/book:scale-105" 
										/>
										{/* Realistic book spine lighting fold */}
										<div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent pointer-events-none" />
										<div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl pointer-events-none" />
									</div>
								))}
							</Marquee>
						</div>
					}
				/>

				{/* ════════════════ 2. 电影胶片流 · React Bits 3D DriftWall (Dual Theme: White in Light Mode, Black in Dark Mode) ════════════════ */}
				<BentoCard
					name="光影放映厅"
					description="3D 悬浮流动胶片流，收录 130+ 部影史高分神作与心灵共鸣。"
					Icon={Film}
					href="/favorite"
					cta="进入放映厅"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-50 dark:bg-[#08080f]">
							<DriftWall
								items={movieDriftItems}
								columns={5}
								tileWidth={105}
								tileHeight={158}
								gap={14}
								radius={12}
								tilt={16}
								turn={-14}
								perspective={1200}
								depth={90}
								speed={32}
								direction="up"
								variance={0.35}
								parallax={0.4}
								pauseOnHover={true}
								lift={50}
							/>
							{/* Ambient Bottom Fade: Clean Pure White in Light Mode, Deep Space Black in Dark Mode */}
							<div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-black/98 dark:via-black/80 dark:to-transparent pointer-events-none" />
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
									<span className="font-semibold text-zinc-500 font-bold">7</span>
									<span className="font-semibold">8</span>
									<span className="font-semibold text-emerald-500 font-bold">9</span>
									<span className="font-semibold text-super-emerald-500 font-bold">10</span>
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
