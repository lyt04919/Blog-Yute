import { CoverSection } from './sections/cover-section'
import { MetaSection } from './sections/meta-section'
import { ImagesSection } from './sections/images-section'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import { usePublish } from '../hooks/use-publish'
import { useWriteStore } from '../stores/write-store'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

export function WriteSidebar() {
	const { isAuth, onDelete } = usePublish()
	const { mode, loading, form, isSplitMode } = useWriteStore()
	const router = useRouter()

	const handleDelete = async () => {
		const confirmMsg = form?.title ? `确定删除《${form.title}》吗？该操作不可恢复。` : '确定删除当前文章吗？该操作不可恢复。'
		if (window.confirm(confirmMsg)) {
			// If not authed, it will do local-only delete
			const success = await onDelete(!isAuth)
			if (success) {
				router.push('/blog')
			}
		}
	}

	return (
		<div
			style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
			className={`flex flex-col shrink-0 overflow-y-auto scrollbar-none p-5 bg-[var(--color-bg)] rounded-3xl border border-[var(--color-border)] shadow-sm ${
				isSplitMode ? 'w-[260px] space-y-6' : 'w-[320px] space-y-6'
			}`}>
			<CoverSection delay={INIT_DELAY + ANIMATION_DELAY * 0} />
			<MetaSection delay={INIT_DELAY + ANIMATION_DELAY * 1} />
			<ImagesSection delay={INIT_DELAY + ANIMATION_DELAY * 2} />
			
			<div className="flex-1" />
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
	)
}
