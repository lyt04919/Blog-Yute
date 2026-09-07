'use client'

import { useEffect } from 'react'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { audioProgressEmitter } from '@/hooks/use-audio-progress'

export function useMediaSession() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
  } = useMusicPlayerStore()

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

    if (!currentTrack) {
      navigator.mediaSession.metadata = null
      return
    }

    // 设置原生系统媒体控制中心元数据（macOS 控制中心、Windows 浮层、锁屏、无线耳机）
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.subtitle || 'Apple Music',
      album: currentTrack.desc || 'Favorites Lounge',
      artwork: currentTrack.cover
        ? [
            {
              src: currentTrack.cover,
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ]
        : [],
    })

    // 设置播放状态提示
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'

    // 绑定系统控制中心与媒体键动作
    const setAction = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {}
    }

    setAction('play', () => togglePlay())
    setAction('pause', () => togglePlay())
    setAction('previoustrack', () => prevTrack())
    setAction('nexttrack', () => nextTrack())
    setAction('seekbackward', (details) => {
      const skipTime = details.seekOffset || 5
      const audio = document.querySelector('audio[data-global-audio]') as HTMLAudioElement | null
      if (audio) {
        audioProgressEmitter.seek(Math.max(0, audio.currentTime - skipTime))
      }
    })
    setAction('seekforward', (details) => {
      const skipTime = details.seekOffset || 5
      const audio = document.querySelector('audio[data-global-audio]') as HTMLAudioElement | null
      if (audio) {
        audioProgressEmitter.seek(Math.min(audio.duration || 30, audio.currentTime + skipTime))
      }
    })
    setAction('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        audioProgressEmitter.seek(details.seekTime)
      }
    })

    return () => {
      setAction('play', null)
      setAction('pause', null)
      setAction('previoustrack', null)
      setAction('nexttrack', null)
      setAction('seekbackward', null)
      setAction('seekforward', null)
      setAction('seekto', null)
    }
  }, [currentTrack, isPlaying, togglePlay, nextTrack, prevTrack])
}
