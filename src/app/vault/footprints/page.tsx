'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuthStore } from '@/hooks/use-auth'
import initialFootprints from '@/data/footprints.json'
import type { Footprint } from './components/footprints-admin-client'

// Dynamically import the Leaflet admin component with SSR disabled
const FootprintsAdminClient = dynamic(
	() => import('./components/footprints-admin-client'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-secondary)]">
				<div className="flex flex-col items-center gap-2">
					<div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
					<p className="text-sm">加载足迹控制台...</p>
				</div>
			</div>
		)
	}
)

export default function VaultFootprintsPage() {
	const { isAuth } = useAuthStore()

	if (!isAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-primary)]">
				<div className="text-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] max-w-md mx-6">
					<h2 className="text-xl font-bold mb-2">未授权访问</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-4">
						此页面是私人仓库管理，请先在右上角输入密码切换为作者模式。
					</p>
					<Link href="/favorite" className="brand-btn px-4 py-2 rounded-full text-sm inline-block">
						返回精选页
					</Link>
				</div>
			</div>
		)
	}

	return <FootprintsAdminClient initialFootprints={initialFootprints as unknown as Footprint[]} />
}
