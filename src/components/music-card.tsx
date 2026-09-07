'use client'

import { useConfigStore } from '../app/(home)/stores/config-store'
import MusicSVG from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'
import { Pause } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { useAudioProgress } from '@/hooks/use-audio-progress'

export default function MusicCard() {
	const pathname = usePathname()
	const { siteContent } = useConfigStore()
	const { currentTrack, isPlaying, togglePlay, playTrack } = useMusicPlayerStore()
	const { currentTime, duration } = useAudioProgress()

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0
	const isHomePage = pathname === '/'

	const togglePlayPause = () => {
		if (!currentTrack) {
			playTrack({
				name: 'Close To You',
				cover: '/images/default-cover.png',
				desc: 'Carpenters · 经典单曲',
				subtitle: 'Carpenters'
			} as any)
		} else {
			togglePlay()
		}
	}

	// 仅在非首页且播放中时展示小卡片
	if (!isHomePage && !isPlaying) {
		return null
	}

	return (
		<div className={clsx(
			'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3 shadow-2xl backdrop-blur-xl',
			'w-[280px]'
		)}>
			{siteContent.enableChristmas && (
				<>
					<img
						src='/images/christmas/snow-10.webp'
						alt='Christmas decoration'
						className='pointer-events-none absolute'
						style={{ width: 120, left: -8, top: -12, opacity: 0.8 }}
					/>
					<img
						src='/images/christmas/snow-11.webp'
						alt='Christmas decoration'
						className='pointer-events-none absolute'
						style={{ width: 80, right: -10, top: -12, opacity: 0.8 }}
					/>
				</>
			)}

			<MusicSVG className='h-8 w-8 text-brand shrink-0' />

			<div className='flex-1 min-w-0'>
				<div className='text-primary font-medium text-sm truncate'>
					{currentTrack?.name || 'Close To You'}
				</div>

				<div className='mt-1 h-1.5 rounded-full bg-secondary/20 overflow-hidden'>
					<div className='bg-brand h-full rounded-full transition-all duration-150' style={{ width: `${progress}%` }} />
				</div>
			</div>

			<button onClick={togglePlayPause} className='flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 hover:bg-secondary/20 transition-colors shrink-0'>
				{isPlaying ? <Pause className='text-brand h-4 w-4' /> : <PlaySVG className='text-brand ml-1 h-4 w-4' />}
			</button>
		</div>
	)
}
