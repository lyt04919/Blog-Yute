'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useTheme } from '@/hooks/use-theme'

// Fix for default Leaflet icon not showing up in React/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Helper component to center map smoothly when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
	const map = useMap()
	useEffect(() => {
		map.setView(center, map.getZoom(), { animate: true })
	}, [center, map])
	return null
}

export default function LocationMap({ location }: { location?: string }) {
	const [coords, setCoords] = useState<[number, number]>([-40.9006, 174.8860]) // Default to NZ
	const [zoom, setZoom] = useState(5)
	const { resolvedTheme } = useTheme()

	useEffect(() => {
		if (!location) return

		const fetchCoords = async () => {
			try {
				const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
				const data = await response.json()
				if (data && data.length > 0) {
					setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
					setZoom(10)
				}
			} catch (error) {
				console.error("Failed to geocode location:", error)
			}
		}

		// Debounce to prevent spamming API while typing
		const timeoutId = setTimeout(fetchCoords, 800)
		return () => clearTimeout(timeoutId)
	}, [location])

	return (
		<div className="w-full h-full relative" style={{
			filter: resolvedTheme === 'dark' ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none',
			transition: 'filter 0.5s ease-in-out'
		}}>
			<MapContainer center={coords} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%', background: 'transparent' }} attributionControl={false} zoomControl={false}>
				<TileLayer
					url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
				/>
				<Marker position={coords} />
				<ChangeView center={coords} />
			</MapContainer>
		</div>
	)
}
