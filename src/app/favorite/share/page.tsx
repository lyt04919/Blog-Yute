'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import GridView from './grid-view'
import CreateDialog from './components/create-dialog'
import { pushShares } from './services/push-shares'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialList from './list.json'
import type { Share } from './components/share-card'
import type { LogoItem } from './components/logo-upload-dialog'
import { StandardPageHeader } from '@/components/ui/standard-page-header'

export default function Page() {
	const [shares, setShares] = useState<Share[]>(initialList as Share[])
	const [originalShares, setOriginalShares] = useState<Share[]>(initialList as Share[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editingShare, setEditingShare] = useState<Share | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleUpdate = (updatedShare: Share, oldShare: Share, logoItem?: LogoItem) => {
		if (updatedShare.isShow && !oldShare.isShow) {
			const showCount = shares.filter(s => s.isShow && s.url !== updatedShare.url).length
			if (showCount >= 4) {
				toast.error('主页最多只能展示 4 个，请先取消其他的展示勾选！')
				return
			}
		}

		const updated = shares.map(s => (s.url === oldShare.url ? updatedShare : s))
		setShares(updated)
		if (logoItem) {
			setLogoItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedShare.url, logoItem)
				return newMap
			})
		}
		autoSave(updated)
	}

	const handleAdd = () => {
		setEditingShare(null)
		setIsCreateDialogOpen(true)
	}

	const handleSaveShare = (updatedShare: Share) => {
		let updated: Share[] = []
		if (editingShare) {
			updated = shares.map(s => (s.url === editingShare.url ? updatedShare : s))
		} else {
			updated = [...shares, updatedShare]
		}
		setShares(updated)
		autoSave(updated)
	}

	const handleDelete = (share: Share) => {
		if (confirm(`确定要删除 ${share.name} 吗？`)) {
			const updated = shares.filter(s => s.url !== share.url)
			setShares(updated)
			autoSave(updated)
		}
	}

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handlePublishCloud()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const autoSave = async (updatedShares: Share[]) => {
		setIsSaving(true)
		try {
			const res = await fetch('/api/save-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'share', data: updatedShares }) })
			const data = await res.json()
			if (!data.success) throw new Error(data.error)

			setOriginalShares(updatedShares)
			setLogoItems(new Map())
			toast.success('已自动保存！')
		} catch (error: any) {
			console.error('Failed to auto-save:', error)
			toast.error(`自动保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handlePublishCloudClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handlePublishCloud()
		}
	}

	const handlePublishCloud = async () => {
		setIsSaving(true)
		try {
			await pushShares({ shares, logoItems })
			setOriginalShares(shares)
			setLogoItems(new Map())
			setIsEditMode(false)
			toast.success('上传同步云端成功！')
		} catch (error: any) {
			console.error('Failed to publish cloud:', error)
			toast.error(`上传同步云端失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isAuth && !isEditMode && (e.ctrlKey || e.metaKey) && e.key === 'e' && e.shiftKey) {
				e.preventDefault()
				setIsEditMode(true)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode, isAuth])

	const sortedShares = [...shares].reverse().sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1
		if (!a.isPinned && b.isPinned) return 1
		return 0
	})

	const headerActions = (
		<div className="flex items-center gap-2">
			{isEditMode ? (
				<>
					<button onClick={() => setIsEditMode(false)} className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'>
						退出编辑
					</button>
					<button onClick={handleAdd} className='px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors'>
						+ 添加
					</button>
					<button onClick={handlePublishCloudClick} disabled={isSaving} className='px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm'>
						{isSaving ? '发布中...' : isAuth ? '发布云端' : '导入密钥'}
					</button>
				</>
			) : (
				!hideEditButton && isAuth && (
					<button onClick={() => setIsEditMode(true)} className='px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>
						编辑模式
					</button>
				)
			)}
		</div>
	)

	return (
		<div className="min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]">
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<StandardPageHeader
				backHref='/favorite'
				backLabel='FAVORITES'
				title='Bookmarks'
				badge={`${shares.length} ITEMS`}
				subtitle='A curated collection of useful websites, resources, and inspiration.'
				actions={headerActions}
			/>

			<GridView shares={sortedShares} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />

			{isCreateDialogOpen && <CreateDialog share={editingShare} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveShare} />}
		</div>
	)
}
