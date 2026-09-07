'use client'

import { useCallback } from 'react'
import { useTheme } from '@/hooks/use-theme'

// Synthesize lightweight haptic click/pop without external audio files
function playHapticTick(targetDark: boolean) {
	if (typeof window === 'undefined') return
	try {
		const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
		if (!AudioCtx) return
		const ctx = new AudioCtx()
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()

		osc.type = 'sine'
		// 880Hz pop for light, warm 440Hz tick for dark
		osc.frequency.setValueAtTime(targetDark ? 440 : 880, ctx.currentTime)
		osc.frequency.exponentialRampToValueAtTime(targetDark ? 220 : 440, ctx.currentTime + 0.035)

		gain.gain.setValueAtTime(0.04, ctx.currentTime)
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)

		osc.connect(gain)
		gain.connect(ctx.destination)
		osc.start()
		osc.stop(ctx.currentTime + 0.035)
	} catch {}
}

interface ThemeToggleButtonProps {
	className?: string
	showLabel?: boolean
}

export function ThemeToggleButton({ className = '', showLabel = false }: ThemeToggleButtonProps) {
	const { resolvedTheme, toggleTheme, isSwitching } = useTheme()
	const isDark = resolvedTheme === 'dark'

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			playHapticTick(!isDark)
			toggleTheme(e.currentTarget)
		},
		[isDark, toggleTheme]
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
			className={`theme-toggle size-full flex items-center justify-center rounded-full cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${isSwitching ? 'is-switching' : ''} ${className}`}
		>
			{/* Moon icon from clay-blog */}
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="theme-toggle__moon size-5 p-0.5"
				aria-hidden="true"
			>
				<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
			</svg>

			{/* Sun icon from clay-blog */}
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="theme-toggle__sun size-5 p-0.5"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
			</svg>

			{showLabel && (
				<span className="sr-only">
					{isDark ? '切换到浅色模式' : '切换到深色模式'}
				</span>
			)}
		</button>
	)
}

export default ThemeToggleButton
