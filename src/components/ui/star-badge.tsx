import React from 'react'
import { Star } from 'lucide-react'

interface StarBadgeProps {
	text: string
	className?: string
}

export default function StarBadge({ text, className = '' }: StarBadgeProps) {
	return (
		<div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase select-none text-zinc-800 dark:text-zinc-200 ${className}`}>
			<Star className="w-3 h-3 text-blue-500 fill-blue-500" />
			<span className="text-inherit">{text}</span>
		</div>
	)
}
