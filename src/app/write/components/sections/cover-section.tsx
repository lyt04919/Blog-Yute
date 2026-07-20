'use client'

import { useRef } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useWriteStore } from '../../stores/write-store'
import { RefreshCw, Trash2, ImagePlus } from 'lucide-react'

type CoverSectionProps = {
	delay?: number
}

export function CoverSection({ delay = 0 }: CoverSectionProps) {
	const { images, setCover, cover, addFiles } = useWriteStore()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()

		// 处理从图片列表中拖入的情况
		const md = e.dataTransfer.getData('text/markdown') || e.dataTransfer.getData('text/plain') || ''
		const m = /!\[\]\(([^)]+)\)/.exec(md.trim())
		if (m) {
			const target = m[1]
			let foundItem

			if (target.startsWith('local-image:')) {
				const id = target.replace(/^local-image:/, '')
				foundItem = images.find(it => it.id === id)
			} else {
				foundItem = images.find(it => it.type === 'url' && it.url === target)
			}

			if (foundItem) {
				setCover(foundItem)
				toast.success('已设置封面')

				return
			}
		}

		// 处理直接拖入文件的情况
		const files = e.dataTransfer.files
		if (files && files.length > 0) {
			const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
			if (imageFiles.length === 0) {
				toast.error('请拖入图片文件')
				return
			}

			const resultImages = await addFiles(imageFiles as unknown as FileList)
			if (resultImages && resultImages.length > 0) {
				// 使用第一个图片作为封面
				setCover(resultImages[0])
				toast.success('已设置封面')
			}
			return
		}
	}

	const handleClickUpload = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		const resultImages = await addFiles(files)
		if (resultImages && resultImages.length > 0) {
			// 使用第一个图片作为封面
			setCover(resultImages[0])
			toast.success('已设置封面')
		}

		// 重置 input 以便可以选择相同的文件
		e.target.value = ''
	}

	const handleRandomCover = () => {
		const seed = Math.random().toString(36).slice(2, 10)
		const imageUrl = `https://picsum.photos/seed/${seed}/1200/800`
		setCover({
			id: seed,
			type: 'url',
			url: imageUrl
		})
		toast.success('已随机生成封面')
	}

	return (
		<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }} className='relative'>
			<div className='flex items-center justify-between mb-3 px-1'>
				<h2 className='text-sm font-semibold text-[var(--color-primary)]'>封面</h2>
			</div>
			<input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileChange} />
			<div
				className='group relative flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] transition-all hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-brand)]/5'
				onDragOver={e => {
					e.preventDefault()
				}}
				onDrop={handleCoverDrop}
				onClick={handleClickUpload}>
				{!!coverPreviewUrl ? (
					<>
						<img src={coverPreviewUrl} alt='cover preview' className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105' />
						<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
						
						{/* Hover actions */}
						<div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
							<button
								type='button'
								onClick={(e) => { e.stopPropagation(); handleRandomCover(); }}
								className='p-2 rounded-lg bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors'
								title="随机封面"
							>
								<RefreshCw className="w-4 h-4" />
							</button>
							<button
								type='button'
								onClick={(e) => { e.stopPropagation(); setCover(null); }}
								className='p-2 rounded-lg bg-red-500/80 backdrop-blur-md text-white hover:bg-red-600 transition-colors'
								title="清除"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</>
				) : (
					<div className='flex flex-col items-center gap-2 text-[var(--color-secondary)] opacity-60 group-hover:opacity-100 transition-opacity'>
						<ImagePlus className="w-8 h-8" />
						<span className="text-xs font-medium">点击或拖拽上传</span>
						<button
							type='button'
							onClick={(e) => { e.stopPropagation(); handleRandomCover(); }}
							className='mt-1 text-xs text-[var(--color-brand)] hover:underline'
						>
							或随机生成
						</button>
					</div>
				)}
			</div>
		</motion.div>
	)
}
