'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import GridView from './grid-view'
import dynamic from 'next/dynamic'
const CreateDialog = dynamic(() => import('./components/create-dialog'), { ssr: false })
import { pushShares } from './services/push-shares'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialList from './list.json'
import type { Share } from './components/share-card'
import type { LogoItem } from './components/logo-upload-dialog'
import { StandardPageHeader } from '@/components/ui/standard-page-header'
import { Plus } from 'lucide-react'

export default function Page() {
	const [shares, setShares] = useState<Share[]>(initialList as Share[])
	const [originalShares, setOriginalShares] = useState<Share[]>(initialList as Share[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editingShare, setEditingShare] = useState<Share | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())

	const { isAuth } = useAuthStore()
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
		const updated = shares.filter(s => s.url !== share.url)
		setShares(updated)
		autoSave(updated)
	}

	const handleCancel = () => {
		setShares(originalShares)
		setIsEditMode(false)
	}

	const autoSave = async (updatedShares: Share[]) => {
		setIsSaving(true)
		try {
			const res = await fetch('/api/save-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target: 'share', data: updatedShares })
			})
			const result = await res.json()
			if (!res.ok) throw new Error(result.error || 'Failed to auto save')
			setOriginalShares(updatedShares)
			toast.success('本地自动保存成功！')
		} catch (error: any) {
			console.error('Failed to auto-save:', error)
			toast.error(`自动保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handlePublishCloudClick = () => {
		if (!isAuth) {
			toast.error('未授权，请先在顶部导航栏登录作者账户')
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

	const sortedShares = [...shares]

	const headerActions = (
		<div className="flex items-center gap-2">
			{isEditMode ? (
				<>
					<button
						onClick={handleCancel}
						disabled={isSaving}
						className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
					>
						取消
					</button>
					<button
						onClick={handleAdd}
						className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-primary)] flex items-center gap-1.5"
					>
						<Plus className="w-4 h-4" />
						添加
					</button>
					<button
						onClick={handlePublishCloudClick}
						disabled={isSaving}
						className="brand-btn px-5 py-2 text-sm"
					>
						{isSaving ? '同步中...' : '同步云端'}
					</button>
				</>
			) : (
				!hideEditButton && isAuth && (
					<button
						onClick={() => setIsEditMode(true)}
						className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-primary)] backdrop-blur-sm"
					>
						编辑
					</button>
				)
			)}
		</div>
	)

	return (
		<div className="min-h-screen relative pb-20 bg-[var(--color-bg)] text-[var(--color-primary)]">

			<StandardPageHeader
				backHref='/favorite'
				backLabel='FAVORITES'
				title='Bookmarks'
				badge={`${shares.length} ITEMS`}
				subtitle='A curated collection of useful websites, resources, and inspiration.'
				actions={headerActions}
			/>

			<GridView shares={sortedShares} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={handleDelete} />

			{isAuth && isCreateDialogOpen && <CreateDialog share={editingShare} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveShare} />}
		</div>
	)
}
