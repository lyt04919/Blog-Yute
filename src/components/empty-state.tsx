'use client'

import { FileText, Search, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type?: 'default' | 'search' | 'blog'
  title?: string
  description?: string
  className?: string
}

export function EmptyState({ 
  type = 'default', 
  title, 
  description,
  className 
}: EmptyStateProps) {
  const config = {
    default: {
      icon: Inbox,
      title: title || '暂无内容',
      description: description || '这里还没有任何内容'
    },
    search: {
      icon: Search,
      title: title || '未找到结果',
      description: description || '尝试使用其他关键词搜索'
    },
    blog: {
      icon: FileText,
      title: title || '暂无文章',
      description: description || '还没有发布任何博客文章'
    }
  }

  const { icon: Icon, title: defaultTitle, description: defaultDescription } = config[type]

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="w-16 h-16 rounded-full bg-[#f4f4f5] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#a1a1aa]" />
      </div>
      <h3 className="text-lg font-semibold text-[#18181b] mb-2">
        {defaultTitle}
      </h3>
      <p className="text-sm text-[#71717a] text-center max-w-sm">
        {defaultDescription}
      </p>
    </div>
  )
}
