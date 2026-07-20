'use client'

import dynamic from 'next/dynamic'
import initialFootprints from '@/data/footprints.json'
import initialWishlist from '@/data/wishlist.json'
import type { Footprint, WishlistItem } from './components/footprint-map-client'

// Dynamically import the map visualization component to bypass SSR execution of Leaflet
const FootprintMapClient = dynamic(
	() => import('./components/footprint-map-client'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-secondary)]">
				<div className="flex flex-col items-center gap-2">
					<div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
					<p className="text-sm">正在加载空间地图...</p>
				</div>
			</div>
		)
	}
)

export default function SpacePage() {
	return (
		<div className="fixed inset-0 z-10 w-full h-full">
			<FootprintMapClient 
				initialFootprints={initialFootprints as unknown as Footprint[]} 
				initialWishlist={initialWishlist as unknown as WishlistItem[]}
			/>
		</div>
	)
}
