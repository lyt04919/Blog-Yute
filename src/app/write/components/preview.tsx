import { useEffect } from 'react'
import { motion } from 'motion/react'
import { BlogPreview } from '@/components/blog-preview'
import { useWriteData } from '../hooks/use-write-data'
import type { PublishForm } from '../types'
import { CoverSection } from './sections/cover-section'
import { MetaSection } from './sections/meta-section'
import { ImagesSection } from './sections/images-section'
import { usePublish } from '../hooks/use-publish'
import { useWriteStore } from '../stores/write-store'
import { useRouter } from 'next/navigation'

type WritePreviewProps = {
	form: PublishForm
	coverPreviewUrl: string | null
	onClose: () => void
	slug?: string
	isSplit?: boolean
}

export function WritePreview({ form, coverPreviewUrl, onClose, slug, isSplit }: WritePreviewProps) {
	const previewData = useWriteData()
	const { isAuth, onDelete, loading } = usePublish()
	const { mode } = useWriteStore()
	const router = useRouter()

	const handleDelete = async () => {
		const confirmMsg = form?.title ? `确定删除《${form.title}》吗？该操作不可恢复。` : '确定删除当前文章吗？该操作不可恢复。'
		if (window.confirm(confirmMsg)) {
			const success = await onDelete(!isAuth)
			if (success) {
				router.push('/blog')
			}
		}
	}

	useEffect(() => {
		if (isSplit) return
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isSplit, onClose])

	return (
		<div className={isSplit ? 'h-full w-full overflow-y-auto p-8' : ''}>
			<div onClick={e => e.stopPropagation()}>
				<BlogPreview
					markdown={previewData.markdown}
					title={previewData.title}
					tags={form.tags}
					date={previewData.date}
					summary={form.summary}
					cover={coverPreviewUrl || undefined}
					slug={slug}
					hideSidebar={isSplit}
				/>
			</div>
			{isSplit && (
				<div className="mt-12 space-y-6 pb-20 max-w-[800px] mx-auto w-full">
					<div className="h-[1px] bg-[#e4e4e7] dark:bg-[#27272a] my-8" />
					<h3 className="text-sm font-semibold text-[#71717a] dark:text-[#a1a1aa] px-1">文章配置与附件</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<CoverSection />
						<MetaSection />
					</div>
					<ImagesSection />
					{mode === 'edit' && (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
							<button
								className='w-full rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50'
								disabled={loading}
								onClick={handleDelete}>
								删除此文章
							</button>
						</motion.div>
					)}
				</div>
			)}
			{!isSplit && (
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					
					className='absolute right-6 rounded-xl border bg-white dark:bg-[#27272a]/60 px-6 py-2 text-sm z-40' style={{ top: '6rem' }}
					onClick={onClose}>
					关闭预览
				</motion.button>
			)}
		</div>
	)
}
