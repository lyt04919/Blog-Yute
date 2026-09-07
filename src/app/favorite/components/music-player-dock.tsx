'use client'

import React from 'react'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { AudioProgressBar } from '@/components/audio/audio-progress-bar'
import { CornerMusicPlayer } from './corner-music-player'
import type { FavoriteItem } from './favorite-item-card'

interface MusicPlayerDockProps {
	onOpenDetail?: (item: FavoriteItem) => void
}

/**
 * MusicPlayerDock is unified with CornerMusicPlayer,
 * providing the corner floating vinyl disc and expandable console inspired by clay-blog.
 */
export function MusicPlayerDock(props: MusicPlayerDockProps = {}) {
	return <CornerMusicPlayer {...props} />
}

export { CornerMusicPlayer }
export default MusicPlayerDock
