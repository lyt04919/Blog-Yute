import Link from 'next/link'

export function RollingTextButton({ href, text, secondaryText, variant = 'primary' }: { href: string; text: string; secondaryText: string; variant?: 'primary' | 'secondary' }) {
	return (
		<Link 
			href={href} 
			className={`group relative inline-flex items-center justify-center px-7 py-3.5 overflow-hidden rounded-full font-bold text-xs transition-all duration-500 shadow-md active:scale-95 ${
				variant === 'primary' 
					? 'bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950' 
					: 'bg-white text-zinc-900 hover:bg-zinc-50 border border-slate-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 dark:border-zinc-700'
			}`}
		>
			<div className="relative flex flex-col items-center justify-center h-4 overflow-hidden">
				<span className="transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full flex items-center gap-1">
					{text}
				</span>
				<span className="absolute transform translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 whitespace-nowrap flex items-center gap-1">
					{secondaryText}
				</span>
			</div>
		</Link>
	)
}
