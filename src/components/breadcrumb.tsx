'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 text-sm text-[#71717a]', className)}>
      <Link 
        href="/" 
        className="flex items-center gap-1 hover:text-[#18181b] transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">首页</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-[#d4d4d8]" />
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-[#18181b] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#18181b] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
