'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useTheme } from '@/hooks/use-theme'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialFootprints from '@/data/footprints.json'
import type { Footprint } from '@/app/space/components/footprint-map-client'

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Helper component to dynamically change map view with absolute sync & ResizeObserver
function ChangeView({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
	const map = useMap()
	
	useEffect(() => {
		let isMounted = true
		const update = () => {
			if (!isMounted) return
			map.invalidateSize(true)
			map.setView([lat, lng], zoom, { animate: false })
		}
		
		// Initial sync
		update()
		
		// Delayed sync to account for layout shifts
		const timer1 = setTimeout(update, 100)
		const timer2 = setTimeout(update, 300)
		const timer3 = setTimeout(update, 600)
		
		// Aggressive ResizeObserver to catch any CSS flex/grid layout changes
		const mapContainer = map.getContainer()
		const resizeObserver = new ResizeObserver(() => {
			if (!isMounted) return
			map.invalidateSize(true)
			map.setView([lat, lng], zoom, { animate: false })
		})
		
		if (mapContainer) {
			resizeObserver.observe(mapContainer)
		}
		
		return () => {
			isMounted = false
			clearTimeout(timer1)
			clearTimeout(timer2)
			clearTimeout(timer3)
			if (mapContainer) {
				resizeObserver.unobserve(mapContainer)
			}
			resizeObserver.disconnect()
		}
	}, [lat, lng, zoom, map])
	
	return null
}

export default function BentoMap() {
	const { resolvedTheme } = useTheme()
	const { siteContent } = useConfigStore()
	const footprints = initialFootprints as Footprint[]
	const containerRef = useRef<HTMLDivElement>(null)
	
	const bentoConfig = siteContent.bentoConfig || {}
	const mapZoom = typeof bentoConfig.mapZoom === 'number' ? bentoConfig.mapZoom : 2
	const mapCenterLat = typeof bentoConfig.mapCenterLat === 'number' ? bentoConfig.mapCenterLat : 20
	const mapCenterLng = typeof bentoConfig.mapCenterLng === 'number' ? bentoConfig.mapCenterLng : 0
	
	// Query current city from footprints
	const currentCity = useMemo(() => {
		return footprints.find(fp => fp.isCurrent) || null
	}, [footprints])

	const suzhouCoords: [number, number] = [31.2989, 120.5853]
	const centerCoords = useMemo<[number, number]>(() => {
		if (currentCity && currentCity.coordinates) {
			return currentCity.coordinates
		}
		return suzhouCoords
	}, [currentCity])

	const locationText = useMemo(() => {
		if (currentCity) {
			return `${currentCity.city}${currentCity.country ? `, ${currentCity.country}` : ''}`
		}
		return 'Suzhou, China'
	}, [currentCity])

	const currentHomeIcon = useMemo(() => {
		if (typeof window === 'undefined') return null
		return L.divIcon({
			className: 'bento-home-marker',
			html: `
				<div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
					<div class="absolute rounded-full border border-orange-500 animate-ping opacity-75" style="width: 24px; height: 24px;"></div>
					<div class="absolute rounded-full border border-orange-500 animate-pulse opacity-50" style="width: 32px; height: 32px;"></div>
					<div class="w-4 h-4 rounded-full bg-orange-500 border border-white dark:border-zinc-950 shadow-md"></div>
				</div>
			`,
			iconSize: [32, 32],
			iconAnchor: [16, 16]
		})
	}, [])

	const createBentoIcon = (type: string, days: number) => {
		const baseDays = days || 1
		const coreSize = Math.min(Math.max(4 + Math.log10(baseDays) * 3, 4), 12)
		const haloSize = coreSize * 2.5
		const opacity = Math.min(0.2 + (Math.log10(baseDays) * 0.1), 0.6)
		
		let rgb = '139, 92, 246' // travel (purple)
		if (type === 'live') {
			rgb = '59, 130, 246'
		} else if (type === 'work') {
			rgb = '245, 158, 11'
		} else if (type === 'study') {
			rgb = '99, 102, 241'
		}

		return L.divIcon({
			className: 'bento-heatmap-marker',
			html: `
				<div class="relative flex items-center justify-center" style="width: ${haloSize}px; height: ${haloSize}px;">
					<div class="absolute rounded-full" style="
						width: ${haloSize}px;
						height: ${haloSize}px;
						background: radial-gradient(circle, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, 0) 70%);
						filter: blur(${coreSize / 2.5}px);
					"></div>
					<div class="rounded-full shadow-sm" style="
						width: ${coreSize}px;
						height: ${coreSize}px;
						background-color: rgb(${rgb});
						border: 0.75px solid var(--color-bg);
					"></div>
				</div>
			`,
			iconSize: [haloSize, haloSize],
			iconAnchor: [haloSize / 2, haloSize / 2]
		})
	}

	return (
		<div 
			ref={containerRef}
			className="w-full h-full relative"
			style={{
				filter: resolvedTheme === 'dark' ? 'invert(95%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none',
				transition: 'filter 0.5s ease-in-out'
			}}
		>
			<style jsx global>{`
				.bento-home-marker, .bento-heatmap-marker {
					background: transparent;
					border: none;
				}
				.bento-map-tiles {
					filter: var(--bento-map-tiles-filter, none);
				}
				.leaflet-tooltip-minimal {
					background: rgba(255, 255, 255, 0.95);
					border: 1px solid rgba(226, 232, 240, 0.8);
					border-radius: 8px;
					padding: 4px 8px;
					font-family: monospace;
					font-size: 11px;
					font-weight: 600;
					color: #0f172a;
					box-shadow: 0 4px 12px rgba(0,0,0,0.08);
				}
				.dark .leaflet-tooltip-minimal {
					background: rgba(24, 24, 27, 0.95);
					border-color: rgba(39, 39, 42, 0.8);
					color: #f4f4f5;
				}
			`}</style>

			<MapContainer 
				center={[mapCenterLat, mapCenterLng]} 
				zoom={mapZoom} 
				zoomSnap={0.1}
				zoomDelta={0.5}
				scrollWheelZoom={false}
				zoomControl={false}
				doubleClickZoom={false}
				dragging={false}
				touchZoom={false}
				style={{ height: '100%', width: '100%', background: 'transparent' }}
				attributionControl={false}
			>
				<ChangeView lat={mapCenterLat} lng={mapCenterLng} zoom={mapZoom} />
				<TileLayer
					url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
					className="bento-map-tiles"
				/>

				{footprints.map((item) => {
					if (item.isCurrent) return null
					return (
						<Marker
							key={item.id}
							position={item.coordinates}
							icon={createBentoIcon(item.type, item.days)}
						>
							<Tooltip className="leaflet-tooltip-minimal" direction="top" offset={[0, -10]} opacity={1}>
								📍 {item.city} · {item.days || 1} 天
							</Tooltip>
						</Marker>
					)
				})}

				{currentHomeIcon && (
					<Marker position={centerCoords} icon={currentHomeIcon}>
						<Tooltip className="leaflet-tooltip-minimal" direction="top" offset={[0, -15]} opacity={1}>
							📍 {currentCity?.city || 'Suzhou'} (常驻地)
						</Tooltip>
					</Marker>
				)}
			</MapContainer>

			<div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm pointer-events-none text-slate-800 dark:text-slate-200">
				{locationText}
			</div>
		</div>
	)
}
