import { FavoriteItemPageTemplate } from '../components/favorite-item-page-template'
import initialMusic from '../music.json'

export default function FavoriteMusicPage() {
  return (
    <FavoriteItemPageTemplate
      initialItems={initialMusic}
      targetType="music"
      pageTitle="Music & Podcasts"
      pageDescription="音乐与播客：写代码时的律动背景音乐，以及经常收听的硬核知识谈话类栏目。"
      enableAppleMusicImport={true}
    />
  )
}
