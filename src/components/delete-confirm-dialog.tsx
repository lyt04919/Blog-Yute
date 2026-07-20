'use client'

import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeleteConfirmDialogProps {
	open: boolean
	count: number
	onConfirm: () => void
	onCancel: () => void
}

export function DeleteConfirmDialog({ open, count, onConfirm, onCancel }: DeleteConfirmDialogProps) {
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-[100] flex items-center justify-center p-4'
					onClick={onCancel}>
					<div className='absolute inset-0 bg-black/30 backdrop-blur-sm' />
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						onClick={e => e.stopPropagation()}
						className='relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl'>
						<button
							onClick={onCancel}
							className='absolute right-4 top-4 rounded-lg p-1 text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]'>
							<X className='h-4 w-4' />
						</button>

						<div className='flex flex-col items-center text-center'>
							<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20'>
								<AlertTriangle className='h-6 w-6 text-red-500 dark:text-red-400' />
							</div>

							<h3 className='mb-2 text-lg font-medium text-[var(--color-primary)]'>确认删除</h3>
							<p className='mb-6 text-sm text-[var(--color-secondary)]'>
								确定要删除选中的 <span className='font-semibold text-[var(--color-primary)]'>{count}</span> 篇文章吗？
								<br />
								此操作不可恢复。
							</p>

							<div className='flex w-full gap-3'>
								<button
									onClick={onCancel}
									className={cn(
										'flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium',
										'text-[var(--color-primary)] transition-colors hover:bg-[var(--color-card)]'
									)}>
									取消
								</button>
								<button
									onClick={onConfirm}
									className={cn(
										'flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white',
										'transition-colors hover:bg-red-600'
									)}>
									确认删除
								</button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
