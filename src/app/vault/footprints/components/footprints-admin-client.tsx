'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Clock, Plus, Trash2, Edit3, Save, Search, CheckCircle, Navigation, Star, X, Upload, ImageIcon } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
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

// Map Click Handler to capture coordinates on click
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
	useMapEvents({
		click(e) {
			onClick(e.latlng.lat, e.latlng.lng)
		}
	})
	return null
}

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

interface FootprintsAdminClientProps {
	initialFootprints: Footprint[]
}

export default function FootprintsAdminClient({ initialFootprints }: FootprintsAdminClientProps) {
	const { resolvedTheme } = useTheme()
	const [footprints, setFootprints] = useState<Footprint[]>(initialFootprints)
	const [searchQuery, setSearchQuery] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [isGeocoding, setIsGeocoding] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Form states
	const [editingId, setEditingId] = useState<string | null>(null)
	const [city, setCity] = useState('')
	const [country, setCountry] = useState('')
	const [latitude, setLatitude] = useState(39.9042) // Default Beijing
	const [longitude, setLongitude] = useState(116.4074)
	const [date, setDate] = useState(new Date().toISOString().split('T')[0])
	
	// Decomposed stay duration inputs
	const [stayYears, setStayYears] = useState(0)
	const [stayMonths, setStayMonths] = useState(0)
	const [stayDays, setStayDays] = useState(1)

	// Current city flag & homepage toggle states
	const [isCurrent, setIsCurrent] = useState(false)
	const [showOnHome, setShowOnHome] = useState(true)

	// Travel journey states (type === 'travel' only)
	const [departureCity, setDepartureCity] = useState('')
	const [departureCoordinates, setDepartureCoordinates] = useState<[number, number] | null>(null)
	const [isGeocodingDeparture, setIsGeocodingDeparture] = useState(false)
	const [stopsInput, setStopsInput] = useState('')
	const [stops, setStops] = useState<Array<{ city: string; coordinates: [number, number] }>>([])
	const [isGeocodingStops, setIsGeocodingStops] = useState(false)

	const [type, setType] = useState<'travel' | 'live' | 'work' | 'study'>('travel')
	const [transport, setTransport] = useState<'flight' | 'train' | 'car' | 'ship' | 'other'>('flight')
	const [notes, setNotes] = useState('')

	// Visual Photo Manager States
	const [imagesList, setImagesList] = useState<string[]>([])
	const [coverImage, setCoverImage] = useState<string>('')
	const [newImageUrl, setNewImageUrl] = useState('')

	// Map center for coordinates picker
	const mapCenter = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude])

	// Filter and sort footprints
	const filteredFootprints = useMemo(() => {
		const q = searchQuery.toLowerCase()
		return footprints
			.filter(item => 
				item.city.toLowerCase().includes(q) || 
				(item.country && item.country.toLowerCase().includes(q)) || 
				(item.notes && item.notes.toLowerCase().includes(q))
			)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	}, [footprints, searchQuery])

	// Deconstruct days into Year, Month, Day display helper
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

	// Handle OSM geocoding for main city
	const handleGeocode = async () => {
		if (!city) {
			toast.error('请输入城市名称')
			return
		}
		setIsGeocoding(true)
		try {
			const query = [city, country].filter(Boolean).join(', ')
			const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
			const data = await response.json()
			if (data && data.length > 0) {
				const lat = parseFloat(data[0].lat)
				const lon = parseFloat(data[0].lon)
				setLatitude(lat)
				setLongitude(lon)
				toast.success(`成功定位到：${data[0].display_name}`)
			} else {
				toast.error('未找到该城市坐标，请手动在地图上点击选择')
			}
		} catch (error) {
			console.error("Geocoding failed:", error)
			toast.error('查询出错，请手动输入或在地图上点击')
		} finally {
			setIsGeocoding(false)
		}
	}

	// Handle OSM geocoding for Departure City
	const handleGeocodeDeparture = async () => {
		if (!departureCity) {
			toast.error('请输入出发城市')
			return
		}
		setIsGeocodingDeparture(true)
		try {
			const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(departureCity)}`)
			const data = await response.json()
			if (data && data.length > 0) {
				const lat = parseFloat(data[0].lat)
				const lon = parseFloat(data[0].lon)
				setDepartureCoordinates([lat, lon])
				toast.success(`定位出发地成功：${data[0].display_name}`)
			} else {
				toast.error('未找到出发城市坐标，请手动检查输入')
			}
		} catch (error) {
			console.error("Departure geocoding failed:", error)
			toast.error('查询出发城市坐标出错')
		} finally {
			setIsGeocodingDeparture(false)
		}
	}

	// Handle OSM geocoding for Intermediate Stops
	const handleGeocodeStops = async () => {
		if (!stopsInput) {
			toast.error('请输入经停城市 (逗号分隔)')
			return
		}
		setIsGeocodingStops(true)
		try {
			const cities = stopsInput.split(',').map(s => s.trim()).filter(Boolean)
			const geocodedStops = []
			for (const cityStr of cities) {
				const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityStr)}`)
				const data = await response.json()
				if (data && data.length > 0) {
					geocodedStops.push({
						city: cityStr,
						coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number]
					})
				} else {
					toast.warning(`未找到经停城市：${cityStr}，已忽略`)
				}
			}
			setStops(geocodedStops)
			if (geocodedStops.length > 0) {
				toast.success(`定位经停地成功，共计 ${geocodedStops.length} 个城市`)
			} else {
				toast.error('未找到任何输入的经停城市坐标')
			}
		} catch (error) {
			console.error("Stops geocoding failed:", error)
			toast.error('查询经停地坐标出错')
		} finally {
			setIsGeocodingStops(false)
		}
	}

	// Handle map click
	const handleMapClick = (lat: number, lng: number) => {
		setLatitude(Number(lat.toFixed(6)))
		setLongitude(Number(lng.toFixed(6)))
	}

	// Photo Management Helpers
	const handleAddPhotoUrl = () => {
		const url = newImageUrl.trim()
		if (!url) return
		if (imagesList.includes(url)) {
			toast.error('该照片已存在于列表')
			return
		}
		const updated = [...imagesList, url]
		setImagesList(updated)
		if (!coverImage) {
			setCoverImage(url)
		}
		setNewImageUrl('')
		toast.success('已添加照片')
	}

	const handleRemovePhoto = (urlToRemove: string) => {
		const updated = imagesList.filter(url => url !== urlToRemove)
		setImagesList(updated)
		if (coverImage === urlToRemove) {
			setCoverImage(updated[0] || '')
		}
		toast.success('已移除照片')
	}

	const handleSetCover = (url: string) => {
		setCoverImage(url)
		setImagesList(prev => {
			const others = prev.filter(img => img !== url)
			return [url, ...others]
		})
		toast.success('已设为该地点封面大图，并置顶显示')
	}

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return
		
		let processedFiles = 0;
		const totalFiles = files.length;

		for (let i = 0; i < files.length; i++) {
			let file = files[i];
			const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

			if (isHeic) {
				const toastId = toast.loading(`正在转换苹果 HEIC 格式: ${file.name}...`);
				try {
					const heic2any = (await import('heic2any')).default;
					const convertedBlob = await heic2any({
						blob: file,
						toType: 'image/jpeg',
						quality: 0.8
					});
					const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
					file = new File([finalBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
					toast.dismiss(toastId);
					toast.success(`${file.name} HEIC 转换成功`);
				} catch (err) {
					console.error("HEIC conversion failed:", err);
					toast.dismiss(toastId);
					toast.error(`无法转换图片: ${file.name}，请尝试手动转换`);
					continue;
				}
			}

			const reader = new FileReader()
			reader.onload = (event) => {
				const dataUrl = event.target?.result as string
				if (dataUrl) {
					// 自动压缩图片以避免 Payload Too Large 错误 (Compress image to avoid 413 Payload Too Large)
					const img = new Image();
					img.onload = () => {
						const canvas = document.createElement('canvas');
						let width = img.width;
						let height = img.height;
						const maxDim = 1200; // 限制最大边长为1200px
						
						if (width > maxDim || height > maxDim) {
							if (width > height) {
								height = Math.round((height * maxDim) / width);
								width = maxDim;
							} else {
								width = Math.round((width * maxDim) / height);
								height = maxDim;
							}
						}
						canvas.width = width;
						canvas.height = height;
						const ctx = canvas.getContext('2d');
						if (ctx) {
							ctx.drawImage(img, 0, 0, width, height);
							// 压缩为 jpeg，质量 0.8
							const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
							setImagesList(prev => [...prev, compressedDataUrl]);
							setCoverImage(prev => prev ? prev : compressedDataUrl);
						}
						processedFiles++;
						if (processedFiles === totalFiles) {
							toast.success(`成功载入并压缩 ${totalFiles} 张照片`);
						}
					};
					img.src = dataUrl;
				}
			}
			reader.readAsDataURL(file)
		}
		
		if (e.target) e.target.value = ''
	}

	// Set form values for editing
	const startEdit = (item: Footprint) => {
		setEditingId(item.id)
		setCity(item.city)
		setCountry(item.country)
		setLatitude(item.coordinates[0])
		setLongitude(item.coordinates[1])
		setDate(item.date)
		
		// Deconstruct days into stayYears, stayMonths, stayDays
		const totalDays = item.days || 1
		setStayYears(Math.floor(totalDays / 365))
		setStayMonths(Math.floor((totalDays % 365) / 30))
		setStayDays(totalDays % 30)

		setIsCurrent(!!item.isCurrent)
		setShowOnHome(item.showOnHome !== false)

		// Journey details
		setDepartureCity(item.departure?.city || '')
		setDepartureCoordinates(item.departure?.coordinates || null)
		setStopsInput(item.stops?.map(s => s.city).join(', ') || '')
		setStops(item.stops || [])
		setTransport(item.transport || 'flight')

		setType(item.type)
		setNotes(item.notes)

		// Photos
		const imgs = item.images || []
		setImagesList(imgs)
		setCoverImage(item.coverImage || (imgs[0] || ''))
	}

	// Reset form
	const resetForm = () => {
		setEditingId(null)
		setCity('')
		setCountry('')
		setLatitude(39.9042)
		setLongitude(116.4074)
		setDate(new Date().toISOString().split('T')[0])
		setStayYears(0)
		setStayMonths(0)
		setStayDays(1)
		setIsCurrent(false)
		setShowOnHome(true)
		setDepartureCity('')
		setDepartureCoordinates(null)
		setStopsInput('')
		setStops([])
		setTransport('flight')
		setType('travel')
		setNotes('')
		setImagesList([])
		setCoverImage('')
		setNewImageUrl('')
	}

	// Save or create point
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!city) {
			toast.error('城市名必填')
			return
		}

		// Calculate total days from inputs
		const totalDays = (stayYears * 365) + (stayMonths * 30) + stayDays

		const newFootprint: Footprint = {
			id: editingId || Date.now().toString(),
			city,
			country,
			coordinates: [latitude, longitude],
			date,
			days: totalDays || 1,
			type,
			notes,
			images: imagesList,
			coverImage: coverImage || imagesList[0] || '',
			showOnHome,
			isCurrent
		}

		// Save journey / trajectory route details if present
		if (departureCity && departureCoordinates) {
			newFootprint.departure = {
				city: departureCity,
				coordinates: departureCoordinates
			}
			newFootprint.transport = transport
		}
		if (stops.length > 0) {
			newFootprint.stops = stops
		}

		// Ensure only one footprint remains checked as isCurrent
		const enforceSingleCurrentCity = (list: Footprint[]) => {
			if (isCurrent) {
				return list.map(item => ({
					...item,
					isCurrent: item.id === newFootprint.id ? true : false
				}))
			}
			return list
		}

		let updatedList: Footprint[] = []
		if (editingId) {
			const rawList = footprints.map(item => item.id === editingId ? newFootprint : item)
			updatedList = enforceSingleCurrentCity(rawList)
		} else {
			const rawList = [newFootprint, ...footprints]
			updatedList = enforceSingleCurrentCity(rawList)
		}

		setFootprints(updatedList)
		resetForm()
		await saveToServer(updatedList)
	}

	// Delete point
	const handleDelete = async (id: string, name: string) => {
		if (confirm(`确定要删除“${name}”的足迹点位吗？`)) {
			const updatedList = footprints.filter(item => item.id !== id)
			setFootprints(updatedList)
			await saveToServer(updatedList)
		}
	}

	// Save to JSON via API
	const saveToServer = async (dataList: Footprint[]) => {
		setIsSaving(true)
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: 'footprints', data: dataList })
			})
			const resData = await res.json()
			if (resData.success) {
				toast.success('保存成功！')
			} else {
				throw new Error(resData.error || '保存失败')
			}
		} catch (error: any) {
			console.error('Failed to save footprints:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="mx-auto w-full max-w-7xl px-6 pt-32 pb-16 text-[var(--color-primary)]">
			{/* Back Button */}
			<div className="mb-8">
				<Link
					href="/space"
					className="inline-flex items-center gap-2 text-sm text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
				>
					<ArrowLeft className="w-4 h-4" /> 返回空间页
				</Link>
			</div>

			<div className="flex flex-col lg:flex-row gap-10">
				{/* Left Side: Form and Map Picker */}
				<div className="w-full lg:w-1/2 flex flex-col gap-6">
					<div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
						<h2 className="text-xl font-medium mb-6 font-serif flex items-center gap-2">
							<MapPin className="w-5 h-5 text-[var(--color-accent)]" />
							{editingId ? '编辑空间点位与相册' : '录入新空间点位与相册'}
						</h2>

						<form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block mb-1 text-xs text-[var(--color-secondary)]">城市 *</label>
									<input
										type="text"
										value={city}
										onChange={e => setCity(e.target.value)}
										placeholder="e.g. 东京"
										className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors"
										required
									/>
								</div>
								<div>
									<label className="block mb-1 text-xs text-[var(--color-secondary)]">国家/地区</label>
									<input
										type="text"
										value={country}
										onChange={e => setCountry(e.target.value)}
										placeholder="e.g. 日本"
										className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors"
									/>
								</div>
							</div>

							<div>
								<button
									type="button"
									onClick={handleGeocode}
									disabled={isGeocoding}
									className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
								>
									{isGeocoding ? '正在反查...' : '🔍 联网自动反查经纬度'}
								</button>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block mb-1 text-xs text-[var(--color-secondary)]">纬度 (Latitude)</label>
									<input
										type="number"
										step="any"
										value={latitude}
										onChange={e => setLatitude(Number(e.target.value))}
										className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors"
										required
									/>
								</div>
								<div>
									<label className="block mb-1 text-xs text-[var(--color-secondary)]">经度 (Longitude)</label>
									<input
										type="number"
										step="any"
										value={longitude}
										onChange={e => setLongitude(Number(e.target.value))}
										className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors"
										required
									/>
								</div>
							</div>

							{/* Coordinate Picker Map */}
							<div className="h-48 rounded-xl overflow-hidden border border-[var(--color-border)] relative">
								<div className="absolute top-2 right-2 z-[1000] bg-black/60 text-white text-[10px] px-2 py-1 rounded">
									在地图上点击直接获取点位坐标
								</div>
								<div 
									className="w-full h-full"
									style={{
										filter: resolvedTheme === 'dark' ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none',
										transition: 'filter 0.5s ease-in-out'
									}}
								>
									<MapContainer 
										center={mapCenter} 
										zoom={3} 
										scrollWheelZoom={true} 
										style={{ height: '100%', width: '100%', background: 'var(--color-bg)' }}
										zoomControl={true}
									>
										<TileLayer
											url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
											attribution="&copy; OpenStreetMap contributors &copy; CARTO"
										/>
										<Marker position={mapCenter} />
										<ChangeView center={mapCenter} />
										<MapClickHandler onClick={handleMapClick} />
									</MapContainer>
								</div>
							</div>

							{/* Checkboxes for Current City & Homepage Visibility */}
							<div className="flex items-center gap-6 flex-wrap pt-1">
								<label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-secondary)] font-medium">
									<input
										type="checkbox"
										checked={isCurrent}
										onChange={e => setIsCurrent(e.target.checked)}
										className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-0 accent-[var(--color-accent)] cursor-pointer size-4"
									/>
									设为当前居住城市 (Set as current city)
								</label>

								<label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-secondary)] font-medium">
									<input
										type="checkbox"
										checked={showOnHome}
										onChange={e => setShowOnHome(e.target.checked)}
										className="rounded border-[var(--color-border)] text-orange-500 focus:ring-0 accent-orange-500 cursor-pointer size-4"
									/>
									<span className="text-orange-600 dark:text-orange-400 font-bold">★ 展示在首页游民纪实摄影墙</span>
								</label>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block mb-1 text-xs text-[var(--color-secondary)]">开始日期 / 经历日期</label>
									<input
										type="date"
										value={date}
										onChange={e => setDate(e.target.value)}
										className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors"
										required
									/>
								</div>
								<div>
									<label className="block mb-1 text-xs text-[var(--color-secondary)]">停留时间 / 驻留长度</label>
									<div className="grid grid-cols-3 gap-2">
										<div className="flex items-center gap-1">
											<input
												type="number"
												min="0"
												value={stayYears}
												onChange={e => setStayYears(Math.max(0, Number(e.target.value)))}
												className="w-full px-1.5 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors text-center text-xs"
											/>
											<span className="text-xs text-[var(--color-secondary)] shrink-0">年</span>
										</div>
										<div className="flex items-center gap-1">
											<input
												type="number"
												min="0"
												max="11"
												value={stayMonths}
												onChange={e => setStayMonths(Math.max(0, Math.min(11, Number(e.target.value))))}
												className="w-full px-1.5 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors text-center text-xs"
											/>
											<span className="text-xs text-[var(--color-secondary)] shrink-0">月</span>
										</div>
										<div className="flex items-center gap-1">
											<input
												type="number"
												min="0"
												value={stayDays}
												onChange={e => setStayDays(Math.max(0, Number(e.target.value)))}
												className="w-full px-1.5 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors text-center text-xs"
											/>
											<span className="text-xs text-[var(--color-secondary)] shrink-0">日</span>
										</div>
									</div>
								</div>
							</div>

							<div>
								<label className="block mb-1.5 text-xs text-[var(--color-secondary)]">空间类型</label>
								<div className="flex gap-4 flex-wrap">
									{(['travel', 'live', 'work', 'study'] as const).map(t => (
										<label key={t} className="flex items-center gap-2 cursor-pointer capitalize">
											<input
												type="radio"
												name="type"
												value={t}
												checked={type === t}
												onChange={() => setType(t)}
												className="accent-[var(--color-accent)]"
											/>
											{t === 'travel' ? '✈️ 旅行' : t === 'live' ? '🏠 居住' : t === 'work' ? '💼 工作' : '📖 学习'}
										</label>
									))}
								</div>
							</div>

							{/* Journey / Trajectory route details (available for all types) */}
							<div className="flex flex-col gap-4 border-l-2 border-[var(--color-border)] pl-4 py-1">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block mb-1 text-xs text-[var(--color-secondary)]">出发城市 (可点击定位)</label>
										<div className="flex gap-2">
											<input
												type="text"
												value={departureCity}
												onChange={e => setDepartureCity(e.target.value)}
												placeholder="e.g. 上海"
												className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors text-xs"
											/>
											<button
												type="button"
												onClick={handleGeocodeDeparture}
												disabled={isGeocodingDeparture}
												className="px-2.5 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-colors text-[10px] shrink-0 font-medium cursor-pointer"
											>
												{isGeocodingDeparture ? '...' : '定位'}
											</button>
										</div>
										{departureCoordinates && (
											<span className="text-[10px] text-green-600 dark:text-green-400 mt-1 block">
												✓ 已定位坐标: [{departureCoordinates[0].toFixed(3)}, {departureCoordinates[1].toFixed(3)}]
											</span>
										)}
									</div>
									<div>
										<label className="block mb-1 text-xs text-[var(--color-secondary)]">经停/转机城市 (多个英文逗号隔开)</label>
										<div className="flex gap-2">
											<input
												type="text"
												value={stopsInput}
												onChange={e => setStopsInput(e.target.value)}
												placeholder="e.g. 广州, 曼谷"
												className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors text-xs"
											/>
											<button
												type="button"
												onClick={handleGeocodeStops}
												disabled={isGeocodingStops}
												className="px-2.5 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-colors text-[10px] shrink-0 font-medium cursor-pointer"
											>
												{isGeocodingStops ? '...' : '定位'}
											</button>
										</div>
										{stops.length > 0 && (
											<span className="text-[10px] text-green-600 dark:text-green-400 mt-1 block">
												✓ 已定位经停 {stops.length} 站 ({stops.map(s => s.city).join(' → ')})
											</span>
										)}
									</div>
								</div>
								
								<div className="mt-2">
									<label className="block mb-1.5 text-xs text-[var(--color-secondary)]">出行方式 (交通工具)</label>
									<div className="flex gap-4 flex-wrap">
										{(['flight', 'train', 'car', 'ship', 'other'] as const).map(tr => (
											<label key={tr} className="flex items-center gap-2 cursor-pointer capitalize text-xs">
												<input
													type="radio"
													name="transport"
													value={tr}
													checked={transport === tr}
													onChange={() => setTransport(tr)}
													className="accent-[var(--color-accent)]"
												/>
												{tr === 'flight' ? '✈️ 飞机' : tr === 'train' ? '🚄 高铁/火车' : tr === 'car' ? '🚗 汽车/自驾' : tr === 'ship' ? '🚢 轮船' : '❓ 其他'}
											</label>
										))}
									</div>
								</div>
							</div>

							<div>
								<label className="block mb-1 text-xs text-[var(--color-secondary)]">手记 / 描述</label>
								<textarea
									value={notes}
									onChange={e => setNotes(e.target.value)}
									placeholder="关于此行空间的日志故事或发现..."
									rows={3}
									className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none text-xs"
								/>
							</div>

							{/* Visual Photo Album Manager with Cover Selector */}
							<div className="border border-[var(--color-border)] p-4 rounded-xl bg-[var(--color-bg)]/40 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<label className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
										<ImageIcon className="w-4 h-4 text-orange-500" /> 点位照片相册管理 ({imagesList.length} 张)
									</label>
									<input 
										ref={fileInputRef}
										type="file"
										multiple
										accept="image/*"
										className="hidden"
										onChange={handleFileUpload}
									/>
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="px-2.5 py-1 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors flex items-center gap-1 cursor-pointer"
									>
										<Upload className="w-3.5 h-3.5" /> 本地上传照片
									</button>
								</div>

								{/* Input Row for URL */}
								<div className="flex gap-2">
									<input
										type="text"
										value={newImageUrl}
										onChange={e => setNewImageUrl(e.target.value)}
										placeholder="输入照片 URL 链接 (如 https://...)"
										className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors text-xs"
										onKeyDown={e => {
											if (e.key === 'Enter') {
												e.preventDefault()
												handleAddPhotoUrl()
											}
										}}
									/>
									<button
										type="button"
										onClick={handleAddPhotoUrl}
										className="px-3 py-1.5 bg-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer"
									>
										<Plus className="w-3.5 h-3.5" /> 追加照片
									</button>
								</div>

								{/* Visual Thumbnails Grid */}
								{imagesList.length > 0 ? (
									<div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
										{imagesList.map((url, index) => {
											const isCover = url === coverImage
											return (
												<div 
													key={index} 
													className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all shadow-sm ${
														isCover ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-200 dark:border-zinc-800'
													}`}
												>
													<img 
														src={url} 
														alt={`Photo ${index}`} 
														className="w-full h-full object-cover"
														onError={(e) => {
															(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop'
														}}
													/>
													
													{/* Delete Button */}
													<button
														type="button"
														onClick={() => handleRemovePhoto(url)}
														className="absolute top-1 right-1 p-1 bg-black/60 text-white hover:bg-red-600 rounded-full transition-colors z-10"
														title="移除此图"
													>
														<X className="w-3 h-3" />
													</button>

													{/* Cover Badge or Set Cover Button */}
													<div className="absolute inset-x-0 bottom-0 p-1 bg-black/70 backdrop-blur-xs flex items-center justify-center">
														{isCover ? (
															<span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
																<Star className="w-3 h-3 fill-amber-400" /> 封面大图
															</span>
														) : (
															<button
																type="button"
																onClick={() => handleSetCover(url)}
																className="text-[10px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
															>
																设为封面
															</button>
														)}
													</div>
												</div>
											)
										})}
									</div>
								) : (
									<div className="p-4 border border-dashed border-[var(--color-border)] rounded-lg text-center text-xs text-[var(--color-secondary)]">
										暂未添加照片，请在上方追加 URL 或从本地上传
									</div>
								)}
							</div>

							<div className="flex gap-4 mt-2">
								<button
									type="submit"
									disabled={isSaving}
									className="flex-1 px-4 py-2.5 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 cursor-pointer"
								>
									<Save className="w-4 h-4" />
									{isSaving ? '正在保存...' : '提交保存'}
								</button>
								{editingId && (
									<button
										type="button"
										onClick={resetForm}
										className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
									>
										取消
									</button>
								)}
							</div>
						</form>
					</div>
				</div>

				{/* Right Side: Footprints List */}
				<div className="w-full lg:w-1/2 relative">
					<div className="flex flex-col gap-6 lg:absolute lg:inset-0 h-full">
						<div className="flex items-center justify-between shrink-0">
							<h2 className="text-xl font-medium font-serif">已录入空间点位 ({footprints.length})</h2>
							<div className="relative w-48">
								<input
									type="text"
									placeholder="搜索点位..."
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-accent)] transition-colors"
								/>
								<Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-secondary)]" />
							</div>
						</div>

						<div className="flex flex-col gap-4 flex-1 overflow-y-auto max-h-[600px] lg:max-h-none pr-2 scrollbar-thin min-h-0 pb-4">
							<AnimatePresence mode="popLayout">
							{filteredFootprints.length === 0 ? (
								<div className="p-12 text-center border border-dashed border-[var(--color-border)] rounded-2xl text-[var(--color-secondary)] text-sm">
									没有找到匹配的空间点位
								</div>
							) : (
								filteredFootprints.map(item => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95 }}
										className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex justify-between items-start hover:border-[var(--color-secondary)] transition-colors relative"
									>
										<div className="flex flex-col gap-2 w-[85%]">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="font-semibold text-sm">
													{item.city} {item.country && <span className="text-[var(--color-secondary)] text-xs">({item.country})</span>}
												</span>
												<span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-border)] text-[var(--color-secondary)]">
													{item.type === 'travel' ? '✈️ 旅行' : item.type === 'live' ? '🏠 居住' : item.type === 'work' ? '💼 工作' : '📖 学习'}
												</span>
												{item.isCurrent && (
													<span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold">
														🏠 当前居住地
													</span>
												)}
												{item.showOnHome !== false && (
													<span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-medium">
														★ 展示在首页
													</span>
												)}
											</div>

											{item.departure && (
												<div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 flex-wrap">
													<Navigation className="w-3 h-3" />
													<span>旅程起点: {item.departure.city} {item.stops && item.stops.length > 0 && ` → [经停 ${item.stops.length} 站: ${item.stops.map(s=>s.city).join(', ')}]`} → {item.city}</span>
													<span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] font-medium ml-1">
														{item.transport === 'flight' ? '✈️ 飞机' : item.transport === 'train' ? '🚄 高铁/火车' : item.transport === 'car' ? '🚗 汽车/自驾' : item.transport === 'ship' ? '🚢 轮船' : '❓ 其他'}
													</span>
												</div>
											)}

											<div className="flex items-center gap-4 text-xs text-[var(--color-secondary)]">
												<span className="flex items-center gap-1">
													<Calendar className="w-3 h-3" /> {item.date}
												</span>
												<span className="flex items-center gap-1">
													<Clock className="w-3 h-3" /> {formatDuration(item.days)}
												</span>
												<span className="text-[10px] font-mono">
													[{item.coordinates[0].toFixed(3)}, {item.coordinates[1].toFixed(3)}]
												</span>
											</div>

											{item.notes && (
												<p className="text-xs text-[var(--color-secondary)] line-clamp-2 mt-1">
													{item.notes}
												</p>
											)}

											{item.images && item.images.length > 0 && (
												<div className="flex gap-2 mt-1.5 overflow-x-auto items-center">
													{item.images.map((img, index) => {
														const isCover = img === (item.coverImage || item.images[0])
														return (
															<div key={index} className="relative shrink-0">
																<img
																	src={img}
																	alt={`${item.city} pic`}
																	className={`w-12 h-9 object-cover rounded-lg border ${
																		isCover ? 'border-amber-500 ring-1 ring-amber-500' : 'border-[var(--color-border)]'
																	}`}
																	onError={(e) => {
																		(e.target as HTMLElement).style.display = 'none'
																	}}
																/>
																{isCover && (
																	<span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow">
																		<Star className="w-2.5 h-2.5 fill-white" />
																	</span>
																)}
															</div>
														)
													})}
												</div>
											)}
										</div>

										<div className="flex gap-1 shrink-0">
											<button
												onClick={() => startEdit(item)}
												className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
												title="编辑"
											>
												<Edit3 className="w-4 h-4" />
											</button>
											<button
												onClick={() => handleDelete(item.id, item.city)}
												className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
												title="删除"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</motion.div>
								))
							)}
						</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
