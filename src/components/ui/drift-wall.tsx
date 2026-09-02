'use client'

import { 
  useCallback, 
  useEffect, 
  useLayoutEffect, 
  useMemo, 
  useRef, 
  useState, 
  type CSSProperties 
} from 'react'
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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1
  return 1 + variance * pseudo
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

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
  depth = 90,
  speed = 32,
  direction = 'up',
  variance = 0.35,
  parallax = 0.6,
  pauseOnHover = true,
  lift = 50,
  fade = 0.6,
  dim = 0.45,
  grayscale = false,
  overlayColor = '#060010',
  className = '',
  style
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const trackRefs = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number | null>(null)

  const offsetsRef = useRef<number[]>([])
  const velocitiesRef = useRef<number[]>([])
  const hoveredColRef = useRef<number>(-1)
  const wallHoveredRef = useRef<boolean>(false)
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const pointerDampedRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastTsRef = useRef<number | null>(null)

  const [containerHeight, setContainerHeight] = useState<number>(360)
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const [reduced, setReduced] = useState<boolean>(false)

  useEffect(() => {
    setReduced(prefersReducedMotion())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const columnItems = useMemo(() => {
    const validItems = items.length > 0 ? items : DEFAULT_ITEMS
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => [])
    validItems.forEach((item, i) => cols[i % columns].push(item))
    return cols.map(col => (col.length ? col : validItems.slice(0, 1)))
  }, [items, columns])

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap
    return columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit)
      const copies = Math.max(3, Math.ceil((containerHeight * 2.5) / copyHeight) + 1)
      return { copyHeight, copies }
    })
  }, [columnItems, tileHeight, gap, containerHeight])

  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height > 0) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const baseVelocities = useMemo(() => {
    const dirSign = direction === 'up' ? 1 : -1
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1
      return speed * columnFactor(c, variance) * dirSign * altSign
    })
  }, [columnItems, speed, direction, variance])

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1))
    velocitiesRef.current = columnItems.map(() => 0)
  }, [columnMeta, columnItems])

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current
      if (!plane) return
      plane.style.transform =
        `translate(-50%, -50%) scale(1.3) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`
    },
    [tilt, turn, roll, depth]
  )

  useEffect(() => {
    applyPlaneTransform(0, 0)

    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000)
      lastTsRef.current = ts

      const maxTilt = parallax * 8
      const targetX = pointerRef.current.x * maxTilt
      const targetY = -pointerRef.current.y * maxTilt
      const damp = 1 - Math.exp(-dt / 0.12)
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y)

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c]
          if (!meta) continue
          
          // When a poster in column c is hovered, STOP that column completely (target = 0)
          const isColHovered = (wallHoveredRef.current && hoveredColRef.current === c) || (activeIdRef.current !== null && hoveredColRef.current === c)
          const target = isColHovered ? 0 : baseVelocities[c]

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.08 : 0.24))
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight
          offsetsRef.current[c] = next

          const el = trackRefs.current[c]
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = null
    }
  }, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform])

  const activate = useCallback((id: string, index: number) => {
    activeIdRef.current = id
    hoveredColRef.current = index
    setActiveId(id)
  }, [])

  const release = useCallback(() => {
    activeIdRef.current = null
    hoveredColRef.current = -1
    setActiveId(null)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        }
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const tile = hit && hit.closest ? hit.closest('[data-tile-id]') as HTMLElement | null : null
      if (!tile) return
      const id = tile.dataset.tileId
      if (!id || id === activeIdRef.current) return
      activeIdRef.current = id
      hoveredColRef.current = Number(tile.dataset.col)
      setActiveId(id)
    },
    [parallax, reduced]
  )

  const handlePointerLeaveWall = useCallback(() => {
    wallHoveredRef.current = false
    pointerRef.current = { x: 0, y: 0 }
    release()
  }, [release])

  const cssVars = useMemo(
    () => ({
      '--dw-tile-w': `${tileWidth}px`,
      '--dw-tile-h': `${tileHeight}px`,
      '--dw-gap': `${gap}px`,
      '--dw-radius': `${radius}px`,
      '--dw-perspective': `${perspective}px`,
      '--dw-lift': `${lift}px`,
      '--dw-dim': dim,
      '--dw-gray': grayscale ? 1 : 0,
      '--dw-overlay': overlayColor,
      ...style
    } as CSSProperties),
    [tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, style]
  )

  const renderTile = (item: DriftWallItem, id: string, colIndex: number) => {
    const inner = (
      <span className="drift-wall__inner">
        <img 
          src={item.image} 
          alt={item.title ?? ''} 
          referrerPolicy="no-referrer"
          loading="eager" 
          decoding="async" 
          draggable={false} 
        />
        <span className="drift-wall__overlay" aria-hidden="true" />
      </span>
    )
    const commonProps = {
      className: `drift-wall__tile${activeId === id ? ' is-active' : ''}`,
      'data-tile-id': id,
      'data-col': colIndex,
      onMouseEnter: () => activate(id, colIndex),
      onMouseLeave: release,
      onFocus: () => activate(id, colIndex),
      onBlur: release
    }
    return (
      <div key={id} tabIndex={0} role="button" aria-label={item.title ?? 'tile'} {...commonProps}>
        {inner}
      </div>
    )
  }

  const rootClass = ['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ')

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHoveredRef.current = true
      }}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => {
          const meta = columnMeta[c]
          const copies = Array.from({ length: meta.copies })
          return (
            <div 
              className="drift-wall__col" 
              key={`col-${c}`}
              onMouseEnter={() => {
                hoveredColRef.current = c
              }}
              onMouseLeave={() => {
                if (hoveredColRef.current === c && !activeIdRef.current) {
                  hoveredColRef.current = -1
                }
              }}
            >
              <div className="drift-wall__track" ref={el => { trackRefs.current[c] = el }}>
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) => renderTile(item, `${c}-${copyIndex}-${itemIndex}`, c))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
