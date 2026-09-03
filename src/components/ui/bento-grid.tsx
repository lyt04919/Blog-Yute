'use client'

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

export interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name?: string
  className?: string
  background?: ReactNode
  Icon?: React.ElementType
  description?: string
  href?: string
  cta?: string
  darkTheme?: boolean
  children?: ReactNode
  blurLevels?: number[]
  progressiveBlurHeight?: string
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Progressive Blur (渐进式多层连续模糊，精准模拟 iOS 毛玻璃与 Magic UI 景深效果，告别生硬死边)
export function ProgressiveBlur({
  className,
  direction = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16],
  height = "55%",
}: {
  className?: string
  direction?: "top" | "bottom"
  blurLevels?: number[]
  height?: string
}) {
  const isBottom = direction === "bottom"
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 overflow-hidden select-none",
        isBottom ? "bottom-0" : "top-0",
        className
      )}
      style={{ height }}
    >
      {blurLevels.map((blur, idx) => {
        const step = 1 / blurLevels.length
        const start = Math.max(0, idx * step)
        const mid = Math.min(1, (idx + 1) * step)
        const end = Math.min(1, (idx + 2) * step)

        const gradient = isBottom
          ? `linear-gradient(to bottom, transparent ${start * 100}%, rgba(0,0,0,1) ${mid * 100}%, rgba(0,0,0,1) ${end * 100}%, ${end >= 1 ? 'rgba(0,0,0,1)' : 'transparent'} 100%)`
          : `linear-gradient(to top, transparent ${start * 100}%, rgba(0,0,0,1) ${mid * 100}%, rgba(0,0,0,1) ${end * 100}%, ${end >= 1 ? 'rgba(0,0,0,1)' : 'transparent'} 100%)`

        return (
          <div
            key={idx}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: gradient,
              WebkitMaskImage: gradient,
            }}
          />
        )
      })}
    </div>
  )
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta = "Learn more",
  darkTheme = false,
  blurLevels = [0.5, 1, 2, 4, 6],
  progressiveBlurHeight = "46%",
  children,
  ...props
}: BentoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // When custom children are provided, render the full-bleed custom layout
  if (children) {
    return (
      <div
        key={name || 'custom-card'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ minHeight: '360px' }}
        className={cn(
          "group relative col-span-3 flex overflow-hidden rounded-2xl cursor-pointer select-none min-h-[360px]",
          darkTheme
            ? "bg-zinc-950 border border-zinc-800 text-white shadow-xl dark:bg-zinc-950 dark:border-zinc-800"
            : "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] border border-zinc-200/80 dark:bg-zinc-900/90 transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] dark:border-zinc-800",
          "transition-all duration-300",
          className
        )}
        {...props}
      >
        {children}
        {/* Hover overlay */}
        <div 
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
          className={cn(
            "pointer-events-none absolute inset-0 z-1",
            darkTheme ? "bg-white/[0.03]" : "bg-black/[0.03] dark:bg-white/[0.03]"
          )}
        />
      </div>
    )
  }

  return (
    <div
      key={name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: '360px' }}
      className={cn(
        "group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-2xl cursor-pointer select-none min-h-[360px]",
        darkTheme
          ? "bg-zinc-950 border border-zinc-800 text-white shadow-xl dark:bg-zinc-950 dark:border-zinc-800"
          : "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] border border-zinc-200/80 dark:bg-zinc-900/90 transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] dark:border-zinc-800",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {/* Background layer spanning upper container (底部柔和自然渐隐，避免硬切) */}
      <div 
        style={{
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,rgba(0,0,0,0.7)_80%,transparent_98%)]"
      >
        {background}
      </div>

      {/* 渐进式多级平滑模糊：可控高度与清晰度 */}
      <ProgressiveBlur 
        direction="bottom" 
        height={progressiveBlurHeight} 
        blurLevels={blurLevels}
        className="z-1" 
      />

      {/* 极柔和环境渐隐底色 */}
      <div 
        style={{ height: progressiveBlurHeight }}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-2",
          darkTheme 
            ? "bg-gradient-to-t from-zinc-950/85 via-zinc-950/30 to-transparent" 
            : "bg-gradient-to-t from-white/85 via-white/25 to-transparent dark:from-zinc-900/85 dark:via-zinc-900/30 dark:to-transparent"
        )}
      />

      {/* Info Content Block (anchored to bottom, slides UP on hover) */}
      <div 
        style={{
          transform: isHovered ? 'translateY(-36px)' : 'translateY(0)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 p-6"
      >
        {Icon && (
          <div
            style={{
              transform: isHovered ? 'scale(0.88)' : 'scale(1)',
              transformOrigin: 'left center',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="mb-1.5"
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs backdrop-blur-xs transition-all duration-300",
              darkTheme
                ? "bg-zinc-900/90 border-zinc-700/80 text-amber-400"
                : "bg-white/95 dark:bg-zinc-800/90 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-800 dark:text-amber-400 group-hover:border-[var(--color-brand)]/50 group-hover:text-[var(--color-brand)] dark:group-hover:text-amber-300"
            )}>
              <Icon className="h-5 w-5 drop-shadow-xs transition-transform duration-300 group-hover:scale-105" />
            </div>
          </div>
        )}
        <h3 className={cn(
          "text-xl font-extrabold tracking-tight drop-shadow-xs",
          darkTheme ? "text-white" : "text-zinc-900 dark:text-white"
        )}>
          {name}
        </h3>
        <p className={cn(
          "max-w-lg text-sm font-semibold leading-relaxed drop-shadow-xs",
          darkTheme ? "text-zinc-200" : "text-zinc-700 dark:text-zinc-200"
        )}>
          {description}
        </p>
      </div>

      {/* Slide-in CTA Button (slides UP from bottom on hover) */}
      <div
        style={{
          transform: isHovered ? 'translateY(0)' : 'translateY(36px)',
          opacity: isHovered ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        }}
        className="pointer-events-none absolute bottom-0 left-0 flex w-full flex-row items-center p-6 z-20"
      >
        <a
          href={href || "#"}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-1.5 text-sm font-bold transition-colors",
            darkTheme 
              ? "text-amber-400 hover:text-amber-300"
              : "text-zinc-900 dark:text-amber-400 hover:text-[var(--color-brand)] dark:hover:text-amber-300"
          )}
        >
          <span>{cta}</span>
          <ArrowRight className="h-4 w-4 ms-1 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Background graying / dimming overlay on hover (Magic UI official effect) */}
      <div 
        style={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
        className={cn(
          "pointer-events-none absolute inset-0 z-1",
          darkTheme ? "bg-white/[0.04]" : "bg-black/[0.03] dark:bg-white/[0.03]"
        )}
      />
    </div>
  )
}
