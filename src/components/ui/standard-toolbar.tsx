'use client'

import { ReactNode } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'

export interface TagOption {
	label: string
	value: string
	count?: number
}

export interface StandardToolbarProps {
	tags?: (string | TagOption)[]
	selectedTag?: string
	onSelectTag?: (tag: string) => void
	
	statusTabs?: { label: string; value: string; count?: number }[]
	selectedStatus?: string
	onSelectStatus?: (status: string) => void

	searchValue?: string
	onSearchChange?: (value: string) => void
	searchPlaceholder?: string

	viewMode?: 'grid' | 'list'
	onViewModeChange?: (mode: 'grid' | 'list') => void

	extraRightActions?: ReactNode
	className?: string
}

export function StandardToolbar({
	tags = [],
	selectedTag = 'all',
	onSelectTag,
	statusTabs,
	selectedStatus,
	onSelectStatus,
	searchValue = '',
	onSearchChange,
	searchPlaceholder = '搜索...',
	viewMode,
	onViewModeChange,
	extraRightActions,
	className = ''
}: StandardToolbarProps) {
	return (
		<div className={`mx-auto w-full max-w-7xl px-6 mb-8 space-y-4 ${className}`}>
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				{/* Left Side: Status Tabs or Primary Category Pills */}
				<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
					{statusTabs && onSelectStatus && (
						<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 mr-2">
							{statusTabs.map(tab => (
								<button
									key={tab.value}
									onClick={() => onSelectStatus(tab.value)}
									className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
										selectedStatus === tab.value
											? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
											: 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
									}`}
								>
									{tab.label}
									{tab.count !== undefined && (
										<span className="ml-1.5 opacity-60 text-[10px]">{tab.count}</span>
									)}
								</button>
							))}
						</div>
					)}

					{tags.length > 0 && onSelectTag && (
						<div className="flex items-center gap-1.5 flex-nowrap shrink-0">
							{tags.map(tag => {
								const val = typeof tag === 'string' ? tag : tag.value
								const lbl = typeof tag === 'string' ? tag : tag.label
								const cnt = typeof tag === 'string' ? undefined : tag.count
								const isSelected = selectedTag === val

								return (
									<button
										key={val}
										onClick={() => onSelectTag(val)}
										className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
											isSelected
												? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
												: 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
										}`}
									>
										{lbl}
										{cnt !== undefined && (
											<span className="ml-1.5 opacity-60 text-[10px]">{cnt}</span>
										)}
									</button>
								)
							})}
						</div>
					)}
				</div>

				{/* Right Side: Search Input + View Mode Switcher + Extra Actions */}
				<div className="flex items-center gap-3 shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
					{onSearchChange !== undefined && (
						<div className="relative flex-1 md:w-64">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								value={searchValue}
								onChange={e => onSearchChange(e.target.value)}
								placeholder={searchPlaceholder}
								className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
							/>
						</div>
					)}

					{viewMode && onViewModeChange && (
						<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700/60">
							<button
								onClick={() => onViewModeChange('grid')}
								className={`p-1.5 rounded-lg transition-all ${
									viewMode === 'grid'
										? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
										: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
								}`}
								title="网格视图"
							>
								<LayoutGrid className="w-3.5 h-3.5" />
							</button>
							<button
								onClick={() => onViewModeChange('list')}
								className={`p-1.5 rounded-lg transition-all ${
									viewMode === 'list'
										? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
										: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
								}`}
								title="列表视图"
							>
								<List className="w-3.5 h-3.5" />
							</button>
						</div>
					)}

					{extraRightActions}
				</div>
			</div>
		</div>
	)
}
