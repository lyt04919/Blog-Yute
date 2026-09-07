'use client'

import { useState, useEffect } from 'react'

export interface AudioProgressDetail {
  currentTime: number
  duration: number
}

class AudioProgressEmitter extends EventTarget {
  emitProgress(currentTime: number, duration: number) {
    this.dispatchEvent(
      new CustomEvent<AudioProgressDetail>('audioprogress', {
        detail: { currentTime, duration },
      })
    )
  }

  seek(targetTime: number) {
    this.dispatchEvent(
      new CustomEvent<{ targetTime: number }>('audioseek', {
        detail: { targetTime },
      })
    )
  }

  onSeek(callback: (targetTime: number) => void) {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetTime: number }>
      callback(customEvent.detail.targetTime)
    }
    this.addEventListener('audioseek', handler)
    return () => this.removeEventListener('audioseek', handler)
  }
}

export const audioProgressEmitter = new AudioProgressEmitter()

export function seekAudio(targetTime: number) {
  audioProgressEmitter.seek(targetTime)
}

export function useAudioProgress() {
  const [progress, setProgress] = useState<AudioProgressDetail>({
    currentTime: 0,
    duration: 30,
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<AudioProgressDetail>
      setProgress(customEvent.detail)
    }

    audioProgressEmitter.addEventListener('audioprogress', handler)
    return () => audioProgressEmitter.removeEventListener('audioprogress', handler)
  }, [])

  return progress
}
