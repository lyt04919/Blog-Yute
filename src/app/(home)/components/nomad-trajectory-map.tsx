'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { 
	ArrowUpRight, 
	Compass, 
	X, 
	Camera, 
	RotateCw, 
	ChevronLeft, 
	ChevronRight 
} from 'lucide-react'
import { WORLD_MAP_SVG_PATH } from './world-map-data'
import rawFootprints from '@/data/footprints.json'

const WorldMapBase = React.memo(function WorldMapBase() {
	return (
		<path
			d={WORLD_MAP_SVG_PATH}
			style={{ fill: '#E2D9C8' }}
			className="dark:!fill-[#25221E] transition-colors duration-500"
		/>
	)
})

export interface UserFootprintMoment {
	id: string
	city: string
	country: string
	date: string
	notes: string
	photo: string
	thumbPhoto?: string
	cityImages: string[] // 该城市专属的全部实拍相册图集
	// 地图真实地理坐标 (SVG 1000 x 480 像素点，100% 严格不变)
	pinX: number
	pinY: number
	// 拍立得照片中心位置 (拉开至四重大洋开阔空地，极致疏朗)
	cardX: number
	cardY: number
	// 照片顶部挂绳连接点
	attachX: number
	attachY: number
	// 弧线控制点
	curveX: number
	curveY: number
	tilt: string
}

