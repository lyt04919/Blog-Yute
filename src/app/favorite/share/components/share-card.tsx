'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Pin } from 'lucide-react'
import StarRating from '@/components/star-rating'
import ShareEditModal from './share-edit-modal'
import ShareDetailModal from './share-detail-modal'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'

export interface Share {
	name: string
	url: string
	description: string
	logo: string
	tags: string[]
	stars: number
	isShow?: boolean
	isShowOnHome?: boolean
	isPinned?: boolean
}

interface ShareCardProps {
	share: Share
	isEditMode?: boolean
	onUpdate?: (share: Share, oldShare: Share) => void
	onDelete?: () => void
}

export function ShareCard({ share, isEditMode = false, onUpdate, onDelete }: ShareCardProps) {
	const [localShare, setLocalShare] = useState(share)
	const { maxSM } = useSize()
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)

	const handleSave = (updatedShare: Share) => {
		setLocalShare(updatedShare)
		onUpdate?.(updatedShare, share)
		setIsEditing(false)
	}

	return (
		<>
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
			className='card relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg p-6 sm:p-7'
			onClick={() => {
				if (isEditMode) {
					setIsEditing(true)
				} else {
					setIsDetailOpen(true)
				}
			}}
		>
			{isEditMode && (
				<div className='absolute top-4 right-4 z-30 flex gap-1.5 items-center'>
					<button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} className='rounded-md px-2.5 py-1 text-xs font-medium bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors'>
						编辑
					</button>
					<button onClick={(e) => { e.stopPropagation(); onDelete?.() }} className='rounded-md px-2.5 py-1 text-xs font-medium bg-red-600 text-white shadow-sm hover:bg-red-500 transition-colors'>
						删除
					</button>
				</div>
			)}
			
			{!isEditMode && (
				<button 
					onClick={(e) => {
						e.stopPropagation()
						if (onUpdate) onUpdate({ ...localShare, isPinned: !localShare.isPinned }, localShare)
					}}
					className={cn(
						'absolute top-4 right-4 z-30 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100',
						localShare.isPinned ? 'bg-brand/20 text-brand shadow-sm opacity-100' : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white backdrop-blur-md'
					)}
					title={localShare.isPinned ? '取消置顶' : '置顶'}
				>
					<Pin className={cn('w-4 h-4', localShare.isPinned ? 'fill-current' : '')} />
				</button>
			)}

			<div className='flex flex-col flex-1 cursor-pointer'>
				<div className='mb-4 flex items-start gap-4'>
					<div className='group relative shrink-0'>
						<img
							src={localShare.logo}
							alt={localShare.name}
							className='h-16 w-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800'
						/>
					</div>
					<div className={cn('flex-1 min-w-0 pt-0.5', isEditMode && 'pr-24')}>
						<h3 className='group-hover:text-brand text-base sm:text-lg font-bold transition-colors truncate leading-tight'>
							{localShare.name}
						</h3>
						<a
							href={localShare.url}
							target='_blank'
							rel='noopener noreferrer'
							onClick={(e) => e.stopPropagation()}
							className='text-secondary hover:text-brand mt-1 block truncate text-xs hover:underline'>
							{localShare.url}
						</a>
					</div>
				</div>

				<StarRating stars={localShare.stars} />

				<div className='mt-3 flex flex-wrap gap-1.5'>
					{localShare.tags.map(tag => (
						<span key={tag} className='bg-secondary/10 rounded-full px-2.5 py-0.5 text-xs text-secondary'>
							{tag}
						</span>
					))}
				</div>

				<p className='mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 transition-all duration-300 flex-1 line-clamp-3'>
					{localShare.description}
				</p>
			</div>
		</motion.div>
		{isEditing && <ShareEditModal share={localShare} onClose={() => setIsEditing(false)} onSave={handleSave} />}
		{isDetailOpen && !isEditMode && <ShareDetailModal share={localShare} onClose={() => setIsDetailOpen(false)} />}
		</>
	)
}
