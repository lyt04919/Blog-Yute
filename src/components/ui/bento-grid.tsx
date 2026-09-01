import { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
	children: ReactNode
	className?: string
}

export interface BentoCardProps extends ComponentPropsWithoutRef<'div'> {
	name: string
	className?: string
	background: ReactNode
	Icon?: React.ElementType
	description: string
	href?: string
	cta?: string
	children?: ReactNode
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
	return (
		<div
			className={cn(
				'grid w-full auto-rows-[20rem] sm:auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4',
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
	children,
	...props
}: BentoCardProps) {
	return (
		<div
			key={name}
			className={cn(
				'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-3xl',
				// light styles
				'bg-white/80 dark:bg-zinc-900/80 [box-shadow:0_0_0_1px_rgba(0,0,0,.05),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
				// dark styles
				'transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)] border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5',
				className
			)}
			{...props}
		>
			<div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">{background}</div>

			<div className="relative z-10 flex flex-col justify-between h-full p-6">
				<div className="pointer-events-none flex transform-gpu flex-col gap-2 transition-all duration-300 lg:group-hover:-translate-y-6">
					{Icon && (
						<div className="size-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-[var(--color-brand)]/10 group-hover:text-[var(--color-brand)] group-hover:border-[var(--color-brand)]/30">
							<Icon className="h-5 w-5 origin-left transform-gpu transition-all duration-300 ease-in-out" />
						</div>
					)}
					<h3 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight mt-2">
						{name}
					</h3>
					<p className="max-w-lg text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
						{description}
					</p>
				</div>

				{children}

				{cta && (
					<>
						{/* Mobile CTA */}
						<div className="pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden mt-4">
							<a
								href={href || '#'}
								className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand)] transition-colors"
							>
								<span>{cta}</span>
								<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</a>
						</div>

						{/* Desktop CTA (hover slide-up) */}
						<div className="pointer-events-none absolute bottom-0 left-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
							<a
								href={href || '#'}
								className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand)] transition-colors"
							>
								<span>{cta}</span>
								<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</a>
						</div>
					</>
				)}
			</div>

			<div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[0.02] group-hover:dark:bg-white/[0.03]" />
		</div>
	)
}