export default function NomadTrajectoryMap() {
	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	// 从 footprints.json 提取各城市专属相册与文案
	const cityMap = useMemo(() => {
		const map: Record<string, { images: string[]; date: string; notes: string; coverImage: string }> = {}
		rawFootprints.forEach((fp) => {
			if (fp.city) {
				map[fp.city] = {
					images: fp.images && fp.images.length > 0 ? fp.images : [fp.coverImage || ''],
					coverImage: fp.coverImage || '',
					date: fp.date || '',
					notes: fp.notes || '',
				}
			}
		})
		return map
	}, [])

	// 4 大真实旅行点位 (方案 1：红棉线牵引悬挂法 + 城市独立专属相册)
	const moments: UserFootprintMoment[] = useMemo(() => {
		const aklData = cityMap['奥克兰']
		const qtnData = cityMap['皇后镇']
		const melData = cityMap['墨尔本']
		const hzData = cityMap['杭州']

		return [
			{
				id: 'fp-hangzhou',
				city: '杭州',
				country: '中国 · 浙江 (常驻地)',
				date: hzData?.date || '2023-07-01',
				notes: hzData?.notes || '西湖漫步与极客纪实，栖居科技与自然交融的江南小镇。',
				photo: '/images/footprints/img_1782661993745_5.jpg',
				thumbPhoto: '/images/footprints/img_1782661993745_5.thumb.webp',
				cityImages: hzData?.images && hzData.images.length > 0
					? hzData.images
					: ['/images/footprints/img_1782661993745_5.jpg'],
				pinX: 394, // 中国华东沿海 (绝对不变)
				pinY: 194,
				cardX: 472, // 往东北拉至北太平洋宽阔海域
				cardY: 92,
				attachX: 472,
				attachY: 42,
				curveX: 425,
				curveY: 105,
				tilt: '3.5deg',
			},
			{
				id: 'fp-melbourne',
				city: '墨尔本',
				country: '澳大利亚 · 维多利亚',
				date: melData?.date || '2025-07-10',
				notes: melData?.notes || '维多利亚海岸线漫步与城市地标探索，跨越南北半球的夏日记忆。',
				photo: '/images/footprints/fp_1784013203171_cover.jpg',
				thumbPhoto: '/images/footprints/fp_1784013203171_cover.thumb.webp',
				cityImages: melData?.images && melData.images.length > 0 
					? melData.images 
					: [
						'/images/footprints/fp_1784013203171_0.jpg',
						'/images/footprints/fp_1784013203171_1.jpg',
						'/images/footprints/fp_1784013203171_2.jpg'
					],
				pinX: 458, // 澳大利亚东南部 (绝对不变)
				pinY: 408,
				cardX: 360, // 往西南拉至印度洋空旷海域
				cardY: 412,
				attachX: 360,
				attachY: 362,
				curveX: 410,
				curveY: 382,
				tilt: '-4deg',
			},
			{
				id: 'fp-auckland',
				city: '奥克兰',
				country: '新西兰 · 北岛',
				date: aklData?.date || '2025-07-10',
				notes: aklData?.notes || '千帆之都的海外游学之旅，海港与天空塔见证青春。',
				photo: '/images/footprints/img_1782661993749_9.jpg',
				thumbPhoto: '/images/footprints/img_1782661993749_9.thumb.webp',
				cityImages: aklData?.images || [
					'/images/footprints/1782465587166_0.jpg',
					'/images/footprints/1782465587166_1.jpg',
					'/images/footprints/1782465587166_2.jpg',
					'/images/footprints/1782465587166_3.jpg',
					'/images/footprints/1782465587166_4.jpg',
					'/images/footprints/1782465587166_5.jpg',
					'/images/footprints/1782465587166_6.jpg'
				],
				pinX: 541, // 新西兰北岛 (绝对不变)
				pinY: 405,
				cardX: 630, // 往东拉至广袤南太平洋海域
				cardY: 342,
				attachX: 630,
				attachY: 292,
				curveX: 588,
				curveY: 338,
				tilt: '4deg',
			},
			{
				id: 'fp-queenstown',
				city: '皇后镇',
				country: '新西兰 · 南岛瓦卡蒂普湖',
				date: qtnData?.date || '2025-09-17',
				notes: qtnData?.notes || '瓦卡蒂普湖畔的晨光，震撼的中土世界自然风光。',
				photo: '/images/footprints/img_1782661993747_6.jpg',
				thumbPhoto: '/images/footprints/img_1782661993747_6.thumb.webp',
				cityImages: qtnData?.images || [
					'/images/footprints/1782481145466_0.jpg',
					'/images/footprints/1782481145466_1.jpg',
					'/images/footprints/1782481145466_2.jpg',
					'/images/footprints/1782481145466_3.jpg',
					'/images/footprints/1782481145466_4.jpg',
					'/images/footprints/1782481145466_5.jpg',
					'/images/footprints/1782481145466_6.jpg'
				],
				pinX: 524, // 新西兰南岛 (绝对不变)
				pinY: 431,
				cardX: 660, // 充分右移至广袤南太平洋海域，100% 完整露出新西兰南北二岛
				cardY: 475,
				attachX: 660,
				attachY: 415,
				curveX: 590,
				curveY: 470,
				tilt: '-3.5deg',
			},
		]
	}, [cityMap])

	// 1:1 空间模块同款全屏大图查看器状态 (城市专属相册多图循环)
	const [lightboxPhoto, setLightboxPhoto] = useState<{
		url: string
		city: string
		date?: string
		note?: string
		index: number
		total: number
		allImages: string[]
	} | null>(null)
	const [photoRotation, setPhotoRotation] = useState<number>(0)

	// 键盘全功能快捷键支持 (Esc 退出, 左右键切图, R 旋转)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!lightboxPhoto) return
			if (e.key === 'Escape') {
				setLightboxPhoto(null)
				setPhotoRotation(0)
			} else if (e.key === 'ArrowLeft') {
				const prevIdx = (lightboxPhoto.index - 1 + lightboxPhoto.total) % lightboxPhoto.total
				setPhotoRotation(0)
				setLightboxPhoto({
					...lightboxPhoto,
					url: lightboxPhoto.allImages[prevIdx],
					index: prevIdx,
				})
			} else if (e.key === 'ArrowRight') {
				const nextIdx = (lightboxPhoto.index + 1) % lightboxPhoto.total
				setPhotoRotation(0)
				setLightboxPhoto({
					...lightboxPhoto,
					url: lightboxPhoto.allImages[nextIdx],
					index: nextIdx,
				})
			} else if (e.key === 'r' || e.key === 'R') {
				setPhotoRotation((prev) => (prev + 90) % 360)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [lightboxPhoto])

	// 全屏打开大图时自动隐藏底部 Dock 导航栏并锁定滚动条
	useEffect(() => {
		if (lightboxPhoto) {
			document.body.classList.add('lightbox-open')
			document.body.style.overflow = 'hidden'
		} else {
			document.body.classList.remove('lightbox-open')
			document.body.style.overflow = ''
		}
		return () => {
			document.body.classList.remove('lightbox-open')
			document.body.style.overflow = ''
		}
	}, [lightboxPhoto])

	// 真实足迹统计数据
	const totalMoments = rawFootprints.length
	const totalCities = new Set(rawFootprints.map((f) => f.city).filter(Boolean)).size
	const totalCountries = new Set(rawFootprints.map((f) => f.country).filter(Boolean)).size

	return (
		<section id="footprints" className="w-full max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-48 sm:pb-60 mb-16 sm:mb-24 relative z-10 select-none">
			{/* 模块居中高级衬线主标题 */}
			<div className="text-center mb-10 sm:mb-14">
				<h2 className="text-3xl sm:text-4xl md:text-[42px] font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
					Travel Footprints
				</h2>
			</div>

			{/* 世界地图舞台 (1000 x 480 黄金比例，比例适中舒展) */}
			<div className="relative w-full aspect-[1000/480] max-h-[520px] flex items-center justify-center overflow-visible">
				
				{/* 真实地理矢量世界地图底图 */}
				<svg
					className="w-full h-full object-contain pointer-events-none"
					viewBox="0 0 1000 480"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* 温润大地色陆地轮廓 (React.memo 隔离超大 147KB 几何 Path 重新计算) */}
					<WorldMapBase />

					{/* 手帐红棉绳（从图钉自然牵引至每张拍立得相框顶部，物理感真实） */}
					<g fill="none">
						{moments.map((m) => {
							const isHovered = hoveredId === m.id
							return (
								<path
									key={`tether-${m.id}`}
									d={`M ${m.pinX} ${m.pinY} Q ${m.curveX} ${m.curveY} ${m.attachX} ${m.attachY}`}
									stroke={isHovered ? '#E53E3E' : '#B84545'}
									strokeWidth={isHovered ? 2.2 : 1.5}
									strokeDasharray="3.5 3.5"
									opacity={isHovered ? 1 : 0.75}
									className="transition-all duration-300"
								/>
							)
						})}
					</g>

					{/* 大陆真实点位底图标记点 */}
					<g fill="#E53E3E" stroke="#FFFFFF" strokeWidth="2">
						{moments.map((m) => (
							<circle
								key={`geo-pin-${m.id}`}
								cx={m.pinX}
								cy={m.pinY}
								r={hoveredId === m.id ? 5.5 : 4}
								className="transition-all duration-300"
							/>
						))}
					</g>
				</svg>

				{/* 旅行数据档案手帐卡片 (置于左下角空旷大洋海域，严格处于非洲大陆下方) */}
				<div 
					style={{ left: '8px', top: '88%' }}
					className="absolute z-20 pointer-events-auto"
				>
					<div className="rounded-2xl backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 border border-white/90 dark:border-zinc-700/60 p-3 sm:p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] max-w-[205px] sm:max-w-[225px]">
						{/* 顶部徽标 */}
						<div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-semibold text-amber-800 dark:text-amber-300 mb-1">
							<Compass className="w-3 h-3 animate-[spin_16s_linear_infinite]" />
							<span>TRAVEL ATLAS · 足迹档案</span>
						</div>

						{/* 3 栏核心旅行数据指标网格 */}
						<div className="grid grid-cols-3 gap-1 py-1.5 my-1 border-y border-zinc-200/70 dark:border-zinc-700/60 text-center">
							<div>
								<p className="text-xs sm:text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 leading-none">
									{totalCountries}
								</p>
								<p className="text-[8px] text-zinc-500 dark:text-zinc-400 mt-0.5">跨越国家</p>
							</div>
							<div className="border-x border-zinc-200/70 dark:border-zinc-700/60">
								<p className="text-xs sm:text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 leading-none">
									{totalCities}
								</p>
								<p className="text-[8px] text-zinc-500 dark:text-zinc-400 mt-0.5">探索城市</p>
							</div>
							<div>
								<p className="text-xs sm:text-sm font-bold font-serif text-zinc-900 dark:text-zinc-100 leading-none">
									{totalMoments}
								</p>
								<p className="text-[8px] text-zinc-500 dark:text-zinc-400 mt-0.5">光影实录</p>
							</div>
						</div>

						{/* 旅途说明短句 */}
						<p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight mb-2.5 mt-1">
							常驻杭州，跨越赤道与大洋，持续定格旅途风景。
						</p>

						{/* 快捷探索 3D 轨迹相册按键 */}
						<Link
							href="/space"
							className="inline-flex items-center justify-between w-full px-2.5 py-1 rounded-xl text-[9px] sm:text-[10px] font-semibold bg-[#F5EDE1] text-[#8C4A15] hover:bg-[#EAE0D0] dark:bg-amber-950/60 dark:text-amber-200 transition-all shadow-2xs active:scale-95"
						>
							<span>进入 3D 轨迹相册</span>
							<ArrowUpRight className="w-2.5 h-2.5" />
						</Link>
					</div>
				</div>

				{/* 4 大真实地理红图钉 (固定在大陆坐标点上) */}
				{moments.map((moment) => {
					const pctX = `${(moment.pinX / 1000) * 100}%`
					const pctY = `${(moment.pinY / 480) * 100}%`

					return (
						<div
							key={`pin-${moment.id}`}
							style={{
								left: pctX,
								top: pctY,
								position: 'absolute',
							}}
							className="z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
						>
							<div
								style={{ backgroundColor: '#E53E3E' }}
								className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center"
							>
								<div className="w-1.5 h-1.5 rounded-full bg-[#FED7D7]" />
							</div>
							<div className="absolute top-3 w-3 h-1 rounded-full bg-black/25 blur-[1px]" />
						</div>
					)
				})}

				{/* 4 大拍立得照片 (适度放大尺寸：提升至 ~120px，清晰悦目又不失精致) */}
				{moments.map((moment) => {
					const isHovered = hoveredId === moment.id
					const pctCardX = `${(moment.cardX / 1000) * 100}%`
					const pctCardY = `${(moment.cardY / 480) * 100}%`

					return (
						<div
							key={`card-${moment.id}`}
							style={{
								left: pctCardX,
								top: pctCardY,
								position: 'absolute',
								transform: 'translate(-50%, -50%)',
								width: '124px',
							}}
							onMouseEnter={() => setHoveredId(moment.id)}
							onMouseLeave={() => setHoveredId(null)}
						>
							{/* 悬浮微气泡 */}
							<AnimatePresence>
								{isHovered && !lightboxPhoto && (
									<motion.div
										initial={{ opacity: 0, y: 6, scale: 0.92 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 4, scale: 0.95 }}
										transition={{ duration: 0.18 }}
										className="absolute -top-15 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap"
									>
										<div className="rounded-xl backdrop-blur-md bg-zinc-900/90 text-white px-3.5 py-1.5 text-center shadow-xl border border-white/20">
											<p className="text-[10px] font-mono text-amber-300 font-semibold">{moment.date}</p>
											<p className="text-[11px] font-bold">
												{moment.city} {moment.cityImages.length > 1 ? `· 查看 ${moment.cityImages.length} 张相册 🔍` : '· 点击放大 🔍'}
											</p>
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{/* 拍立得相框 (固定精确 ~120px 黄金微放大幅度) */}
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setPhotoRotation(0)
									setLightboxPhoto({
										url: moment.cityImages[0] || moment.photo,
										city: moment.city,
										date: moment.date,
										note: moment.notes,
										index: 0,
										total: moment.cityImages.length,
										allImages: moment.cityImages,
									})
								}}
								style={{
									transform: `rotate(${moment.tilt}) scale(${isHovered ? 1.12 : 1})`,
									width: '118px',
								}}
								className="block text-left transition-all duration-300 group-hover/pin:rotate-0 group-hover/pin:z-40 cursor-pointer active:scale-95 focus:outline-none"
								title={`点击查看${moment.city}相册：${moment.city} · ${moment.country}`}
							>
								<div className="w-[108px] sm:w-[114px] md:w-[118px] bg-white p-1.5 pb-3 rounded-xs shadow-[0_12px_28px_rgba(0,0,0,0.18)] border border-zinc-200/80 transition-shadow pointer-events-none">
									{/* 正方形照片视窗 */}
									<div className="relative w-full aspect-square rounded-2xs overflow-hidden bg-zinc-900 shadow-inner mb-1.5">
										<img
											src={moment.thumbPhoto || moment.photo}
											alt={moment.city}
											loading="lazy"
											decoding="async"
											className="w-full h-full object-cover group-hover/pin:scale-105 transition-transform duration-500"
										/>
									</div>

									{/* 城市名称标签 */}
									<p className="text-[10px] sm:text-[11px] font-bold text-zinc-800 text-center font-serif truncate leading-tight">
										{moment.city}
									</p>
								</div>
							</button>
						</div>
					)
				})}

			</div>

			{/* 📸 城市专属相册 1:1 空间模块同款全屏大图查看器 */}
			{mounted && typeof document !== 'undefined' && createPortal(
				<AnimatePresence>
					{lightboxPhoto && (
						<motion.div
							key="fullscreen-lightbox"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999999 }}
							className="fixed inset-0 w-screen h-screen bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 select-none"
							onClick={() => {
								setLightboxPhoto(null)
								setPhotoRotation(0)
							}}
						>
							{/* Lightbox Header with safe margin away from top-right lock button */}
							<div 
								className="flex items-center justify-between text-white z-10 w-full max-w-7xl mx-auto pr-16 sm:pr-20" 
								onClick={(e) => e.stopPropagation()}
							>
								<div className="flex items-center gap-2.5">
									<div className="p-1.5 rounded-lg bg-white/10 text-amber-300">
										<Camera className="w-4 h-4" />
									</div>
									<span className="font-bold text-sm tracking-wide">{lightboxPhoto.city}</span>
									{lightboxPhoto.date && (
										<span className="text-xs text-white/60 font-mono">· {lightboxPhoto.date}</span>
									)}
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
										className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-md border border-white/15 hover:scale-105 active:scale-95"
										title="顺时针旋转90度 (快捷键 R)"
									>
										<RotateCw className="w-3.5 h-3.5" />
										<span className="hidden sm:inline">旋转</span>
									</button>
									<span className="text-xs font-mono text-white/80 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
										{lightboxPhoto.index + 1} / {lightboxPhoto.total}
									</span>
									<button
										type="button"
										onClick={() => {
											setLightboxPhoto(null)
											setPhotoRotation(0)
										}}
										className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xl border border-white/20 hover:scale-105 active:scale-95"
									>
										<X className="w-4 h-4" />
										<span>关闭</span>
									</button>
								</div>
							</div>

							{/* Main Image Stage */}
							<div 
								className="relative flex-1 flex items-center justify-center my-4 overflow-hidden" 
								onClick={(e) => e.stopPropagation()}
							>
								<img 
									src={lightboxPhoto.url} 
									alt={lightboxPhoto.city}
									style={{ transform: `rotate(${photoRotation}deg)`, imageOrientation: 'from-image' }}
									className="max-h-[85vh] max-w-[92vw] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-transform duration-300 select-none"
								/>

								{lightboxPhoto.total > 1 && (
									<>
										<button
											type="button"
											onClick={() => {
												const prev = (lightboxPhoto.index - 1 + lightboxPhoto.total) % lightboxPhoto.total
												setPhotoRotation(0)
												setLightboxPhoto({
													...lightboxPhoto,
													url: lightboxPhoto.allImages[prev],
													index: prev,
												})
											}}
											className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 shadow-xl hover:scale-110 active:scale-95"
										>
											<ChevronLeft className="w-6 h-6" />
										</button>
										<button
											type="button"
											onClick={() => {
												const next = (lightboxPhoto.index + 1) % lightboxPhoto.total
												setPhotoRotation(0)
												setLightboxPhoto({
													...lightboxPhoto,
													url: lightboxPhoto.allImages[next],
													index: next,
												})
											}}
											className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 shadow-xl hover:scale-110 active:scale-95"
										>
											<ChevronRight className="w-6 h-6" />
										</button>
									</>
								)}
							</div>

							{/* Lightbox Caption */}
							{lightboxPhoto.note && (
								<div 
									className="text-center text-xs text-white/80 max-w-xl mx-auto italic py-1 z-10" 
									onClick={(e) => e.stopPropagation()}
								>
									"{lightboxPhoto.note}"
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}
		</section>
	)
}
