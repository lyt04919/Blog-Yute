'use client'

import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import { DialogModal } from '@/components/dialog-modal'
import { Select } from '@/components/select'

interface StatusModalProps {
	open: boolean
	onClose: () => void
	editableItems: BlogIndexItem[]
	onAssignStatus: (slug: string, status?: string) => void
}

export function StatusModal({
	open,
	onClose,
	editableItems,
	onAssignStatus
}: StatusModalProps) {
	const statusOptions = useMemo(
		() => [
			{ value: 'published', label: 'Published (已发布)' },
			{ value: 'draft', label: 'Draft (草稿)' },
		],
		[]
	)

	return (
		<DialogModal open={open} onClose={onClose} className='card w-[600px] max-w-[90vw] rounded-2xl p-6'>
			<div className='mb-4 flex items-center justify-between'>
				<div className='text-lg font-semibold'>文章状态管理</div>
				<button onClick={onClose} className='text-secondary hover:text-brand text-sm'>
					关闭
				</button>
			</div>
			<div className='space-y-4'>
				<div className='text-sm text-slate-500 dark:text-zinc-400 mb-2'>
					在此统一修改文章的状态。设置为 Draft（草稿）后，访客将无法看到该文章。
				</div>
				<div className='max-h-[500px] space-y-2 overflow-y-auto rounded-xl bg-white dark:bg-[#27272a]/60 p-3'>
					{editableItems.map(item => (
						<div key={item.slug} className='flex flex-col gap-2 rounded-lg border bg-white dark:bg-[#27272a]/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between'>
							<div className='text-sm font-medium'>
								{item.title || item.slug}
								<span className='text-secondary ml-2 text-xs'>{dayjs(item.date).format('YYYY-MM-DD')}</span>
							</div>
							<Select
								value={item.status || 'published'}
								onChange={value => onAssignStatus(item.slug, value)}
								options={statusOptions}
								className='w-full text-sm sm:w-[160px]'
							/>
						</div>
					))}
					{editableItems.length === 0 && <div className='text-secondary text-sm'>暂无文章</div>}
				</div>
			</div>
		</DialogModal>
	)
}
