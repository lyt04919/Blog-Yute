'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

interface TagFilterProps {
  tags: string[]
  selectedTag: string
  tagCounts?: Record<string, number>
  onSelectTag: (tag: string) => void
}

export function TagFilter({ tags, selectedTag, tagCounts, onSelectTag }: TagFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const sortedTags = useMemo(() => {
    const allTag = tags.find(t => t === 'All')
    const otherTags = tags.filter(t => t !== 'All').sort((a, b) => {
      const countA = tagCounts?.[a] || 0
      const countB = tagCounts?.[b] || 0
      return countB - countA
    })
    return allTag ? [allTag, ...otherTags] : otherTags
  }, [tags, tagCounts])

  const TagButton = ({ tag }: { tag: string }) => (
    <button
      onClick={() => {
        onSelectTag(tag)
      }}
      className={cn(
        "h-8 flex items-center px-1 pl-3 rounded-full cursor-pointer border text-sm transition-colors whitespace-nowrap shrink-0",
        selectedTag === tag
          ? "border-[#18181b] bg-[#18181b] text-white shadow-sm"
          : "border-[#e4e4e7] bg-white hover:bg-[#fafafa] text-[#52525b]"
      )}
    >
      <span className="font-medium">{tag}</span>
      {tagCounts?.[tag] !== undefined && (
        <span
          className={cn(
            "ml-2 text-[10px] border rounded-full h-5 min-w-5 font-semibold flex items-center justify-center",
            selectedTag === tag
              ? "border-[#3f3f46] bg-[#27272a] text-[#f4f4f5]"
              : "border-[#e4e4e7] bg-[#f4f4f5] text-[#71717a]"
          )}
        >
          {tagCounts[tag]}
        </span>
      )}
    </button>
  )

  const needsExpansion = sortedTags.length > 6 // Show arrow only if there are enough tags to likely wrap

  return (
    <>
      {/* Desktop Filter */}
      <div className="hidden md:flex flex-col items-center w-full relative">
        <div 
          className="flex flex-wrap gap-y-3 gap-x-2 w-full overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: isExpanded ? '1000px' : '32px' }}
        >
          {sortedTags.map((tag) => (
            <TagButton key={tag} tag={tag} />
          ))}
        </div>

        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center justify-center w-8 h-8 rounded-full border border-[#e4e4e7] bg-white dark:bg-[#27272a] hover:bg-[#fafafa] text-[#a1a1aa] hover:text-[#18181b] transition-colors shadow-sm cursor-pointer z-20"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isExpanded ? "rotate-180" : "")} />
          </button>
        )}
      </div>

      {/* Mobile Filter (Native Select wrapping) */}
      <div className="md:hidden relative w-full">
        <select
          value={selectedTag}
          onChange={(e) => onSelectTag(e.target.value)}
          className="w-full appearance-none bg-white dark:bg-[#27272a] border border-[#e4e4e7] rounded-lg px-4 py-3 text-sm font-medium text-[#3f3f46] focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-sm"
        >
          {sortedTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag} {tagCounts?.[tag] !== undefined ? `(${tagCounts[tag]})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-[#a1a1aa]" />
      </div>
    </>
  )
}
