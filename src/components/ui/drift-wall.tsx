'use client'

import { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties } from 'react'
import './drift-wall.css'

export interface DriftWallItem {
  image: string
  title?: string
  href?: string
  raw?: any
}

export interface DriftWallProps {
  items?: DriftWallItem[]
  columns?: number
  tileWidth?: number
  tileHeight?: number
  gap?: number
  radius?: number
  tilt?: number
  turn?: number
  roll?: number
  perspective?: number
  depth?: number
  speed?: number
  direction?: 'up' | 'down'
  variance?: number
  parallax?: number
  pauseOnHover?: boolean
  lift?: number
  fade?: number
  dim?: number
  grayscale?: boolean
  overlayColor?: string
  className?: string
  style?: CSSProperties
  onItemClick?: (item: DriftWallItem, index: number, event: React.MouseEvent) => void
}

const DEFAULT_ITEMS: DriftWallItem[] = [
  { image: '/images/movies/coco.jpg', title: '寻梦环游记' },
  { image: '/images/uploads/4e81d4e853b5eb4f.webp', title: '变形金刚2' }
]

export default function DriftWall({
  items = DEFAULT_ITEMS,
  columns = 5,
  tileWidth = 105,
  tileHeight = 158,
  gap = 14,
  radius = 12,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 0,
  speed = 32,
  direction = 'up',
  variance = 0.35,
  parallax = 0.35,
  pauseOnHover = true,
  lift = 40,
  fade = 0.6,
  dim,
  grayscale = false,
  overlayColor,
  className = '',
  style,
  onItemClick
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const [isInView, setIsInView] = useState(true)

  // Tracking click displacement to prevent dropped clicks in 3D animated environment
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const justTriggeredRef = useRef<boolean>(false)

  const handleTilePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return // Left click only
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
  }, [])

  const handleTilePointerUp = useCallback((item: DriftWallItem, index: number, e: React.PointerEvent) => {
    if (!pointerDownPosRef.current) return
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x)
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y)
    const dt = Date.now() - pointerDownPosRef.current.time
    pointerDownPosRef.current = null

    // Tolerant click detection: within 12px displacement and 800ms duration
    if (dx < 12 && dy < 12 && dt < 800) {
      justTriggeredRef.current = true
      setTimeout(() => {
        justTriggeredRef.current = false
      }, 250)
      if (onItemClick) {
        e.preventDefault()
        e.stopPropagation()
        onItemClick(item, index, e as unknown as React.MouseEvent)
      }
    }
  }, [onItemClick])

  const handleTileClick = useCallback((item: DriftWallItem, index: number, e: React.MouseEvent) => {
    if (justTriggeredRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onItemClick) {
      e.preventDefault()
      e.stopPropagation()
      onItemClick(item, index, e)
    }
  }, [onItemClick])

  const handleTileKeyDown = useCallback((item: DriftWallItem, index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      if (onItemClick) {
        onItemClick(item, index, e as unknown as React.MouseEvent)
      }
    }
  }, [onItemClick])

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, { threshold: 0.01, rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const columnItems = useMemo(() => {
    const validItems = items && items.length > 0 ? items : DEFAULT_ITEMS
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => [])
    validItems.forEach((item, i) => cols[i % columns].push(item))
    return cols.map(col => (col.length ? col : validItems.slice(0, 1)))
  }, [items, columns])

  // Column speed variations for natural, organic drift
  const columnDurations = useMemo(() => {
    return Array.from({ length: columns }).map((_, c) => {
      const baseSec = Math.max(18, Math.round(960 / speed))
      const factor = 1 + (((c * 0.618) % 1) - 0.5) * variance
      return Math.round(baseSec * factor)
    })
  }, [columns, speed, variance])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (parallax <= 0 || !planeRef.current || !containerRef.current) return

      // If the cursor is over any poster tile, lock the 3D plane so it stays 100% still without jitter
      const target = e.target as HTMLElement
      if (target?.closest?.('.drift-wall__tile')) {
        return
      }

      const clientX = e.clientX
      const clientY = e.clientY

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (!containerRef.current || !planeRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const px = ((clientX - rect.left) / rect.width - 0.5) * parallax * 8
        const py = -((clientY - rect.top) / rect.height - 0.5) * parallax * 8
        planeRef.current.style.transform =
          `translate(-50%, -50%) scale(1.15) ` +
          `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
          `translateZ(0)`
      })
    },
    [parallax, tilt, turn, roll]
  )

  const handlePointerLeave = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (!planeRef.current) return
    planeRef.current.style.transform =
      `translate(-50%, -50%) scale(1.15) ` +
      `rotateX(${tilt}deg) rotateY(${turn}deg) rotateZ(${roll}deg) ` +
      `translateZ(0)`
  }, [tilt, turn, roll])

  const cssVars = useMemo(() => {
    const vars: Record<string, any> = {
      '--dw-tile-w': `${tileWidth}px`,
      '--dw-tile-h': `${tileHeight}px`,
      '--dw-gap': `${gap}px`,
      '--dw-radius': `${radius}px`,
      '--dw-perspective': `${perspective}px`,
      '--dw-lift': `${lift}px`,
      '--dw-gray': grayscale ? 1 : 0,
      ...style
    }
    if (dim !== undefined) vars['--dw-dim'] = dim
    if (overlayColor !== undefined) vars['--dw-overlay'] = overlayColor
    return vars as CSSProperties
  }, [tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, style])

  return (
    <div
      ref={containerRef}
      className={`drift-wall ${className}`.trim()}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div 
        ref={planeRef} 
        className="drift-wall__plane"
        style={{
          transform: `translate(-50%, -50%) scale(1.15) rotateX(${tilt}deg) rotateY(${turn}deg) rotateZ(${roll}deg) translateZ(0)`,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {columnItems.map((col, c) => {
          const isReverse = c % 2 === 1
          const duration = `${columnDurations[c]}s`
          return (
            <div
              key={`col-${c}`}
              className="drift-wall__col"
            >
              <div
                className="drift-wall__track"
                style={{
                  animation: `drift-wall-vertical ${duration} linear infinite`,
                  animationDirection: isReverse ? 'reverse' : 'normal',
                  animationPlayState: isInView ? 'running' : 'paused',
                }}
              >
                {/* 2 seamless loops for infinite vertical scroll */}
                {[0, 1].map((copyIndex) => (
                  <div key={copyIndex} className="flex flex-col shrink-0 [gap:var(--dw-gap)]">
                    {col.map((item, itemIndex) => (
                      <div
                        key={`${c}-${copyIndex}-${itemIndex}`}
                        tabIndex={0}
                        role="button"
                        aria-label={item.title ?? 'tile'}
                        title={item.title ? `点击查看《${item.title}》电影详情与影评` : undefined}
                        className={`drift-wall__tile ${onItemClick ? 'cursor-pointer' : ''}`}
                        onPointerDown={handleTilePointerDown}
                        onPointerUp={(e) => handleTilePointerUp(item, itemIndex, e)}
                        onClick={(e) => handleTileClick(item, itemIndex, e)}
                        onKeyDown={(e) => handleTileKeyDown(item, itemIndex, e)}
                      >
                        <span className="drift-wall__inner">
                          <img
                            src={item.image}
                            alt={item.title ?? ''}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.style.opacity = '0.2'
                            }}
                          />
                          <span className="drift-wall__overlay" aria-hidden="true" />
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
