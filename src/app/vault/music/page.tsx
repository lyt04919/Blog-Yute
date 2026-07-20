import { FavoriteItemPageTemplate } from '@/app/favorite/components/favorite-item-page-template'
import initialMusic from '@/app/favorite/music.json'

export default function VaultMusicPage() {
  return (
    <FavoriteItemPageTemplate
      initialItems={initialMusic}
      targetType="music"
      pageTitle="Music & Podcasts 仓库管理"
      pageDescription="在这里管理你的所有音乐与播客记录。可以新增、编辑、删除以及控制哪些项目公开到 Favorites 精选和主页展示。"
      enableAppleMusicImport={true}
      isManagement={true}
      backUrl="/favorite/music"
      backLabel="返回公开页"
    />
  )
}
