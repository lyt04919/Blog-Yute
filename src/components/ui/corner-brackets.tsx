import React from 'react'

interface CornerBracketsProps {
	className?: string
}

export default function CornerBrackets({ className = '' }: CornerBracketsProps) {
	return (
		<>
			{/* Top-Left */}
			<div className={`absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-300 dark:border-zinc-700 pointer-events-none rounded-tl-[4px] z-10 ${className}`} />
			{/* Top-Right */}
			<div className={`absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-300 dark:border-zinc-700 pointer-events-none rounded-tr-[4px] z-10 ${className}`} />
			{/* Bottom-Left */}
			<div className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-300 dark:border-zinc-700 pointer-events-none rounded-bl-[4px] z-10 ${className}`} />
			{/* Bottom-Right */}
			<div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-300 dark:border-zinc-700 pointer-events-none rounded-br-[4px] z-10 ${className}`} />
		</>
	)
}
