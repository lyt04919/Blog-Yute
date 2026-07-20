'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Unlock, Lock, X, Settings } from 'lucide-react'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { toast } from 'sonner'
import clsx from 'clsx'

export default function ModeToggle() {
	const { isAuth, setPassword, clearAuth } = useAuthStore()
	const [isOpen, setIsOpen] = useState(false)
	const [pwd, setPwd] = useState('')

	const { siteContent, configDialogOpen, setConfigDialogOpen } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isAuth && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setConfigDialogOpen(!configDialogOpen)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isAuth, configDialogOpen, setConfigDialogOpen])

	const handleToggle = () => {
		if (isAuth) {
			clearAuth()
			toast.success('已切换至访客模式')
		} else {
			setIsOpen(true)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await setPassword(pwd)
			setIsOpen(false)
			setPwd('')
			toast.success('已切换至作者模式')
		} catch (error: any) {
			toast.error(error.message || '密码错误')
		}
	}

	return (
		<>
			{/* Top Right Toggle Button */}
			<motion.button
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				onClick={handleToggle}
				className={clsx(
					"fixed top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-colors border",
					isAuth 
						? "bg-brand/10 border-brand/20 text-brand hover:bg-brand/20" 
						: "bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-zinc-800/80"
				)}
				title={isAuth ? "当前为作者模式 (点击退出)" : "当前为访客模式 (点击解锁)"}
			>
				{isAuth ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
			</motion.button>

			{/* Password Modal */}
			<AnimatePresence>
				{isOpen && (
					<div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsOpen(false)}
							className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6"
						>
							<button 
								onClick={() => setIsOpen(false)}
								className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
							>
								<X className="h-5 w-5" />
							</button>
							
							<div className="mb-6 flex flex-col items-center text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
									<User className="h-6 w-6" />
								</div>
								<h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">作者模式</h3>
								<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">请输入密码解锁完整权限</p>
							</div>

							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
								<input
									type="password"
									value={pwd}
									onChange={e => setPwd(e.target.value)}
									placeholder="密码"
									className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand dark:text-zinc-100"
									autoFocus
								/>
								<button
									type="submit"
									className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition-all hover:bg-brand/90 active:scale-[0.98]"
								>
									解锁
								</button>
							</form>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	)
}
