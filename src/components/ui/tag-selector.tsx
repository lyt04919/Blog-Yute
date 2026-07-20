'use client'

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'

interface TagSelectorProps {
	options?: string[]
	selectedTags?: string[]
	onChange: (tags: string[]) => void
	allowCustom?: boolean
}

export function TagSelector({ options = [], selectedTags = [], onChange, allowCustom = true }: TagSelectorProps) {
	const [isAddingCustom, setIsAddingCustom] = useState(false)
	const [customTagInput, setCustomTagInput] = useState('')

	const safeSelected = selectedTags || []
	const safeOptions = options || []

	const toggleTag = (tag: string) => {
		if (safeSelected.includes(tag)) {
			onChange(safeSelected.filter(t => t !== tag))
		} else {
			onChange([...safeSelected, tag])
		}
	}

	const handleAddCustom = () => {
		const trimmed = customTagInput.trim()
		if (trimmed) {
			// Split by comma (Chinese and English commas)
			const newTags = trimmed
				.split(/[,，]/)
				.map(t => t.trim())
				.filter(t => t && !safeSelected.includes(t))
			if (newTags.length > 0) {
				onChange([...safeSelected, ...newTags])
			}
		}
		setCustomTagInput('')
		setIsAddingCustom(false)
	}

	// Combine standard preset options with any extra existing selected tags that aren't in options
	const allDisplayOptions = Array.from(new Set([...safeOptions, ...safeSelected]))

	return (
		<div className="flex flex-col gap-2.5">
			<div className="flex flex-wrap items-center gap-2">
				{allDisplayOptions.map(tag => {
					const isSelected = safeSelected.includes(tag)
					return (
						<button
							key={tag}
							type="button"
							onClick={() => toggleTag(tag)}
							className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
								isSelected
									? 'bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-500'
									: 'bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#30363D] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
							}`}
						>
							<span>{tag}</span>
							{isSelected && <X className="w-3 h-3 stroke-[2.5]" />}
						</button>
					)
				})}

				{allowCustom && !isAddingCustom && (
					<button
						type="button"
						onClick={() => setIsAddingCustom(true)}
						className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors"
					>
						<Plus className="w-3 h-3" />
						<span>自定义</span>
					</button>
				)}

				{isAddingCustom && (
					<div className="inline-flex items-center gap-1 bg-white dark:bg-[#161B22] border border-slate-300 dark:border-slate-700 rounded-full px-2.5 py-1 text-xs">
						<input
							type="text"
							autoFocus
							value={customTagInput}
							onChange={e => setCustomTagInput(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									e.preventDefault()
									handleAddCustom()
								}
								if (e.key === 'Escape') {
									setIsAddingCustom(false)
								}
							}}
							placeholder="添加新标签(支持逗号分隔)..."
							className="w-40 bg-transparent focus:outline-none text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
						/>
						<button type="button" onClick={handleAddCustom} className="text-blue-500 hover:text-blue-600 p-0.5">
							<Check className="w-3.5 h-3.5" />
						</button>
						<button type="button" onClick={() => setIsAddingCustom(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
