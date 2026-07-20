'use client'

import { motion } from 'motion/react'
import { useWriteStore } from '../stores/write-store'
import { INIT_DELAY } from '@/consts'
import { useRef, useState, useMemo } from 'react'
import { WriteStats } from './stats'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { WriteEditorToc } from './editor-toc'
import { Bold, Italic, Link as LinkIcon, Code, Heading1, Heading2, Heading3, Quote, Minus, Image as ImageIcon } from 'lucide-react'

const defaultText = 'text'

export function WriteEditor() {
	const { form, updateForm, addFiles, isZenMode, isSplitMode } = useWriteStore()
	const viewRef = useRef<EditorView | null>(null)
	const [activeLine, setActiveLine] = useState(1)

	// Tooltip & Slash Menu States
	const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0, show: false })
	const [slashMenu, setSlashMenu] = useState({ top: 0, left: 0, show: false, pos: 0, filter: '', index: 0 })

	const SLASH_COMMANDS = useMemo(() => [
		{ id: 'h1', icon: <Heading1 className="w-4 h-4"/>, label: 'Heading 1', desc: '一级标题', insert: '# ' },
		{ id: 'h2', icon: <Heading2 className="w-4 h-4"/>, label: 'Heading 2', desc: '二级标题', insert: '## ' },
		{ id: 'h3', icon: <Heading3 className="w-4 h-4"/>, label: 'Heading 3', desc: '三级标题', insert: '### ' },
		{ id: 'quote', icon: <Quote className="w-4 h-4"/>, label: 'Quote', desc: '引用', insert: '> ' },
		{ id: 'code', icon: <Code className="w-4 h-4"/>, label: 'Code Block', desc: '代码块', insert: '```\n\n```', offset: 4 },
		{ id: 'divider', icon: <Minus className="w-4 h-4"/>, label: 'Divider', desc: '分割线', insert: '---\n' },
	], [])

	const filteredCommands = useMemo(() => {
		if (!slashMenu.filter) return SLASH_COMMANDS
		return SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(slashMenu.filter.toLowerCase()) || c.desc.includes(slashMenu.filter))
	}, [slashMenu.filter, SLASH_COMMANDS])

	// Custom CodeMirror theme targeting the app's glassmorphism style
	const customTheme = useMemo(() => {
		return EditorView.theme({
			"&": {
				backgroundColor: "transparent !important",
				height: "100%",
			},
			".cm-scroller": {
				overflow: "auto",
				fontFamily: "inherit",
				scrollbarWidth: "none", // Firefox
			},
			".cm-scroller::-webkit-scrollbar": {
				display: "none" // Safari & Chrome
			},
			".cm-content": {
				padding: "16px 8px",
				fontSize: "14px",
				lineHeight: "1.7",
				color: "var(--color-primary)",
			},
			".cm-gutters": {
				backgroundColor: "transparent",
				borderRight: "none",
				color: "var(--color-secondary)",
				opacity: 0.4,
				paddingRight: "8px",
			},
			".cm-gutter": {
				backgroundColor: "transparent",
			},
			".cm-activeLine": {
				backgroundColor: "color-mix(in srgb, var(--color-brand) 4%, transparent) !important",
				borderRadius: "6px",
			},
			".cm-activeLineGutter": {
				backgroundColor: "transparent",
				color: "var(--color-brand)",
				fontWeight: "bold",
			},
			"&.cm-focused .cm-cursor": {
				borderLeftColor: "var(--color-brand)",
				borderLeftWidth: "2px",
			},
			"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
				backgroundColor: "color-mix(in srgb, var(--color-brand) 15%, transparent) !important",
			}
		}, { dark: false })
	}, [])

	// Setup update listener to track current line of the cursor
	const updateListener = useMemo(() => {
		return EditorView.updateListener.of((update) => {
			const view = update.view
			const mainSelection = view.state.selection.main
			const cursorLine = view.state.doc.lineAt(mainSelection.head)

			if (update.selectionSet || update.docChanged) {
				setActiveLine(cursorLine.number)
			}

			// Floating Toolbar logic
			if (!mainSelection.empty && view.hasFocus) {
				const coords = view.coordsAtPos(mainSelection.from)
				if (coords) {
					setToolbarPos({ top: coords.top - 45, left: coords.left, show: true })
				}
			} else {
				setToolbarPos(prev => prev.show ? { ...prev, show: false } : prev)
			}

			// Slash Command logic
			if (update.selectionSet || update.docChanged) {
				if (mainSelection.empty && view.hasFocus) {
					const textBeforeCursor = cursorLine.text.slice(0, mainSelection.head - cursorLine.from)
					const match = textBeforeCursor.match(/(^|\s)\/([^\s]*)$/)
					
					if (match) {
						const slashPos = mainSelection.head - match[2].length - 1
						const coords = view.coordsAtPos(slashPos)
						if (coords) {
							setSlashMenu(prev => ({
								...prev,
								top: coords.bottom + 5,
								left: coords.left,
								show: true,
								pos: slashPos,
								filter: match[2],
								index: Math.min(prev.index, filteredCommands.length - 1)
							}))
						}
					} else {
						setSlashMenu(prev => prev.show ? { ...prev, show: false } : prev)
					}
				} else {
					setSlashMenu(prev => prev.show ? { ...prev, show: false } : prev)
				}
			}
		})
	}, [filteredCommands.length])

	const slashMenuRef = useRef(slashMenu)
	slashMenuRef.current = slashMenu
	const filteredCommandsRef = useRef(filteredCommands)
	filteredCommandsRef.current = filteredCommands

	const keyHandlerExtension = useMemo(() => {
		return EditorView.domEventHandlers({
			keydown(e, view) {
				const currentMenu = slashMenuRef.current
				const cmds = filteredCommandsRef.current
				if (currentMenu.show) {
					if (e.key === 'ArrowDown') {
						e.preventDefault()
						setSlashMenu(prev => ({ ...prev, index: (prev.index + 1) % cmds.length }))
						return true
					}
					if (e.key === 'ArrowUp') {
						e.preventDefault()
						setSlashMenu(prev => ({ ...prev, index: (prev.index - 1 + cmds.length) % cmds.length }))
						return true
					}
					if (e.key === 'Enter') {
						e.preventDefault()
						if (cmds[currentMenu.index]) {
							// Execute command manually since executeSlashCommand might be stale in closure
							const cmd = cmds[currentMenu.index]
							const { state } = view
							const head = state.selection.main.head
							const from = currentMenu.pos
							
							view.dispatch(
								state.update({
									changes: { from, to: head, insert: cmd.insert },
									selection: { anchor: from + cmd.insert.length - (cmd.offset || 0) },
									scrollIntoView: true
								})
							)
							setSlashMenu(prev => ({ ...prev, show: false }))
							view.focus()
						}
						return true
					}
					if (e.key === 'Escape') {
						e.preventDefault()
						setSlashMenu(prev => ({ ...prev, show: false }))
						return true
					}
				}
				return false
			}
		})
	}, [])

	const insertText = (text: string) => {
		const view = viewRef.current
		if (!view) return

		view.focus()
		const { state } = view
		const mainSelection = state.selection.main
		
		view.dispatch(
			state.update({
				changes: {
					from: mainSelection.from,
					to: mainSelection.to,
					insert: text
				},
				selection: { anchor: mainSelection.from + text.length },
				scrollIntoView: true
			})
		)
	}

	const toggleBold = () => {
		const view = viewRef.current
		if (!view) return

		view.focus()
		const { state } = view
		const { from, to } = state.selection.main
		const selectedText = state.sliceDoc(from, to)

		// Check if already surrounded by '**'
		const before = state.sliceDoc(from - 2, from)
		const after = state.sliceDoc(to, to + 2)
		const isBold = before === '**' && after === '**'

		if (isBold && selectedText) {
			view.dispatch(
				state.update({
					changes: { from: from - 2, to: to + 2, insert: selectedText },
					selection: { anchor: from - 2 + selectedText.length },
					scrollIntoView: true
				})
			)
		} else {
			const text = selectedText || defaultText
			view.dispatch(
				state.update({
					changes: { from, to, insert: `**${text}**` },
					selection: selectedText
						? { anchor: from + text.length + 4 }
						: { anchor: from + 2, head: from + 2 + defaultText.length },
					scrollIntoView: true
				})
			)
		}
	}

	const toggleItalic = () => {
		const view = viewRef.current
		if (!view) return

		view.focus()
		const { state } = view
		const { from, to } = state.selection.main
		const selectedText = state.sliceDoc(from, to)

		// Check if already surrounded by '*' (excluding '**')
		const before = state.sliceDoc(from - 1, from)
		const after = state.sliceDoc(to, to + 1)
		const isItalic = before === '*' && after === '*' && !(state.sliceDoc(from - 2, from) === '**' && state.sliceDoc(to, to + 2) === '**')

		if (isItalic && selectedText) {
			view.dispatch(
				state.update({
					changes: { from: from - 1, to: to + 1, insert: selectedText },
					selection: { anchor: from - 1 + selectedText.length },
					scrollIntoView: true
				})
			)
		} else {
			const text = selectedText || defaultText
			view.dispatch(
				state.update({
					changes: { from, to, insert: `*${text}*` },
					selection: selectedText
						? { anchor: from + text.length + 2 }
						: { anchor: from + 1, head: from + 1 + defaultText.length },
					scrollIntoView: true
				})
			)
		}
	}

	const toggleLink = () => {
		const view = viewRef.current
		if (!view) return

		view.focus()
		const { state } = view
		const { from, to } = state.selection.main
		const selectedText = state.sliceDoc(from, to)

		const text = selectedText || defaultText
		view.dispatch(
			state.update({
				changes: { from, to, insert: `[${text}](url)` },
				selection: { anchor: from + text.length + 3, head: from + text.length + 6 },
				scrollIntoView: true
			})
		)
	}

	const toggleCode = () => {
		const view = viewRef.current
		if (!view) return

		view.focus()
		const { state } = view
		const { from, to } = state.selection.main
		const selectedText = state.sliceDoc(from, to)

		const text = selectedText || 'code'
		view.dispatch(
			state.update({
				changes: { from, to, insert: `\`${text}\`` },
				selection: selectedText
					? { anchor: from + text.length + 2 }
					: { anchor: from + 1, head: from + 1 + text.length },
				scrollIntoView: true
			})
		)
	}

	const executeSlashCommand = (command: typeof SLASH_COMMANDS[0]) => {
		const view = viewRef.current
		if (!view || !slashMenu.show) return

		const { state } = view
		const head = state.selection.main.head
		const from = slashMenu.pos
		
		view.dispatch(
			state.update({
				changes: { from, to: head, insert: command.insert },
				selection: { anchor: from + command.insert.length - (command.offset || 0) },
				scrollIntoView: true
			})
		)
		setSlashMenu(prev => ({ ...prev, show: false }))
		view.focus()
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Ctrl/Cmd + B: Toggle Bold
		if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
			e.preventDefault()
			toggleBold()
			return
		}

		// Ctrl/Cmd + I: Toggle Italic
		if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
			e.preventDefault()
			toggleItalic()
			return
		}

		// Ctrl/Cmd + K: Link
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault()
			toggleLink()
			return
		}
	}

	const handlePaste = async (e: React.ClipboardEvent) => {
		const items = e.clipboardData.items
		if (!items) return

		const imageFiles: File[] = []
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile()
				if (file) {
					imageFiles.push(file)
				}
			}
		}

		if (imageFiles.length > 0) {
			e.preventDefault()

			const resultImages = await addFiles(imageFiles).catch(() => [])

			if (resultImages && resultImages.length > 0) {
				const markdowns = resultImages.map(item => (item.type === 'url' ? `![](${item.url})` : `![](local-image:${item.id})`)).join('\n')
				insertText(markdowns)
			}
		}
	}

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault()
		const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
		
		if (files.length > 0) {
			// Insert skeleton placeholder
			const placeholderId = `uploading-${Date.now()}`
			const placeholderText = `![图片上传中...](${placeholderId})\n`
			insertText(placeholderText)

			const resultImages = await addFiles(files).catch(() => [])

			if (resultImages && resultImages.length > 0) {
				const view = viewRef.current
				if (view) {
					const markdowns = resultImages.map(item => (item.type === 'url' ? `![](${item.url})` : `![](local-image:${item.id})`)).join('\n') + '\n'
					// Replace placeholder with actual markdown
					const docText = view.state.doc.toString()
					const idx = docText.indexOf(placeholderText)
					if (idx !== -1) {
						view.dispatch(
							view.state.update({
								changes: { from: idx, to: idx + placeholderText.length, insert: markdowns }
							})
						)
					}
				}
			}
		}
	}

	const handleHeadingClick = (lineNum: number) => {
		const view = viewRef.current
		if (!view) return

		view.focus()
		const line = view.state.doc.line(lineNum)
		view.dispatch({
			effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 20 }),
			selection: { anchor: line.from }
		})
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: INIT_DELAY }}
			style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
			className={`bg-card flex flex-col relative ${
				isZenMode
					? 'w-full max-w-[900px] border-none shadow-none bg-transparent'
					: isSplitMode
						? 'flex-1 min-w-0 rounded-2xl border p-6 shadow-sm'
						: 'w-[800px] rounded-[40px] border p-6 shadow'
			}`}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
			onDragOver={e => e.preventDefault()}
			onDrop={handleDrop}>
			
			{/* Floating Toolbar */}
			{toolbarPos.show && (
				<motion.div
					initial={{ opacity: 0, y: 10, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					className="fixed z-[100] flex items-center gap-1 bg-[var(--color-card)]/90 backdrop-blur-xl border border-[var(--color-border)] p-1 rounded-xl shadow-xl"
					style={{ top: toolbarPos.top, left: Math.max(20, toolbarPos.left - 60) }}
					onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus
				>
					<button onClick={toggleBold} className="p-1.5 hover:bg-[var(--color-bg)] rounded-lg text-[var(--color-primary)] transition-colors"><Bold className="w-4 h-4" /></button>
					<button onClick={toggleItalic} className="p-1.5 hover:bg-[var(--color-bg)] rounded-lg text-[var(--color-primary)] transition-colors"><Italic className="w-4 h-4" /></button>
					<div className="w-[1px] h-4 bg-[var(--color-border)] mx-1" />
					<button onClick={toggleLink} className="p-1.5 hover:bg-[var(--color-bg)] rounded-lg text-[var(--color-primary)] transition-colors"><LinkIcon className="w-4 h-4" /></button>
					<button onClick={toggleCode} className="p-1.5 hover:bg-[var(--color-bg)] rounded-lg text-[var(--color-primary)] transition-colors"><Code className="w-4 h-4" /></button>
				</motion.div>
			)}

			{/* Slash Commands Menu */}
			{slashMenu.show && filteredCommands.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: -5, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					className="fixed z-[100] w-56 flex flex-col bg-[var(--color-card)]/95 backdrop-blur-xl border border-[var(--color-border)] p-1.5 rounded-xl shadow-2xl"
					style={{ top: slashMenu.top, left: slashMenu.left }}
				>
					<div className="text-[10px] text-[var(--color-secondary)] uppercase px-2 py-1 mb-1 font-medium tracking-widest">
						Basic Blocks
					</div>
					{filteredCommands.map((cmd, i) => (
						<button
							key={cmd.id}
							onClick={() => executeSlashCommand(cmd)}
							className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-left transition-colors ${i === slashMenu.index ? 'bg-[var(--color-bg)] text-[var(--color-brand)]' : 'text-[var(--color-primary)] hover:bg-[var(--color-bg)]'}`}
						>
							<div className="flex items-center justify-center w-6 h-6 rounded bg-[var(--color-bg)] shadow-sm border border-[var(--color-border)]">
								{cmd.icon}
							</div>
							<div className="flex flex-col">
								<span className="font-medium leading-tight">{cmd.label}</span>
								<span className="text-[10px] text-[var(--color-secondary)] leading-tight">{cmd.desc}</span>
							</div>
						</button>
					))}
				</motion.div>
			)}

			{/* Floating dynamic TOC navigation */}
			<WriteEditorToc
				markdown={form.md}
				activeLine={activeLine}
				onHeadingClick={handleHeadingClick}
			/>

			<div className='mb-4 flex flex-col gap-1'>
				<input
					type='text'
					placeholder='无标题文章'
					className='w-full bg-transparent border-none text-3xl md:text-4xl font-bold text-[var(--color-primary)] placeholder-[var(--color-secondary)]/40 focus:outline-none focus:ring-0 px-2 py-2'
					value={form.title}
					onChange={e => updateForm({ title: e.target.value })}
				/>
				<div className='flex items-center gap-2 px-2 opacity-50 focus-within:opacity-100 transition-opacity'>
					<span className="text-sm font-mono text-[var(--color-secondary)]">/blog/</span>
					<input
						type='text'
						placeholder='your-article-slug'
						className='w-full max-w-[300px] bg-transparent border-none text-sm text-[var(--color-secondary)] font-mono focus:outline-none focus:ring-0 p-0'
						value={form.slug}
						onChange={e => updateForm({ slug: e.target.value })}
					/>
				</div>
			</div>
			
			<div className="flex-1 min-h-0 w-full bg-transparent overflow-hidden">
				<CodeMirror
					value={form.md}
					height="100%"
					className="h-full w-full"
					theme="none"
					onCreateEditor={(view) => {
						viewRef.current = view
					}}
					extensions={[
						markdown(),
						EditorView.lineWrapping,
						keymap.of([indentWithTab]),
						customTheme,
						updateListener,
						keyHandlerExtension
					]}
					onChange={(val) => {
						const updates: any = { md: val }
						
						// Auto extract title from first H1 if title is empty
						const h1Match = val.match(/^#\s+(.+)$/m)
						if (h1Match && h1Match[1]) {
							const extractedTitle = h1Match[1].trim()
							if (!form.title) {
								updates.title = extractedTitle
							}
						}
						
						updateForm(updates)
					}}
				/>
			</div>
			
			<WriteStats />
		</motion.div>
	)
}
