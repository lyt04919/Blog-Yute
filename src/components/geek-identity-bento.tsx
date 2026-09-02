'use client'

import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { Marquee } from '@/components/ui/marquee'
import DriftWall, { type DriftWallItem } from '@/components/ui/drift-wall'
import { InfiniteSpiral } from '@/components/ui/infinite-spiral'
import { getPosterUrl } from '@/app/favorite/components/movie-card'
import { 
	BookOpen, 
	Film, 
	Feather,
	Sparkles
} from 'lucide-react'

// Import user's authentic data
import moviesData from '@/data/movies.json'
import booksData from '@/data/books.json'
import shareData from '@/app/favorite/share/list.json'

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

// Curated web & tools items for 3D InfiniteSpiral helix
const webToolsSpiralItems = (shareData as any[])
	.filter((s) => Boolean(s.logo) && s.isShow !== false)
	.map((s, idx) => ({
		id: `tool-${idx}`,
		src: s.logo,
		alt: s.name,
		label: s.name,
		href: s.url,
		target: '_blank'
	}))

export function GeekIdentityBento({ className }: { className?: string }) {
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

				{/* ════════════════ 3. 📸 私享随笔 · 富士拍立得三联画廊 (纯净版：自然下移居中排布) ════════════════ */}
				<BentoCard
					name="私享随笔"
					description="记录日常思绪、旅途快照与那些触动心弦的生活切片。"
					Icon={Feather}
					href="/vault/diary"
					cta="翻阅生活日记"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-x-0 top-0 h-[260px] flex items-center justify-center pt-6 sm:pt-7 px-4 sm:px-6 select-none">
							<div className="flex items-center justify-center gap-4 sm:gap-7">
								{/* 1. 左侧富士相纸：奥克兰黄昏 (-7°) */}
								<div
									style={{
										width: '134px',
										height: '196px',
										transform: 'rotate(-7deg) translateY(12px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
										boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 14px 28px -4px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)'
									}}
									className="relative bg-gradient-to-b from-[#FFFFFF] via-[#FDFDFD] to-[#F8F8F8] p-2 pb-6 rounded-[9px] pointer-events-none group-hover:!-rotate-[11deg] group-hover:!-translate-x-3 group-hover:!translate-y-2 group-hover:shadow-2xl flex flex-col shrink-0"
								>
									{/* 富士特有内嵌倒角压痕相框 */}
									<div 
										style={{ 
											width: '118px', 
											height: '144px',
											boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.08)'
										}} 
										className="relative rounded-[5px] overflow-hidden bg-zinc-900 shrink-0"
									>
										<img
											src="/images/uploads/7ef4d45667098fa8.jpeg"
											alt="Auckland Sunset"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
										{/* 富士高光胶片反光膜 */}
										<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
									</div>

									{/* 富士相纸底部纯净手写留白（无水印与LOGO） */}
									<div className="flex-1 flex items-center justify-center pt-1 px-0.5 overflow-visible">
										<p 
											style={{ 
												fontFamily: 'var(--font-cursive), "Caveat", "Bradley Hand", cursive',
												fontSize: '15px',
												color: '#262626',
												transform: 'rotate(-0.8deg)'
											}}
											className="font-medium tracking-wide text-center whitespace-nowrap select-none opacity-90"
										>
											Sunset Beach &apos;24
										</p>
									</div>
								</div>

								{/* 2. 中间富士相纸：蒂卡波湖 (0° 视觉主位微浮) */}
								<div
									style={{
										width: '140px',
										height: '204px',
										transform: 'rotate(0deg) translateY(2px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
										zIndex: 10,
										boxShadow: '0 8px 12px -2px rgba(0,0,0,0.08), 0 20px 38px -6px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.07)'
									}}
									className="relative bg-gradient-to-b from-[#FFFFFF] via-[#FDFDFD] to-[#F8F8F8] p-2 pb-6 rounded-[9px] pointer-events-none group-hover:!-translate-y-2 group-hover:!scale-104 group-hover:shadow-2xl flex flex-col shrink-0"
								>
									{/* 富士特有内嵌倒角压痕相框 */}
									<div 
										style={{ 
											width: '124px', 
											height: '150px',
											boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.08)'
										}} 
										className="relative rounded-[5px] overflow-hidden bg-zinc-900 shrink-0"
									>
										<img
											src="/images/uploads/0c004c6f642839f2.jpeg"
											alt="Lake Tekapo"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
										{/* 富士高光胶片反光膜 */}
										<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
									</div>

									{/* 富士相纸底部纯净手写留白（无水印与LOGO） */}
									<div className="flex-1 flex items-center justify-center pt-1 px-0.5 overflow-visible">
										<p 
											style={{ 
												fontFamily: 'var(--font-cursive), "Caveat", "Bradley Hand", cursive',
												fontSize: '15px',
												color: '#262626',
												transform: 'rotate(0.5deg)'
											}}
											className="font-medium tracking-wide text-center whitespace-nowrap select-none opacity-90"
										>
											Lake Tekapo &apos;24
										</p>
									</div>
								</div>

								{/* 3. 右侧富士相纸：皇后镇日落 (+7°) */}
								<div
									style={{
										width: '134px',
										height: '196px',
										transform: 'rotate(7deg) translateY(12px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
										boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 14px 28px -4px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)'
									}}
									className="relative bg-gradient-to-b from-[#FFFFFF] via-[#FDFDFD] to-[#F8F8F8] p-2 pb-6 rounded-[9px] pointer-events-none group-hover:!rotate-[11deg] group-hover:!translate-x-3 group-hover:!translate-y-2 group-hover:shadow-2xl flex flex-col shrink-0"
								>
									{/* 富士特有内嵌倒角压痕相框 */}
									<div 
										style={{ 
											width: '118px', 
											height: '144px',
											boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.08)'
										}} 
										className="relative rounded-[5px] overflow-hidden bg-zinc-900 shrink-0"
									>
										<img
											src="/images/uploads/844b159ea02995f4.jpeg"
											alt="Queenstown"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
										{/* 富士高光胶片反光膜 */}
										<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
									</div>

									{/* 富士相纸底部纯净手写留白（无水印与LOGO） */}
									<div className="flex-1 flex items-center justify-center pt-1 px-0.5 overflow-visible">
										<p 
											style={{ 
												fontFamily: 'var(--font-cursive), "Caveat", "Bradley Hand", cursive',
												fontSize: '15px',
												color: '#262626',
												transform: 'rotate(-0.5deg)'
											}}
											className="font-medium tracking-wide text-center whitespace-nowrap select-none opacity-90"
										>
											Queenstown &apos;24
										</p>
									</div>
								</div>
							</div>
						</div>
					}
				/>

				{/* ════════════════ 4. 🌀 灵感工具箱 · React Bits 3D InfiniteSpiral ════════════════ */}
				<BentoCard
					name="灵感工具箱"
					description="精选 25+ 款高生产力前端库、设计工具与效率神器。"
					Icon={Sparkles}
					href="/favorite/share"
					cta="探索精选工具"
					className="col-span-1 md:col-span-1"
					background={
						<div className="absolute inset-0 w-full h-full overflow-hidden">
							<InfiniteSpiral
								items={webToolsSpiralItems}
								animationMode="auto"
								speed={0.4}
								radius={82}
								cardWidth={52}
								cardHeight={52}
								verticalSpacing={44}
								perspective={900}
								cardRadius={12}
								centerScale={1.18}
								edgeFade={0.15}
								edgeBlur={2}
								cardsPerTurn={7}
								pauseOnHover={true}
								imageFit="contain"
							/>
							{/* Soft Ambient Bottom Gradient Fade for readable typography */}
							<div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-zinc-900 dark:via-zinc-900/85 dark:to-transparent pointer-events-none z-5" />
						</div>
					}
				/>
			</BentoGrid>
		</div>
	)
}
