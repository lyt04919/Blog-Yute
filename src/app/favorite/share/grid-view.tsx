'use client'

import { useState } from 'react'
import { type LogoItem } from './components/logo-upload-dialog'
import { ShareCard, type Share } from './components/share-card'
import { StandardToolbar } from '@/components/ui/standard-toolbar'

interface GridViewProps {
	shares: Share[]
	isEditMode?: boolean
	onUpdate?: (share: Share, oldShare: Share, logoItem?: LogoItem) => void
	onDelete?: (share: Share) => void
}

export default function GridView({ shares, isEditMode = false, onUpdate, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')

	const allTags = ['all', ...Array.from(new Set(shares.flatMap(share => share.tags)))]

	const filteredShares = shares.filter(share => {
		const matchesSearch = share.name.toLowerCase().includes(searchTerm.toLowerCase()) || share.description.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesTag = selectedTag === 'all' || share.tags.includes(selectedTag)
		return matchesSearch && matchesTag
	})

	return (
		<div className='mx-auto w-full max-w-7xl px-6 pb-12'>
			<StandardToolbar
				tags={allTags}
				selectedTag={selectedTag}
				onSelectTag={setSelectedTag}
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				searchPlaceholder="搜索书签..."
			/>

			<div className='grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3'>
				{filteredShares.map(share => (
					<ShareCard key={share.url} share={share} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={() => onDelete?.(share)} />
				))}
			</div>

			{filteredShares.length === 0 && (
				<div className='flex flex-col items-center justify-center py-24 text-slate-400'>
					<p className='text-base font-medium text-slate-700 dark:text-slate-200'>暂无匹配书签</p>
				</div>
			)}
		</div>
	)
}
