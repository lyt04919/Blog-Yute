'use client'

import { useWriteStore } from './stores/write-store'
import { usePreviewStore } from './stores/preview-store'
import { WriteEditor } from './components/editor'
import { WriteSidebar } from './components/sidebar'
import { WriteActions } from './components/actions'
import { WritePreview } from './components/preview'
import { useEffect } from 'react'
import { useAuthStore } from '@/hooks/use-auth'
import Link from 'next/link'

export default function WritePage() {
	const { isAuth } = useAuthStore()
	const { form, cover, reset, isZenMode, isSplitMode } = useWriteStore()
	useEffect(() => reset(), [])
	const { isPreview, closePreview } = usePreviewStore()

	if (!isAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-primary)]">
				<div className="text-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] max-w-md mx-6">
					<h2 className="text-xl font-bold mb-2">未授权访问</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-4">此页面是写博客页面，请先在右上角输入密码切换为作者模式。</p>
					<Link href="/blog" className="brand-btn px-4 py-2 rounded-full text-sm inline-block">
						返回博客页
					</Link>
				</div>
			</div>
		)
	}

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	if (isPreview) {
		return <WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} />
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
						<WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} isSplit={true} />
					</div>
				)}
			</div>
		</div>
	)
}
