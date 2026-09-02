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
        "bento-card-root group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "dark:bg-zinc-900/90 transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] border border-zinc-200/80 dark:border-zinc-800",
        className
      )}
      {...props}
    >
      {/* Background layer spanning upper/full container */}
      <div className="bento-card-bg-widget absolute inset-0 z-0 overflow-hidden pointer-events-none transition-transform duration-300 ease-out">
        {background}
      </div>

      {/* Info Content Block (slides UP on hover) */}
      <div className="bento-card-info pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 ease-out group-hover:-translate-y-10">
        {Icon && (
          <Icon className="bento-card-icon h-12 w-12 origin-left transform-gpu text-zinc-700 dark:text-zinc-300 transition-all duration-300 ease-in-out group-hover:scale-75" />
        )}
        <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          {name}
        </h3>
        <p className="max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>

      {/* Slide-in CTA Button (slides UP from bottom on hover) */}
      <div
        className={cn(
          "bento-card-cta pointer-events-none absolute bottom-0 left-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 z-20"
        )}
      >
        <a
          href={href || "#"}
          className="pointer-events-auto inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand)] transition-colors"
        >
          <span>{cta}</span>
          <ArrowRight className="h-4 w-4 ms-1 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Background graying / dimming overlay on hover (Magic UI official effect) */}
      <div className="bento-card-overlay pointer-events-none absolute inset-0 z-1 transform-gpu transition-all duration-300 group-hover:bg-neutral-900/[0.045] dark:group-hover:bg-white/[0.05]" />
    </div>
  )
}
