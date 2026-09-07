'use client'

import { useState, useMemo } from 'react'
import type { Diary, FilterState } from '@/types/diary'
import dayjs from 'dayjs'

export const INITIAL_FILTERS: FilterState = {
	year: null,
	month: null,
	date: null,
	tags: [],
	locations: [],
	moods: [],
	weathers: [],
	mediaType: 'all'
}

export function useDiaryFilters(diaries: Diary[]) {
	const [searchQuery, setSearchQuery] = useState('')
	const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
	const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)

	const filteredDiaries = useMemo(() => {
		const result = diaries.filter(d => {
			const q = searchQuery.toLowerCase().trim()
			const matchesSearch = !q || 
				(d.content && d.content.toLowerCase().includes(q)) || 
				(d.tags && d.tags.some(t => t.toLowerCase().includes(q))) || 
				(d.location && d.location.toLowerCase().includes(q)) ||
				(d.mood && d.mood.toLowerCase().includes(q)) ||
				(d.weather && d.weather.toLowerCase().includes(q))
			
			if (!matchesSearch) return false

			const dateObj = dayjs(d.date)
			const dateStr = dateObj.format('YYYY-MM-DD')

			// Exact date filter (e.g. from Heatmap click)
			if (filters.date && dateStr !== filters.date) {
				return false
			}

			// Year and Month
			if (filters.year) {
				if (dateObj.format('YYYY') !== filters.year) return false
				if (filters.month && dateObj.format('MM') !== filters.month) return false
			}

			// Array filters
			if (filters.tags.length > 0 && (!d.tags || !filters.tags.some(t => d.tags!.includes(t)))) return false
			if (filters.locations.length > 0 && (!d.location || !filters.locations.includes(d.location))) return false
			if (filters.moods.length > 0 && (!d.mood || !filters.moods.includes(d.mood))) return false
			if (filters.weathers.length > 0 && (!d.weather || !filters.weathers.includes(d.weather))) return false

			// Media Type
			if (filters.mediaType !== 'all') {
				const hasMedia = (d.media && d.media.length > 0) || !!d.image
				if (filters.mediaType === 'media-only' && !hasMedia) return false
				if (filters.mediaType === 'text-only' && hasMedia) return false
			}
			
			return true
		})

		// Sort by date with ID fallback
		return result.sort((a, b) => {
			const dateA = dayjs(a.date).valueOf()
			const dateB = dayjs(b.date).valueOf()
			if (dateA === dateB) {
				return sortOrder === 'desc' 
					? (parseInt(b.id) || 0) - (parseInt(a.id) || 0)
					: (parseInt(a.id) || 0) - (parseInt(b.id) || 0)
			}
			return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
		})
	}, [diaries, searchQuery, filters, sortOrder])

	const activeFilterCount = useMemo(() => {
		return (filters.year ? 1 : 0) + 
			(filters.month ? 1 : 0) + 
			(filters.date ? 1 : 0) +
			filters.tags.length + 
			filters.locations.length + 
			filters.moods.length + 
			filters.weathers.length + 
			(filters.mediaType !== 'all' ? 1 : 0)
	}, [filters])

	const resetFilters = () => {
		setFilters(INITIAL_FILTERS)
		setSearchQuery('')
	}

	const setSingleDateFilter = (dateStr: string) => {
		setFilters(prev => ({
			...prev,
			date: prev.date === dateStr ? null : dateStr
		}))
	}

	return {
		searchQuery,
		setSearchQuery,
		sortOrder,
		setSortOrder,
		filters,
		setFilters,
		filteredDiaries,
		activeFilterCount,
		resetFilters,
		setSingleDateFilter
	}
}
