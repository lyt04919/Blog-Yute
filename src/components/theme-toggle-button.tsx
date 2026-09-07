'use client'

import { useCallback } from 'react'
import { Sun, Moon } from 'lucide-react'
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
			e.stopPropagation()
			playHapticTick(!isDark)
			const rect = e.currentTarget.getBoundingClientRect()
			const coords = {
				clientX: Math.round(rect.left + rect.width / 2),
				clientY: Math.round(rect.top + rect.height / 2)
			}
			toggleTheme(coords)
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
			className={`theme-toggle size-full cursor-pointer transition-colors border-0 outline-none p-0 ${isSwitching ? 'is-switching' : ''} ${className}`}
		>
			{/* Moon icon (displayed in Light Mode to toggle to Dark) */}
			<Moon className="theme-toggle__moon size-full p-0.5" aria-hidden="true" />

			{/* Sun icon (displayed in Dark Mode to toggle to Light) */}
			<Sun className="theme-toggle__sun size-full p-0.5" aria-hidden="true" />

			{showLabel && (
				<span className="sr-only">
					{isDark ? '切换到浅色模式' : '切换到深色模式'}
				</span>
			)}
		</button>
	)
}

export default ThemeToggleButton
