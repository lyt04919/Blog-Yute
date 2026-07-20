'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, RefreshCw, Layers, List, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, Tooltip, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useTheme } from '@/hooks/use-theme'
import { useAuthStore } from '@/hooks/use-auth'

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

export interface Footprint {
	id: string
	city: string
	country: string
	coordinates: [number, number]
	date: string
	days: number
	type: 'travel' | 'live' | 'work' | 'study'
	notes: string
	images: string[]
	coverImage?: string
	showOnHome?: boolean
	isCurrent?: boolean
	departure?: { city: string; coordinates: [number, number] }
	stops?: Array<{ city: string; coordinates: [number, number] }>
	transport?: 'flight' | 'train' | 'car' | 'ship' | 'other'
}

export interface WishlistItem {
	city: string
	country: string
	progress: number
	desc: string
	status: 'planning' | 'dreaming'
	color: 'accent' | 'blue' | 'zinc'
}

interface FootprintMapClientProps {
	initialFootprints: Footprint[]
	initialWishlist: WishlistItem[]
}

// Helper to calculate Bezier arc points for flights
function getArcPoints(start: [number, number], end: [number, number], segmentsCount = 30): Array<[number, number]> {
	const [lat1, lng1] = start
	const [lat2, lng2] = end

	const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2))
	if (distance < 0.5) {
		return [start, end]
	}

	const midLat = (lat1 + lat2) / 2
	const midLng = (lng1 + lng2) / 2

	// Perpendicular offset factor (curviness)
	const curviness = 0.15
	
	const ctrlLat = midLat - (lng2 - lng1) * curviness
	const ctrlLng = midLng + (lat2 - lat1) * curviness

	const points: Array<[number, number]> = []
	for (let i = 0; i <= segmentsCount; i++) {
		const t = i / segmentsCount
		const lat = Math.pow(1 - t, 2) * lat1 + 2 * (1 - t) * t * ctrlLat + Math.pow(t, 2) * lat2
		const lng = Math.pow(1 - t, 2) * lng1 + 2 * (1 - t) * t * ctrlLng + Math.pow(t, 2) * lng2
		points.push([lat, lng])
	}
	return points
}

// Controller component to programmatically pan/zoom Leaflet map
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
	const map = useMap()
	useEffect(() => {
		map.flyTo(center, zoom, { animate: true, duration: 1.8 })
	}, [center, zoom, map])
	return null
}

