'use client'

import { useParams } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { useLoadBlog } from '../hooks/use-load-blog'
import { WriteEditor } from '../components/editor'
import { WriteSidebar } from '../components/sidebar'
import { WriteActions } from '../components/actions'
import { WritePreview } from '../components/preview'
import { useAuthStore } from '@/hooks/use-auth'
import Link from 'next/link'

export default function EditBlogPage() {
	const { isAuth } = useAuthStore()
	const params = useParams() as { slug?: string }
	const slug = params?.slug || ''

	const { form, cover } = useWriteStore()
	const { isPreview, closePreview } = usePreviewStore()
	const { loading } = useLoadBlog(slug)
	
	const { isZenMode, isSplitMode } = useWriteStore()

	if (!isAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-primary)]">
				<div className="text-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] max-w-md mx-6">
					<h2 className="text-xl font-bold mb-2">未授权访问</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-4">此页面是编辑博客页面，请先在右上角输入密码切换为作者模式。</p>
					<Link href="/blog" className="brand-btn px-4 py-2 rounded-full text-sm inline-block">
						返回博客页
					</Link>
				</div>
			</div>
		)
	}

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	if (loading) {
		return <div className='text-[var(--color-secondary)] flex h-screen items-center justify-center text-sm'>加载中...</div>
	}

	if (!slug) {
		return <div className='flex h-screen items-center justify-center text-sm text-red-500'>无效的博客 ID</div>
	}

	if (isPreview) {
		return <WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} slug={slug} />
	}

	return (
		<div className={`flex h-full flex-col items-center gap-6 px-6 pt-24 pb-12 ${isSplitMode ? 'w-full max-w-none' : ''}`}>
			<div className={`w-full ${isSplitMode ? 'max-w-[1800px]' : 'max-w-[1144px]'}`}>
				<WriteActions />
			</div>
			<div className={`flex w-full justify-center gap-6 ${isSplitMode ? 'max-w-[1800px]' : 'max-w-[1144px]'}`}>
				<WriteEditor />
				{!isZenMode && !isSplitMode && <WriteSidebar />}
				{isSplitMode && (
					<div 
						style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
						className="flex-1 min-w-0 overflow-hidden"
					>
						<WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} slug={slug} isSplit={true} />
					</div>
				)}
			</div>
		</div>
	)
}
