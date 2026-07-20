import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { usePublish } from '../hooks/use-publish'
import { saveBlogLocal } from '../services/save-blog-local'
import { useAutoSave } from '../hooks/use-auto-save'
import { ArrowLeft, Minimize2, Columns, Monitor, FileUp, Save, MoreHorizontal } from 'lucide-react'

export function WriteActions() {
	const { loading, mode, form, loadBlogForEdit, originalSlug, updateForm, autoSaveStatus, isZenMode, isSplitMode, toggleZenMode, toggleSplitMode } = useWriteStore()
	const { openPreview } = usePreviewStore()
	const { isAuth, onChoosePrivateKey, onPublish, onDelete } = usePublish()
	const [saving, setSaving] = useState(false)
	
	// Enable auto-save
	useAutoSave()

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isZenMode) {
				toggleZenMode()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isZenMode, toggleZenMode])

	const keyInputRef = useRef<HTMLInputElement>(null)
	const mdInputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	const handleImportOrPublish = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			onPublish()
		}
	}

	const handleSaveLocal = async () => {
		try {
			setSaving(true)
			await saveBlogLocal({
				form: useWriteStore.getState().form,
				cover: useWriteStore.getState().cover,
				images: useWriteStore.getState().images,
				mode: useWriteStore.getState().mode,
				originalSlug: useWriteStore.getState().originalSlug
			})
			toast.success('本地保存成功')
			router.push('/blog')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || '本地保存失败')
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		if (!window.confirm('返回上一页？（未保存的修改会丢失）')) {
			return
		}
		if (mode === 'edit' && originalSlug) {
			router.push(`/blog/${originalSlug}`)
		} else {
			router.push('/blog')
		}
	}

	const buttonText = isAuth ? (mode === 'edit' ? '更新' : '发布') : '导入密钥'

	const handleImportMd = () => {
		mdInputRef.current?.click()
	}

	const handleMdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			const text = await file.text()
			updateForm({ md: text })
			toast.success('已导入 Markdown 文件')
		} catch (error) {
			toast.error('导入失败，请重试')
		} finally {
			if (e.currentTarget) e.currentTarget.value = ''
		}
	}

	if (isZenMode) {
		return (
			<motion.button
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="fixed top-6 right-6 z-50 bg-card rounded-full shadow-lg border px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-colors"
				onClick={toggleZenMode}>
				退出禅模式 (Esc)
			</motion.button>
		)
	}

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await onChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>
			<input ref={mdInputRef} type='file' accept='.md' className='hidden' onChange={handleMdFileChange} />

			<div className='flex items-center justify-between w-full z-40 bg-[var(--color-bg)]/80 backdrop-blur-md pb-4 pt-2 -mt-2 sticky top-0 border-b border-transparent transition-colors'>
				<div className='flex items-center gap-3'>
					<button
						onClick={handleCancel}
						disabled={saving}
						title="返回"
						className='p-2 rounded-xl text-[var(--color-secondary)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-primary)] transition-all'>
						<ArrowLeft className='w-5 h-5' />
					</button>

					{mode === 'edit' && (
						<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className='flex items-center'>
							<span className='px-2.5 py-1 rounded-md bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-xs font-medium'>
								编辑模式
							</span>
						</motion.div>
					)}
				</div>

				<div className='flex items-center gap-3'>
					{/* Mode Toggles */}
					<div className="flex items-center bg-[var(--color-border)]/30 rounded-xl p-1 border border-[var(--color-border)]/50">
						<button
							onClick={toggleZenMode}
							title="禅模式"
							className={`p-1.5 rounded-lg transition-all ${isZenMode ? 'bg-[var(--color-bg)] shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}>
							<Minimize2 className="w-4 h-4" />
						</button>
						<button
							onClick={toggleSplitMode}
							title="分栏预览"
							className={`p-1.5 rounded-lg transition-all ${isSplitMode ? 'bg-[var(--color-bg)] shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}>
							<Columns className="w-4 h-4" />
						</button>
						<button
							onClick={openPreview}
							title="全屏预览"
							className="p-1.5 rounded-lg transition-all text-[var(--color-secondary)] hover:text-[var(--color-primary)]">
							<Monitor className="w-4 h-4" />
						</button>
					</div>

					{/* Secondary Actions (Dropdown) */}
					<div className="relative group">
						<button className="p-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors rounded-xl hover:bg-[var(--color-border)]/50">
							<MoreHorizontal className="w-5 h-5" />
						</button>
						<div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1 z-50">
							<button onClick={handleImportMd} className="px-3 py-2.5 text-sm text-left hover:bg-[var(--color-border)]/50 rounded-lg flex items-center gap-2 text-[var(--color-primary)] transition-colors">
								<FileUp className="w-4 h-4" /> 导入 MD
							</button>
						</div>
					</div>

					{/* Local Save Action */}
					<button
						className='px-6 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 shadow-sm border border-slate-200 dark:border-zinc-700'
						disabled={loading || saving}
						onClick={handleSaveLocal}>
						<Save className="w-4 h-4" />
						{saving ? '保存中...' : '本地保存'}
					</button>

					{/* Primary Action */}
					<button
						className='px-6 py-2 rounded-xl bg-[var(--color-brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md shadow-[var(--color-brand)]/20'
						disabled={loading || saving}
						onClick={handleImportOrPublish}>
						{saving ? '保存中...' : buttonText}
					</button>
				</div>
			</div>
		</>
	)
}
