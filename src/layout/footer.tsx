import Link from 'next/link'

export default function Footer() {
	return (
		<footer className='relative z-10 border-t border-[var(--color-border)] mt-20'>
			<div className='mx-auto max-w-5xl px-6 pt-12 pb-24'>
				<div className='flex flex-col md:flex-row items-center justify-between gap-6'>
					{/* Brand */}
					<div className='flex items-center gap-2'>
						<span className='font-serif text-lg font-medium text-[var(--color-primary)]'>YYsuni</span>
						<span className='text-xs text-[var(--color-secondary)]'>Workshop</span>
					</div>

					{/* Links */}
					<nav className='flex items-center gap-6'>
						<Link href='/' className='text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'>
							Home
						</Link>
						<Link href='/blog' className='text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'>
							Blog
						</Link>
						<Link href='/projects' className='text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'>
							Projects
						</Link>
						<Link href='/about' className='text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors'>
							About
						</Link>
					</nav>

					{/* Copyright */}
					<div className='text-xs text-[var(--color-secondary)]'>
						© {new Date().getFullYear()} YYsuni. All rights reserved.
					</div>
				</div>
			</div>
		</footer>
	)
}
