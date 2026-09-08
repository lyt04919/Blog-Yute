'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { Book, Film, Home, Search, Lock, Unlock, Mail, MapPin, Map } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function CommandMenu() {
	const [open, setOpen] = useState(false)
	const router = useRouter()
	const { isAuth, clearAuth, setAuthModalOpen } = useAuthStore()

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((open) => !open)
			}
		}

		document.addEventListener('keydown', down)
		return () => document.removeEventListener('keydown', down)
	}, [])

	const runCommand = (command: () => unknown) => {
		setOpen(false)
		command()
	}

	return (
		<AnimatePresence>
			{open && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
					<motion.div
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.97 }}
						transition={{ duration: 0.15 }}
						className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<Command label="Global Command Menu">
							<div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
								<Search className="w-4 h-4 text-slate-400 shrink-0" />
								<Command.Input 
									placeholder="Type a command or search..."
									className="w-full h-12 pl-3 text-sm text-slate-900 dark:text-slate-100 bg-transparent placeholder-slate-400 focus:outline-none"
								/>
							</div>

							<Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
								<Command.Empty className="py-6 text-sm text-center text-slate-500">No results found.</Command.Empty>

								<Command.Group heading="Navigation" className="text-xs font-semibold tracking-wider text-slate-400 px-2 py-2 uppercase">
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 aria-selected:text-blue-600 dark:aria-selected:text-blue-400 transition-colors"
									>
										<Home className="w-4 h-4" />
										<span>Home</span>
									</Command.Item>
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/report'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 aria-selected:text-blue-600 dark:aria-selected:text-blue-400 transition-colors"
									>
										<span className="text-base">✨</span>
										<span>Annual Report (Dashboard)</span>
									</Command.Item>
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/space'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 aria-selected:text-blue-600 dark:aria-selected:text-blue-400 transition-colors"
									>
										<MapPin className="w-4 h-4" />
										<span>Space Map (空间地图)</span>
									</Command.Item>
								</Command.Group>

								<Command.Group heading="Favorites" className="text-xs font-semibold tracking-wider text-slate-400 px-2 py-2 uppercase mt-2">
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/favorite/books'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-purple-50 dark:aria-selected:bg-purple-900/30 aria-selected:text-purple-600 dark:aria-selected:text-purple-400 transition-colors"
									>
										<Book className="w-4 h-4" />
										<span>Books Showcase</span>
									</Command.Item>
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/favorite/movies'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-purple-50 dark:aria-selected:bg-purple-900/30 aria-selected:text-purple-600 dark:aria-selected:text-purple-400 transition-colors"
									>
										<Film className="w-4 h-4" />
										<span>Movies Showcase</span>
									</Command.Item>
								</Command.Group>

								<Command.Group heading="Author Actions" className="text-xs font-semibold tracking-wider text-slate-400 px-2 py-2 uppercase mt-2">
									<Command.Item 
										onSelect={() => runCommand(() => {
											if (isAuth) {
												clearAuth()
												toast.success('已切换至访客模式')
											} else {
												setAuthModalOpen(true)
											}
										})}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
									>
										{isAuth ? <Unlock className="w-4 h-4 text-amber-500" /> : <Lock className="w-4 h-4" />}
										<span>{isAuth ? '退出作者模式 (当前已解锁)' : '解锁作者模式 (输入密码)'}</span>
									</Command.Item>
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/vault'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
									>
										<Lock className="w-4 h-4" />
										<span>Vault (Management)</span>
									</Command.Item>
									<Command.Item 
										onSelect={() => runCommand(() => router.push('/vault/footprints'))}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
									>
										<Map className="w-4 h-4" />
										<span>Manage Spaces (空间管理)</span>
									</Command.Item>
									<Command.Item 
										onSelect={() => {
											runCommand(() => navigator.clipboard.writeText('hello@example.com'))
											alert('Email copied to clipboard!')
										}}
										className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 transition-colors"
									>
										<Mail className="w-4 h-4" />
										<span>Copy Email</span>
									</Command.Item>
								</Command.Group>
							</Command.List>
						</Command>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	)
}
