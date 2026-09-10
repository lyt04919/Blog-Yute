'use client'

import { useCallback } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

interface ThemeToggleButtonProps {
	className?: string
	showLabel?: boolean
}

export function ThemeToggleButton({ className = '', showLabel = false }: ThemeToggleButtonProps) {
	const { resolvedTheme, toggleTheme, isSwitching } = useTheme()
	const isDark = resolvedTheme === 'dark'

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.stopPropagation()
			const rect = e.currentTarget.getBoundingClientRect()
			const coords = {
				clientX: Math.round(rect.left + rect.width / 2),
				clientY: Math.round(rect.top + rect.height / 2)
			}
			toggleTheme(coords)
		},
		[toggleTheme]
	)

	return (
		<button
			type="button"
			onClick={handleClick}
			data-theme-toggle=""
			data-theme-icon={resolvedTheme}
			role="switch"
			aria-checked={isDark}
			aria-pressed={isDark}
			aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
			title={isDark ? '切换浅色模式' : '切换深色模式'}
			className={`theme-toggle size-full cursor-pointer transition-colors border-0 outline-none p-0 ${isSwitching ? 'is-switching' : ''} ${className}`}
		>
			{/* 暗色模式只显示月亮，浅色模式只显示太阳 */}
			{isDark ? (
				<Moon className="theme-toggle__moon size-full p-0.5" aria-hidden="true" />
			) : (
				<Sun className="theme-toggle__sun size-full p-0.5" aria-hidden="true" />
			)}

			{showLabel && (
				<span className="sr-only">
					{isDark ? '切换到浅色模式' : '切换到深色模式'}
				</span>
			)}
		</button>
	)
}

export default ThemeToggleButton
