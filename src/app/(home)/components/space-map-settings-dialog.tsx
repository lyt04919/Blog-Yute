'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { pushSiteContent } from '@/app/(home)/services/push-site-content'
import { Loader2, RotateCcw, Plus, Trash2 } from 'lucide-react'

// Dynamically load the map client to avoid SSR issues
const SpaceMapSettingsClient = dynamic(
	() => import('./space-map-settings-client'),
	{
		ssr: false,
		loading: () => (
			<div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
				<div className="flex flex-col items-center gap-2 text-zinc-400">
					<Loader2 className="w-6 h-6 animate-spin" />
					<span className="text-sm">加载克隆沙盘中...</span>
				</div>
			</div>
		)
	}
)

interface SpaceMapSettingsDialogProps {
	open: boolean
	onClose: () => void
}

export default function SpaceMapSettingsDialog({ open, onClose }: SpaceMapSettingsDialogProps) {
	const { siteContent, setSiteContent, cardStyles } = useConfigStore()
	const [isSaving, setIsSaving] = useState(false)
	const wrapperRef = useRef<HTMLDivElement>(null)

	// Local state for the map position
	const [lat, setLat] = useState(siteContent.bentoConfig?.mapCenterLat ?? 20)
	const [lng, setLng] = useState(siteContent.bentoConfig?.mapCenterLng ?? 0)
	const [zoom, setZoom] = useState(siteContent.bentoConfig?.mapZoom ?? 2)

	// Physical dimension cloning state
	const [physicalDims, setPhysicalDims] = useState<{ width: number, height: number } | null>(null)
	const [scale, setScale] = useState(1)

	// Wishlist state
	const [wishlist, setWishlist] = useState<{name: string, status: string}[]>(siteContent.bentoConfig?.wishlist || [])

	// Sync local state when dialog opens and clone physical dimensions
	useEffect(() => {
		if (open) {
			setLat(siteContent.bentoConfig?.mapCenterLat ?? 20)
			setLng(siteContent.bentoConfig?.mapCenterLng ?? 0)
			setZoom(siteContent.bentoConfig?.mapZoom ?? 2)
			setWishlist(siteContent.bentoConfig?.wishlist || [])

			// Clone the exact physical dimensions from the homepage container
			const homeEl = document.getElementById('home-bento-map-container')
			if (homeEl) {
				const rect = homeEl.getBoundingClientRect()
				if (rect.width > 0 && rect.height > 0) {
					setPhysicalDims({ width: rect.width, height: rect.height })
				}
			}
		}
	}, [open, siteContent])

	// Calculate scale to fit the cloned physical dimensions into the dialog
	useEffect(() => {
		if (!open || !physicalDims || !wrapperRef.current) return

		const updateScale = () => {
			if (wrapperRef.current && physicalDims) {
				const availableWidth = wrapperRef.current.clientWidth
				if (availableWidth > 0) {
					// Always scale to fit the full available width of the dialog perfectly
					setScale(availableWidth / physicalDims.width)
				}
			}
		}

		updateScale()
		
		const resizeObserver = new ResizeObserver(() => {
			updateScale()
		})
		
		resizeObserver.observe(wrapperRef.current)
		window.addEventListener('resize', updateScale)
		
		return () => {
			resizeObserver.disconnect()
			window.removeEventListener('resize', updateScale)
		}
	}, [open, physicalDims])

	const handleMapChange = (newLat: number, newLng: number, newZoom: number) => {
		setLat(newLat)
		setLng(newLng)
		setZoom(newZoom)
	}

	const handleResetDefault = () => {
		setLat(20)
		setLng(0)
		setZoom(2)
		toast.success('已恢复为默认舒展全景视野')
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const updatedContent = { ...siteContent }
			if (!updatedContent.bentoConfig) {
				updatedContent.bentoConfig = {
					mapZoom: zoom,
					mapCenterLat: lat,
					mapCenterLng: lng
				} as any
			} else {
				updatedContent.bentoConfig = {
					...updatedContent.bentoConfig,
					mapCenterLat: lat,
					mapCenterLng: lng,
					mapZoom: zoom,
					wishlist: wishlist
				}
			}

			await pushSiteContent(updatedContent, cardStyles)
			setSiteContent(updatedContent)
			toast.success('已保存 Space 模块地图配置')
			onClose()
		} catch (error: any) {
			console.error('Save error:', error)
			toast.error(`保存出错: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<DialogModal
			open={open}
			onClose={onClose}
			className="card overflow-y-auto p-6 flex flex-col gap-4"
			style={{ width: '100%', maxWidth: '850px', maxHeight: '92vh' }}
		>
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-serif font-medium text-[var(--color-primary)]">
					Space 模块地图沙盘
				</h2>
				<button 
					onClick={handleResetDefault}
					className="flex items-center gap-1 text-xs text-orange-500 hover:underline cursor-pointer font-medium"
				>
					<RotateCcw className="w-3.5 h-3.5" /> 重置为默认视野
				</button>
			</div>

			<div className="flex flex-col space-y-4">
				<p className="text-sm text-[var(--color-secondary)]">
					{physicalDims ? 
						<span className="text-emerald-500 font-medium">已开启物理级 1:1 克隆。</span> : ''
					}
					请在下方沙盘中自由拖拽平移和缩放。十字准星所指区域及边界，将**完全等比例**呈现在首页。
				</p>
				
				{/* The Wrapper that determines available space */}
				<div 
					ref={wrapperRef} 
					className="w-full relative flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 shadow-inner border border-slate-200/80 dark:border-zinc-800/80"
					style={{ 
						// Give it a height that fits the scaled map
						height: physicalDims ? `${physicalDims.height * scale}px` : '450px' 
					}}
				>
					{/* The actual physical map cloned from home */}
					<div 
						className="relative flex-shrink-0 max-w-none"
						style={{
							width: physicalDims ? `${physicalDims.width}px` : '100%',
							height: physicalDims ? `${physicalDims.height}px` : '450px',
							transform: `scale(${scale})`,
							transformOrigin: 'center center'
						}}
					>
						{open && (
							<SpaceMapSettingsClient
								initialLat={lat}
								initialLng={lng}
								zoom={zoom}
								onChange={handleMapChange}
							/>
						)}
					</div>
				</div>

				{/* Wishlist Editor */}
				<div className="mt-6 border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg)]/30">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-bold text-[var(--color-primary)]">游民探索愿望清单 (Wishlist)</h3>
						<button 
							onClick={() => setWishlist([...wishlist, { name: '', status: 'WISHLIST' }])}
							className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
						>
							<Plus className="w-3 h-3" /> 添加地点
						</button>
					</div>
					<div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
						{wishlist.length === 0 ? (
							<div className="text-xs text-[var(--color-secondary)] text-center py-4 italic border border-dashed border-[var(--color-border)] rounded-lg">
								暂无愿望清单，点击右上角添加。
							</div>
						) : (
							wishlist.map((item, idx) => (
								<div key={idx} className="flex items-center gap-2 bg-[var(--color-card)] p-2 rounded-lg border border-[var(--color-border)]">
									<input 
										type="text" 
										value={item.name}
										onChange={(e) => {
											const newList = [...wishlist]
											newList[idx].name = e.target.value
											setWishlist(newList)
										}}
										placeholder="例如：大理 (Dali)"
										className="flex-1 bg-transparent border-none text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded px-1 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)]/50"
									/>
									<select
										value={item.status}
										onChange={(e) => {
											const newList = [...wishlist]
											newList[idx].status = e.target.value
											setWishlist(newList)
										}}
										className="bg-transparent border border-[var(--color-border)] text-[10px] rounded px-1 py-0.5 focus:outline-none text-[var(--color-secondary)]"
									>
										<option value="NEXT">NEXT</option>
										<option value="WISHLIST">WISHLIST</option>
									</select>
									<button 
										onClick={() => {
											const newList = [...wishlist]
											newList.splice(idx, 1)
											setWishlist(newList)
										}}
										className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
									>
										<Trash2 className="w-3 h-3" />
									</button>
								</div>
							))
						)}
					</div>
				</div>

				<div className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)] mt-4">
					<div className="flex items-center text-xs text-[var(--color-secondary)] font-mono flex-wrap gap-2">
						<span>纬度: {lat.toFixed(4)}</span>
						<span className="text-zinc-300 dark:text-zinc-700">|</span>
						<span>经度: {lng.toFixed(4)}</span>
						<span className="text-zinc-300 dark:text-zinc-700">|</span>
						<div className="flex items-center gap-2">
							<span>缩放:</span>
							<input 
								type="number" 
								step="0.1" 
								min="1" 
								max="5"
								value={zoom}
								onChange={(e) => {
									const val = parseFloat(e.target.value)
									if (!isNaN(val)) setZoom(val)
								}}
								className="w-16 px-2 py-1 bg-transparent border border-[var(--color-border)] rounded text-xs focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
					</div>
					
					<div className="flex gap-2">
						<button
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
							disabled={isSaving}
						>
							取消
						</button>
						<button
							onClick={handleSave}
							disabled={isSaving}
							className="flex items-center gap-2 brand-btn px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
							保存当前视图
						</button>
					</div>
				</div>
			</div>
		</DialogModal>
	)
}
