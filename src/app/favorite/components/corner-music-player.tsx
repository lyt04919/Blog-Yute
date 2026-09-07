'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Shuffle,
	Repeat,
	Repeat1,
	X,
	ExternalLink,
	Volume2,
	VolumeX,
	Loader2,
	Music,
	ListMusic
} from 'lucide-react'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { AudioProgressBar } from '@/components/audio/audio-progress-bar'
import type { FavoriteItem } from './favorite-item-card'
import defaultMusicList from '@/app/favorite/music.json'

interface CornerMusicPlayerProps {
	onOpenDetail?: (item: FavoriteItem) => void
}

export function CornerMusicPlayer({ onOpenDetail }: CornerMusicPlayerProps = {}) {
	const {
		currentTrack,
		playlist,
		isPlaying,
		isLoadingAudio,
		volume,
		isMuted,
		playbackMode,
		playTrack,
		setCurrentTrack,
		togglePlay,
		nextTrack,
		prevTrack,
		setVolume,
		toggleMute,
		setPlaybackMode,
	} = useMusicPlayerStore()

	const [isExpanded, setIsExpanded] = useState(false)
	const [showVolumePopup, setShowVolumePopup] = useState(false)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const listContainerRef = useRef<HTMLDivElement | null>(null)

	// 如果播放列表为空，默认注入本地音乐库种子并选中首曲就绪
	useEffect(() => {
		const state = useMusicPlayerStore.getState()
		if (state.playlist.length === 0 && defaultMusicList.length > 0) {
			useMusicPlayerStore.setState({
				playlist: defaultMusicList as FavoriteItem[],
				currentTrack: state.currentTrack || (defaultMusicList[0] as FavoriteItem),
			})
		}
	}, [])

	const activeList = playlist.length > 0 ? playlist : (defaultMusicList as FavoriteItem[])
	const activeTrack = currentTrack || activeList[0]
	const currentIndex = activeList.findIndex((t) => t.name === activeTrack?.name)

	// 点击面板外部或按 Esc 键平滑收起展开控制台
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsExpanded(false)
				setShowVolumePopup(false)
			}
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isExpanded) {
				setIsExpanded(false)
				setShowVolumePopup(false)
			}
		}

		if (isExpanded) {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('keydown', handleKeyDown)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isExpanded])

	// 切换歌曲时，自动将当前激活的歌曲平滑滚动至列表可见区域
	useEffect(() => {
		if (isExpanded && listContainerRef.current && currentIndex >= 0) {
			const activeElement = listContainerRef.current.children[currentIndex] as HTMLElement
			if (activeElement) {
				activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
			}
		}
	}, [currentIndex, isExpanded])

	// 滚轮微调音量
	const handleWheelVolume = (e: React.WheelEvent) => {
		e.preventDefault()
		const delta = e.deltaY < 0 ? 5 : -5
		setVolume(volume + delta)
	}

	if (!activeTrack) return null

	return (
		<div ref={containerRef} className="fixed right-6 bottom-6 z-50 select-none">
			{/* 1. 展开态：向左上方弹出的发烧级毛玻璃音乐控制舱 (Popup Glass Audio Console) */}
			<div
				className={`absolute right-0 bottom-[calc(100%+14px)] w-[360px] max-w-[calc(100vw-3rem)] max-h-[min(76vh,540px)] rounded-3xl bg-white/95 dark:bg-[#141416]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-4 flex flex-col gap-3.5 transition-all duration-300 ease-out origin-bottom-right [transform-origin:92%_100%] z-50 ${
					isExpanded
						? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
						: 'opacity-0 scale-90 translate-y-3 pointer-events-none invisible'
				}`}
			>
				{/* 顶部状态栏 (Header) */}
				<div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/5">
					{/* 左侧：跳跃 Mini Equalizer + 播放状态 */}
					<div className="flex items-center gap-2">
						<div className="flex items-end gap-0.5 h-3.5 px-0.5">
							<span
								className={`w-0.5 rounded-full bg-emerald-500 transition-all ${
									isPlaying ? 'eq-bar-1' : 'h-1.5'
								}`}
							/>
							<span
								className={`w-0.5 rounded-full bg-emerald-500 transition-all ${
									isPlaying ? 'eq-bar-2' : 'h-3'
								}`}
							/>
							<span
								className={`w-0.5 rounded-full bg-emerald-500 transition-all ${
									isPlaying ? 'eq-bar-3' : 'h-1'
								}`}
							/>
						</div>
						<span className="text-[11px] font-medium tracking-wide uppercase text-slate-500 dark:text-neutral-400">
							{isPlaying ? '正在播放' : '已暂停'}
						</span>
						<span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-50 dark:bg-rose-500/15 text-[#FA243C]">
							Apple Music
						</span>
					</div>

					{/* 右侧动作图标组 (音量、外链、收起) */}
					<div className="flex items-center gap-1 text-slate-400 dark:text-neutral-400">
						{/* 音量悬浮滑块切换 */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowVolumePopup(!showVolumePopup)}
								className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
								title={`音量: ${volume}% (点击调整)`}
							>
								{isMuted || volume === 0 ? (
									<VolumeX className="w-3.5 h-3.5 text-rose-500" />
								) : (
									<Volume2 className="w-3.5 h-3.5" />
								)}
							</button>

							{showVolumePopup && (
								<div
									onWheel={handleWheelVolume}
									className="absolute right-0 bottom-full mb-2 p-2 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-2 z-50 animate-in fade-in zoom-in-95 duration-150"
								>
									<button
										type="button"
										onClick={toggleMute}
										className="text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
									>
										{isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
									</button>
									<input
										type="range"
										min="0"
										max="100"
										value={isMuted ? 0 : volume}
										onChange={(e) => setVolume(Number(e.target.value))}
										className="w-20 h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
									/>
									<span className="text-[10px] font-mono w-6 text-right text-slate-500 dark:text-neutral-400">
										{isMuted ? 0 : volume}%
									</span>
								</div>
							)}
						</div>

						{/* Apple Music 外链 */}
						{activeTrack.link && (
							<a
								href={activeTrack.link}
								target="_blank"
								rel="noopener noreferrer"
								className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
								title="在 Apple Music 中打开原曲"
							>
								<ExternalLink className="w-3.5 h-3.5" />
							</a>
						)}

						{/* 收起面板 */}
						<button
							type="button"
							onClick={() => setIsExpanded(false)}
							className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
							title="收起控制台 (Esc)"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* 当前播放曲目信息 (Hero Track Card) */}
				<div className="flex items-center gap-3">
					<div
						className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-md border border-black/5 dark:border-white/10 cursor-pointer group"
						onClick={() => onOpenDetail && onOpenDetail(activeTrack)}
						title="查看单曲详情"
					>
						{activeTrack.cover ? (
							<img
								src={activeTrack.cover}
								alt={activeTrack.name}
								className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						) : (
							<div className="w-full h-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
								<Music className="w-6 h-6 text-slate-400" />
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<h4
							className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
							onClick={() => onOpenDetail && onOpenDetail(activeTrack)}
						>
							{activeTrack.name}
						</h4>
						<p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
							{activeTrack.subtitle || '群星'}
						</p>
						<p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate mt-0.5">
							{activeTrack.desc || '精选单曲'}
						</p>
					</div>
				</div>

				{/* 解耦音频进度条与洗带控制器 */}
				<AudioProgressBar showTimeLabels={true} className="py-0.5" />

				{/* 播控按键组 (随机、上一首、中央主播控、下一首、循环) */}
				<div className="flex items-center justify-between px-2 pt-0.5">
					{/* 随机播放开关 */}
					<button
						type="button"
						onClick={() => setPlaybackMode(playbackMode === 'shuffle' ? 'list' : 'shuffle')}
						className={`p-2 rounded-full transition-all cursor-pointer ${
							playbackMode === 'shuffle'
								? 'text-[#FA243C] bg-rose-50 dark:bg-rose-500/15'
								: 'text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
						}`}
						title={playbackMode === 'shuffle' ? '当前模式：随机播放' : '开启随机播放'}
					>
						<Shuffle className="w-3.5 h-3.5" />
					</button>

					{/* 上一首 */}
					<button
						type="button"
						onClick={prevTrack}
						className="p-2 rounded-full text-slate-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
						title="上一首 (快捷键: [ )"
					>
						<SkipBack className="w-4 h-4 fill-current" />
					</button>

					{/* 核心播放/暂停键 */}
					<button
						type="button"
						onClick={togglePlay}
						disabled={isLoadingAudio}
						className="w-11 h-11 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-80"
						title={isPlaying ? '暂停 (空格)' : '播放 (空格)'}
					>
						{isLoadingAudio ? (
							<Loader2 className="w-4 h-4 animate-spin text-amber-500" />
						) : isPlaying ? (
							<Pause className="w-4 h-4 fill-current" />
						) : (
							<Play className="w-4 h-4 fill-current ml-0.5" />
						)}
					</button>

					{/* 下一首 */}
					<button
						type="button"
						onClick={nextTrack}
						className="p-2 rounded-full text-slate-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
						title="下一首 (快捷键: ] )"
					>
						<SkipForward className="w-4 h-4 fill-current" />
					</button>

					{/* 循环模式切换 */}
					<button
						type="button"
						onClick={() => setPlaybackMode(playbackMode === 'single' ? 'list' : 'single')}
						className={`p-2 rounded-full transition-all cursor-pointer ${
							playbackMode === 'single'
								? 'text-[#FA243C] bg-rose-50 dark:bg-rose-500/15'
								: 'text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
						}`}
						title={playbackMode === 'single' ? '当前模式：单曲循环' : '开启单曲循环'}
					>
						{playbackMode === 'single' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
					</button>
				</div>

				{/* 播放队列抽屉 (Scrollable Playlist Queue) */}
				<div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-col gap-1.5">
					<div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-neutral-400">
						<div className="flex items-center gap-1 font-medium">
							<ListMusic className="w-3.5 h-3.5" />
							<span>播放列表</span>
						</div>
						<span className="text-[11px] font-mono">
							{currentIndex >= 0 ? currentIndex + 1 : 1} / {activeList.length} 首
						</span>
					</div>

					<div
						ref={listContainerRef}
						className="max-h-36 overflow-y-auto space-y-1 pr-1 overscroll-contain"
						style={{ scrollbarWidth: 'thin' }}
					>
						{activeList.map((track, idx) => {
							const isCurrent = track.name === activeTrack.name
							return (
								<div
									key={`${track.name}-${idx}`}
									onClick={() => playTrack(track, activeList)}
									className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
										isCurrent
											? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-medium'
											: 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-white/5'
									}`}
								>
									<div className="flex items-center gap-2 min-w-0 flex-1">
										{/* 播放中跳动均衡器图标或序号 */}
										<div className="w-4 h-4 flex items-center justify-center shrink-0">
											{isCurrent && isPlaying ? (
												<div className="flex items-end gap-0.5 h-3">
													<span className="w-0.5 rounded-full bg-emerald-500 eq-bar-1" />
													<span className="w-0.5 rounded-full bg-emerald-500 eq-bar-2" />
													<span className="w-0.5 rounded-full bg-emerald-500 eq-bar-3" />
												</div>
											) : (
												<span className="text-[10px] font-mono opacity-50 group-hover:hidden">
													{idx + 1}
												</span>
											)}
											<Play
												className={`w-3 h-3 text-slate-800 dark:text-white hidden group-hover:block ${
													isCurrent && isPlaying ? '!hidden' : ''
												}`}
											/>
										</div>

										<div className="min-w-0 flex-1">
											<p className="truncate text-xs">{track.name}</p>
											<p className="truncate text-[10px] opacity-70">{track.subtitle || '群星'}</p>
										</div>
									</div>

									{isCurrent && (
										<span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
											{isPlaying ? '播放中' : '暂停'}
										</span>
									)}
								</div>
							)
						})}
					</div>
				</div>
			</div>

			{/* 2. 折叠态（常驻）：右下角发烧黑胶唱片微入口 (Floating Vinyl Disc Toggle) */}
			<div
				className={`relative group cursor-pointer rounded-full transition-all duration-200 ${
					isExpanded ? 'ring-2 ring-emerald-500/70 dark:ring-emerald-400/70 scale-105' : ''
				}`}
				onClick={() => setIsExpanded(!isExpanded)}
				title={`${activeTrack.name} - ${activeTrack.subtitle || ''} (点击${isExpanded ? '收起' : '展开'}播放器)`}
			>
				{/* 播放状态下的动态光晕 (Dynamic Ambient Halo Glow) */}
				{isPlaying && (
					<div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500/35 via-rose-500/30 to-emerald-500/25 blur-md pointer-events-none -z-10 animate-pulse" />
				)}

				{/* 黑胶主体 (Vinyl Disc) */}
				<div
					style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
					className="relative w-[52px] h-[52px] rounded-full vinyl-disc border border-black/40 dark:border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.35)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex items-center justify-center animate-spin-slow transition-transform duration-200 hover:scale-105 active:scale-95"
				>
					{/* 同心圆黑胶凹槽质感叠加 (Realistic Concentric Groove Texture) */}
					<div
						className="absolute inset-0 rounded-full pointer-events-none"
						style={{
							backgroundImage:
								'repeating-radial-gradient(circle at center, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 4px)',
						}}
					/>

					{/* 斜向反光高光 (Diagonal Vinyl Sheen) */}
					<div
						className="absolute inset-0 rounded-full pointer-events-none opacity-40"
						style={{
							background:
								'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 42%, rgba(255,255,255,0.12) 58%, transparent 100%)',
						}}
					/>

					{/* 盘心专辑封面圆标 (Center Label Album Art) */}
					<div className="relative w-6 h-6 rounded-full overflow-hidden shadow-inner border border-black/40 dark:border-white/30 shrink-0">
						{activeTrack.cover ? (
							<img
								src={activeTrack.cover}
								alt={activeTrack.name}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full bg-zinc-800 flex items-center justify-center">
								<Music className="w-3 h-3 text-white/70" />
							</div>
						)}

						{/* 唱片中心轴心穿孔 (Center Spindle Hole) */}
						<div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-[#121214] ring-1 ring-white/40 shadow-xs" />
					</div>
				</div>

				{/* 右下角跳动音波指示微标 (Equalizer Pulse Badge) */}
				<div className="absolute -bottom-1 -right-1 flex items-end gap-0.5 px-1.5 py-1 bg-black/90 dark:bg-zinc-900 border border-white/20 rounded-full shadow-md pointer-events-none">
					<span
						className={`w-0.5 rounded-full bg-emerald-400 transition-all ${
							isPlaying ? 'eq-bar-1' : 'h-1.5'
						}`}
					/>
					<span
						className={`w-0.5 rounded-full bg-emerald-400 transition-all ${
							isPlaying ? 'eq-bar-2' : 'h-2.5'
						}`}
					/>
					<span
						className={`w-0.5 rounded-full bg-emerald-400 transition-all ${
							isPlaying ? 'eq-bar-3' : 'h-1'
						}`}
					/>
				</div>
			</div>
		</div>
	)
}
