'use client'

import { useEffect } from 'react'

interface PageTitleProps {
  title: string
  siteName?: string
}

export function PageTitle({ title, siteName = 'YYsuni' }: PageTitleProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} - ${siteName}` : siteName
    document.title = fullTitle
    
    return () => {
      document.title = siteName
    }
  }, [title, siteName])

  return null
}
