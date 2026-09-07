'use client'

import React from 'react'
import { BookDashed, RotateCcw, PenLine } from 'lucide-react'

interface DiaryEmptyStateProps {
	isFiltered: boolean
	onResetFilter?: () => void
	onCreateDiary?: () => void
}

export default function DiaryEmptyState({ isFiltered, onResetFilter, onCreateDiary }: DiaryEmptyStateProps) {
	return (
		<div className="w-full py-20 flex flex-col items-center justify-center text-center px-4">
			<div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center mb-5 text-neutral-400 dark:text-neutral-500 shadow-inner">
				<BookDashed className="w-8 h-8 stroke-[1.5]" />
			</div>
			
			<h3 className="text-xl font-serif font-bold text-[var(--color-primary)] mb-2">
				{isFiltered ? '未找到匹配的回忆' : '还没有记录任何回忆'}
			</h3>
			
			<p className="text-sm text-[var(--color-secondary)] max-w-sm mb-6 font-light leading-relaxed">
				{isFiltered
					? '当前设定的关键词或高级筛选条件下没有日记。尝试清除部分筛选条件或换个搜索词。'
					: '生活里的点滴细碎都值得被定格。点击下方按钮开始记录你的第一篇日记。'}
			</p>

			<div className="flex items-center gap-3">
				{isFiltered && onResetFilter && (
					<button
						onClick={onResetFilter}
						className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors shadow-xs"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						<span>清除筛选条件</span>
					</button>
				)}

				{onCreateDiary && (
					<button
						onClick={onCreateDiary}
						className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:brightness-110 active:scale-95 transition-all shadow-sm"
					>
						<PenLine className="w-3.5 h-3.5" />
						<span>写篇新日记</span>
					</button>
				)}
			</div>
		</div>
	)
}
