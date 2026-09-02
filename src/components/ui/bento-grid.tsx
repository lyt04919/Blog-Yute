import { type ComponentPropsWithoutRef, type ReactNode } from "react"
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
        "grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4",
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
  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
        // light styles
        "bg-white/95 [box-shadow:0_0_0_1px_rgba(0,0,0,.04),0_2px_4px_rgba(0,0,0,.04),0_12px_24px_rgba(0,0,0,.04)]",
        // dark styles
        "dark:bg-zinc-900/95 transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] border border-zinc-200/80 dark:border-zinc-800",
        "transition-all duration-300 hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700",
        className
      )}
      {...props}
    >
      {/* Top Visual Area (scales slightly on card hover) */}
      <div className="relative w-full h-[58%] overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.03]">
        {background}
      </div>

      {/* Info Content Block (slides UP on card hover) */}
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 ease-out group-hover:-translate-y-10">
        {Icon && (
          <Icon className="h-10 w-10 origin-left transform-gpu text-zinc-700 dark:text-zinc-200 transition-all duration-300 ease-in-out group-hover:scale-75" />
        )}
        <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mt-1">
          {name}
        </h3>
        <p className="max-w-lg text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Slide-in CTA Button (slides UP from bottom on hover) */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 flex w-full translate-y-10 transform-gpu flex-row items-center px-6 py-5 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 z-20"
        )}
      >
        <a
          href={href || "#"}
          className="pointer-events-auto inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand)] transition-colors"
        >
          <span>{cta}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Ambient subtle hover tint overlay */}
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[0.02] group-hover:dark:bg-white/[0.02]" />
    </div>
  )
}
