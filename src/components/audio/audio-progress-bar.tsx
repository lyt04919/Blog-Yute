'use client'

import React, { useState, useRef } from 'react'
import { useAudioProgress, seekAudio } from '@/hooks/use-audio-progress'

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

interface AudioProgressBarProps {
  showTimeLabels?: boolean
  className?: string
  barClassName?: string
}

export function AudioProgressBar({
  showTimeLabels = true,
  className = '',
  barClassName = '',
}: AudioProgressBarProps) {
  const { currentTime, duration } = useAudioProgress()
  const [hoverPosition, setHoverPosition] = useState<{ x: number; time: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const fraction = offsetX / rect.width
    setHoverPosition({
      x: offsetX,
      time: fraction * duration,
    })
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const targetTime = (clickX / rect.width) * duration
    seekAudio(targetTime)
  }

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {showTimeLabels && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-neutral-400 mb-1 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {/* 交互进度条轨道 */}
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`group/scrubber relative w-full h-1.5 hover:h-2.5 rounded-full bg-slate-200/80 dark:bg-white/15 cursor-pointer transition-all duration-150 py-1 -my-1 ${barClassName}`}
        title="点击或拖拽跳转播放进度"
      >
        {/* 背景轨道底色 */}
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* 已播放进度条 */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full rounded-full bg-slate-900 dark:bg-white transition-[width] duration-75 ease-out shadow-xs"
          />
        </div>

        {/* 悬停微拖拽小圆点（Thumb Indicator） */}
        <div
          style={{ left: `${progressPercent}%` }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none shadow-md"
        />

        {/* 鼠标悬停时间标记 Tooltip */}
        {hoverPosition && (
          <div
            style={{ left: `${hoverPosition.x}px` }}
            className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-mono font-medium shadow-md pointer-events-none whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            {formatTime(hoverPosition.time)}
          </div>
        )}
      </div>
    </div>
  )
}
