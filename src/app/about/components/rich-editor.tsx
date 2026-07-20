'use client'

import {
	MDXEditor,
	headingsPlugin,
	listsPlugin,
	quotePlugin,
	thematicBreakPlugin,
	markdownShortcutPlugin,
	toolbarPlugin,
	UndoRedo,
	BoldItalicUnderlineToggles,
	BlockTypeSelect,
	CreateLink,
	InsertTable,
	InsertThematicBreak,
	ListsToggle,
	linkPlugin,
	linkDialogPlugin,
	tablePlugin,
	frontmatterPlugin,
	imagePlugin
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { useTheme } from '@/hooks/use-theme'
import { useEffect, useState } from 'react'

interface RichEditorProps {
	markdown: string
	onChange: (markdown: string) => void
}

export default function RichEditor({ markdown, onChange }: RichEditorProps) {
	const { resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	return (
		<div className={`prose-editor-wrapper relative w-full rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-card)] shadow-inner transition-colors ${resolvedTheme === 'dark' ? 'dark-theme dark-editor' : ''}`}>
			<MDXEditor
				markdown={markdown}
				onChange={onChange}
				contentEditableClassName="prose prose-sm dark:prose-invert max-w-none focus:outline-none px-6 py-6 min-h-[400px]"
				plugins={[
					headingsPlugin(),
					listsPlugin(),
					quotePlugin(),
					thematicBreakPlugin(),
					linkPlugin(),
					linkDialogPlugin(),
					tablePlugin(),
					frontmatterPlugin(),
					imagePlugin(),
					markdownShortcutPlugin(),
					toolbarPlugin({
						toolbarContents: () => (
							<div className="flex flex-wrap items-center gap-1 w-full p-2 bg-[var(--color-card)] border-b border-[var(--color-border)]/50">
								<UndoRedo />
								<div className="w-px h-4 bg-[var(--color-border)]/50 mx-2" />
								<BlockTypeSelect />
								<div className="w-px h-4 bg-[var(--color-border)]/50 mx-2" />
								<BoldItalicUnderlineToggles />
								<div className="w-px h-4 bg-[var(--color-border)]/50 mx-2" />
								<CreateLink />
								<ListsToggle />
								<InsertTable />
								<InsertThematicBreak />
							</div>
						)
					})
				]}
			/>
			<style jsx global>{`
				.dark-theme .mdxeditor-toolbar {
					background-color: var(--color-card) !important;
					border-color: rgba(255, 255, 255, 0.1) !important;
				}
				.dark-theme .mdxeditor {
					--mdxeditor-toolbar-bg: var(--color-card);
					--mdxeditor-toolbar-border: rgba(255, 255, 255, 0.1);
					--mdxeditor-text-color: var(--color-primary);
				}

				/* Toolbar Layout & Buttons */
				.mdxeditor-toolbar {
					padding: 8px 12px !important;
				}
				.mdxeditor-toolbar button {
					border-radius: 8px !important;
					padding: 6px !important;
					color: var(--color-secondary) !important;
					transition: all 0.2s ease !important;
				}
				.mdxeditor-toolbar button:hover {
					background-color: var(--color-brand-alpha, rgba(120, 119, 198, 0.1)) !important;
					color: var(--color-primary) !important;
				}
				.mdxeditor-toolbar button[data-state="on"] {
					background-color: var(--color-brand-alpha, rgba(120, 119, 198, 0.2)) !important;
					color: var(--color-brand) !important;
				}
				
				/* Hide default messy labels in toolbar */
				.mdxeditor-toolbar > div > label,
				.mdxeditor-toolbar > label {
					display: none !important;
				}

				/* Style the Select Trigger Combobox specifically */
				.mdxeditor-toolbar button[role="combobox"] {
					background-color: var(--color-card) !important;
					border: 1px solid var(--color-border) !important;
					padding: 6px 12px !important;
					font-size: 13px !important;
					color: var(--color-primary) !important;
					box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
				}
				.mdxeditor-toolbar button[role="combobox"]:hover {
					border-color: var(--color-brand) !important;
				}

				/* Popovers and Menus (Highest z-index and polished styling) */
				div[data-radix-popper-content-wrapper],
				.mdxeditor-popup-container {
					z-index: 99999 !important;
				}
				.mdxeditor-select-content,
				[data-radix-popper-content-wrapper] [role="dialog"],
				[data-radix-popper-content-wrapper] [role="menu"],
				[data-radix-popper-content-wrapper] [role="listbox"],
				.mdxeditor-popup-container > div {
					background-color: var(--color-card) !important;
					color: var(--color-primary) !important;
					border: 1px solid var(--color-border) !important;
					box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3) !important;
					border-radius: 12px !important;
					padding: 6px !important;
					overflow: hidden !important;
				}
				.mdxeditor-select-item {
					border-radius: 6px !important;
					padding: 6px 12px !important;
					cursor: pointer !important;
					transition: background-color 0.2s ease !important;
					font-size: 13px !important;
					color: var(--color-primary) !important;
				}
				.mdxeditor-select-item:hover,
				.mdxeditor-select-item[data-highlighted] {
					background-color: var(--color-brand-alpha, rgba(120, 119, 198, 0.15)) !important;
					color: var(--color-primary) !important;
				}
				
				/* Table Floating Toolbar Polish */
				.mdxeditor-popup-container [role="toolbar"] {
					display: flex;
					gap: 4px;
					padding: 2px;
				}
				.mdxeditor-popup-container [role="toolbar"] button {
					border-radius: 6px !important;
					padding: 6px !important;
				}
				.mdxeditor-popup-container [role="toolbar"] button:hover {
					background-color: var(--color-brand-alpha, rgba(120, 119, 198, 0.15)) !important;
				}
			`}</style>
		</div>
	)
}
