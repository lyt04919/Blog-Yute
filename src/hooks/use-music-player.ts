import { create } from 'zustand'
import type { FavoriteItem } from '@/app/favorite/components/favorite-item-card'

export type PlaybackMode = 'list' | 'single' | 'shuffle'

export interface MusicPlayerState {
  currentTrack: FavoriteItem | null
  playlist: FavoriteItem[]
  isPlaying: boolean
  isLoadingAudio: boolean
  duration: number
  volume: number // 0 - 100
  isMuted: boolean
  playbackMode: PlaybackMode
  audioError: string | null
  currentAudioSrc: string | null

  // Actions
  playTrack: (track: FavoriteItem, playlist?: FavoriteItem[]) => void
  setCurrentTrack: (track: FavoriteItem | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  togglePlay: () => void
  closePlayer: () => void
  nextTrack: () => void
  prevTrack: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setPlaybackMode: (mode: PlaybackMode) => void
  togglePlaybackMode: () => void
  setDuration: (duration: number) => void
  setIsLoadingAudio: (isLoading: boolean) => void
  setCurrentAudioSrc: (src: string | null) => void
  setAudioError: (error: string | null) => void
}

const getInitialVolume = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('music_player_volume')
      if (saved !== null) {
        const parsed = Number(saved)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed
      }
    } catch {}
  }
  return 80
}

export const useMusicPlayerStore = create<MusicPlayerState>((set, get) => ({
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  isLoadingAudio: false,
  duration: 30,
  volume: getInitialVolume(),
  isMuted: false,
  playbackMode: 'list',
  audioError: null,
  currentAudioSrc: null,

  playTrack: (track, playlist = []) => {
    const list = playlist.length > 0 ? playlist : get().playlist
    const targetList = list.length > 0 ? list : [track]
    set({
      currentTrack: track,
      playlist: targetList,
      isPlaying: true,
      audioError: null,
    })
  },

  setCurrentTrack: (track) => set({ currentTrack: track, audioError: null }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  closePlayer: () => set({ currentTrack: null, isPlaying: false, currentAudioSrc: null }),

  nextTrack: () => {
    const { currentTrack, playlist, playbackMode } = get()
    if (!currentTrack || playlist.length === 0) return
    if (playlist.length === 1) {
      set({ isPlaying: true })
      return
    }

    const currentIdx = playlist.findIndex((i) => i.name === currentTrack.name)
    let nextIdx = 0

    if (playbackMode === 'shuffle') {
      let randIdx = Math.floor(Math.random() * playlist.length)
      if (randIdx === currentIdx && playlist.length > 1) {
        randIdx = (randIdx + 1) % playlist.length
      }
      nextIdx = randIdx
    } else {
      nextIdx = (currentIdx + 1) % playlist.length
    }

    set({ currentTrack: playlist[nextIdx], isPlaying: true, audioError: null })
  },

  prevTrack: () => {
    const { currentTrack, playlist, playbackMode } = get()
    if (!currentTrack || playlist.length === 0) return
    if (playlist.length === 1) {
      set({ isPlaying: true })
      return
    }

    const currentIdx = playlist.findIndex((i) => i.name === currentTrack.name)
    let prevIdx = 0

    if (playbackMode === 'shuffle') {
      let randIdx = Math.floor(Math.random() * playlist.length)
      if (randIdx === currentIdx && playlist.length > 1) {
        randIdx = (randIdx - 1 + playlist.length) % playlist.length
      }
      prevIdx = randIdx
    } else {
      prevIdx = (currentIdx - 1 + playlist.length) % playlist.length
    }

    set({ currentTrack: playlist[prevIdx], isPlaying: true, audioError: null })
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(100, volume))
    set({ volume: clamped, isMuted: clamped === 0 ? true : false })
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('music_player_volume', String(clamped))
      } catch {}
    }
  },

  toggleMute: () => set({ isMuted: !get().isMuted }),

  setPlaybackMode: (mode) => set({ playbackMode: mode }),

  togglePlaybackMode: () => {
    const modes: PlaybackMode[] = ['list', 'single', 'shuffle']
    const nextMode = modes[(modes.indexOf(get().playbackMode) + 1) % modes.length]
    set({ playbackMode: nextMode })
  },

  setDuration: (duration) => set({ duration: duration > 0 ? duration : 30 }),
  setIsLoadingAudio: (isLoadingAudio) => set({ isLoadingAudio }),
  setCurrentAudioSrc: (currentAudioSrc) => set({ currentAudioSrc }),
  setAudioError: (audioError) => set({ audioError }),
}))
