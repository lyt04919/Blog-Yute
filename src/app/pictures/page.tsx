'use client'

export interface Picture {
	id: string
	uploadedAt: string
	description?: string
	image?: string
	images?: string[]
}

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useTheme } from '@/hooks/use-theme'
import type { ImageItem } from '../projects/components/image-upload-dialog'
import initialFootprints from '@/data/footprints.json'

const LocationAlbumGrid = dynamic(
	() => import('./components/location-album-grid').then(mod => mod.LocationAlbumGrid),
	{ ssr: false }
)
const PicturesTimeline = dynamic(
	() => import('./components/pictures-timeline').then(mod => mod.PicturesTimeline),
	{ ssr: false }
)
const DomeGallery = dynamic(
	() => import('./components/dome-gallery').then(mod => mod.DomeGallery),
	{ ssr: false }
)
const UploadDialog = dynamic(() => import('./components/upload-dialog'), { ssr: false })

export default function Page() {
	const [isEditMode, setIsEditMode] = useState(false)
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
	const [viewMode, setViewMode] = useState<'albums' | 'timeline' | 'dome'>('albums')

	const { isAuth } = useAuthStore()
	const { siteContent } = useConfigStore()
	const { resolvedTheme } = useTheme()
	const hideEditButton = siteContent.hideEditButton ?? false

	// Gather all photos dynamically from footprints for the 3D Dome Gallery
	const domeImages = useMemo(() => {
		const list: { src: string; alt: string }[] = []
		initialFootprints
			.filter((fp: any) => fp.coverImage || (fp.images && fp.images.length > 0))
			.forEach((fp: any) => {
				const photos = fp.images && fp.images.length > 0 ? fp.images : [fp.coverImage]
				photos.forEach((img: string) => {
					if (img) {
						list.push({ src: img, alt: `${fp.city} - ${fp.notes || ''}` })
					}
				})
			})
		return list
	}, [])

	const handleUploadSubmit = ({ images, description }: { images: ImageItem[]; description: string }) => {
		// Image upload handler for adding new photos to footprint albums
		setIsUploadDialogOpen(false)
	}

	return (
		<div className="relative min-h-screen bg-[var(--color-bg)]">
			{/* Floating Back to Space Map Button */}
			<Link
				href="/space"
				className="absolute left-6 top-6 z-50 px-4 py-2 rounded-full border border-white/20 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl text-xs font-semibold text-[var(--color-primary)] hover:bg-white/95 dark:hover:bg-zinc-850 hover:-translate-x-0.5 transition-all inline-flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
			>
				<ArrowLeft className="w-3.5 h-3.5" /> 返回空间地图
			</Link>

			{/* View Toggle Bar */}
			<div className="w-full flex justify-center pt-24 pb-2 z-30 relative">
				<div className="flex items-center gap-1 bg-white/75 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full border border-white/20 dark:border-zinc-800/80 p-1 shadow-lg select-none">
					<button
						onClick={() => setViewMode('albums')}
						className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
							viewMode === 'albums'
								? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-md font-extrabold'
								: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-transparent'
						}`}
					>
						🗂️ 城市相册
					</button>
					<button
						onClick={() => setViewMode('timeline')}
						className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
							viewMode === 'timeline'
								? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-md font-extrabold'
								: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-transparent'
						}`}
					>
						📅 时间足迹
					</button>
					<button
						onClick={() => setViewMode('dome')}
						className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 ${
							viewMode === 'dome'
								? 'bg-[var(--color-primary)] text-[var(--color-bg)] shadow-md font-extrabold'
								: 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-transparent'
						}`}
					>
						🔮 3D 穹顶
					</button>
				</div>
			</div>

			{/* Conditionally Render View */}
			{viewMode === 'albums' ? (
				<LocationAlbumGrid isEditMode={isEditMode} />
			) : viewMode === 'timeline' ? (
				<PicturesTimeline />
			) : (
				<div className="w-full h-[70vh] md:h-[80vh] px-6 max-w-7xl mx-auto relative z-10 select-none pb-12">
					<div className="w-full h-full rounded-[40px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 backdrop-blur-sm shadow-inner relative">
						<DomeGallery
							images={domeImages}
							grayscale={false}
							overlayBlurColor={resolvedTheme === 'dark' ? '#09090b' : '#fafafa'}
							openedImageWidth="380px"
							openedImageHeight="500px"
						/>
					</div>
				</div>
			)}

			{/* Edit & Upload Toolbar */}
			<motion.div 
				initial={{ opacity: 0, scale: 0.9 }} 
				animate={{ opacity: 1, scale: 1 }} 
				className="fixed bottom-8 right-8 flex gap-3 z-40"
			>
				{isEditMode ? (
					<div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl">
						<button
							onClick={() => setIsUploadDialogOpen(true)}
							className="brand-btn px-5 py-2 text-xs rounded-xl"
						>
							上传点位照片
						</button>
						<button
							onClick={() => setIsEditMode(false)}
							className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
						>
							完成
						</button>
					</div>
				) : (
					isAuth && !hideEditButton && viewMode === 'albums' && (
						<button
							onClick={() => setIsEditMode(true)}
							className="px-5 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-xs font-medium border border-slate-200/80 dark:border-zinc-800 rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
						>
							<span>⚙️ 管理相册</span>
						</button>
					)
				)}
			</motion.div>

			{isUploadDialogOpen && <UploadDialog onClose={() => setIsUploadDialogOpen(false)} onSubmit={handleUploadSubmit} />}
		</div>
	)
}
