'use client'

import { TagSelector } from '@/components/ui/tag-selector'

const BLOG_TAG_OPTIONS = [
	'前端开发', '3D 与图形', 'AI 与工具', '学习笔记', '生活与随感', '游戏程序'
]

type TagInputProps = {
	tags: string[]
	onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
	return (
		<div className='bg-card w-full rounded-xl border border-slate-200 dark:border-slate-800 p-4'>
			<span className='text-xs text-slate-500 dark:text-slate-400 font-medium block mb-2.5'>选择博客标签</span>
			<TagSelector
				options={BLOG_TAG_OPTIONS}
				selectedTags={tags}
				onChange={onChange}
			/>
		</div>
	)
}
