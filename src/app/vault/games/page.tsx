import { FavoriteItemPageTemplate } from '@/app/favorite/components/favorite-item-page-template'
import initialGames from '@/app/favorite/games.json'

export default function VaultGamesPage() {
	return (
		<FavoriteItemPageTemplate
			initialItems={initialGames}
			targetType="games"
			pageTitle="Games 仓库管理"
			pageDescription="在这里管理你的所有游戏记录。可以新增、编辑、删除以及控制哪些项目公开到 Favorites 精选和主页展示。"
			isManagement={true}
			backUrl="/favorite/games"
			backLabel="返回公开页"
		/>
	)
}
