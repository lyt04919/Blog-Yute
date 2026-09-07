'use client'

import { motion } from 'motion/react'
import { useTheme } from '@/hooks/use-theme'
import { useCallback } from 'react'

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
	const { resolvedTheme, toggleTheme } = useTheme()
	const isDark = resolvedTheme === 'dark'

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			playHapticTick(!isDark)
			toggleTheme(e)
		},
		[isDark, toggleTheme]
	)

	return (
		<motion.button
			onClick={handleClick}
			role="switch"
			aria-checked={isDark}
			aria-label={isDark ? '切换至亮色模式' : '切换至暗色模式'}
			title={isDark ? '切换亮色模式' : '切换暗色模式'}
			whileHover={{ scale: 1.08 }}
			whileTap={{ scale: 0.9 }}
			transition={{ type: 'spring', stiffness: 450, damping: 25 }}
			className={`relative flex items-center justify-center rounded-full cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}
		>
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="size-full p-1"
				animate={{ rotate: isDark ? 90 : 0 }}
				transition={{ type: 'spring', stiffness: 300, damping: 20 }}
			>
				{/* Mask creating the Moon crescent from the Sun sphere */}
				<mask id="moon-cutout-mask">
					<rect x="0" y="0" width="100%" height="100%" fill="white" />
					<motion.circle
						animate={{
							cx: isDark ? 19 : 30,
							cy: isDark ? 4 : -10,
							r: isDark ? 8 : 0
						}}
						transition={{ type: 'spring', stiffness: 350, damping: 25 }}
						fill="black"
					/>
				</mask>

				{/* Central Orb */}
				<motion.circle
					cx="12"
					cy="12"
					animate={{ r: isDark ? 8 : 4.5 }}
					mask="url(#moon-cutout-mask)"
					fill="currentColor"
					stroke="none"
					transition={{ type: 'spring', stiffness: 350, damping: 25 }}
				/>

				{/* Sun Rays - Smoothly collapse and fade out in Dark Mode */}
				<motion.g
					animate={{
						scale: isDark ? 0 : 1,
						opacity: isDark ? 0 : 1
					}}
					transition={{ duration: 0.2 }}
					style={{ originX: '12px', originY: '12px' }}
				>
					<line x1="12" y1="1" x2="12" y2="3" />
					<line x1="12" y1="21" x2="12" y2="23" />
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
					<line x1="1" y1="12" x2="3" y2="12" />
					<line x1="21" y1="12" x2="23" y2="12" />
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
				</motion.g>
			</motion.svg>
			{showLabel && (
				<span className="sr-only">
					{isDark ? '切换至亮色模式' : '切换至暗色模式'}
				</span>
			)}
		</motion.button>
	)
}

export default ThemeToggleButton
