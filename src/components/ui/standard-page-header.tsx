'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export interface StandardPageHeaderProps {
	backHref?: string
	backLabel?: string
	title: ReactNode
	badge?: string
	subtitle?: string
	actions?: ReactNode
	className?: string
}

export function StandardPageHeader({
	backHref,
	backLabel = 'BACK',
	title,
	badge,
	subtitle,
	actions,
	className = ''
}: StandardPageHeaderProps) {
	return (
		<div className={`mx-auto w-full max-w-7xl px-6 pt-28 pb-8 ${className}`}>
			{backHref && (
				<Link
					href={backHref}
					className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 group"
				>
					<ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
					<span>{backLabel}</span>
				</Link>
			)}

			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-2 max-w-3xl">
					<div className="flex items-center gap-3 flex-wrap">
						<h1 className="text-4xl font-medium tracking-tight lg:text-5xl font-serif text-slate-900 dark:text-white leading-none">
							{title}
						</h1>
						{badge && (
							<span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
								{badge}
							</span>
						)}
					</div>
					{subtitle && (
						<p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
							{subtitle}
						</p>
					)}
				</div>

				{actions && (
					<div className="flex items-center gap-3 shrink-0 self-start md:self-end">
						{actions}
					</div>
				)}
			</div>
		</div>
	)
}
