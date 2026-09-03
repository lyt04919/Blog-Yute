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

// Extract real books with full covers (strictly active books intended for display)
const realBooks: BookItem[] = (booksData as any[])
	.filter((b) => Boolean(b.cover) && b.isShow !== false && b.isShowOnHome !== false)
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

// 3 distinct washi tape styles (3 款质感各异的真实和纸/手账胶带)
function WashiTape({ variant = 'translucent', rotate = 0 }: { variant?: 'translucent' | 'grid' | 'dots'; rotate?: number }) {
	if (variant === 'grid') {
		// 款式 2：日系米黄方格手账胶带（完美还原图一手绘方格纸质感）
		return (
			<div
				style={{
					width: '60px',
					height: '20px',
					top: '-10px',
					left: '50%',
					transform: `translateX(-50%) rotate(${rotate}deg)`,
					backgroundColor: 'rgba(248, 243, 230, 0.88)',
					backdropFilter: 'blur(2px)',
					boxShadow: '0 1.5px 3.5px rgba(60, 45, 20, 0.14), inset 0 1px 1px rgba(255,255,255,0.9)',
					backgroundImage: `
						linear-gradient(rgba(120, 95, 60, 0.12) 1px, transparent 1px),
						linear-gradient(90deg, rgba(120, 95, 60, 0.12) 1px, transparent 1px)
					`,
					backgroundSize: '4px 4px',
					borderLeft: '1.5px dashed rgba(120, 95, 60, 0.28)',
					borderRight: '1.5px dashed rgba(120, 95, 60, 0.28)',
				}}
				className="absolute z-30 pointer-events-none rounded-[1px] select-none"
			/>
		)
	}

	if (variant === 'dots') {
		// 款式 3：暖调复古牛皮纸微波点胶带（深浅质感对比）
		return (
			<div
				style={{
					width: '52px',
					height: '18px',
					top: '-9px',
					left: '50%',
					transform: `translateX(-50%) rotate(${rotate}deg)`,
					backgroundColor: 'rgba(238, 224, 200, 0.85)',
					backdropFilter: 'blur(2px)',
					boxShadow: '0 1.5px 3px rgba(60, 45, 20, 0.14), inset 0 1px 1px rgba(255,255,255,0.75)',
					backgroundImage: `radial-gradient(rgba(130, 95, 55, 0.2) 1px, transparent 1px)`,
					backgroundSize: '4.5px 4.5px',
					borderLeft: '1.5px dashed rgba(130, 95, 55, 0.3)',
					borderRight: '1.5px dashed rgba(130, 95, 55, 0.3)',
				}}
				className="absolute z-30 pointer-events-none rounded-[1px] select-none"
			/>
		)
	}

	// 款式 1：半透明磨砂美纹纤维胶带（柔和雾面）
	return (
		<div
			style={{
				width: '54px',
				height: '18px',
				top: '-9px',
				left: '50%',
				transform: `translateX(-50%) rotate(${rotate}deg)`,
				backgroundColor: 'rgba(255, 248, 236, 0.76)',
				backdropFilter: 'blur(2.5px)',
				boxShadow: '0 1px 3px rgba(60, 45, 20, 0.12), inset 0 1px 1px rgba(255,255,255,0.9)',
				backgroundImage: `
					repeating-linear-gradient(
						45deg,
						rgba(140, 110, 70, 0.04) 0px,
						rgba(140, 110, 70, 0.04) 2px,
						transparent 2px,
						transparent 4px
					)
				`,
				borderLeft: '1.5px dashed rgba(140, 110, 70, 0.22)',
				borderRight: '1.5px dashed rgba(140, 110, 70, 0.22)',
			}}
			className="absolute z-30 pointer-events-none rounded-[1px] select-none"
		/>
	)
}

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
						<div className="absolute inset-0 w-full h-full overflow-hidden">
							<Marquee
								pauseOnHover
								duration="25s"
								gap="1.5rem"
								style={{ top: '36px' }}
								className="absolute inset-x-0 py-0"
							>
								{realBooks.map((item, idx) => (
									<div
										key={idx}
										style={{
											width: '112px',
											height: '168px',
											minWidth: '112px',
											maxWidth: '112px',
											flexShrink: 0,
										}}
										className="group/book relative w-28 h-[168px] rounded-xl overflow-hidden shadow-md border border-zinc-200/80 dark:border-zinc-700/80 shrink-0 select-none bg-zinc-100 dark:bg-zinc-800 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
									>
										{/* 1. Base book cover: 100% visible, authentic 2:3 vertical proportion */}
										<img 
											src={item.cover} 
											alt={item.name} 
											referrerPolicy="no-referrer"
											loading="lazy"
											decoding="async"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											className="w-full h-full object-cover transition-transform duration-300 group-hover/book:scale-105 select-none pointer-events-none" 
										/>

										{/* 2. Realistic book spine lighting fold */}
										<div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent pointer-events-none z-10" />
										<div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl pointer-events-none z-10" />
									</div>
								))}
							</Marquee>
						</div>
					}
				/>

				{/* ════════════════ 2. 电影胶片流 · React Bits 3D DriftWall (Adaptive Film Showcase) ════════════════ */}
				<BentoCard
					name="光影放映厅"
					description="3D 悬浮流动胶片流，收录 130+ 部影史高分神作与心灵共鸣。"
					Icon={Film}
					href="/favorite"
					cta="进入放映厅"
					className="col-span-1 md:col-span-2"
					progressiveBlurHeight="36%"
					blurLevels={[0.5, 1, 2.5, 4.5]}
					background={
						<div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-100/70 dark:bg-[#08080f]">
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
								dim={0.82}
								overlayColor="transparent"
							/>
						</div>
					}
				/>

				{/* ════════════════ 3. 📸 私享随笔 · 暖调复古拍立得三联画廊 (不同和纸贴纸 + 自然暖白相纸) ════════════════ */}
				<BentoCard
					name="私享随笔"
					description="记录日常思绪、旅途快照与那些触动心弦的生活切片。"
					Icon={Feather}
					href="/vault/diary"
					cta="翻阅生活日记"
					className="col-span-1 md:col-span-2"
					background={
						<div className="absolute inset-x-0 top-0 h-[260px] flex items-center justify-center pt-8 sm:pt-9 px-4 sm:px-6 select-none">
							<div className="flex items-center justify-center gap-3 sm:gap-5">
								{/* 1. 左侧拍立得：奥克兰黄昏 (-7°) · 搭配半透明磨砂美纹胶带 */}
								<div
									style={{
										width: '146px',
										height: '182px',
										transform: 'rotate(-7deg) translateY(12px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
										boxShadow: '0 4px 6px -1px rgba(50,35,15,0.07), 0 14px 28px -4px rgba(45,30,15,0.15), 0 0 0 1px rgba(160,135,100,0.18)'
									}}
									className="relative bg-gradient-to-b from-[#FDFBF7] via-[#F8F5EE] to-[#EFEBE0] p-2.5 pb-6 rounded-[8px] pointer-events-none group-hover:!-rotate-[11deg] group-hover:!-translate-x-3 group-hover:!translate-y-2 group-hover:shadow-2xl flex flex-col shrink-0"
								>
									{/* 贴纸 1：半透明磨砂微纤维胶带 */}
									<WashiTape variant="translucent" rotate={3} />

									{/* 经典 1:1 方形照片窗口 */}
									<div 
										style={{ 
											width: '126px', 
											height: '126px',
											boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(0,0,0,0.1)'
										}} 
										className="relative rounded-[4px] overflow-hidden bg-zinc-900 shrink-0"
									>
										<img
											src="/images/uploads/7ef4d45667098fa8.jpeg"
											alt="Auckland Sunset"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
										{/* 胶片高光反光膜 */}
										<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
									</div>

									{/* 拍立得暖调复古宽下巴手写留白 */}
									<div className="flex-1 flex items-center justify-center pt-1.5 px-0.5 overflow-visible">
										<p 
											style={{ 
												fontFamily: 'var(--font-cursive), "Caveat", "Bradley Hand", cursive',
												fontSize: '15px',
												color: '#262017',
												transform: 'rotate(-0.8deg)'
											}}
											className="font-medium tracking-wide text-center whitespace-nowrap select-none opacity-90"
										>
											Sunset Beach &apos;24
										</p>
									</div>
								</div>

								{/* 2. 中间拍立得：蒂卡波湖 (0° 视觉主位微浮) · 搭配日系和纸方格胶带 (参考图一) */}
								<div
									style={{
										width: '150px',
										height: '186px',
										transform: 'rotate(0deg) translateY(2px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
										zIndex: 10,
										boxShadow: '0 8px 14px -2px rgba(50,35,15,0.1), 0 22px 42px -6px rgba(45,30,15,0.2), 0 0 0 1px rgba(160,135,100,0.2)'
									}}
									className="relative bg-gradient-to-b from-[#FDFBF7] via-[#F8F5EE] to-[#EFEBE0] p-2.5 pb-6 rounded-[8px] pointer-events-none group-hover:!-translate-y-2 group-hover:!scale-104 group-hover:shadow-2xl flex flex-col shrink-0"
								>
									{/* 贴纸 2：日系手账方格纸胶带（完美还原图一） */}
									<WashiTape variant="grid" rotate={-2} />

									{/* 经典 1:1 方形照片窗口 */}
									<div 
										style={{ 
											width: '130px', 
											height: '130px',
											boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(0,0,0,0.1)'
										}} 
										className="relative rounded-[4px] overflow-hidden bg-zinc-900 shrink-0"
									>
										<img
											src="/images/uploads/0c004c6f642839f2.jpeg"
											alt="Lake Tekapo"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
										{/* 胶片高光反光膜 */}
										<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
									</div>

									{/* 拍立得暖调复古宽下巴手写留白 */}
									<div className="flex-1 flex items-center justify-center pt-1.5 px-0.5 overflow-visible">
										<p 
											style={{ 
												fontFamily: 'var(--font-cursive), "Caveat", "Bradley Hand", cursive',
												fontSize: '15px',
												color: '#262017',
												transform: 'rotate(0.5deg)'
											}}
											className="font-medium tracking-wide text-center whitespace-nowrap select-none opacity-90"
										>
											Lake Tekapo &apos;24
										</p>
									</div>
								</div>

								{/* 3. 右侧拍立得：皇后镇日落 (+7°) · 搭配浅咖牛皮微波点胶带 */}
								<div
									style={{
										width: '146px',
										height: '182px',
										transform: 'rotate(7deg) translateY(12px)',
										transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
										boxShadow: '0 4px 6px -1px rgba(50,35,15,0.07), 0 14px 28px -4px rgba(45,30,15,0.15), 0 0 0 1px rgba(160,135,100,0.18)'
									}}
									className="relative bg-gradient-to-b from-[#FDFBF7] via-[#F8F5EE] to-[#EFEBE0] p-2.5 pb-6 rounded-[8px] pointer-events-none group-hover:!rotate-[11deg] group-hover:!translate-x-3 group-hover:!translate-y-2 group-hover:shadow-2xl flex flex-col shrink-0"
								>
									{/* 贴纸 3：暖调复古牛皮纸微波点胶带 */}
									<WashiTape variant="dots" rotate={2.5} />

									{/* 经典 1:1 方形照片窗口 */}
									<div 
										style={{ 
											width: '126px', 
											height: '126px',
											boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(0,0,0,0.1)'
										}} 
										className="relative rounded-[4px] overflow-hidden bg-zinc-900 shrink-0"
									>
										<img
											src="/images/uploads/844b159ea02995f4.jpeg"
											alt="Queenstown"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											loading="lazy"
										/>
										{/* 胶片高光反光膜 */}
										<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
									</div>

									{/* 拍立得暖调复古宽下巴手写留白 */}
									<div className="flex-1 flex items-center justify-center pt-1.5 px-0.5 overflow-visible">
										<p 
											style={{ 
												fontFamily: 'var(--font-cursive), "Caveat", "Bradley Hand", cursive',
												fontSize: '15px',
												color: '#262017',
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
						</div>
					}
				/>
			</BentoGrid>
		</div>
	)
}
