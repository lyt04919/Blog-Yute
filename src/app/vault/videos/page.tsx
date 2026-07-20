import { FavoriteItemPageTemplate } from '@/app/favorite/components/favorite-item-page-template'
import initialVideos from '@/app/favorite/videos.json'

export default function VaultVideosPage() {
	return (
		<FavoriteItemPageTemplate
			initialItems={initialVideos}
			targetType="videos"
			pageTitle="精选视频 仓库管理"
			pageDescription="在这里管理你的所有推荐视频与纪录片记录。可以新增、编辑、删除以及控制哪些项目公开到 Favorites 精选和主页展示。"
			isManagement={true}
			backUrl="/favorite/videos"
			backLabel="返回公开页"
		/>
	)
}
