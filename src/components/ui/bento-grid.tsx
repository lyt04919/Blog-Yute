import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
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
  cta,
  ...props
}: BentoCardProps) {
  return (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
      // light styles
      "bg-white/90 [box-shadow:0_0_0_1px_rgba(0,0,0,.04),0_2px_4px_rgba(0,0,0,.04),0_12px_24px_rgba(0,0,0,.04)]",
      // dark styles
      "dark:bg-zinc-900/90 transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] border border-zinc-200/80 dark:border-zinc-800",
      className
    )}
    {...props}
  >
    <div className="relative w-full h-[58%] overflow-hidden flex items-center justify-center">
      {background}
    </div>
    
    <div className="p-6 pt-2 z-10">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-8">
        {Icon && (
          <Icon className="h-9 w-9 origin-left transform-gpu text-zinc-700 dark:text-zinc-200 transition-all duration-300 ease-in-out group-hover:scale-75" />
        )}
        <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mt-1">
          {name}
        </h3>
        <p className="max-w-lg text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {description}
        </p>
      </div>

      {cta && (
        <div
          className={cn(
            "pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden mt-3"
          )}
        >
          <a
            href={href || "#"}
            className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[var(--color-brand)] transition-colors"
          >
            <span>{cta}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      )}
    </div>

    {cta && (
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 hidden w-full translate-y-8 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
        )}
      >
        <a
          href={href || "#"}
          className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[var(--color-brand)] transition-colors"
        >
          <span>{cta}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    )}

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[0.02] group-hover:dark:bg-white/[0.02]" />
  </div>
  )
}
