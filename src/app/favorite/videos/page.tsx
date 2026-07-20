'use client'

import { FavoriteItemPageTemplate } from '../components/favorite-item-page-template'
import initialVideos from '../videos.json'

export default function FavoriteVideosPage() {
	return (
		<FavoriteItemPageTemplate
			initialItems={initialVideos}
			targetType="videos"
			pageTitle="Videos"
			pageDescription="A collection of inspiring tech talks, product concepts, and visual art videos."
		/>
	)
}
