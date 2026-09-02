'use client'

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

export interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className?: string
  background: ReactNode
  Icon?: React.ElementType
  description: string
  href?: string
  cta?: string
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

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta = "Learn more",
  ...props
}: BentoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      key={name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: '360px' }}
      className={cn(
        "group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-2xl cursor-pointer select-none min-h-[360px]",
        // light styles: pure white card with subtle elevation
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] border border-zinc-200/80",
        // dark styles: deep space black card with subtle inner glow
        "dark:bg-zinc-900/90 transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] dark:border-zinc-800",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {/* Background layer spanning upper container */}
      <div 
        style={{
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        {background}
      </div>

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
              transform: isHovered ? 'scale(0.75)' : 'scale(1)',
              transformOrigin: 'left center',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="mb-1"
          >
            <Icon className="h-10 w-10 text-zinc-900 dark:text-amber-400 transition-colors drop-shadow-xs" />
          </div>
        )}
        <h3 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white drop-shadow-xs">
          {name}
        </h3>
        <p className="max-w-lg text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-200 drop-shadow-xs">
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
          className="pointer-events-auto inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-amber-400 hover:text-[var(--color-brand)] dark:hover:text-amber-300 transition-colors"
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
        className="pointer-events-none absolute inset-0 z-1 bg-black/[0.03] dark:bg-white/[0.03]" 
      />
    </div>
  )
}
