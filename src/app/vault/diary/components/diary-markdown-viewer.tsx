'use client'

import React from 'react'
import { useMarkdownRender } from '@/hooks/use-markdown-render'

interface DiaryMarkdownViewerProps {
	content: string
	className?: string
}

export default function DiaryMarkdownViewer({ content, className = '' }: DiaryMarkdownViewerProps) {
	const { content: renderedContent, loading } = useMarkdownRender(content || '')

	if (loading || !renderedContent) {
		return (
			<div className={`prose prose-neutral dark:prose-invert max-w-none text-[#3f3f46] dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-light break-words ${className}`}>
				{content}
			</div>
		)
	}

	return (
		<div className={`prose prose-neutral dark:prose-invert max-w-none text-[#3f3f46] dark:text-neutral-300 leading-relaxed font-light break-words [&_pre]:my-3 [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-brand/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:my-0.5 ${className}`}>
			{renderedContent}
		</div>
	)
}
