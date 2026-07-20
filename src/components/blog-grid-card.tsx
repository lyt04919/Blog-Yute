import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface BlogGridCardProps {
  slug: string
  title: string
  description?: string
  date: string
  cover?: string
  showRightBorder?: boolean
  editMode?: boolean
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  status?: 'draft' | 'published'
}

export function BlogGridCard({
  slug,
  title,
  description,
  date,
  cover,
  showRightBorder = true,
  editMode,
  isSelected,
  onClick,
  status
}: BlogGridCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      onClick={(e) => {
        if (editMode) {
          e.preventDefault()
          onClick?.(e)
        }
      }}
      className={cn(
        "group block relative bg-white dark:bg-[#18181b] rounded-2xl border transition-shadow overflow-hidden",
        editMode 
          ? (isSelected ? "border-[#18181b] dark:border-[#e4e4e7] shadow-md ring-1 ring-[#18181b] dark:ring-[#e4e4e7]" : "border-[#e4e4e7] dark:border-[#3f3f46] hover:border-[#a1a1aa] dark:hover:border-[#52525b]")
          : "border-[#f4f4f5] dark:border-[#27272a] shadow-sm hover:shadow-md"
      )}
    >
      {editMode && (
        <div className="absolute top-4 right-4 z-20">
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border bg-white dark:bg-[#27272a] shadow-sm transition-colors',
              isSelected ? 'border-[#18181b] dark:border-[#e4e4e7] bg-[#18181b] dark:bg-[#e4e4e7] text-white dark:text-[#18181b]' : 'border-[#D9D9D9] dark:border-[#52525b] text-transparent'
            )}>
            <Check className="w-4 h-4" />
          </span>
        </div>
      )}
      <div className="flex flex-col h-full">
        {cover && (
          <div className="relative w-full h-48 overflow-hidden bg-[#f4f4f5] dark:bg-[#27272a]">
            <img
              src={cover}
              alt={title || slug}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <div className="p-6 flex flex-col gap-3 flex-grow">
          <h3 className="text-xl font-bold text-[#18181b] dark:text-[#e4e4e7] group-hover:text-[#52525b] dark:group-hover:text-[#a1a1aa] transition-colors line-clamp-2">
            {title || slug}
          </h3>
          {description && (
            <p className="text-[#71717a] dark:text-[#8a8f98] text-sm line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}
          <div className="mt-auto pt-4 flex items-center justify-between">
            <time className="block text-xs font-semibold uppercase tracking-widest text-[#a1a1aa] dark:text-[#71717a]">
              {date}
            </time>
            {status === 'draft' && (
              <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded font-bold tracking-wide">
                草稿
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
