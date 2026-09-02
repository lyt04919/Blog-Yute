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
	ArrowRight
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

				{/* ════════════════ 3. 📸 私享随笔 · 拍立得记忆流 (1:1 还原设计图全尺寸布局) ════════════════ */}
				<BentoCard
					darkTheme={true}
					className="col-span-1 md:col-span-2 bg-[#0c0c11] dark:bg-[#0c0c11] border-zinc-800/90 text-white shadow-2xl overflow-hidden"
				>
					<div 
						style={{ minHeight: '360px' }}
						className="relative w-full h-full flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6 overflow-hidden"
					>
						{/* 背景极微环境光点缀 */}
						<div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
						<div className="absolute -bottom-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />

						{/* 📸 左侧区域：大尺寸错落拍立得相纸（严格像素约束防撑爆） */}
						<div 
							style={{ width: '220px', minWidth: '220px', height: '260px' }}
							className="relative shrink-0 flex items-center justify-center select-none"
						>
							{/* 底层拍立得：新西兰 Tekapo 湖畔 */}
							<div 
								style={{
									width: '160px',
									height: '210px',
									transform: 'rotate(8deg) translate(14px, -10px)',
									transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
								}}
								className="absolute bg-[#FAF9F6] p-2.5 rounded-sm shadow-xl border border-black/15 pointer-events-none group-hover:!rotate-[13deg] group-hover:!translate-x-6 group-hover:!-translate-y-4 group-hover:shadow-2xl flex flex-col"
							>
								<div 
									style={{ width: '140px', height: '140px' }}
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
									<p className="text-[9px] font-mono font-bold text-zinc-700 tracking-tight truncate">
										Tekapo Lake (2024.06)
									</p>
								</div>
							</div>

							{/* 表层拍立得：海边黄昏抓拍 */}
							<div 
								style={{
									width: '170px',
									height: '220px',
									transform: 'rotate(-4deg) translate(-10px, 10px)',
									transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
								}}
								className="relative bg-[#FAF9F6] p-2.5 rounded-sm shadow-2xl border border-black/15 pointer-events-none z-10 group-hover:!rotate-0 group-hover:!scale-105 group-hover:!-translate-y-2 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col"
							>
								<div 
									style={{ width: '150px', height: '150px' }}
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
									<p className="text-[9px] font-serif font-bold text-zinc-800 tracking-tight truncate">
										Sunset Beach (2024.06)
									</p>
								</div>
							</div>
						</div>

						{/* 📝 右侧区域：沉浸式随笔手账（时间胶囊 + 大标题 + 动人文字 + 地点与 CTA） */}
						<div className="flex-1 min-w-0 h-full flex flex-col justify-between z-10 py-1">
							{/* 顶部：日期胶囊与心境胶囊 */}
							<div className="flex flex-wrap items-center gap-2 mb-3">
								<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-xs">
									2024.06.16
								</span>
								<span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md flex items-center gap-1.5 shadow-xs">
									<span>☀️ Sunny</span>
									<span className="opacity-40">·</span>
									<span>Calm</span>
								</span>
							</div>

							{/* 中部：优雅大标题与思绪段落 */}
							<div className="flex-1 flex flex-col justify-center my-2">
								<h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-snug mb-2 drop-shadow-xs">
									一个人去看海 · 黄昏随想
								</h3>
								<p className="text-xs sm:text-[13.5px] font-sans leading-relaxed text-zinc-300/90 line-clamp-3 sm:line-clamp-4 pr-2">
									“两年前的今天，第一次一个人去看海。虽然海风很凉，但听着浪花拍打礁石的声音，内心竟然出奇地平静。拍了好多照片，最喜欢这张黄昏时的抓拍。人生其实就像大海一样，有时波澜壮阔，有时又归于宁静。希望自己永远能保持这份面对世界的好奇心。🌊🌅”
								</p>
							</div>

							{/* 底部：地点坐标与直达 CTA 按键 */}
							<div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
								<div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
									<div className="size-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
										<MapPin className="w-3.5 h-3.5 text-blue-400" />
									</div>
									<span className="font-semibold text-zinc-300">秦皇岛 · 海边</span>
								</div>

								<a
									href="/vault/diary"
									className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/30 hover:scale-102 active:scale-98"
								>
									<span>翻阅生活日记</span>
									<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
								</a>
							</div>
						</div>
					</div>
				</BentoCard>

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
