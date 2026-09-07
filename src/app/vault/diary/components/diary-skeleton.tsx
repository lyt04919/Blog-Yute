'use client'

import React from 'react'

export default function DiarySkeleton() {
	return (
		<div className='relative min-h-screen px-4 pb-20 pt-16 md:px-8 max-w-6xl mx-auto animate-pulse'>
			{/* Header Skeleton */}
			<div className="flex items-center justify-between mb-10">
				<div className="h-10 w-36 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
				<div className="flex gap-2">
					<div className="h-9 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
					<div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
				</div>
			</div>

			{/* Dashboard Layer Skeleton */}
			<div className="rounded-3xl p-8 bg-neutral-100/60 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800/50 mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
				<div className="w-[220px] h-[160px] rounded-2xl bg-neutral-200/80 dark:bg-neutral-800/60 shrink-0" />
				<div className="w-[1px] h-32 bg-neutral-200 dark:bg-neutral-800 hidden md:block shrink-0" />
				<div className="flex-1 w-full flex flex-col items-end gap-3">
					<div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
					<div className="w-full h-24 bg-neutral-200/60 dark:bg-neutral-800/40 rounded-xl" />
				</div>
			</div>

			{/* Controls Row Skeleton */}
			<div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
				<div className="flex items-center gap-3 w-full md:w-auto flex-1">
					<div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
					<div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
				</div>
				<div className="h-10 w-44 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
			</div>

			{/* Card Grid Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				{[1, 2, 3, 4, 5, 6].map(i => (
					<div 
						key={i} 
						className="w-full rounded-[32px] bg-neutral-200/70 dark:bg-neutral-800/50" 
						style={{ aspectRatio: '4/5' }} 
					/>
				))}
			</div>
		</div>
	)
}
