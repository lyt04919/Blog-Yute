import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Favorites'
}

export default function FavoriteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
