'use client'

import { useEffect, useRef } from 'react'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { audioProgressEmitter } from '@/hooks/use-audio-progress'
import { useAudioShortcuts } from '@/hooks/use-audio-shortcuts'
import { useMediaSession } from '@/hooks/use-media-session'

export function GlobalAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const audioCache = useRef<Record<string, string>>({})
  const isFetchingRef = useRef<string | null>(null)

  // 挂载桌面全局媒体快捷键与 MediaSession 系统控制
  useAudioShortcuts()
  useMediaSession()

  const {
    currentTrack,
    playlist,
    isPlaying,
    volume,
    isMuted,
    playbackMode,
    setIsPlaying,
    setIsLoadingAudio,
    setDuration,
    setCurrentAudioSrc,
    setAudioError,
    nextTrack,
  } = useMusicPlayerStore()

  // 安全播放辅助方法，妥善拦截处理 AbortError 与 Autoplay 限制
  const playAudioSafe = async (audio: HTMLAudioElement) => {
    try {
      const promise = audio.play()
      playPromiseRef.current = promise
      await promise
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // 用户快速切歌或暂停打断，属于正常控制流，静默忽略
        return
      }
      if (err?.name === 'NotAllowedError') {
        console.warn('[GlobalAudioEngine] 浏览器拦截了自动播放，需用户手势触发')
        setIsPlaying(false)
        return
      }
      console.warn('[GlobalAudioEngine] 播放发生异常:', err)
    }
  }

  // 1. 初始化并绑定底层事件监听
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      audioProgressEmitter.emitProgress(
        audio.currentTime,
        audio.duration && !isNaN(audio.duration) ? audio.duration : 30
      )
    }

    const handleLoadedMetadata = () => {
      const d = audio.duration && !isNaN(audio.duration) ? audio.duration : 30
      setDuration(d)
      audioProgressEmitter.emitProgress(audio.currentTime, d)
    }

    const handleEnded = () => {
      const currentMode = useMusicPlayerStore.getState().playbackMode
      if (currentMode === 'single') {
        audio.currentTime = 0
        playAudioSafe(audio)
      } else {
        nextTrack()
      }
    }

    const handleError = () => {
      const currentSrc = audio.src
      if (currentSrc && !currentSrc.includes('/music/close-to-you.mp3')) {
        console.warn('[GlobalAudioEngine] 音频流加载失败，启用高保真本地兜底音频')
        audio.src = '/music/close-to-you.mp3'
        audio.load()
        if (useMusicPlayerStore.getState().isPlaying) {
          playAudioSafe(audio)
        }
      } else {
        setAudioError('音频文件无法播放')
        setIsLoadingAudio(false)
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // 监听进度条微组件的点击跳转（Scrubbing）
    const unsubscribeSeek = audioProgressEmitter.onSeek((targetTime) => {
      if (audio && !isNaN(targetTime)) {
        audio.currentTime = Math.max(0, Math.min(audio.duration || 30, targetTime))
      }
    })

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      unsubscribeSeek()
    }
  }, [nextTrack, setDuration, setAudioError, setIsLoadingAudio, setIsPlaying])

  // 2. 响应音量与静音状态
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100))
    }
  }, [volume, isMuted])

  // 3. 当音轨变更时，获取音频流 URL 并处理播放
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    const trackKey = `${currentTrack.name}__${currentTrack.subtitle || ''}`
    isFetchingRef.current = trackKey
    setIsLoadingAudio(true)

    const loadAndPlayTrack = async () => {
      let src = audioCache.current[trackKey]

      if (!src) {
        try {
          const query = encodeURIComponent(`${currentTrack.name} ${currentTrack.subtitle || ''}`)
          const res = await fetch(`/api/music-preview?term=${query}`)
          if (res.ok) {
            const data = await res.json()
            if (data.previewUrl) {
              src = data.previewUrl
              audioCache.current[trackKey] = src
            }
          }
        } catch (err) {
          console.warn('[GlobalAudioEngine] 远程音频预览获取失败:', err)
        }
      }

      // 若未获取到预览流，使用默认高保真兜底音频
      if (!src) {
        src = '/music/close-to-you.mp3'
      }

      // 如果在异步请求期间用户又快速切换了下一首，放弃过时的更新
      if (isFetchingRef.current !== trackKey) return

      setCurrentAudioSrc(src)
      setIsLoadingAudio(false)

      if (audio.src !== src) {
        audio.src = src
        audio.load()
      }

      if (useMusicPlayerStore.getState().isPlaying) {
        await playAudioSafe(audio)
      }

      // 预先静默预拉取播放列表中下一首曲目的预览 URL，实现零延迟切歌
      const list = playlist.length > 0 ? playlist : [currentTrack]
      if (list.length > 1) {
        const currIdx = list.findIndex((t) => t.name === currentTrack.name)
        const nextIdx = (currIdx + 1) % list.length
        const nextItem = list[nextIdx]
        const nextKey = `${nextItem.name}__${nextItem.subtitle || ''}`
        if (!audioCache.current[nextKey]) {
          const nextQuery = encodeURIComponent(`${nextItem.name} ${nextItem.subtitle || ''}`)
          fetch(`/api/music-preview?term=${nextQuery}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.previewUrl) {
                audioCache.current[nextKey] = data.previewUrl
              }
            })
            .catch(() => {})
        }
      }
    }

    loadAndPlayTrack()
  }, [currentTrack?.name, currentTrack?.subtitle, playlist, setCurrentAudioSrc, setIsLoadingAudio])

  // 4. 响应 isPlaying 状态切换
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      if (audio.paused) {
        playAudioSafe(audio)
      }
    } else {
      if (!audio.paused) {
        if (playPromiseRef.current) {
          playPromiseRef.current.then(() => audio.pause()).catch(() => {})
        } else {
          audio.pause()
        }
      }
    }
  }, [isPlaying, currentTrack])

  return (
    <audio
      ref={audioRef}
      data-global-audio="true"
      preload="auto"
      style={{ display: 'none' }}
    />
  )
}
