'use client'

import { useMemo, useRef, useCallback, type CSSProperties } from 'react'
import './drift-wall.css'

export interface DriftWallItem {
  image: string
  title?: string
  href?: string
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
  style
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)

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
      const rect = containerRef.current.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const px = ((e.clientX - rect.left) / rect.width - 0.5) * parallax * 8
      const py = -((e.clientY - rect.top) / rect.height - 0.5) * parallax * 8
      planeRef.current.style.transform =
        `translate(-50%, -50%) scale(1.15) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(0)`
    },
    [parallax, tilt, turn, roll]
  )

  const handlePointerLeave = useCallback(() => {
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
                        className="drift-wall__tile"
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
