import { Marked, type Tokens } from 'marked'

export type TocItem = { id: string; text: string; level: number }

export interface MarkdownRenderResult {
	html: string
	toc: TocItem[]
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
}

// Lazy load shiki
let shikiModule: typeof import('shiki') | null = null
let shikiLoadAttempted = false

async function loadShiki() {
	if (shikiLoadAttempted) {
		return shikiModule
	}
	shikiLoadAttempted = true

	try {
		shikiModule = await import('shiki')
		return shikiModule
	} catch (error) {
		console.warn('Failed to load shiki module:', error)
		return null
	}
}

// Lazy load katex
let katexModule: typeof import('katex') | null = null
let katexLoadAttempted = false

async function loadKatex() {
	if (katexModule) return katexModule
	if (katexLoadAttempted) return null
	katexLoadAttempted = true

	try {
		const mod: any = await import('katex')
		katexModule = (mod?.default ?? mod) as any
		return katexModule
	} catch (error) {
		console.warn('Failed to load katex module:', error)
		return null
	}
}

function renderMathWithKatex(content: string, displayMode: boolean, katex: any) {
	if (!katex) {
		return displayMode ? `$$${content}$$` : `$${content}$`
	}
	try {
		return katex.renderToString(content, {
			displayMode,
			throwOnError: false,
			output: 'html',
			strict: 'ignore'
		})
	} catch {
		return displayMode ? `$$${content}$$` : `$${content}$`
	}
}

let markedInstance: Marked | null = null

function getOrCreateMarked(katex: any) {
	if (markedInstance) return markedInstance

	const instance = new Marked({
		gfm: true,
		breaks: true
	})

	instance.use({
		extensions: [
			{
				name: 'mathBlock',
				level: 'block',
				start(src: string) {
					return src.indexOf('$$')
				},
				tokenizer(src: string) {
					const match = src.match(/^\$\$([\s\S]+?)\$\$(?:\n+|$)/)
					if (!match) return
					return {
						type: 'mathBlock',
						raw: match[0],
						text: match[1].trim()
					} as any
				},
				renderer(token: any) {
					return `${renderMathWithKatex(token.text || '', true, katexModule)}\n`
				}
			},
			{
				name: 'mathInline',
				level: 'inline',
				start(src: string) {
					const idx = src.indexOf('$')
					return idx === -1 ? undefined : idx
				},
				tokenizer(src: string) {
					if (src.startsWith('$$')) return
					if (src.startsWith('\\$')) return

					const match = src.match(/^\$([^\n$]+?)\$/)
					if (!match) return

					const inner = match[1]
					if (!inner || !inner.trim()) return

					return {
						type: 'mathInline',
						raw: match[0],
						text: inner.trim()
					} as any
				},
				renderer(token: any) {
					return renderMathWithKatex(token.text || '', false, katexModule)
				}
			}
		],
		renderer: {
			heading(token: Tokens.Heading) {
				const id = slugify(token.text || '')
				return `<h${token.depth} id="${id}">${token.text}</h${token.depth}>`
			},
			listitem(token: Tokens.ListItem) {
				let inner = token.text
				let tokens = token.tokens
				if (token.task) tokens = tokens.slice(1)
				inner = instance.parser(tokens) as string

				if (token.task) {
					const checkbox = token.checked ? '<input type="checkbox" checked disabled />' : '<input type="checkbox" disabled />'
					return `<li class="task-list-item">${checkbox} ${inner}</li>\n`
				}
				return `<li>${inner}</li>\n`
			}
		}
	})

	markedInstance = instance
	return markedInstance
}

export async function renderMarkdown(markdown: string = ''): Promise<MarkdownRenderResult> {
	if (!markdown) markdown = ''
	const [shiki, katex] = await Promise.all([loadShiki(), loadKatex()])
	const parserInstance = getOrCreateMarked(katex)

	const codeBlockMap = new Map<string, { html: string; original: string }>()
	const tokens = parserInstance.lexer(markdown)

	// Extract TOC from parsed tokens
	const toc: TocItem[] = []
	function extractHeadings(tokenList: typeof tokens) {
		for (const token of tokenList) {
			if (token.type === 'heading' && token.depth <= 3) {
				const text = token.text
				const id = slugify(text)
				toc.push({ id, text, level: token.depth })
			}
			if ('tokens' in token && token.tokens) {
				extractHeadings(token.tokens as typeof tokens)
			}
		}
	}
	extractHeadings(tokens)

	// Pre-process code blocks with Shiki
	for (const token of tokens) {
		if (token.type === 'code') {
			const codeToken = token as Tokens.Code
			const originalCode = codeToken.text
			const key = `__SHIKI_CODE_${codeBlockMap.size}__`

			if (shiki) {
				try {
					const html = await shiki.codeToHtml(originalCode, {
						lang: codeToken.lang || 'text',
						themes: {
							light: 'one-light',
							dark: 'one-dark-pro'
						}
					})
					codeBlockMap.set(key, { html, original: originalCode })
					codeToken.text = key
				} catch {
					codeBlockMap.set(key, { html: '', original: originalCode })
					codeToken.text = key
				}
			} else {
				codeBlockMap.set(key, { html: '', original: originalCode })
				codeToken.text = key
			}
		}
	}

	let html = (parserInstance.parser(tokens) as string) || ''

	if (codeBlockMap.size > 0) {
		for (const [key, codeData] of codeBlockMap.entries()) {
			const escapedCode = codeData.original
				.replace(/&/g, '&amp;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')

			const replacement = codeData.html
				? codeData.html.replace(/^<pre/, `<pre data-code="${escapedCode}"`)
				: `<pre data-code="${escapedCode}"><code>${escapedCode}</code></pre>`

			const pattern = new RegExp(`<pre><code[^>]*>${key}<\\/code><\\/pre>`, 'g')
			html = html.replace(pattern, replacement)
		}
	}

	return { html, toc }
}
