'use client'

import { useState, useCallback } from 'react'
import { X, Search, Music, Disc, Mic2, Radio, Loader2, Plus } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { toast } from 'sonner'

interface AppleMusicResult {
  id: number
  name: string
  artist: string
  cover: string
  coverSmall: string
  link: string
  type: string
  genre: string
  releaseDate: string
  trackCount: number
  embedCode: string
}

interface AppleMusicSearchDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (item: {
    name: string
    subtitle: string
    cover: string
    desc: string
    review: string
    link: string
    embedCode: string
    category: string
  }) => void
}

const searchTypes = [
  { key: 'album', label: '专辑', icon: Disc },
  { key: 'song', label: '歌曲', icon: Music },
  { key: 'artist', label: '艺人', icon: Mic2 },
  { key: 'podcast', label: '播客', icon: Radio },
]

export function AppleMusicSearchDialog({ open, onClose, onSelect }: AppleMusicSearchDialogProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('album')
  const [results, setResults] = useState<AppleMusicResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('请输入搜索关键词')
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const res = await fetch(
        `/api/apple-music-search?term=${encodeURIComponent(query.trim())}&type=${searchType}`
      )
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResults(data.results || [])
    } catch (err: any) {
      toast.error(`搜索失败: ${err.message}`)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [query, searchType])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelect = (item: AppleMusicResult) => {
    const categoryMap: Record<string, string> = {
      album: '音乐',
      song: '音乐',
      artist: '艺人',
      podcast: '播客',
    }

    onSelect({
      name: item.name,
      subtitle: item.artist,
      cover: item.cover,
      desc: `${item.genre}${item.releaseDate ? ` · ${new Date(item.releaseDate).getFullYear()}` : ''}${item.trackCount ? ` · ${item.trackCount} 首` : ''}`,
      review: '',
      link: item.link,
      embedCode: item.embedCode,
      category: categoryMap[item.type] || '音乐',
    })

    toast.success(`已选择: ${item.name}`)
    onClose()
  }

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      className="card max-w-2xl w-full max-h-[85vh] p-6 md:p-8 relative bg-[var(--color-bg)] flex flex-col shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-primary)]">从 Apple Music 导入</h2>
          <p className="text-sm text-[var(--color-secondary)] mt-1">搜索专辑、歌曲、艺人或播客</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] bg-[var(--color-card)] hover:bg-[var(--color-border)] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Type Tabs */}
      <div className="flex gap-2 mb-4">
        {searchTypes.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.key}
              onClick={() => {
                setSearchType(type.key)
                setResults([])
                setHasSearched(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                searchType === type.key
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-card)] text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {type.label}
            </button>
          )
        })}
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`搜索 ${searchTypes.find((t) => t.key === searchType)?.label}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-medium rounded-xl hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              搜索中
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              搜索
            </>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        {hasSearched && results.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-secondary)]">
            <Music className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">未找到结果，请尝试其他关键词</p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-4 p-3 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-border)] transition-colors text-left group"
            >
              {/* Cover */}
              <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-border)]">
                {item.cover ? (
                  <img
                    src={item.cover}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-5 h-5 text-[var(--color-secondary)]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[var(--color-primary)] truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-[var(--color-secondary)] truncate mt-0.5">
                  {item.artist}
                  {item.genre && ` · ${item.genre}`}
                </p>
              </div>

              {/* Add Icon */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </DialogModal>
  )
}
