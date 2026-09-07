import Link from 'next/link'

export default function NotFound() {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
			<h1 className="text-6xl font-bold font-serif mb-4 text-[var(--color-primary)]">404</h1>
			<p className="text-base text-[var(--color-secondary)] mb-6">抱歉，您访问的页面不存在或已被移除。</p>
			<Link
				href="/"
				className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium text-sm transition-all hover:brightness-110 active:scale-95 shadow-xs"
			>
				返回首页
			</Link>
		</div>
	)
}