export default function FootprintMapClient({ initialFootprints, initialWishlist }: FootprintMapClientProps) {
	const { resolvedTheme } = useTheme()
	const { isAuth } = useAuthStore()
	const [activePoint, setActivePoint] = useState<Footprint | null>(null)
	const [hasFlownIn, setHasFlownIn] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => {
			setHasFlownIn(true)
		}, 800)
		return () => clearTimeout(timer)
	}, [])
	
	// Timeline states
	const [isPlaying, setIsPlaying] = useState(false)
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
	const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

	// Photo viewer state
	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

	// Premium interactive options
	const [showPath, setShowPath] = useState(false)
	const [selectedTypes, setSelectedTypes] = useState<Array<'travel' | 'live' | 'work' | 'study'>>(['travel', 'live', 'work', 'study'])
	const [isSidebarOpen, setIsSidebarOpen] = useState(true)
	const [activeSidebarTab, setActiveSidebarTab] = useState<'points' | 'badges'>('points')

	// Wishlist edit states
	const [wishlistData, setWishlistData] = useState<WishlistItem[]>(initialWishlist || [])
	const [isEditingWishlist, setIsEditingWishlist] = useState(false)
	const [isSavingWishlist, setIsSavingWishlist] = useState(false)

	const saveWishlist = async () => {
		setIsSavingWishlist(true)
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					target: 'wishlist',
					data: wishlistData
				})
			})
			if (!res.ok) throw new Error('Failed to save')
			setIsEditingWishlist(false)
		} catch (error) {
			console.error('Save error:', error)
			alert('保存失败')
		} finally {
			setIsSavingWishlist(false)
		}
	}

	// Sort footprints chronologically
	const sortedFootprints = useMemo<Footprint[]>(() => {
		return [...initialFootprints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	}, [initialFootprints])

	// Dynamic achievements computations
	const achievements = useMemo(() => {
		const totalDays = sortedFootprints
			.filter(fp => fp.type !== 'live' && fp.type !== 'work' && !fp.isCurrent)
			.reduce((sum, fp) => sum + fp.days, 0)
		
		const flightCount = sortedFootprints.filter(fp => fp.transport === 'flight').length
		const trainCount = sortedFootprints.filter(fp => fp.transport === 'train').length
		const shipCount = sortedFootprints.filter(fp => fp.transport === 'ship').length
		const liveCities = sortedFootprints.filter(fp => fp.type === 'live').map(fp => fp.city)
		const uniqueLiveCities = Array.from(new Set(liveCities)).length

		const uniqueCountries = Array.from(new Set(sortedFootprints.map(fp => fp.country).filter(Boolean))).length
		const hasStudy = sortedFootprints.some(fp => fp.type === 'study')
		
		const hasOceania = sortedFootprints.some(fp => fp.coordinates[0] < 0)
		const hasAsia = sortedFootprints.some(fp => fp.coordinates[0] > 0)
		const continentsCount = (hasOceania ? 1 : 0) + (hasAsia ? 1 : 0)

		const hasFarSouth = sortedFootprints.some(fp => fp.coordinates[0] < -40)
		const hasFarNorth = sortedFootprints.some(fp => fp.coordinates[0] > 60)
		const hasManyPhotos = sortedFootprints.some(fp => fp.images && fp.images.length >= 5)
		
		const typesSet = new Set(sortedFootprints.map(fp => fp.type))
		const hasAllTypes = typesSet.has('travel') && typesSet.has('live') && typesSet.has('work') && typesSet.has('study')

		return [
			{
				id: 'global-explorer',
				title: '环球探索者',
				desc: '踏足 2 个以上大洲点位 (已打卡亚洲/大洋洲)',
				unlocked: continentsCount >= 2,
				icon: '🗺️'
			},
			{
				id: 'global-citizen',
				title: '四海为家',
				desc: '踏足并记录了 5 个不同的国家',
				unlocked: uniqueCountries >= 5,
				icon: '🌍'
			},
			{
				id: 'frequent-flyer',
				title: '飞天常客',
				desc: '累计记录 3 次以上飞行轨迹 (已飞 3+ 次)',
				unlocked: flightCount >= 3,
				icon: '✈️'
			},
			{
				id: 'train-voyager',
				title: '铁道漫游者',
				desc: '累计记录 3 次以上火车旅行轨迹',
				unlocked: trainCount >= 3,
				icon: '🚂'
			},
			{
				id: 'ocean-voyager',
				title: '跨洋远航',
				desc: '通过船舶或游轮完成一次旅行',
				unlocked: shipCount >= 1,
				icon: '🛳️'
			},
			{
				id: 'dual-residency',
				title: '双栖生活',
				desc: '在 1 个以上城市长期居住过',
				unlocked: uniqueLiveCities >= 1,
				icon: '🏠'
			},
			{
				id: 'overseas-student',
				title: '异乡学子',
				desc: '有过跨国或异地求学的记录',
				unlocked: hasStudy,
				icon: '🎓'
			},
			{
				id: 'ultimate-latitude',
				title: '极致之境',
				desc: '解锁最南端城市 (踏足南纬 40° 以南地区)',
				unlocked: hasFarSouth,
				icon: '🏔️'
			},
			{
				id: 'northern-lights',
				title: '北境之光',
				desc: '探索极北之地 (到达北纬 60° 以北)',
				unlocked: hasFarNorth,
				icon: '🌌'
			},
			{
				id: 'roaming-nomad',
				title: '流浪漫游',
				desc: '累计纯旅行天数达到 30 天以上',
				unlocked: totalDays >= 30,
				icon: '🎒'
			},
			{
				id: 'versatile-explorer',
				title: '多元人生',
				desc: '体验过旅行、居住、工作、学习全部 4 种状态',
				unlocked: hasAllTypes,
				icon: '🌟'
			},
			{
				id: 'time-catcher',
				title: '时光捕手',
				desc: '在单次旅程中留下了丰富的影像记录 (5张以上)',
				unlocked: hasManyPhotos,
				icon: '📸'
			}
		]
	}, [sortedFootprints])

	// Get unique list of years visited
	const yearsList = useMemo(() => {
		if (sortedFootprints.length === 0) return [new Date().getFullYear()]
		const years = sortedFootprints.map(fp => new Date(fp.date).getFullYear())
		const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b)
		
		// Ensure we cover a continuous range or at least start to end
		const startYear = uniqueYears[0]
		const endYear = uniqueYears[uniqueYears.length - 1]
		const list = []
		for (let y = startYear; y <= endYear; y++) {
			list.push(y)
		}
		return list
	}, [sortedFootprints])

	// Initialize selected year to the latest year available
	useEffect(() => {
		if (yearsList.length > 0) {
			setSelectedYear(yearsList[yearsList.length - 1])
		}
	}, [yearsList])

	// Filter footprints up to selected year AND matching active types
	const visibleFootprints = useMemo<Footprint[]>(() => {
		return sortedFootprints.filter(
			fp => new Date(fp.date).getFullYear() <= selectedYear && selectedTypes.includes(fp.type)
		)
	}, [sortedFootprints, selectedYear, selectedTypes])

	// Chronological path coordinates for Polyline
	const pathCoordinates = useMemo(() => {
		return visibleFootprints.map(fp => fp.coordinates)
	}, [visibleFootprints])

	// Find overlapping points for the currently active point
	const overlappingPoints = useMemo(() => {
		if (!activePoint) return []
		return visibleFootprints.filter(fp => 
			Math.abs(fp.coordinates[0] - activePoint.coordinates[0]) < 0.0001 &&
			Math.abs(fp.coordinates[1] - activePoint.coordinates[1]) < 0.0001
		)
	}, [activePoint, visibleFootprints])

	const overlappingIndex = useMemo(() => {
		if (!activePoint) return -1
		return overlappingPoints.findIndex(fp => fp.id === activePoint.id)
	}, [activePoint, overlappingPoints])

	const handleNextOverlapping = () => {
		if (overlappingIndex < overlappingPoints.length - 1) {
			setActivePoint(overlappingPoints[overlappingIndex + 1])
			setCurrentPhotoIndex(0)
		} else {
			setActivePoint(overlappingPoints[0])
			setCurrentPhotoIndex(0)
		}
	}

	const handlePrevOverlapping = () => {
		if (overlappingIndex > 0) {
			setActivePoint(overlappingPoints[overlappingIndex - 1])
			setCurrentPhotoIndex(0)
		} else {
			setActivePoint(overlappingPoints[overlappingPoints.length - 1])
			setCurrentPhotoIndex(0)
		}
	}

	// Determine target map center and zoom (for fly-in and centering updates)
	const targetCenter = useMemo<[number, number]>(() => {
		if (activePoint) return activePoint.coordinates
		if (visibleFootprints.length > 0) {
			// Center on the latest footprint
			return visibleFootprints[visibleFootprints.length - 1].coordinates
		}
		return [31.2989, 120.5853] // Default Suzhou, China
	}, [activePoint, visibleFootprints])

	const targetZoom = useMemo(() => {
		return activePoint ? 7 : 4
	}, [activePoint])

	// Autoplay timeline player
	const togglePlay = () => {
		if (isPlaying) {
			stopPlayback()
		} else {
			startPlayback()
		}
	}

	const startPlayback = () => {
		setIsPlaying(true)
		let currentYearIndex = yearsList.indexOf(selectedYear)
		if (currentYearIndex === -1 || currentYearIndex === yearsList.length - 1) {
			currentYearIndex = 0
			setSelectedYear(yearsList[0])
		}

		playIntervalRef.current = setInterval(() => {
			currentYearIndex++
			if (currentYearIndex < yearsList.length) {
				const nextYear = yearsList[currentYearIndex]
				setSelectedYear(nextYear)
				
				// Focus on a footprint of this new year if available
				const yearFps = sortedFootprints.filter(
					fp => new Date(fp.date).getFullYear() === nextYear && selectedTypes.includes(fp.type)
				)
				if (yearFps.length > 0) {
					setActivePoint(yearFps[0])
					setIsSidebarOpen(true)
				}
			} else {
				stopPlayback()
			}
		}, 3000)
	}

	const stopPlayback = () => {
		setIsPlaying(false)
		if (playIntervalRef.current) {
			clearInterval(playIntervalRef.current)
			playIntervalRef.current = null
		}
	}

	useEffect(() => {
		return () => {
			if (playIntervalRef.current) clearInterval(playIntervalRef.current)
		}
	}, [])

	// Helper to format stay duration (e.g. 120 days -> 4月)
	const formatDuration = (totalDays: number) => {
		const y = Math.floor(totalDays / 365)
		const m = Math.floor((totalDays % 365) / 30)
		const d = totalDays % 30
		
		const parts = []
		if (y > 0) parts.push(`${y}年`)
		if (m > 0) parts.push(`${m}月`)
		if (d > 0 || parts.length === 0) parts.push(`${d}天`)
		return parts.join(' ')
	}

	// Leaflet Custom Pulse Icon builder for heatmap-like glow
	const createPulseIcon = (type: string, days: number, isActive: boolean) => {
		const baseDays = days || 1
		// Base size based on days spent (logarithmic scale prevents huge dots for years of stay)
		const coreSize = Math.min(Math.max(6 + Math.log10(baseDays) * 4, 6), 20)
		const haloSize = coreSize * 3
		const opacity = Math.min(0.25 + (Math.log10(baseDays) * 0.15), 0.75)
		
		// Color scheme based on type
		let rgb = '139, 92, 246' // travel (purple)
		if (type === 'live') {
			rgb = '59, 130, 246' // blue
		} else if (type === 'work') {
			rgb = '245, 158, 11' // amber
		} else if (type === 'study') {
			rgb = '99, 102, 241' // indigo
		}

		return L.divIcon({
			className: 'custom-pulse-marker',
			html: `
				<div class="relative flex items-center justify-center" style="width: ${haloSize}px; height: ${haloSize}px;">
					<!-- Expanding glowing rings for active markers -->
					${isActive ? `
					<div class="absolute rounded-full marker-glowing-ring" style="
						width: ${haloSize * 1.5}px;
						height: ${haloSize * 1.5}px;
						border: 2px solid rgba(${rgb}, 0.5);
						background: transparent;
					"></div>
					<div class="absolute rounded-full marker-glowing-ring" style="
						width: ${haloSize * 1.5}px;
						height: ${haloSize * 1.5}px;
						border: 1px solid rgba(${rgb}, 0.3);
						background: transparent;
						animation-delay: 1.25s;
					"></div>
					` : ''}
					
					<!-- Heatmap-style glowing halo -->
					<div class="absolute rounded-full ${isActive ? 'marker-pulse-glow' : ''}" style="
						width: ${haloSize}px;
						height: ${haloSize}px;
						background: radial-gradient(circle, rgba(${rgb}, ${opacity * (isActive ? 1.4 : 1)}) 0%, rgba(${rgb}, 0) 70%);
						filter: blur(${coreSize / 2}px);
						opacity: ${isActive ? 1.0 : 0.85};
						transform: scale(${isActive ? 1.25 : 1});
						transition: all 0.3s ease;
					"></div>
					<!-- Inner solid core -->
					<div class="rounded-full shadow-lg transition-all duration-300" style="
						width: ${coreSize}px;
						height: ${coreSize}px;
						background-color: rgb(${rgb});
						border: ${isActive ? '2.5px' : '1.5px'} solid ${isActive ? 'var(--color-accent)' : 'var(--color-bg)'};
						box-shadow: ${isActive ? `0 0 12px rgb(${rgb})` : 'none'};
						transform: scale(${isActive ? 1.2 : 1});
					"></div>
				</div>
			`,
			iconSize: [haloSize, haloSize],
			iconAnchor: [haloSize / 2, haloSize / 2]
		})
	}

	// Custom marker icon for journey transit/departure points
	const createJourneyPointIcon = (labelType: 'departure' | 'stop') => {
		const color = labelType === 'departure' ? 'bg-indigo-500' : 'bg-slate-400'
		return L.divIcon({
			className: 'custom-journey-marker',
			html: `
				<div class="relative flex items-center justify-center animate-fade-in" style="width: 16px; height: 16px;">
					<div class="absolute rounded-full bg-white dark:bg-zinc-950 opacity-40 animate-ping" style="width: 12px; height: 12px;"></div>
					<div class="w-2.5 h-2.5 rounded-full ${color} border border-white dark:border-zinc-950 shadow-sm"></div>
				</div>
			`,
			iconSize: [16, 16],
			iconAnchor: [8, 8]
		})
	}

	// Statistics computations for global overview
	const stats = useMemo(() => {
		const totalCountries = Array.from(new Set(visibleFootprints.map(fp => fp.country).filter(Boolean))).length
		const totalCities = Array.from(new Set(visibleFootprints.map(fp => fp.city))).length
		const totalDays = visibleFootprints
			.filter(fp => fp.type !== 'live' && fp.type !== 'work' && !fp.isCurrent)
			.reduce((sum, fp) => sum + fp.days, 0)
		
		const travelCount = visibleFootprints.filter(fp => fp.type === 'travel').length
		const liveCount = visibleFootprints.filter(fp => fp.type === 'live').length
		const workCount = visibleFootprints.filter(fp => fp.type === 'work').length
		const studyCount = visibleFootprints.filter(fp => fp.type === 'study').length

		return {
			totalCountries,
			totalCities,
			totalDays,
			travelCount,
			liveCount,
			workCount,
			studyCount
		}
	}, [visibleFootprints])

	const toggleTypeFilter = (type: 'travel' | 'live' | 'work' | 'study') => {
		setSelectedTypes(prev => 
			prev.includes(type) 
				? prev.filter(t => t !== type)
				: [...prev, type]
		)
	}

	return (
		<div className="absolute inset-0 bg-[var(--color-bg)] z-10 select-none overflow-hidden">
			{/* Leaflet CSS Inject and Custom Marker styles */}
			<style jsx global>{`
				.leaflet-container {
					background-color: var(--color-bg) !important;
				}
				.leaflet-bar {
					border: 1px solid var(--color-border) !important;
					box-shadow: none !important;
					border-radius: 8px !important;
					overflow: hidden;
				}
				.leaflet-bar a {
					background-color: var(--color-card) !important;
					color: var(--color-primary) !important;
					border-bottom: 1px solid var(--color-border) !important;
					transition: background-color 0.2s;
				}
				.leaflet-bar a:hover {
					background-color: var(--color-border) !important;
				}
				.custom-pulse-marker {
					background: transparent;
					border: none;
				}
				.leaflet-tooltip {
					background-color: var(--color-card) !important;
					border: 1px solid var(--color-border) !important;
					color: var(--color-primary) !important;
					border-radius: 8px !important;
					padding: 6px 10px !important;
					font-size: 11px !important;
					box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
					backdrop-filter: blur(8px) !important;
					font-family: inherit;
				}
				.leaflet-tooltip-top:before {
					border-top-color: var(--color-border) !important;
				}
				.travel-trajectory-line {
					stroke-dasharray: 6 6;
					animation: dash 30s linear infinite;
				}
				.travel-trajectory-active-travel {
					stroke-dasharray: 8 4;
					animation: dash-active 12s linear infinite;
					filter: drop-shadow(0 0 4px rgb(168, 85, 247));
				}
				.travel-trajectory-active-live {
					stroke-dasharray: 8 4;
					animation: dash-active 12s linear infinite;
					filter: drop-shadow(0 0 4px rgb(59, 130, 246));
				}
				.travel-trajectory-active-work {
					stroke-dasharray: 8 4;
					animation: dash-active 12s linear infinite;
					filter: drop-shadow(0 0 4px rgb(245, 158, 11));
				}
				.travel-trajectory-active-study {
					stroke-dasharray: 8 4;
					animation: dash-active 12s linear infinite;
					filter: drop-shadow(0 0 4px rgb(99, 102, 241));
				}
				.flight-trajectory-line {
					stroke-dasharray: 8 8;
					animation: dash 20s linear infinite;
				}
				.flight-trajectory-active-travel {
					stroke-dasharray: 10 5;
					animation: dash-active 8s linear infinite;
					filter: drop-shadow(0 0 6px rgb(168, 85, 247));
				}
				.flight-trajectory-active-live {
					stroke-dasharray: 10 5;
					animation: dash-active 8s linear infinite;
					filter: drop-shadow(0 0 6px rgb(59, 130, 246));
				}
				.flight-trajectory-active-work {
					stroke-dasharray: 10 5;
					animation: dash-active 8s linear infinite;
					filter: drop-shadow(0 0 6px rgb(245, 158, 11));
				}
				.flight-trajectory-active-study {
					stroke-dasharray: 10 5;
					animation: dash-active 8s linear infinite;
					filter: drop-shadow(0 0 6px rgb(99, 102, 241));
				}
				@keyframes dash {
					to {
						stroke-dashoffset: -1000;
					}
				}
				@keyframes dash-active {
					to {
						stroke-dashoffset: -500;
					}
				}
				.custom-journey-marker {
					background: transparent;
					border: none;
				}
				.bg-travel-active {
					background-color: #a855f7 !important;
					color: #ffffff !important;
				}
				.bg-live-active {
					background-color: #3b82f6 !important;
					color: #ffffff !important;
				}
				.bg-work-active {
					background-color: #f59e0b !important;
					color: #ffffff !important;
				}
				.bg-study-active {
					background-color: #6366f1 !important;
					color: #ffffff !important;
				}
				.map-tiles-dark {
					filter: invert(95%) hue-rotate(180deg) brightness(95%) contrast(90%);
				}
				@keyframes custom-marker-pulse {
					0% { transform: scale(0.95); opacity: 0.65; }
					50% { transform: scale(1.1); opacity: 0.95; }
					100% { transform: scale(0.95); opacity: 0.65; }
				}
				@keyframes custom-ring-expand {
					0% { transform: scale(0.4); opacity: 0.9; }
					100% { transform: scale(1.7); opacity: 0; }
				}
				.marker-glowing-ring {
					animation: custom-ring-expand 2.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
				}
				.marker-pulse-glow {
					animation: custom-marker-pulse 2s ease-in-out infinite;
				}
			`}</style>

			{/* Map Container (First in DOM, z-0) */}
			<div className="absolute inset-0 w-full h-full z-0">
				<MapContainer 
					center={[20, 0]} 
					zoom={2} 
					minZoom={2}
					maxZoom={12}
					scrollWheelZoom={true} 
					style={{ height: '100%', width: '100%' }}
					zoomControl={false}
					attributionControl={false}
				>
					<TileLayer
						key={resolvedTheme}
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
						attribution="&copy; OpenStreetMap contributors &copy; CARTO"
						className={resolvedTheme === 'dark' ? 'map-tiles-dark' : ''}
					/>
					
					{/* Journey Trajectories (for any type with departure information) */}
					{visibleFootprints.map((item) => {
						if (!item.departure) return null
						
						const isPointActive = activePoint?.id === item.id
						// Render route line if showPath is ON or if it's the active point
						if (!showPath && !isPointActive) return null

						const isFlight = item.transport === 'flight'

						// Generate points for the polyline segments
						let positions: Array<[number, number]> = []
						if (isFlight) {
							// For flight: interpolate curved points between each consecutive node
							const nodes = [
								item.departure.coordinates,
								...(item.stops || []).map(s => s.coordinates),
								item.coordinates
							]
							for (let i = 0; i < nodes.length - 1; i++) {
								const segmentPoints = getArcPoints(nodes[i], nodes[i+1])
								if (i > 0) {
									positions.pop() // Avoid duplicates at joints
								}
								positions.push(...segmentPoints)
							}
						} else {
							// For non-flights: straight lines
							positions = [
								item.departure.coordinates,
								...(item.stops || []).map(s => s.coordinates),
								item.coordinates
							]
						}

						// Set route line color based on footprint type and active state
						let lineColor = "rgba(139, 92, 246, 0.45)" // travel (purple)
						if (item.type === 'live') {
							lineColor = isPointActive ? "rgb(59, 130, 246)" : "rgba(59, 130, 246, 0.45)" // live (blue)
						} else if (item.type === 'work') {
							lineColor = isPointActive ? "rgb(245, 158, 11)" : "rgba(245, 158, 11, 0.45)" // work (amber)
						} else if (item.type === 'study') {
							lineColor = isPointActive ? "rgb(99, 102, 241)" : "rgba(99, 102, 241, 0.45)" // study (indigo)
						} else {
							lineColor = isPointActive ? "rgb(168, 85, 247)" : "rgba(139, 92, 246, 0.45)" // travel (purple)
						}

						const polylineClass = isPointActive 
							? isFlight
								? item.type === 'live' ? 'flight-trajectory-active-live' :
								  item.type === 'work' ? 'flight-trajectory-active-work' :
								  item.type === 'study' ? 'flight-trajectory-active-study' :
								  'flight-trajectory-active-travel'
								: item.type === 'live' ? 'travel-trajectory-active-live' :
								  item.type === 'work' ? 'travel-trajectory-active-work' :
								  item.type === 'study' ? 'travel-trajectory-active-study' :
								  'travel-trajectory-active-travel'
							: isFlight 
								? 'flight-trajectory-line' 
								: 'travel-trajectory-line'

						return (
							<Polyline
								key={`route-${item.id}`}
								positions={positions}
								color={lineColor}
								weight={isPointActive ? 3.5 : 2}
								opacity={isPointActive ? 0.95 : 0.6}
								className={polylineClass}
							/>
						)
					})}

					{/* Active Point's Departure and Transit Stops Markers (for any type) */}
					{activePoint && activePoint.departure && (
						<>
							{/* Departure point */}
							<Marker
								position={activePoint.departure.coordinates}
								icon={createJourneyPointIcon('departure')}
							>
								<Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent={true}>
									<span className="font-sans text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
										🛫 出发: {activePoint.departure.city}
									</span>
								</Tooltip>
							</Marker>

							{/* Intermediate Stops */}
							{(activePoint.stops || []).map((stop, idx) => (
								<Marker
									key={`stop-${activePoint.id}-${idx}`}
									position={stop.coordinates}
									icon={createJourneyPointIcon('stop')}
								>
									<Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent={true}>
										<span className="font-sans text-[9px] font-bold text-slate-600 dark:text-slate-400">
											🛑 经停: {stop.city}
										</span>
									</Tooltip>
								</Marker>
							))}
						</>
					)}

					{visibleFootprints.map((item) => {
						const isActive = activePoint?.id === item.id
						return (
							<Marker 
								key={item.id}
								position={item.coordinates}
								icon={createPulseIcon(item.type, item.days, isActive)}
								eventHandlers={{
									click: () => {
										setActivePoint(item)
										setCurrentPhotoIndex(0)
										setIsSidebarOpen(true)
									}
								}}
							>
								<Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={false}>
									<span className="font-sans text-[10px] font-bold tracking-wide">
										{item.city} {item.country ? `(${item.country})` : ''}
									</span>
								</Tooltip>
							</Marker>
						)
					})}

					{hasFlownIn && <MapController center={targetCenter} zoom={targetZoom} />}
				</MapContainer>
			</div>

			{/* Floating Header */}
			<div className="absolute top-8 left-6 right-20 z-50 flex justify-between items-center pointer-events-none gap-4">
				<div className="pointer-events-auto flex items-center gap-3 flex-wrap">
					<Link
						href="/"
						className="px-4 py-2 rounded-full border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl text-xs font-semibold text-[var(--color-primary)] hover:bg-white/95 dark:hover:bg-zinc-850 hover:-translate-x-0.5 transition-all inline-flex items-center gap-1.5 shadow-lg active:scale-95"
					>
						<ArrowLeft className="w-3.5 h-3.5" /> Back to Home
					</Link>

					{/* Category Filter Toggles */}
					<div className="flex items-center gap-1 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full border border-white/20 dark:border-zinc-800/80 p-1 shadow-lg">
						{(['travel', 'live', 'work', 'study'] as const).map(t => {
							const isActive = selectedTypes.includes(t)
							const label = t === 'travel' ? '✈️ 旅行' : t === 'live' ? '🏠 居住' : t === 'work' ? '💼 工作' : '📖 学习'
							return (
								<button
									key={t}
									onClick={() => toggleTypeFilter(t)}
									className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all cursor-pointer border-0 ${
										isActive
											? t === 'travel' ? 'bg-travel-active shadow-sm text-white' :
											  t === 'live' ? 'bg-live-active shadow-sm text-white' :
											  t === 'work' ? 'bg-work-active shadow-sm text-white' : 'bg-study-active shadow-sm text-white'
											: 'text-[var(--color-secondary)] hover:bg-[var(--color-border)]/50'
									}`}
								>
									{label}
								</button>
							)
						})}
					</div>

					{isAuth && (
						<Link
							href="/vault/footprints"
							className="px-4 py-2 rounded-full border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-white/90 dark:hover:bg-zinc-850 transition-colors inline-flex items-center gap-1.5 shadow-lg"
						>
							⚙️ Manage Spaces (管理点位)
						</Link>
					)}
				</div>

				<div className="px-5 py-2.5 rounded-full border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl text-sm font-semibold text-[var(--color-primary)] shadow-lg pointer-events-auto font-serif shrink-0 flex items-center gap-2">
					<span>🌍 Space Map / </span>
					<span className="text-[var(--color-accent)] font-sans font-bold">{selectedYear}</span>
					<button
						onClick={() => setIsSidebarOpen(prev => !prev)}
						className="p-1 rounded-lg border border-[var(--color-border)]/50 hover:bg-[var(--color-border)]/45 transition-colors ml-1 cursor-pointer"
						title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
					>
						<List className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
					</button>
				</div>
			</div>

			{/* Floating Map Legend (Bottom Left) */}
			<div className="absolute bottom-28 left-6 z-40 border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 text-xs text-[var(--color-primary)] pointer-events-auto">
				<div className="font-serif font-bold border-b border-[var(--color-border)] pb-1 mb-0.5">点位类别</div>
				<div className="flex items-center gap-2">
					<span className="w-2.5 h-2.5 rounded-full bg-purple-500" style={{ border: '2.5px solid var(--color-bg)' }}></span>
					<span className="text-[11px] text-[var(--color-secondary)]">✈️ 旅行 (Travel)</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-2.5 h-2.5 rounded-full bg-blue-500" style={{ border: '2.5px solid var(--color-bg)' }}></span>
					<span className="text-[11px] text-[var(--color-secondary)]">🏠 居住 (Live)</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-2.5 h-2.5 rounded-full bg-amber-500" style={{ border: '2.5px solid var(--color-bg)' }}></span>
					<span className="text-[11px] text-[var(--color-secondary)]">💼 工作 (Work)</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-2.5 h-2.5 rounded-full bg-indigo-500" style={{ border: '2.5px solid var(--color-bg)' }}></span>
					<span className="text-[11px] text-[var(--color-secondary)]">📖 学习 (Study)</span>
				</div>
			</div>

			{/* Floating Side Info & Stats Panel */}
			<AnimatePresence>
				{isSidebarOpen && (
					<div className="absolute inset-y-0 right-6 z-40 flex items-center pointer-events-none">
						<motion.div
							initial={{ x: 380, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 380, opacity: 0 }}
							transition={{ type: 'spring', damping: 25, stiffness: 200 }}
							className="w-80 sm:w-96 border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-sm pointer-events-auto"
							style={{ maxHeight: '65vh' }}
						>
						{activePoint ? (
							/* Details View for Selected Point */
							<>
								{/* Card Header */}
								<div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
									<div className="flex flex-col">
										<div className="flex items-center gap-1.5">
											{overlappingPoints.length > 1 && (
												<button 
													onClick={handlePrevOverlapping} 
													className="p-0.5 -ml-1 rounded-full hover:bg-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
												>
													<ChevronLeft className="w-4 h-4"/>
												</button>
											)}
											<h3 className="font-serif font-bold text-base flex items-center gap-1.5">
												<MapPin className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
												{activePoint.city}
											</h3>
											{overlappingPoints.length > 1 && (
												<button 
													onClick={handleNextOverlapping} 
													className="p-0.5 rounded-full hover:bg-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
												>
													<ChevronRight className="w-4 h-4"/>
												</button>
											)}
											{overlappingPoints.length > 1 && (
												<span className="text-[9px] text-[var(--color-secondary)] font-mono bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] ml-1">
													{overlappingIndex + 1}/{overlappingPoints.length}
												</span>
											)}
										</div>
										<span className="text-[10px] text-[var(--color-secondary)] uppercase tracking-wider mt-1">
											{activePoint.country || '中国'}
										</span>
									</div>
									<div className="flex gap-2">
										<button 
											onClick={() => setActivePoint(null)}
											className="text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-colors"
										>
											Overview
										</button>
										<button 
											onClick={() => setIsSidebarOpen(false)}
											className="text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] px-2 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-colors"
										>
											Hide
										</button>
									</div>
								</div>

								<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
									{/* Photos Carousel */}
									{activePoint.images && activePoint.images.length > 0 ? (
										<div className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-[var(--color-border)] group shrink-0">
											<img 
												src={activePoint.images[currentPhotoIndex]} 
												alt={activePoint.city}
												className="w-full h-full object-cover"
											/>
											{activePoint.images.length > 1 && (
												<>
													<button 
														onClick={() => setCurrentPhotoIndex(prev => (prev === 0 ? activePoint.images.length - 1 : prev - 1))}
														className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
													>
														<ChevronLeft className="w-4 h-4" />
													</button>
													<button 
														onClick={() => setCurrentPhotoIndex(prev => (prev === activePoint.images.length - 1 ? 0 : prev + 1))}
														className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
													>
														<ChevronRight className="w-4 h-4" />
													</button>
													<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
														{activePoint.images.map((_, i) => (
															<span 
																key={i} 
																className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-white w-3' : 'bg-white/50'}`}
															/>
														))}
													</div>
												</>
											)}
										</div>
									) : (
										<div className="h-32 rounded-xl border border-dashed border-[var(--color-border)] bg-zinc-500/5 flex flex-col items-center justify-center text-[var(--color-secondary)] text-xs shrink-0">
											暂无照片记录
										</div>
									)}

									{/* Metadata */}
									<div className="flex gap-4 border-b border-[var(--color-border)] pb-3 shrink-0">
										<div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)]">
											<Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
											<div>
												<div className="text-[10px] text-[var(--color-secondary)] font-semibold">记录时间</div>
												<div className="text-[var(--color-primary)] font-medium">{activePoint.date}</div>
											</div>
										</div>
										<div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)]">
											<Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
											<div>
												<div className="text-[10px] text-[var(--color-secondary)] font-semibold">停留时间</div>
												<div className="text-[var(--color-primary)] font-medium">{formatDuration(activePoint.days)}</div>
											</div>
										</div>
										<div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)]">
											<span className="text-base">
												{activePoint.type === 'travel' ? '✈️' : activePoint.type === 'live' ? '🏠' : activePoint.type === 'work' ? '💼' : '📖'}
											</span>
											<div>
												<div className="text-[10px] text-[var(--color-secondary)] font-semibold">类别</div>
												<div className="text-[var(--color-primary)] font-medium capitalize">{activePoint.type}</div>
											</div>
										</div>
									</div>

									{/* Notes */}
									<div className="shrink-0">
										<div className="text-[10px] text-[var(--color-secondary)] font-semibold mb-1">旅行故事 / 空间日志</div>
										<p className="text-xs text-[var(--color-secondary)] leading-relaxed bg-[var(--color-bg)]/40 p-3 rounded-xl border border-[var(--color-border)]/50 whitespace-pre-line font-serif italic">
											{activePoint.notes || '这里还未留下文字手记...'}
										</p>
									</div>
								</div>
							</>
						) : (
							/* Global Overview Dashboard with Tab Switchers */
							<>
								{/* Overview Console Header with Tabs */}
								<div className="p-4 border-b border-[var(--color-border)] shrink-0 flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<h3 className="font-serif font-bold text-base flex items-center gap-1.5">
												<BarChart3 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
												空间探索仪表盘
											</h3>
											<span className="text-[10px] text-[var(--color-secondary)] uppercase tracking-wider">
												Space Dashboard
											</span>
										</div>
										<button 
											onClick={() => setIsSidebarOpen(false)}
											className="text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] px-2 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-colors cursor-pointer"
										>
											Hide
										</button>
									</div>
									
									{/* Custom Tabs Switcher */}
									<div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold select-none">
										<button
											onClick={() => setActiveSidebarTab('points')}
											className={`py-1.5 rounded-lg transition-all text-center cursor-pointer border-0 flex items-center justify-center gap-1 ${
												activeSidebarTab === 'points'
													? 'bg-white dark:bg-zinc-900 shadow-sm text-[var(--color-primary)] font-bold'
													: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-transparent'
											}`}
										>
											📋 点位
										</button>
										<Link
											href="/pictures"
											className="py-1.5 rounded-lg transition-all text-center cursor-pointer border-0 flex items-center justify-center gap-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-transparent hover:bg-white dark:hover:bg-zinc-900/50"
										>
											📸 相册
										</Link>
										<button
											onClick={() => setActiveSidebarTab('badges')}
											className={`py-1.5 rounded-lg transition-all text-center cursor-pointer border-0 flex items-center justify-center gap-1 ${
												activeSidebarTab === 'badges'
													? 'bg-white dark:bg-zinc-900 shadow-sm text-[var(--color-primary)] font-bold'
													: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-transparent'
											}`}
										>
											🏆 成就
										</button>
									</div>
								</div>

								{/* Main Tab Contents Container */}
								<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin">
									
									{/* Tab 1: Points & Counters (Default overview list) */}
									{activeSidebarTab === 'points' && (
										<>
											{/* Counters Grid */}
											<div className="grid grid-cols-3 gap-3 shrink-0">
												<div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/30 text-center">
													<div className="text-xl font-bold font-mono text-[var(--color-accent)]">{stats.totalCities}</div>
													<div className="text-[9px] text-[var(--color-secondary)]">探索城市</div>
												</div>
												<div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/30 text-center">
													<div className="text-xl font-bold font-mono text-[var(--color-accent)]">{stats.totalCountries}</div>
													<div className="text-[9px] text-[var(--color-secondary)]">覆盖国家</div>
												</div>
												<div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/30 text-center">
													<div className="text-xl font-bold font-mono text-[var(--color-accent)]">{stats.totalDays}</div>
													<div className="text-[9px] text-[var(--color-secondary)]">旅行天数</div>
												</div>
											</div>

											{/* Point Breakdown */}
											<div className="flex flex-col gap-2 shrink-0">
												<div className="text-[10px] text-[var(--color-secondary)] font-semibold">空间类别分布</div>
												<div className="grid grid-cols-2 gap-2 text-xs">
													<div className="flex justify-between items-center p-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-card)]">
														<span className="text-[var(--color-secondary)]">✈️ 旅行点位</span>
														<span className="font-mono font-bold text-[var(--color-primary)]">{stats.travelCount}</span>
													</div>
													<div className="flex justify-between items-center p-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-card)]">
														<span className="text-[var(--color-secondary)]">🏠 居住经历</span>
														<span className="font-mono font-bold text-[var(--color-primary)]">{stats.liveCount}</span>
													</div>
													<div className="flex justify-between items-center p-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-card)]">
														<span className="text-[var(--color-secondary)]">💼 工作驻留</span>
														<span className="font-mono font-bold text-[var(--color-primary)]">{stats.workCount}</span>
													</div>
													<div className="flex justify-between items-center p-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-card)]">
														<span className="text-[var(--color-secondary)]">📖 学习驻留</span>
														<span className="font-mono font-bold text-[var(--color-primary)]">{stats.studyCount}</span>
													</div>
												</div>
											</div>

											{/* Footprints Chronological List */}
											<div className="flex flex-col gap-2.5 shrink-0">
												<div className="text-[10px] text-[var(--color-secondary)] font-semibold flex items-center justify-between">
													<span>足迹与点位时间线 ({visibleFootprints.length})</span>
													<span className="text-[9px] font-mono">截止于 {selectedYear} 年</span>
												</div>
												<div className="flex flex-col gap-2">
													{visibleFootprints.length === 0 ? (
														<div className="text-center text-xs text-[var(--color-secondary)] py-8 border border-dashed border-[var(--color-border)] rounded-xl">
															无符合当前筛选条件的点位
														</div>
													) : (
														(visibleFootprints as Footprint[]).map((item: Footprint) => {
															const isPointActive = false
															
															let typeTagClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400"
															if (item.type === 'live') {
																typeTagClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400"
															} else if (item.type === 'work') {
																typeTagClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400"
															} else if (item.type === 'study') {
																typeTagClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
															}

															return (
																<button
																	key={item.id}
																	onClick={() => {
																		setActivePoint(item)
																		setCurrentPhotoIndex(0)
																	}}
																	className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left w-full text-xs cursor-pointer ${
																		isPointActive 
																			? item.type === 'live' ? 'border-blue-500 bg-blue-500/10 shadow-sm font-bold' :
																			  item.type === 'work' ? 'border-amber-500 bg-amber-500/10 shadow-sm font-bold' :
																			  item.type === 'study' ? 'border-indigo-500 bg-indigo-500/10 shadow-sm font-bold' :
																			  'border-purple-500 bg-purple-500/10 shadow-sm font-bold'
																			: 'border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-card)]/50'
																	}`}
																>
																	<div className="flex flex-col gap-0.5">
																		<span className="font-semibold text-[var(--color-primary)]">
																			{item.city} {item.country && <span className="text-[var(--color-secondary)] text-[10px] font-normal">({item.country})</span>}
																		</span>
																		<span className="text-[10px] text-[var(--color-secondary)] font-mono">{item.date} ({formatDuration(item.days)})</span>
																	</div>
																	<span className={`text-[10px] px-2.5 py-0.5 rounded-full shrink-0 ml-2 font-medium ${typeTagClass}`}>
																		{item.type === 'travel' ? '✈️ 旅行' : item.type === 'live' ? '🏠 居住' : item.type === 'work' ? '💼 工作' : '📖 学习'}
																	</span>
																</button>
															)
														})
													)}
												</div>
											</div>
										</>
									)}

									{/* Tab 3: Achievements Badge Wall & Travel Wishlist */}
									{activeSidebarTab === 'badges' && (
										<div className="flex flex-col gap-6 py-1">
											{/* Achievements Section */}
											<div className="flex flex-col gap-3">
												<span className="text-[10px] text-[var(--color-secondary)] font-semibold uppercase tracking-wider">
													🏛️ 空间探索展馆
												</span>
												<div className="flex flex-col gap-3">
													{achievements.map(ach => (
														<div 
															key={ach.id} 
															className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
																ach.unlocked 
																	? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--color-primary)] shadow-sm'
																	: 'bg-zinc-500/5 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60'
															}`}
														>
															<div className={`text-2xl p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
																ach.unlocked 
																	? 'bg-emerald-500/10 shadow-inner'
																	: 'bg-zinc-500/10'
															}`}>
																{ach.icon}
															</div>
															<div className="flex flex-col min-w-0">
																<span className="font-bold text-xs flex items-center gap-1.5">
																	{ach.title}
																	{ach.unlocked && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wide">已解锁</span>}
																</span>
																<span className="text-[10px] text-[var(--color-secondary)] leading-relaxed mt-0.5">{ach.desc}</span>
															</div>
														</div>
													))}
												</div>
											</div>
											
											{/* Wishlist Section */}
											<div className="flex flex-col gap-3">
												<div className="flex items-center justify-between">
													<span className="text-[10px] text-[var(--color-secondary)] font-semibold uppercase tracking-wider">
														🎯 旅行心愿单 & 下一站
													</span>
													{isAuth && (
														<div className="flex gap-2">
															{isEditingWishlist ? (
																<>
																	<button
																		onClick={() => {
																			setWishlistData([...wishlistData, { city: '', country: '', progress: 0, desc: '', status: 'planning', color: 'accent' }])
																		}}
																		className="text-[10px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-colors"
																	>
																		+ 新增
																	</button>
																	<button
																		onClick={saveWishlist}
																		disabled={isSavingWishlist}
																		className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
																	>
																		{isSavingWishlist ? '保存中...' : '保存'}
																	</button>
																	<button
																		onClick={() => {
																			setWishlistData(initialWishlist || [])
																			setIsEditingWishlist(false)
																		}}
																		className="text-[10px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-colors"
																	>
																		取消
																	</button>
																</>
															) : (
																<button
																	onClick={() => setIsEditingWishlist(true)}
																	className="text-[10px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-colors"
																>
																	编辑心愿单
																</button>
															)}
														</div>
													)}
												</div>
												<div className="grid grid-cols-1 gap-3 text-xs">
													{isEditingWishlist ? (
														wishlistData.map((wish, idx) => (
															<div key={idx} className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/30">
																<div className="flex justify-between items-center mb-1">
																	<span className="text-xs font-bold text-[var(--color-secondary)]"># {idx + 1}</span>
																	<button 
																		onClick={() => setWishlistData(wishlistData.filter((_, i) => i !== idx))}
																		className="text-[10px] text-red-500 hover:bg-red-500/10 px-1.5 py-0.5 rounded"
																	>
																		删除
																	</button>
																</div>
																<input 
																	value={wish.city}
																	onChange={e => {
																		const newData = [...wishlistData];
																		newData[idx].city = e.target.value;
																		setWishlistData(newData);
																	}}
																	placeholder="城市 (例如: 东京 Tokyo)"
																	className="w-full bg-transparent border-b border-[var(--color-border)] px-1 py-1 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-accent)]"
																/>
																<input 
																	value={wish.country || ''}
																	onChange={e => {
																		const newData = [...wishlistData];
																		newData[idx].country = e.target.value;
																		setWishlistData(newData);
																	}}
																	placeholder="国家"
																	className="w-full bg-transparent border-b border-[var(--color-border)] px-1 py-1 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-accent)]"
																/>
																<input 
																	value={wish.desc}
																	onChange={e => {
																		const newData = [...wishlistData];
																		newData[idx].desc = e.target.value;
																		setWishlistData(newData);
																	}}
																	placeholder="描述 (例如: 看极光、高反体验)"
																	className="w-full bg-transparent border-b border-[var(--color-border)] px-1 py-1 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-accent)]"
																/>
																<div className="flex items-center gap-2 mt-1">
																	<span className="text-[10px] text-[var(--color-secondary)]">进度:</span>
																	<input 
																		type="range"
																		min="0"
																		max="100"
																		value={wish.progress}
																		onChange={e => {
																			const newData = [...wishlistData];
																			newData[idx].progress = parseInt(e.target.value);
																			setWishlistData(newData);
																		}}
																		className="flex-1 accent-[var(--color-accent)]"
																	/>
																	<span className="text-[10px] w-6">{wish.progress}%</span>
																</div>
																<div className="flex gap-2 mt-1">
																	<select 
																		value={wish.status}
																		onChange={e => {
																			const newData = [...wishlistData];
																			newData[idx].status = e.target.value as any;
																			setWishlistData(newData);
																		}}
																		className="bg-[var(--color-bg)] border border-[var(--color-border)] text-xs rounded px-1 py-1 outline-none"
																	>
																		<option value="planning">规划中</option>
																		<option value="dreaming">向往中</option>
																	</select>
																	<select 
																		value={wish.color}
																		onChange={e => {
																			const newData = [...wishlistData];
																			newData[idx].color = e.target.value as any;
																			setWishlistData(newData);
																		}}
																		className="bg-[var(--color-bg)] border border-[var(--color-border)] text-xs rounded px-1 py-1 outline-none"
																	>
																		<option value="accent">主题色 (Accent)</option>
																		<option value="blue">蓝色 (Blue)</option>
																		<option value="zinc">灰色 (Zinc)</option>
																	</select>
																</div>
															</div>
														))
													) : (
														wishlistData.map((wish, idx) => {
															const statusLabel = wish.status === 'planning' ? '规划中' : '向往中'
															const strokeColor = wish.color === 'accent' ? 'stroke-[var(--color-accent)]' : wish.color === 'blue' ? 'stroke-blue-500' : 'stroke-zinc-400'
															
															const radius = 14
															const circumference = 2 * Math.PI * radius
															const offset = circumference - (wish.progress / 100) * circumference

															return (
																<div key={idx} className="flex items-center gap-3.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[var(--color-card)]/50">
																	{/* Circular Progress */}
																	<div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
																		<svg className="w-full h-full transform -rotate-90">
																			<circle cx="20" cy="20" r={radius} className="stroke-zinc-100 dark:stroke-zinc-800 fill-none" strokeWidth="2.5" />
																			<circle cx="20" cy="20" r={radius} className={`${strokeColor} fill-none transition-all duration-1000`} strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
																		</svg>
																		<span className="absolute text-[8.5px] font-bold font-mono text-[var(--color-primary)]">{wish.progress}%</span>
																	</div>
																	
																	<div className="flex flex-col min-w-0 flex-1">
																		<div className="flex items-center justify-between">
																			<span className="font-bold text-xs truncate">{wish.city}</span>
																			<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
																				wish.status === 'planning' 
																					? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
																					: 'bg-zinc-500/10 border-zinc-200 dark:border-zinc-800 text-zinc-500'
																			}`}>
																				{statusLabel}
																			</span>
																		</div>
																		<span className="text-[10px] text-[var(--color-secondary)] truncate mt-1 leading-normal">{wish.desc}</span>
																	</div>
																</div>
															)
														})
													)}
												</div>
											</div>
										</div>
									)}
								</div>
							</>
						)}
					</motion.div>
				</div>
				)}
			</AnimatePresence>

			{/* Floating Bottom Timeline Slider & Controls */}
			<div className="absolute bottom-8 left-6 right-6 z-40 pointer-events-none flex flex-col gap-3">
				<div className="mx-auto w-full max-w-3xl border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-2xl pointer-events-auto flex items-center gap-4 flex-wrap sm:flex-nowrap">
					{/* Play / Pause button */}
					<button 
						onClick={togglePlay}
						className="p-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] hover:opacity-90 transition-opacity cursor-pointer shrink-0 flex items-center justify-center shadow-md border-0"
						title={isPlaying ? 'Pause timeline' : 'Autoplay timeline'}
					>
						{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 animate-pulse" />}
					</button>

					{/* Timeline Slider */}
					<div className="flex-1 flex flex-col gap-1 w-full min-w-[200px]">
						<div className="flex justify-between text-[10px] text-[var(--color-secondary)] px-1 font-mono font-bold">
							<span>{yearsList[0]}</span>
							<span className="text-[var(--color-accent)] font-semibold">探索至今: {selectedYear}</span>
							<span>{yearsList[yearsList.length - 1]}</span>
						</div>
						
						<input 
							type="range" 
							min={yearsList[0]}
							max={yearsList[yearsList.length - 1]}
							step={1}
							value={selectedYear}
							onChange={(e) => {
								stopPlayback()
								setSelectedYear(parseInt(e.target.value))
							}}
							className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] focus:outline-none"
						/>
					</div>

					{/* Toggle Trajectory Path */}
					<button
						onClick={() => setShowPath(prev => !prev)}
						className={`px-3 py-2 rounded-xl border transition-all text-xs shrink-0 flex items-center gap-1.5 cursor-pointer ${
							showPath 
								? 'bg-[var(--color-accent)] text-white border-transparent shadow-sm font-bold'
								: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] border-[var(--color-border)]'
						}`}
						title="Toggle travel path lines connecting chronological footprints"
					>
						<Layers className="w-3.5 h-3.5" />
						{showPath ? '隐藏轨迹' : '显示轨迹'}
					</button>

					{/* Reset / View All */}
					<button
						onClick={() => {
							stopPlayback()
							setSelectedYear(yearsList[yearsList.length - 1])
							setActivePoint(null)
						}}
						className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-all text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
						title="Reset view to show all locations"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						重置视角
					</button>
				</div>
			</div>
		</div>
	)
}
