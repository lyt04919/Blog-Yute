'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

type CodeBlockProps = {
	children: React.ReactNode
	code: string
}

function fallbackCopy(text: string): boolean {
	const textarea = document.createElement('textarea')
	textarea.value = text
	// Make textarea part of the document but visually hidden
	textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;'
	document.body.appendChild(textarea)
	// Select all text
	textarea.select()
	try {
		const success = document.execCommand('copy')
		document.body.removeChild(textarea)
		return success
	} catch {
		document.body.removeChild(textarea)
		return false
	}
}

export function CodeBlock({ children, code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		// Debug: log the actual code being copied
		console.log('Copy button clicked, code length:', code?.length || 0)
		console.log('Code content preview:', code?.substring(0, 100) || 'EMPTY')

		let success = false
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(code)
				success = true
				console.log('navigator.clipboard.writeText succeeded')
			} else {
				console.log('navigator.clipboard not available, using fallback')
				success = fallbackCopy(code)
			}
		} catch (err) {
			console.error('Copy error:', err)
			success = fallbackCopy(code)
		}

		if (success) {
			setCopied(true)
			toast.success('代码已复制')
			setTimeout(() => setCopied(false), 2000)
		} else {
			toast.error('复制失败')
		}
	}

	return (
		<div className='code-block-wrapper'>
			<button
				type='button'
				onClick={handleCopy}
				className='code-block-copy-btn'
				aria-label='Copy code'
			>
				{copied ? <Check size={16} /> : <Copy size={16} />}
			</button>
			{children}
		</div>
	)
}

