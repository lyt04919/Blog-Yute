'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { 
	Play, 
	Pause, 
	SkipForward, 
	SkipBack, 
	ArrowUpRight, 
	Star, 
	X, 
	ExternalLink, 
	Gamepad2, 
	Tv, 
	Disc, 
	Sparkles, 
	PlayCircle,
	Globe,
	Copy,
	Check
} from 'lucide-react'
import { toast } from 'sonner'
import { Marquee } from '@/components/ui/marquee'
import { HeroVideoModal } from '@/components/ui/hero-video-dialog'

// 数据源引入
import moviesData from '@/data/movies.json'
import booksData from '@/data/books.json'
import musicData from '@/app/favorite/music.json'
import gamesData from '@/app/favorite/games.json'
import videosData from '@/app/favorite/videos.json'
import shareData from '@/app/favorite/share/list.json'

function getShareTagStyle(tag: string) {
	const t = tag.trim().toLowerCase()
	if (/ai|人工智能|gpt|大模型/i.test(t)) {
		return { label: tag, emoji: '✨', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
	}
	if (/开发|编程|代码|dev|github|api/i.test(t)) {
		return { label: tag, emoji: '💻', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
	}
	if (/设计|ui|ux|css|图标|配色|3d/i.test(t)) {
		return { label: tag, emoji: '🎨', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
	}
	if (/工具|效率|生产力|转换|压缩/i.test(t)) {
		return { label: tag, emoji: '⚡', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
	}
	return { label: tag, emoji: '💡', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
}

export default function AudioCinemaLounge() {
	// 核心状态：播放中 / 暂停中 (唯一交互为点击拨杆/唱臂切换落针与移开)
	const [isPlaying, setIsPlaying] = useState<boolean>(true)
	const [currentMusicIndex, setCurrentMusicIndex] = useState<number>(0)
	const [isArmHovered, setIsArmHovered] = useState<boolean>(false)
	const [isCopied, setIsCopied] = useState<boolean>(false)
	const [activeVideo, setActiveVideo] = useState<{ url: string; title?: string } | null>(null)

	// 选中的详情模态卡片数据
	const [selectedItem, setSelectedItem] = useState<{
		title: string
		cover: string
		type: 'movie' | 'book' | 'game' | 'video' | 'share'
		categoryName: string
		subtitle?: string
		stars?: number
		score?: string
		status?: string
		desc?: string
		tags?: string[]
		quote?: string
		link?: string
		review?: string
		chapters?: { time: string; title: string }[]
	} | null>(null)

	// 1. 🎵 音乐数据
	const playlist = useMemo(() => {
		return musicData.filter((m) => m.isShow && m.isShowOnHome !== false)
	}, [])

	const currentTrack = playlist[currentMusicIndex] || playlist[0]

	// 唯一交互：点击拨杆/唱臂切换播放/暂停
	const togglePlayState = () => {
		setIsPlaying((prev) => !prev)
	}

	// 切换上一首曲目
	const handlePrevTrack = (e?: React.MouseEvent) => {
		if (e) e.stopPropagation()
		setCurrentMusicIndex((prev) => (prev - 1 + playlist.length) % playlist.length)
		if (!isPlaying) setIsPlaying(true)
	}

	// 切换下一首曲目
	const handleNextTrack = (e?: React.MouseEvent) => {
		if (e) e.stopPropagation()
		setCurrentMusicIndex((prev) => (prev + 1) % playlist.length)
		if (!isPlaying) setIsPlaying(true)
	}

	// 复制链接辅助
	const handleCopyUrl = (url?: string) => {
		if (!url) return
		navigator.clipboard.writeText(url)
		setIsCopied(true)
		toast.success('已复制网址到剪贴板 🚀')
		setTimeout(() => setIsCopied(false), 2000)
	}


	// 4. 🌐 网页灵感与极客工具列表 (Web & Geek Tools)
	const sharesList = useMemo(() => {
		return (shareData as any[])
			.filter((s) => s.isShow !== false)
			.map((s) => {
				let domain = ''
				try {
					const parsed = new URL(s.url?.startsWith('http') ? s.url : `https://${s.url}`)
					domain = parsed.hostname.replace(/^www\./, '')
				} catch {
					domain = s.url || ''
				}
				const fallbackLogo = s.url ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : ''
				return {
					id: `share-${s.name}`,
					type: 'share' as const,
					title: s.name,
					subtitle: domain || '极客工具',
					cover: s.logo || fallbackLogo,
					stars: s.stars || 4,
					desc: s.description,
					tags: s.tags || ['工具'],
					link: s.url,
				}
			})
	}, [])

	// 5. 🎮 游戏列表 (16:9 横版 Steam 胶囊)
	const gamesList = useMemo(() => {
		return (gamesData as any[])
			.filter((g) => g.isShow !== false && g.cover)
			.map((g) => ({
				id: `game-${g.name}`,
				type: 'game' as const,
				title: g.name,
				subtitle: g.subtitle || g.category || 'PC / Steam',
				cover: g.cover,
				stars: g.stars || 5,
				status: g.status || '精选游艺',
				category: g.category || '第九艺术',
				desc: g.desc,
				review: g.review,
				link: g.link || '/favorite/games',
			}))
	}, [])

	// 6. 📺 视频列表 (16:9 横版 YouTube 视听)
	const videosList = useMemo(() => {
		return (videosData as any[])
			.filter((v) => v.isShow !== false && v.cover)
			.map((v) => ({
				id: `video-${v.name}`,
				type: 'video' as const,
				title: v.name,
				subtitle: v.subtitle || 'YouTube 精选',
				cover: v.cover,
				stars: v.stars || 5,
				status: v.status || '精选视听',
				category: v.category || '深度对谈',
				desc: v.desc,
				review: v.review,
				link: v.link || '/favorite/videos',
				chapters: v.chapters || [],
			}))
	}, [])

	const sharesDuration = `${Math.max(12, Math.round((sharesList.length * cardPitchWeb) / speedPxPerSec))}s`
	const gamesDuration = `${Math.max(12, Math.round((gamesList.length * cardPitchHorizontal) / speedPxPerSec))}s`
	const videosDuration = `${Math.max(12, Math.round((videosList.length * cardPitchHorizontal) / speedPxPerSec))}s`

	const totalMovies = moviesData.length
	const totalBooks = booksData.length
	const totalMusic = musicData.length
	const totalGames = gamesData.length
	const totalVideos = videosData.length
	const totalShares = shareData.length

	return (
		<section id="favorites-lounge" className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24 pt-10 sm:pt-14 pb-28 sm:pb-36 select-none relative z-10 block">
			{/* 模块居中高级典雅衬线主标题 (Editorial Typography Header) */}
			<div className="text-center mb-8 sm:mb-10 w-full">
				<span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#A68A68] dark:text-[#C5A880] uppercase font-semibold block mb-1.5">
					CURATED PLEASURES · 私享客厅
				</span>
				<h2 className="text-2xl sm:text-3xl md:text-[38px] font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
					Audio & Cinema Lounge
				</h2>
				<p className="mt-1.5 text-xs sm:text-sm font-serif italic text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
					“A personal sanctuary of curated sound, cinema, literature & digital craft.”
				</p>
			</div>

			{/* 🌟 核心展厅内容布局 (黑胶展台 + 第一层竖版海报/书卷 + 第二层横版游戏/视听) */}
			<div className="flex flex-col gap-10 sm:gap-12 w-full items-center">
				
				{/* ════════════════ 1. 🎵 核心黑胶展台：锁定等高对称双栏 ════════════════ */}
				<div className="w-full max-w-[920px] flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8">
					
					{/* 1.1 🎵 左侧：黑胶唱机 (锁定 440px 宽，248px 高，全景完整显示) */}
					<div 
						style={{ width: '100%', maxWidth: '440px' }}
						className="shrink-0 flex flex-col items-center justify-center"
					>
						<div className="relative w-full">
							{/* 底部物理接触深邃柔和阴影 */}
							<div 
								style={{
									width: '92%',
									height: '36px',
									bottom: '-12px',
									left: '4%',
									background: 'radial-gradient(ellipse at center, rgba(140,110,70,0.38) 0%, rgba(0,0,0,0.22) 42%, transparent 75%)',
								}}
								className="absolute pointer-events-none filter blur-md -z-10"
							/>

							{/* 唱机主体容器 (严格固定 16:9 比例) */}
							<div 
								style={{ width: '100%', height: '248px', position: 'relative' }}
								className="rounded-3xl overflow-hidden group/turntable cursor-pointer shadow-[0_16px_36px_rgba(140,110,70,0.18),0_6px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.85)] bg-[#F8F5F0] dark:bg-zinc-950"
								onClick={togglePlayState}
								title="点击拨杆或机身进行 播放 / 暂停"
							>
								{/* 💽 1. 经典影棚背景超写实机身底座 */}
								<img 
									src="/images/turntable-clean-base.webp" 
									alt="Luxury Champagne Gold Turntable Studio Base"
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									className="select-none pointer-events-none"
								/>

								{/* 🦾 2. 核心唯一可动部件：高精独立透明金属唱臂杆与唱头 */}
								<motion.div
									onHoverStart={() => setIsArmHovered(true)}
									onHoverEnd={() => setIsArmHovered(false)}
									animate={{
										rotate: isPlaying ? 14 : -20, 
										y: isPlaying ? 0 : -3.5,
										scale: isArmHovered ? 1.02 : 1,
									}}
									transition={{
										duration: 0.85,
										ease: [0.34, 1.56, 0.64, 1],
									}}
									style={{
										position: 'absolute',
										top: '-1.4%',
										right: '7.7%',
										width: '46.5%',
										height: '82.6%',
										transformOrigin: '68.5% 28.0%',
										zIndex: 30,
									}}
									className="cursor-pointer group/arm"
									title={isPlaying ? '点击拨杆移开暂停' : '点击拨杆落针播放'}
								>
									<img 
										src="/images/tonearm-wand-only.png" 
										alt="Articulated Gold Tonearm Wand"
										style={{ width: '100%', height: '100%', objectFit: 'contain' }}
										className="select-none pointer-events-none drop-shadow-[0_5px_10px_rgba(0,0,0,0.3)]"
									/>

									{/* 唱头上的高精度绿色 LED 循轨指示灯 */}
									<div 
										style={{
											position: 'absolute',
											bottom: '18%',
											left: '15%',
											width: '5.5px',
											height: '5.5px',
										}}
										className={`rounded-full transition-all duration-300 ${
											isPlaying
												? 'bg-emerald-400 shadow-[0_0_7px_#34d399,0_0_13px_#34d399]'
												: 'bg-zinc-600 shadow-none'
										}`}
									/>

									{/* 悬停微徽标 */}
									<div className="absolute top-7 right-7 opacity-0 group-hover/arm:opacity-100 transition-opacity pointer-events-none">
										<span className="px-2 py-0.5 rounded-full bg-amber-950/85 text-amber-200 text-[8px] font-mono border border-amber-500/40 shadow-md">
											{isPlaying ? '点击拨开 ⏸' : '点击落针 ▶'}
										</span>
									</div>
								</motion.div>
							</div>

							{/* 底部状态提示 */}
							<div className="mt-2.5 text-center">
								<span className="text-[11px] font-mono tracking-wider text-zinc-600 dark:text-zinc-300 inline-flex items-center gap-1.5 font-medium">
									<span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
									{isPlaying ? '唱针正在循轨 · 点击拨杆可暂停' : '唱机待机中 · 点击拨杆落针播放'}
								</span>
							</div>
						</div>
					</div>

					{/* 1.2 🎛️ 右侧：发烧级黑胶主理控制台 */}
					<div 
						style={{ width: '100%', maxWidth: '440px', height: '248px' }}
						className="shrink-0 flex flex-col justify-between"
					>
						{/* 一体化发烧主控舱 */}
						<div 
							className={`h-full p-4 sm:p-4.5 rounded-3xl backdrop-blur-2xl border transition-all duration-300 shadow-[0_16px_36px_rgba(140,110,70,0.1),0_6px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-between overflow-hidden ${
								isPlaying
									? 'bg-[#FAF7F2] dark:bg-[#1A1816] border-[#D8C9B5] dark:border-[#4A3E31]'
									: 'bg-zinc-100/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 opacity-90'
							}`}
						>
							{/* 1.2.1 顶栏：发烧规格徽章 + 呼吸信号 */}
							<div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06] dark:border-white/[0.08]">
								<div className="flex items-center gap-2">
									<span className="relative flex h-2 w-2">
										<span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-amber-500' : 'bg-zinc-400'}`} />
										<span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-amber-600' : 'bg-zinc-500'}`} />
									</span>
									<span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#8C6E46] dark:text-[#D4B68D]">
										DENON DP-3000 · DIRECT DRIVE
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#EFE4D6] dark:bg-amber-950/80 text-[#7A4E1D] dark:text-amber-300 font-bold border border-amber-300/60 dark:border-amber-700/50 shadow-2xs">
										33 ⅓ RPM
									</span>
									<span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/60 dark:border-emerald-800/40 shadow-2xs">
										HI-RES
									</span>
								</div>
							</div>

							{/* 1.2.2 歌曲主标题、封面与流派 */}
							<div className="flex items-center gap-3 pt-0.5">
								{/* 实体专辑封面相框 */}
								<div 
									style={{ width: '48px', height: '48px' }}
									className="relative shrink-0 rounded-2xl overflow-hidden shadow-md bg-zinc-900 border border-black/15"
								>
									<img
										src={currentTrack?.cover}
										alt={currentTrack?.name}
										style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										className="select-none pointer-events-none"
									/>
									<div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/20 pointer-events-none" />
								</div>

								{/* 歌曲主标题与艺术家 */}
								<div className="flex-1 min-w-0 flex flex-col justify-center">
									<div className="flex items-center gap-1.5 min-w-0">
										<h4 
											title={currentTrack?.name}
											className="text-base font-serif font-bold text-zinc-900 dark:text-zinc-50 truncate tracking-tight"
										>
											{currentTrack?.name || '光辉岁月'}
										</h4>
										<Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
									</div>
									<p className="text-xs text-[#8C6E46] dark:text-amber-300/90 font-mono font-medium truncate mt-0.5">
										{currentTrack?.subtitle || 'Beyond'}
									</p>
									<p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
										{currentTrack?.desc || '粤语流行 · 经典黑胶单曲'}
									</p>
								</div>
							</div>

							{/* 1.2.3 高对比金色播控按键组 + 动感跳跃金色音频波形柱 */}
							<div className="flex items-center justify-between gap-3 py-1 px-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border border-black/[0.05] dark:border-white/[0.05]">
								{/* 播放控制键组 */}
								<div className="flex items-center gap-1.5 shrink-0">
									<button
										type="button"
										onClick={handlePrevTrack}
										style={{ width: '32px', height: '32px' }}
										className="rounded-full bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
										title="上一首黑胶曲目"
									>
										<SkipBack className="w-3.5 h-3.5 fill-current" />
									</button>

									{/* 核心高对比大播放/暂停按键 */}
									<button
										type="button"
										onClick={togglePlayState}
										style={{
											width: '40px',
											height: '40px',
											background: isPlaying
												? 'linear-gradient(135deg, #D4AF37 0%, #B8860B 50%, #996515 100%)'
												: '#27272A',
										}}
										className="rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-md border border-amber-300/80 dark:border-amber-500/50"
										title={isPlaying ? '拨开唱臂暂停' : '落针播放'}
									>
										{isPlaying ? (
											<Pause className="w-4 h-4 fill-white text-white drop-shadow-sm" />
										) : (
											<Play className="w-4 h-4 fill-white text-white translate-x-0.5 drop-shadow-sm" />
										)}
									</button>

									<button
										type="button"
										onClick={handleNextTrack}
										style={{ width: '32px', height: '32px' }}
										className="rounded-full bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
										title="下一首黑胶曲目"
									>
										<SkipForward className="w-3.5 h-3.5 fill-current" />
									</button>
								</div>

								{/* 动态 18 段发烧级跳跃音频波形条 */}
								<div className="flex-1 flex items-center justify-center gap-[3px] h-7 px-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-amber-200/60 dark:border-zinc-800 shadow-inner overflow-hidden">
									{[14, 22, 10, 26, 16, 24, 12, 20, 28, 15, 22, 11, 25, 18, 27, 13, 21, 16].map((maxH, i) => (
										<motion.span
											key={i}
											animate={isPlaying ? {
												height: [4, maxH * 0.75, maxH * 0.35, maxH * 0.9, 4],
											} : {
												height: 3,
											}}
											transition={isPlaying ? {
												repeat: Infinity,
												duration: 0.8 + ((i % 5) * 0.15),
												ease: 'easeInOut',
											} : {
												duration: 0.3,
											}}
											style={{
												width: '3px',
												borderRadius: '9999px',
												background: isPlaying
													? 'linear-gradient(to top, #B8860B, #F59E0B)'
													: '#A1A1AA',
											}}
											className="inline-block"
										/>
									))}
								</div>
							</div>

							{/* 1.2.4 典藏黑胶唱片匣快捷切换 */}
							<div className="pt-1 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-1.5">
								<div className="flex items-center justify-between px-0.5">
									<span className="text-[9.5px] font-mono font-bold tracking-wider uppercase text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
										<Disc className="w-3.5 h-3.5 text-[#A68A68] dark:text-[#C5A880]" />
										<span>VINYL CRATE · 典藏黑胶匣</span>
									</span>
									<Link
										href="/favorite/music"
										className="text-[9.5px] font-mono font-bold text-[#8C5E28] dark:text-amber-300 hover:underline flex items-center gap-0.5"
									>
										<span>全部 {totalMusic} 首</span>
										<ArrowUpRight className="w-2.5 h-2.5" />
									</Link>
								</div>

								{/* 3 张实体感精选黑胶微卡片 */}
								<div className="grid grid-cols-3 gap-1.5">
									{playlist.slice(0, 3).map((track, idx) => (
										<button
											key={track.name}
											type="button"
											onClick={() => {
												setCurrentMusicIndex(idx)
												if (!isPlaying) setIsPlaying(true)
											}}
											className={`p-1.5 rounded-2xl transition-all flex items-center gap-1.5 text-left cursor-pointer border min-w-0 ${
												currentMusicIndex === idx
													? 'bg-[#FAF3EA] dark:bg-amber-950/40 border-[#C8A97E] dark:border-amber-600/60 shadow-xs ring-1 ring-[#C8A97E]/30'
													: 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
											}`}
										>
											<img 
												src={track.cover} 
												alt={track.name}
												style={{ width: '24px', height: '24px' }}
												className="rounded-lg object-cover shadow-2xs shrink-0"
											/>
											<div className="min-w-0 flex-1 overflow-hidden">
												<h5 
													title={track.name}
													className={`text-[11px] font-serif font-bold truncate ${
														currentMusicIndex === idx 
															? 'text-[#78461C] dark:text-amber-200' 
															: 'text-zinc-800 dark:text-zinc-200'
													}`}
												>
													{track.name}
												</h5>
												<p className="text-[8.5px] text-zinc-600 dark:text-zinc-300 font-mono truncate">
													{track.subtitle}
												</p>
											</div>
										</button>
									))}
								</div>
							</div>

						</div>

					</div>

				</div>


				{/* ════════════════ 3. 🌐 第二层（全新）：网页灵感与极客工具 (Web & Tools Marquee) ════════════════ */}
				<div className="relative w-full overflow-hidden rounded-3xl p-3.5 sm:p-4.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-xs">
					<div className="flex items-center justify-between gap-2 mb-3.5 px-1.5">
						<div className="flex items-center gap-2">
							<Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
							<h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
								Web & Tools · 灵感工具与极客站点
							</h3>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
								{sharesList.length} 款精选
							</span>
							<Link
								href="/favorite/share"
								className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
							>
								<span>全部</span>
								<ArrowUpRight className="w-2.5 h-2.5" />
							</Link>
						</div>
					</div>

					{/* 左右无缝渐变遮罩 */}
					<div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_36px,black_calc(100%-36px),transparent_100%)]">
						<Marquee pauseOnHover duration={sharesDuration} className="py-1">
							{sharesList.map((share) => {
								const tagStyle = getShareTagStyle(share.tags[0] || '工具')
								return (
									<div
										key={share.id}
										onClick={() => setSelectedItem({
											title: share.title,
											cover: share.cover,
											type: 'share',
											categoryName: '网页工具 · Web & Tools',
											subtitle: share.subtitle,
											stars: share.stars,
											desc: share.desc,
											tags: share.tags,
											link: share.link,
										})}
										style={{ width: '230px' }}
										className="shrink-0 group/card cursor-pointer flex items-center gap-3 p-2.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-850 border border-black/5 dark:border-white/10 hover:border-amber-400/50 dark:hover:border-amber-500/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 mx-1.5"
									>
										{/* Favicon / Logo 相框 */}
										<div 
											style={{ width: '42px', height: '42px' }}
											className="relative shrink-0 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800 p-1.5 shadow-2xs border border-black/5 dark:border-white/10 flex items-center justify-center group-hover/card:scale-106 transition-transform"
										>
											<img
												src={share.cover}
												alt={share.title}
												style={{ width: '100%', height: '100%', objectFit: 'contain' }}
												className="select-none pointer-events-none"
												onError={(e) => {
													(e.target as HTMLElement).style.display = 'none'
												}}
											/>
										</div>

										{/* 站点名称与精炼描述 */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-1">
												<h4 className="text-xs font-serif font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors">
													{share.title}
												</h4>
												<span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded-full border ${tagStyle.bg} shrink-0`}>
													{tagStyle.emoji} {share.tags[0] || '工具'}
												</span>
											</div>
											<p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
												{share.desc || share.subtitle}
											</p>
											<div className="flex items-center gap-0.5 mt-1">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star
														key={i}
														className={`w-2 h-2 ${
															i < (share.stars || 4)
																? 'fill-amber-400 text-amber-400'
																: 'fill-transparent text-zinc-300 dark:text-zinc-700'
														}`}
													/>
												))}
											</div>
										</div>
									</div>
								)
							})}
						</Marquee>
					</div>
				</div>

				{/* ════════════════ 4. 🎮 第三层：游戏 (左) | 📺 视听 (右) 16:9 横版宽屏双走马灯 ════════════════ */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full items-start">
					
					{/* 4.1 🎮 左侧：互动游艺长廊 (Games Marquee) */}
					<div className="relative w-full overflow-hidden rounded-3xl p-3.5 sm:p-4.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-xs">
						<div className="flex items-center justify-between gap-2 mb-3.5 px-1">
							<div className="flex items-center gap-2">
								<Gamepad2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
								<h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
									Games · 互动艺术
								</h3>
							</div>
							<span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
								{gamesList.length} 款神作
							</span>
						</div>

						{/* 左右无缝渐变遮罩 */}
						<div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_36px,black_calc(100%-36px),transparent_100%)]">
							<Marquee pauseOnHover duration={gamesDuration} className="py-1">
								{gamesList.map((game) => (
									<div
										key={game.id}
										onClick={() => setSelectedItem({
											title: game.title,
											cover: game.cover,
											type: 'game',
											categoryName: '游艺 · Games',
											subtitle: game.subtitle,
											stars: game.stars,
											status: game.status,
											desc: game.desc,
											tags: [game.category, game.status],
											quote: game.review,
											link: game.link,
											review: game.review
										})}
										style={{ width: '185px' }}
										className="shrink-0 group/card cursor-pointer flex flex-col items-center mx-1.5"
									>
										{/* Steam 16:9 横版胶囊相框 */}
										<div 
											style={{ width: '185px', height: '104px' }}
											className="relative rounded-2xl overflow-hidden bg-zinc-950 shadow-[0_8px_20px_rgba(0,0,0,0.16)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.55)] border border-zinc-200/90 dark:border-zinc-800 transition-all duration-300 group-hover/card:scale-104 group-hover/card:-translate-y-1"
										>
											<img
												src={game.cover}
												alt={game.title}
												style={{ width: '100%', height: '100%', objectFit: 'cover' }}
												className="transition-transform duration-500 group-hover/card:scale-106 select-none pointer-events-none"
											/>
											<div className="absolute top-2 left-2 px-2 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-purple-300 text-[8.5px] font-mono font-bold border border-purple-400/30">
												{game.status}
											</div>
										</div>

										{/* 标题与真实星级 */}
										<div className="pt-2 text-center w-full px-1">
											<h4 className="text-xs font-serif font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
												{game.title}
											</h4>
											<p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
												{game.subtitle}
											</p>
											<div className="flex items-center justify-center gap-0.5 mt-1">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star 
														key={i} 
														className={`w-2.5 h-2.5 ${
															i < (game.stars || 5) 
																? 'fill-amber-400 text-amber-400' 
																: 'fill-transparent text-zinc-300 dark:text-zinc-700'
														}`} 
													/>
												))}
											</div>
										</div>
									</div>
								))}
							</Marquee>
						</div>
					</div>

					{/* 4.2 📺 右侧：视听视野漫谈 (Videos Marquee) */}
					<div className="relative w-full overflow-hidden rounded-3xl p-3.5 sm:p-4.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-xs">
						<div className="flex items-center justify-between gap-2 mb-3.5 px-1">
							<div className="flex items-center gap-2">
								<Tv className="w-4 h-4 text-rose-600 dark:text-rose-400" />
								<h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
									Videos · 视听视野
								</h3>
							</div>
							<span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
								{videosList.length} 期专栏
							</span>
						</div>

						{/* 左右无缝渐变遮罩 */}
						<div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_36px,black_calc(100%-36px),transparent_100%)]">
							<Marquee reverse pauseOnHover duration={videosDuration} className="py-1">
								{videosList.map((video) => (
									<div
										key={video.id}
										style={{ width: '185px' }}
										className="shrink-0 group/card cursor-pointer flex flex-col items-center mx-1.5"
									>
										{/* YouTube 16:9 宽屏相框：点击直接唤起 HeroVideoModal 原地播放 */}
										<div 
											style={{ width: '185px', height: '104px' }}
											className="relative rounded-2xl overflow-hidden bg-zinc-950 shadow-[0_8px_20px_rgba(0,0,0,0.16)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.55)] border border-zinc-200/90 dark:border-zinc-800 transition-all duration-300 group-hover/card:scale-104 group-hover/card:-translate-y-1"
											onClick={(e) => {
												e.stopPropagation()
												setActiveVideo({ url: video.link, title: video.title })
											}}
											title="点击原地全屏播放"
										>
											<img
												src={video.cover}
												alt={video.title}
												style={{ width: '100%', height: '100%', objectFit: 'cover' }}
												className="transition-transform duration-500 group-hover/card:scale-106 select-none pointer-events-none"
											/>
											{/* 呼吸光晕 Play 悬浮徽标 */}
											<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/35">
												<div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg transform group-hover/card:scale-110 transition-transform">
													<Play className="w-5 h-5 fill-white translate-x-0.5" />
												</div>
											</div>
											<div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md backdrop-blur-md bg-black/70 text-rose-300 text-[8.5px] font-mono font-bold border border-rose-400/30 flex items-center gap-1">
												<PlayCircle className="w-2.5 h-2.5 text-rose-400" />
												<span>PLAY</span>
											</div>
										</div>

										{/* 标题与真实星级：点击打开详情弹窗 */}
										<div 
											className="pt-2 text-center w-full px-1"
											onClick={() => setSelectedItem({
												title: video.title,
												cover: video.cover,
												type: 'video',
												categoryName: '视听 · Videos',
												subtitle: video.subtitle,
												stars: video.stars,
												status: video.status,
												desc: video.desc,
												tags: [video.category, video.status],
												quote: video.review,
												link: video.link,
												review: video.review,
												chapters: video.chapters
											})}
										>
											<h4 className="text-xs font-serif font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight group-hover/card:text-rose-600 dark:group-hover/card:text-rose-400 transition-colors">
												{video.title}
											</h4>
											<p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
												{video.subtitle}
											</p>
											<div className="flex items-center justify-center gap-0.5 mt-1">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star 
														key={i} 
														className={`w-2.5 h-2.5 ${
															i < (video.stars || 5) 
																? 'fill-amber-400 text-amber-400' 
																: 'fill-transparent text-zinc-300 dark:text-zinc-700'
														}`} 
													/>
												))}
											</div>
										</div>
									</div>
								))}
							</Marquee>
						</div>
					</div>

				</div>

				{/* ════════════════ 5. 底栏：全景数据统计与收藏库直达 (Bottom Stats Bar) ════════════════ */}
				<div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full">
					<div className="font-mono tracking-[0.16em] text-zinc-600 dark:text-zinc-400 text-center sm:text-left font-semibold uppercase text-[10px] sm:text-[11px]">
						{totalMovies} MOVIES · {totalBooks} BOOKS · {totalMusic} VINYLS · {totalGames} GAMES · {totalVideos} VIDEOS · {totalShares} TOOLS
					</div>

					<Link
						href="/favorite"
						className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold bg-[#EAE0D0] text-[#78461C] hover:bg-[#DFCDB6] dark:bg-amber-950/80 dark:text-amber-200 dark:hover:bg-amber-900/80 transition-all shadow-xs active:scale-95 cursor-pointer text-xs"
					>
						<span>进入完整 Favorites 收藏馆</span>
						<ArrowUpRight className="w-3.5 h-3.5" />
					</Link>
				</div>

			</div>

			{/* ════════════════ 藏品详情微弹窗 (Quick Detail Modal) ════════════════ */}
			<AnimatePresence>
				{selectedItem && (
					<div 
						className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
						onClick={() => setSelectedItem(null)}
					>
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/75 backdrop-blur-md"
						/>

						<motion.div
							initial={{ scale: 0.9, y: 20, opacity: 0 }}
							animate={{ scale: 1, y: 0, opacity: 1 }}
							exit={{ scale: 0.92, y: 15, opacity: 0 }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							style={{ backgroundColor: '#FAF8F5' }}
							className="relative z-10 w-full max-w-lg dark:!bg-[#18181B] p-5 sm:p-6 rounded-3xl shadow-2xl border border-zinc-200/90 dark:border-zinc-700/80 overflow-hidden"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								onClick={() => setSelectedItem(null)}
								className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
							>
								<X className="w-4 h-4" />
							</button>

							<div className="flex flex-col sm:flex-row gap-5 items-start">
								{/* 封面相框：根据横竖版/网页图标自适应比例 */}
								<div 
									style={
										selectedItem.type === 'share'
											? { width: '84px', height: '84px' }
											: selectedItem.type === 'game' || selectedItem.type === 'video'
											? { width: '180px', height: '105px' }
											: { width: '130px', height: '190px' }
									}
									className={`shrink-0 rounded-2xl overflow-hidden shadow-md border ${
										selectedItem.type === 'share'
											? 'bg-white dark:bg-zinc-800 border-black/10 p-2 flex items-center justify-center'
											: 'bg-zinc-950 border-black/10 relative group/modal-cover'
									} ${selectedItem.type === 'video' ? 'cursor-pointer' : ''}`}
									onClick={() => {
										if (selectedItem.type === 'video' && selectedItem.link) {
											setActiveVideo({ url: selectedItem.link, title: selectedItem.title })
										}
									}}
								>
									<img
										src={selectedItem.cover}
										alt={selectedItem.title}
										style={{ width: '100%', height: '100%', objectFit: selectedItem.type === 'share' ? 'contain' : 'cover' }}
										className="select-none pointer-events-none"
										onError={(e) => {
											if (selectedItem.type === 'share') {
												(e.target as HTMLElement).style.display = 'none'
											}
										}}
									/>
									{selectedItem.type === 'video' && (
										<div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/modal-cover:bg-black/60 transition-colors">
											<div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
												<Play className="w-5 h-5 fill-white translate-x-0.5" />
											</div>
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
											{selectedItem.categoryName}
										</span>
										{selectedItem.status && (
											<span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
												{selectedItem.status}
											</span>
										)}
										{selectedItem.tags && selectedItem.tags.map((tag, idx) => (
											<span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/5">
												#{tag}
											</span>
										))}
									</div>

									<h3 className="text-lg sm:text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1">
										{selectedItem.title}
									</h3>

									{selectedItem.subtitle && (
										<p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
											{selectedItem.subtitle}
										</p>
									)}

									<div className="flex items-center gap-1 text-amber-500 mb-3">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												className={`w-3.5 h-3.5 ${
													i < (selectedItem.stars || 5)
														? 'fill-amber-400 text-amber-400'
														: 'fill-transparent text-zinc-300 dark:text-zinc-600'
												}`}
											/>
										))}
									</div>

									{selectedItem.quote && (
										<p className="text-xs italic text-zinc-600 dark:text-zinc-300 border-l-2 border-amber-600/60 pl-2.5 py-0.5 mb-3 leading-relaxed">
											"{selectedItem.quote}"
										</p>
									)}

									<p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3 mb-4">
										{selectedItem.desc || selectedItem.review || '暂无详细简介。'}
									</p>

									{selectedItem.chapters && selectedItem.chapters.length > 0 && (
										<div className="mb-3 p-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-black/5 dark:border-white/5">
											<span className="text-[9px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
												章节概览 ({selectedItem.chapters.length})
											</span>
											<div className="flex flex-wrap gap-1">
												{selectedItem.chapters.slice(0, 4).map((ch, idx) => (
													<span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/5">
														{ch.time} {ch.title}
													</span>
												))}
											</div>
										</div>
									)}

									{selectedItem.type === 'share' ? (
										<div className="flex items-center gap-2 pt-1">
											{selectedItem.link && (
												<a
													href={selectedItem.link}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all shadow-xs"
												>
													<span>访问官方站点</span>
													<ExternalLink className="w-3 h-3" />
												</a>
											)}
											{selectedItem.link && (
												<button
													type="button"
													onClick={() => handleCopyUrl(selectedItem.link)}
													className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
												>
													{isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
													<span>{isCopied ? '已复制' : '复制网址'}</span>
												</button>
											)}
										</div>
									) : selectedItem.type === 'video' ? (
										<div className="flex items-center gap-2 pt-1">
											{selectedItem.link && (
												<button
													type="button"
													onClick={() => setActiveVideo({ url: selectedItem.link!, title: selectedItem.title })}
													className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xs cursor-pointer active:scale-95"
												>
													<Play className="w-3 h-3 fill-white" />
													<span>原地高清播放</span>
												</button>
											)}
											{selectedItem.link && (
												<a
													href={selectedItem.link}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 transition-all"
												>
													<span>前往源站</span>
													<ExternalLink className="w-3 h-3" />
												</a>
											)}
										</div>
									) : (
										selectedItem.link && (
											<a
												href={selectedItem.link}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all shadow-xs"
											>
												<span>
													{selectedItem.type === 'game' 
														? '直达 Steam / 游戏源站' 
														: '查看详情 / 直达源站'}
												</span>
												<ExternalLink className="w-3 h-3" />
											</a>
										)
									)}
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* ════════════════ 影院级 HeroVideoModal 视频播放弹窗 ════════════════ */}
			<HeroVideoModal
				isOpen={Boolean(activeVideo)}
				onClose={() => setActiveVideo(null)}
				videoSrc={activeVideo?.url || ''}
				animationStyle="from-center"
			/>
		</section>
	)
}
