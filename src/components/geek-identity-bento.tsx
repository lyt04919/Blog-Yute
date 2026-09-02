'use client'

import { useState, useEffect } from 'react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { Marquee } from '@/components/ui/marquee'
import DriftWall, { type DriftWallItem } from '@/components/ui/drift-wall'
import { getPosterUrl } from '@/app/favorite/components/movie-card'
import { 
	BookOpen, 
	Film, 
	CalendarDays,
	MapPin,
	Feather
} from 'lucide-react'

// Import user's authentic data
import moviesData from '@/data/movies.json'
import booksData from '@/data/books.json'
import diaryData from '@/data/private/diary.json'

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

// Featured authentic diary slice (Sea reflection with polaroid memories)
const featuredDiary = (diaryData as any[]).find((d) => d.id === 'mock_historical_2024') || (diaryData as any[])[0]

export function GeekIdentityBento({ className }: { className?: string }) {
	const [currentDay, setCurrentDay] = useState<number>(1)
	const [currentMonth, setCurrentMonth] = useState<string>('September')
	const [currentYear, setCurrentYear] = useState<number>(2026)
	const [mounted, setMounted] = useState<boolean>(false)

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

				{/* ════════════════ 2. 电影胶片流 · React Bits 3D DriftWall (Dedicated Cinematic Dark Theater) ════════════════ */}
				<BentoCard
					name="光影放映厅"
					description="3D 悬浮流动胶片流，收录 130+ 部影史高分神作与心灵共鸣。"
					Icon={Film}
					href="/favorite"
					cta="进入放映厅"
					darkTheme={true}
					className="col-span-1 md:col-span-2 text-white bg-zinc-950 dark:bg-zinc-950 border-zinc-800"
					background={
						<div className="absolute inset-0 w-full h-full overflow-hidden bg-[#08080f]">
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
								depth={0}
								speed={32}
								direction="up"
								variance={0.35}
								parallax={0.35}
								pauseOnHover={true}
								lift={40}
								dim={0.45}
								overlayColor="#060010"
							/>
							{/* Cinematic Ambient Bottom Fade */}
							<div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black from-30% via-black/95 via-65% to-transparent pointer-events-none z-10" />
						</div>
					}
				/>

				{/* ════════════════ 3. 📸 私享随笔 · 拍立得记忆流 (保留标准 BentoCard 底部信息栏) ════════════════ */}
				<BentoCard
					name="私享随笔"
					description="记录日常思绪、旅途快照与那些触动心弦的生活切片。"
					Icon={Feather}
					href="/vault/diary"
					cta="翻阅生活日记"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-x-0 top-0 h-[225px] [mask-image:linear-gradient(to_bottom,#000_82%,transparent_100%)] flex items-center justify-between px-6 sm:px-8 overflow-hidden select-none">
							{/* 📸 左侧区域：大尺寸错落拍立得相纸（行内硬尺寸防越界） */}
							<div 
								style={{ width: '185px', minWidth: '185px', height: '195px' }}
								className="relative shrink-0 flex items-center justify-center"
							>
								{/* 底层拍立得：新西兰 Tekapo 湖畔 */}
								<div 
									style={{
										width: '128px',
										height: '164px',
										transform: 'rotate(7deg) translate(12px, -6px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
									}}
									className="absolute bg-[#FAF9F6] p-2 rounded-sm shadow-md border border-black/15 pointer-events-none group-hover:!rotate-[12deg] group-hover:!translate-x-5 group-hover:!-translate-y-2 group-hover:shadow-xl flex flex-col"
								>
									<div 
										style={{ width: '112px', height: '112px' }}
										className="rounded-2xs overflow-hidden bg-zinc-200 shrink-0"
									>
										<img
											src="/images/uploads/0c004c6f642839f2.jpeg"
											alt="Tekapo Lake"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
									</div>
									<div className="flex-1 flex items-center justify-center">
										<p className="text-[8px] font-mono font-bold text-zinc-700 tracking-tight truncate">
											Tekapo Lake (2024.06)
										</p>
									</div>
								</div>

								{/* 表层拍立得：海边黄昏抓拍 */}
								<div 
									style={{
										width: '138px',
										height: '174px',
										transform: 'rotate(-4deg) translate(-8px, 6px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
									}}
									className="relative bg-[#FAF9F6] p-2 rounded-sm shadow-xl border border-black/15 pointer-events-none z-10 group-hover:!rotate-0 group-hover:!scale-104 group-hover:!-translate-y-1.5 group-hover:shadow-2xl flex flex-col"
								>
									<div 
										style={{ width: '122px', height: '122px' }}
										className="rounded-2xs overflow-hidden bg-zinc-200 shrink-0"
									>
										<img
											src={featuredDiary?.image || '/images/uploads/7ef4d45667098fa8.jpeg'}
											alt="Sunset Beach"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
									</div>
									<div className="flex-1 flex items-center justify-center">
										<p className="text-[8px] font-serif font-bold text-zinc-800 tracking-tight truncate">
											Sunset Beach (2024.06)
										</p>
									</div>
								</div>
							</div>

							{/* 📝 右侧区域：沉浸式随笔摘录（自适应深浅主题颜色） */}
							<div className="flex-1 min-w-0 pl-4 sm:pl-6 flex flex-col justify-center gap-1.5 z-10">
								{/* 顶部标签：日期胶囊 + 心境胶囊 + 地点徽章 */}
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
										2024.06.16
									</span>
									<span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center gap-1 shadow-2xs">
										<span>☀️ 晴朗</span>
										<span className="opacity-30">·</span>
										<span>平静</span>
									</span>
									<span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 items-center gap-1">
										<MapPin className="w-2.5 h-2.5 text-rose-500" />
										<span>秦皇岛 · 海边</span>
									</span>
								</div>

								{/* 标题 */}
								<h4 className="text-sm sm:text-base font-serif font-bold text-zinc-900 dark:text-white tracking-tight leading-snug drop-shadow-2xs">
									一个人去看海 · 黄昏随想
								</h4>

								{/* 思绪正文 */}
								<p className="text-xs sm:text-[13px] font-sans leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-2 sm:line-clamp-3 italic opacity-95">
									“两年前的今天，第一次一个人去看海。虽然海风很凉，但听着浪花拍打礁石的声音，内心竟然出奇地平静。人生其实就像大海一样，有时波澜壮阔，有时又归于宁静。希望自己永远能保持这份好奇心。🌊🌅”
								</p>
							</div>
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
