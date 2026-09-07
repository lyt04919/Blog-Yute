'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Diary } from '@/types/diary'
import { pushDiaries } from '../services/push-diaries'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useDiaryData() {
	const { isAuth, getAuthToken } = useAuthStore()
	const [diaries, setDiaries] = useState<Diary[]>([])
	const [originalDiaries, setOriginalDiaries] = useState<Diary[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const fetchData = useCallback(async () => {
		try {
			if (!isAuth) {
				setIsLoading(false)
				return
			}
			
			let token = ''
			try {
				token = await getAuthToken()
			} catch (e) {
				console.error('No auth token available, continuing in dev mode:', e)
			}

			const headers: Record<string, string> = {}
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}

			const res = await fetch('/api/private/diary', { headers })
			if (res.ok) {
				const data: Diary[] = await res.json()
				setDiaries(data)
				setOriginalDiaries(data)
			} else {
				throw new Error(`HTTP ${res.status}`)
			}
		} catch (error) {
			console.error('Failed to fetch diaries:', error)
			toast.error('加载日记数据失败')
		} finally {
			setIsLoading(false)
		}
	}, [isAuth, getAuthToken])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const autoSave = async (newDiaries: Diary[]) => {
		setIsSaving(true)
		try {
			await pushDiaries({ diaries: newDiaries })
			setOriginalDiaries(newDiaries)
		} catch (error: any) {
			console.error('Auto save error:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleUpdateDiary = (updatedDiary: Diary, oldDiary: Diary) => {
		const newDiaries = diaries.map(s => (s.id === oldDiary.id ? updatedDiary : s))
		setDiaries(newDiaries)
		autoSave(newDiaries)
	}

	const handleSaveDiary = (diaryToSave: Diary, editingId?: string | null) => {
		const newDiaries = editingId 
			? diaries.map(s => (s.id === editingId ? diaryToSave : s))
			: [diaryToSave, ...diaries]
		setDiaries(newDiaries)
		autoSave(newDiaries)
	}

	const handleDeleteDiary = (diary: Diary) => {
		if (confirm('确定要删除这篇日记吗？此操作无法撤销。')) {
			const newDiaries = diaries.filter(s => s.id !== diary.id)
			setDiaries(newDiaries)
			autoSave(newDiaries)
			toast.success('已删除日记')
		}
	}

	return {
		isAuth,
		isLoading,
		isSaving,
		diaries,
		originalDiaries,
		refetch: fetchData,
		handleUpdateDiary,
		handleSaveDiary,
		handleDeleteDiary
	}
}
