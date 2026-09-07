'use client'

import React from 'react'
import { 
	Play, 
	Pause, 
	SkipBack, 
	SkipForward, 
	Shuffle,
	Repeat,
	Repeat1,
	X, 
	Maximize2, 
	ExternalLink, 
	Music, 
	Volume2,
	VolumeX,
	Loader2
} from 'lucide-react'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { AudioProgressBar } from '@/components/audio/audio-progress-bar'
import type { FavoriteItem } from './favorite-item-card'

interface MusicPlayerDockProps {
	onOpenDetail?: (item: FavoriteItem) => void
}

export function MusicPlayerDock({ onOpenDetail }: MusicPlayerDockProps = {}) {
	const { 
		currentTrack, 
		playlist, 
		isPlaying, 
		isLoadingAudio,
		volume,
		isMuted,
		playbackMode,
		togglePlay,
		nextTrack, 
		prevTrack,
		setVolume,
		toggleMute,
		setPlaybackMode,
		closePlayer,
	} = useMusicPlayerStore()

	// 若当前没有点播任何音轨，底栏静默隐藏
	if (!currentTrack) return null

	const handleWheelVolume = (e: React.WheelEvent) => {
		e.preventDefault()
		const delta = e.deltaY < 0 ? 5 : -5
		setVolume(volume + delta)
	}

	return (
		<div 
			style={{
				position: 'fixed',
				bottom: '20px',
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 99999,
				width: '94%',
				maxWidth: '820px'
			}}
			className="pointer-events-auto select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
		>
			{/* 发烧级极光动态氛围背光 (Dynamic Ambient Backlight Glow) */}
			<div 
				style={{
					background: isPlaying
						? 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.22) 0%, rgba(244, 63, 94, 0.14) 45%, transparent 75%)'
						: 'radial-gradient(ellipse at center, rgba(148, 163, 184, 0.12) 0%, transparent 70%)',
				}}
				className="absolute -inset-3 rounded-full filter blur-2xl pointer-events-none -z-10 transition-all duration-700"
			/>

			{/* 桌面端高定玻璃拟态控制舱 (Desktop High-Fidelity Glass Console) */}
			<div className="w-full rounded-full bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] px-5 py-2.5 flex items-center justify-between gap-5 text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10 hover:border-amber-400/40 dark:hover:border-amber-400/30 transition-colors">
				
				{/* 1. 左侧：发烧级播控按钮组 (随机、上一首、主播放、下一首、循环模式) */}
				<div className="flex items-center gap-2.5 shrink-0">
					{/* 随机播放切换 */}
					<button
						type="button"
						onClick={() => setPlaybackMode(playbackMode === 'shuffle' ? 'list' : 'shuffle')}
						className={`p-2 rounded-full transition-all cursor-pointer ${
							playbackMode === 'shuffle' 
								? 'text-[#FA243C] bg-rose-50 dark:bg-rose-500/15 shadow-xs' 
								: 'text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
						}`}
						title={playbackMode === 'shuffle' ? '当前模式：随机播放' : '开启随机播放'}
					>
						<Shuffle className="w-3.5 h-3.5" />
					</button>

					{/* 上一首曲目 */}
					<button
						type="button"
						onClick={prevTrack}
						disabled={playlist.length <= 1}
						className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-all active:scale-90 cursor-pointer"
						title="上一首 (快捷键: Shift+P)"
					>
						<SkipBack className="w-4 h-4 fill-current" />
					</button>

					{/* 核心主播放/暂停按键 */}
					<button
						type="button"
						onClick={togglePlay}
						disabled={isLoadingAudio}
						className="w-10 h-10 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-60 ring-2 ring-black/10 dark:ring-white/20"
						title={isPlaying ? '暂停 (快捷键: 空格)' : '播放 (快捷键: 空格)'}
					>
						{isLoadingAudio ? (
							<Loader2 className="w-4 h-4 animate-spin text-current" />
						) : isPlaying ? (
							<Pause className="w-4 h-4 fill-current" />
						) : (
							<Play className="w-4 h-4 fill-current translate-x-0.5" />
						)}
					</button>

					{/* 下一首曲目 */}
					<button
						type="button"
						onClick={nextTrack}
						disabled={playlist.length <= 1}
						className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-all active:scale-90 cursor-pointer"
						title="下一首 (快捷键: Shift+N)"
					>
						<SkipForward className="w-4 h-4 fill-current" />
					</button>

					{/* 循环模式切换 (列表循环 ⇄ 单曲循环) */}
					<button
						type="button"
						onClick={() => setPlaybackMode(playbackMode === 'single' ? 'list' : 'single')}
						className={`p-2 rounded-full transition-all cursor-pointer ${
							playbackMode === 'single' 
								? 'text-[#FA243C] bg-rose-50 dark:bg-rose-500/15 shadow-xs' 
								: 'text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
						}`}
						title={playbackMode === 'single' ? '当前模式：单曲循环' : '开启单曲循环'}
					>
						{playbackMode === 'single' ? (
							<Repeat1 className="w-3.5 h-3.5" />
						) : (
							<Repeat className="w-3.5 h-3.5" />
						)}
					</button>
				</div>

				{/* 2. 中间：音轨元数据与解耦交互进度条 */}
				<div className="flex items-center gap-3.5 min-w-0 flex-1 px-2">
					{/* 实体封面微缩相框 */}
					<div 
						onClick={() => onOpenDetail?.(currentTrack)}
						className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden shadow-md bg-neutral-900 border border-slate-200/90 dark:border-white/10 cursor-pointer group"
						title="点击查看乐评档案"
					>
						{currentTrack.cover ? (
							<img 
								src={currentTrack.cover} 
								alt={currentTrack.name} 
								className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300" 
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-rose-500 to-amber-500 text-white">
								<Music className="w-5 h-5" />
							</div>
						)}
						<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<Maximize2 className="w-3.5 h-3.5 text-white drop-shadow-sm" />
						</div>
					</div>

					{/* 歌曲信息与独立渲染的进度条 */}
					<div className="flex flex-col min-w-0 flex-1 justify-center">
						<div className="flex items-center justify-between gap-2 mb-1">
							<div className="flex items-center gap-1.5 truncate">
								<span 
									onClick={() => onOpenDetail?.(currentTrack)}
									className="text-sm font-serif font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-[#FA243C] transition-colors"
								>
									{currentTrack.name}
								</span>
								<span className="text-xs text-slate-500 dark:text-neutral-400 truncate font-mono">
									— {currentTrack.subtitle || 'Apple Music'}
								</span>
							</div>
						</div>

						{/* 彻底隔离高频 re-render 的进度条组件 */}
						<AudioProgressBar showTimeLabels={true} />
					</div>
				</div>

				{/* 3. 右侧：发烧级音量控制与辅助动作 */}
				<div className="flex items-center gap-2.5 shrink-0">
					{/* 音量滑块与滚轮调节 */}
					<div 
						onWheel={handleWheelVolume}
						className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/5 border border-black/5 dark:border-white/5"
						title="滑动调节音量或滚动鼠标滚轮"
					>
						<button
							type="button"
							onClick={toggleMute}
							className="text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
							title={isMuted ? '取消静音 (快捷键: M)' : '静音 (快捷键: M)'}
						>
							{isMuted || volume === 0 ? (
								<VolumeX className="w-4 h-4 text-rose-500" />
							) : (
								<Volume2 className="w-4 h-4" />
							)}
						</button>
						<input
							type="range"
							min="0"
							max="100"
							value={isMuted ? 0 : volume}
							onChange={(e) => setVolume(Number(e.target.value))}
							className="w-20 h-1 bg-slate-300 dark:bg-white/20 rounded-full appearance-none accent-slate-900 dark:accent-white cursor-pointer"
						/>
						<span className="text-[10px] font-mono text-slate-400 dark:text-neutral-400 w-6 text-right">
							{isMuted ? '0%' : `${volume}%`}
						</span>
					</div>

					{/* Apple Music 外部链接 */}
					{currentTrack.link && (
						<a
							href={currentTrack.link}
							target="_blank"
							rel="noopener noreferrer"
							className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
							title="在 Apple Music 中试听完整专辑"
						>
							<ExternalLink className="w-4 h-4" />
						</a>
					)}

					{/* 关闭播放底栏 */}
					<button
						type="button"
						onClick={closePlayer}
						className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
						title="收起播放器底栏"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

			</div>
		</div>
	)
}

