'use client'

import { useEffect } from 'react'
import { useMusicPlayerStore } from '@/hooks/use-music-player'
import { audioProgressEmitter } from '@/hooks/use-audio-progress'

export function useAudioShortcuts() {
  const {
    currentTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    toggleMute,
  } = useMusicPlayerStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查当前获得焦点的元素，避免在输入框、文本区或富文本编辑器内误触发快捷键
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      // 仅在已有播放音轨时响应媒体快捷键
      if (!currentTrack) return

      // 空格键：播放 / 暂停
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }

      // Shift + N / Ctrl+N / Meta+N：下一首
      if (
        (e.key === 'n' || e.key === 'N') &&
        (e.shiftKey || e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault()
        nextTrack()
        return
      }

      // Shift + P / Ctrl+P / Meta+P：上一首
      if (
        (e.key === 'p' || e.key === 'P') &&
        (e.shiftKey || e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault()
        prevTrack()
        return
      }

      // M 键：静音 / 取消静音
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMute()
        return
      }

      // 方向左键：快退 5 秒
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        const audio = document.querySelector('audio[data-global-audio]') as HTMLAudioElement | null
        if (audio) {
          const newTime = Math.max(0, audio.currentTime - 5)
          audioProgressEmitter.seek(newTime)
        }
        return
      }

      // 方向右键：快进 5 秒
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        const audio = document.querySelector('audio[data-global-audio]') as HTMLAudioElement | null
        if (audio) {
          const newTime = Math.min(audio.duration || 30, audio.currentTime + 5)
          audioProgressEmitter.seek(newTime)
        }
        return
      }

      // 方向上键：增加音量 5%
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setVolume(Math.min(100, volume + 5))
        return
      }

      // 方向下键：降低音量 5%
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setVolume(Math.max(0, volume - 5))
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTrack, togglePlay, nextTrack, prevTrack, volume, setVolume, toggleMute])
}
