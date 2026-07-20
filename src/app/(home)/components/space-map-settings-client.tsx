'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface SpaceMapSettingsClientProps {
	initialLat: number
	initialLng: number
	zoom: number
	onChange: (lat: number, lng: number, zoom: number) => void
}

function MapEvents({ zoom, onChange }: { zoom: number, onChange: (lat: number, lng: number, zoom: number) => void }) {
	const map = useMap()

	useEffect(() => {
		const update = () => {
			map.invalidateSize()
		}
		update()
		const timer = setTimeout(update, 200)
		return () => clearTimeout(timer)
	}, [map])

	useEffect(() => {
		if (map.getZoom() !== zoom) {
			map.setZoom(zoom)
		}
	}, [zoom, map])

	useMapEvents({
		moveend: () => {
			const center = map.getCenter()
			const currentZoom = map.getZoom()
			onChange(center.lat, center.lng, currentZoom)
		},
		zoomend: () => {
			const center = map.getCenter()
			const currentZoom = map.getZoom()
			onChange(center.lat, center.lng, currentZoom)
		}
	})

	return null
}

export default function SpaceMapSettingsClient({ initialLat, initialLng, zoom, onChange }: SpaceMapSettingsClientProps) {
	// Add a ready state to prevent hydration mismatch with leaflet
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		setIsReady(true)
	}, [])

	if (!isReady) return <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />

	return (
		<MapContainer
			center={[initialLat, initialLng]}
			zoom={zoom}
			style={{ width: '100%', height: '100%', zIndex: 1 }}
			zoomControl={true}
			scrollWheelZoom={true}
			dragging={true}
			worldCopyJump={true}
			zoomSnap={0.1}
			zoomDelta={0.5}
		>
			<TileLayer
				url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				className="map-tiles"
			/>
			<MapEvents zoom={zoom} onChange={onChange} />
			
			{/* Crosshair indicator at the center */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
				<div className="relative flex items-center justify-center">
					<div className="w-10 h-10 border-2 border-orange-500/50 rounded-full" />
					<div className="absolute w-2 h-2 bg-orange-500 rounded-full" />
					<div className="absolute w-12 h-[2px] bg-orange-500/50" />
					<div className="absolute h-12 w-[2px] bg-orange-500/50" />
				</div>
			</div>
			
			<style jsx global>{`
				.map-tiles {
					filter: var(--map-tiles-filter, none);
				}
				.dark .map-tiles {
					--map-tiles-filter: invert(1) hue-rotate(180deg) brightness(95%) contrast(90%);
				}
			`}</style>
		</MapContainer>
	)
}
