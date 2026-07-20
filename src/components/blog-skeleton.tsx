import React from 'react'
import { motion } from 'motion/react'

export function BlogSkeleton() {
	return (
		<div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20 animate-pulse">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
				{/* Left: Article Content */}
				<div className="lg:col-span-8">
					<div className="mb-10">
						{/* Category Placeholder */}
						<div className="h-4 w-20 bg-[var(--color-border)] rounded mb-4 opacity-50" />
						{/* Title Placeholder */}
						<div className="h-10 w-3/4 bg-[var(--color-border)] rounded-md mb-6 opacity-70" />
						{/* Meta Placeholder */}
						<div className="flex gap-4">
							<div className="h-4 w-24 bg-[var(--color-border)] rounded opacity-50" />
							<div className="h-4 w-16 bg-[var(--color-border)] rounded opacity-50" />
						</div>
					</div>
					{/* Body Placeholder */}
					<div className="space-y-4">
						<div className="h-4 w-full bg-[var(--color-border)] rounded opacity-40" />
						<div className="h-4 w-full bg-[var(--color-border)] rounded opacity-40" />
						<div className="h-4 w-5/6 bg-[var(--color-border)] rounded opacity-40" />
						<div className="h-32 w-full bg-[var(--color-border)] rounded-xl my-8 opacity-30" />
						<div className="h-4 w-full bg-[var(--color-border)] rounded opacity-40" />
						<div className="h-4 w-4/5 bg-[var(--color-border)] rounded opacity-40" />
					</div>
				</div>
				{/* Right: Sidebar Placeholder */}
				<div className="hidden lg:block lg:col-span-4 space-y-8 pt-2">
					<div className="h-[300px] w-full bg-[var(--color-border)] rounded-xl opacity-30" />
					<div className="h-48 w-full bg-[var(--color-border)] rounded-xl opacity-30" />
				</div>
			</div>
		</div>
	)
}
