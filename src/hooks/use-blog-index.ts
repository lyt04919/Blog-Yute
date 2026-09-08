import useSWR from 'swr'
import { useMemo } from 'react'
import { useAuthStore } from '@/hooks/use-auth'
import type { BlogIndexItem } from '@/app/blog/types'

export type { BlogIndexItem } from '@/app/blog/types'

// 改进 fetcher，抛出状态码以便处理 404
const fetcher = async (url: string) => {
	const res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) {
		const error: any = new Error('Fetch failed')
		error.status = res.status
		throw error
	}
	const data = await res.json()
	return Array.isArray(data) ? data : []
}

export function useBlogIndex() {
	const { isAuth } = useAuthStore()
	const swrKey = isAuth ? '/api/blogs?role=admin' : '/api/blogs'
	const { data, error, isLoading, mutate } = useSWR<BlogIndexItem[]>(swrKey, fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	const result = data || []
	
	const filteredResult = useMemo(() => {
		if (!isAuth) {
			return result.filter(item => !item.hidden && item.status !== 'draft')
		}
		return result
	}, [result, isAuth])

	return {
		items: filteredResult,
		loading: isLoading,
		error,
		mutate
	}
}

export function useLatestBlog() {
	const { items, loading, error } = useBlogIndex()

	const latestBlog = items.length > 0 ? items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null

	return {
		blog: latestBlog,
		loading,
		error
	}
}
