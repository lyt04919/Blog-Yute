'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlignLeft } from 'lucide-react'
import clsx from 'clsx'

interface HeadingItem {
	text: string
	level: number
	line: number
}

interface WriteEditorTocProps {
	markdown: string
	activeLine: number
	onHeadingClick: (line: number) => void
}

export function WriteEditorToc({ markdown, activeLine, onHeadingClick }: WriteEditorTocProps) {
	const [isOpen, setIsOpen] = useState(false)

	// Parse headings from markdown content
	const headings = useMemo(() => {
		const lines = (markdown || '').split('\n')
		const list: HeadingItem[] = []
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim()
			// Matches H1 (#), H2 (##), H3 (###) headings
			const match = line.match(/^(#{1,3})\s+(.+)$/)
			if (match) {
				list.push({
					level: match[1].length,
					text: match[2].trim(),
					line: i + 1
				})
			}
		}
		return list
	}, [markdown])

	// Find the active heading index (the closest heading above or at activeLine)
	const activeIndex = useMemo(() => {
		let index = -1
		for (let i = 0; i < headings.length; i++) {
			if (headings[i].line <= activeLine) {
				index = i
			} else {
				break
			}
		}
		return index
	}, [headings, activeLine])

	return (
		<div className="absolute right-full top-0 mr-4 h-full hidden xl:flex items-start z-30">
			<div className="relative">
				{/* Toggle Button */}
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className={clsx(
						"flex h-10 w-10 items-center justify-center rounded-xl border bg-card/65 text-secondary backdrop-blur-md transition-all hover:text-brand",
						isOpen ? "border-brand text-brand shadow" : "shadow-sm"
					)}
					title="文章目录大纲"
				>
					<AlignLeft className="h-5 w-5" />
				</button>

				{/* Collapsible Panel */}
				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ width: 0, opacity: 0, scale: 0.95 }}
							animate={{ width: 220, opacity: 1, scale: 1 }}
							exit={{ width: 0, opacity: 0, scale: 0.95 }}
							transition={{ type: 'spring', damping: 20, stiffness: 200 }}
							className="absolute top-12 left-0 bg-card w-[220px] rounded-2xl border p-4 shadow-lg backdrop-blur-md flex flex-col origin-top-left"
							style={{ maxHeight: '500px' }}
						>
							<div className="mb-3 flex items-center justify-between border-b pb-2">
								<h3 className="text-xs font-semibold text-primary tracking-wider uppercase">文章大纲</h3>
								<span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
									{headings.length} 个章节
								</span>
							</div>
							
							<div className="scrollbar-none flex-1 overflow-y-auto space-y-1 pr-1 max-h-[400px]">
								{headings.length === 0 ? (
									<p className="text-xs text-[#a1a1aa] italic text-center py-4">暂无标题</p>
								) : (
									headings.map((item, idx) => {
										const isActive = idx === activeIndex
										return (
											<button
												key={idx}
												type="button"
												onClick={() => onHeadingClick(item.line)}
												className={clsx(
													"text-left text-xs transition-all block w-full truncate py-1.5 rounded-lg pr-2 border-l-2",
													isActive 
														? "text-brand font-medium border-brand bg-brand/5 pl-2" 
														: "text-secondary border-transparent hover:bg-[#f4f4f5]/35 hover:text-primary pl-3"
												)}
												style={{ 
													paddingLeft: isActive 
														? undefined 
														: `${(item.level - 1) * 8 + 12}px` 
												}}
											>
												{item.text}
											</button>
										)
									})
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}
