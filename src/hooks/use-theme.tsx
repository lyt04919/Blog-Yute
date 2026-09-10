'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
	theme: Theme
	resolvedTheme: 'light' | 'dark'
	mounted: boolean
	isSwitching?: boolean
	setTheme: (theme: Theme) => void
	toggleTheme: (e?: React.MouseEvent | { clientX: number; clientY: number } | HTMLElement) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'blog-theme'

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light'
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
	if (typeof window === 'undefined') return null
	try {
		return localStorage.getItem(STORAGE_KEY) as Theme | null
	} catch {
		return null
	}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('system')
	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
	const [mounted, setMounted] = useState(false)
	const [isSwitching, setIsSwitching] = useState(false)
	const isTransitioningRef = useRef(false)

	const syncDOM = useCallback((currentTheme: 'light' | 'dark') => {
		const root = document.documentElement
		if (currentTheme === 'dark') {
			root.classList.add('dark')
		} else {
			root.classList.remove('dark')
		}
		root.setAttribute('data-theme', currentTheme)
	}, [])

	useEffect(() => {
		const stored = getStoredTheme()
		const initialTheme = stored || 'system'
		setThemeState(initialTheme)
		const resolved = initialTheme === 'system' ? getSystemTheme() : initialTheme
		setResolvedTheme(resolved)
		syncDOM(resolved)
		setMounted(true)
	}, [syncDOM])

	// Listen for OS theme preference changes
	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = () => {
			if (theme === 'system') {
				const resolved = getSystemTheme()
				setResolvedTheme(resolved)
				syncDOM(resolved)
			}
		}
		media.addEventListener('change', handler)
		return () => media.removeEventListener('change', handler)
	}, [theme, syncDOM])

	// Sync across tabs via storage event
	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY && e.newValue) {
				const newTheme = e.newValue as Theme
				setThemeState(newTheme)
				const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
				setResolvedTheme(resolved)
				syncDOM(resolved)
			}
		}
		window.addEventListener('storage', handleStorage)
		return () => window.removeEventListener('storage', handleStorage)
	}, [syncDOM])

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme)
		try {
			localStorage.setItem(STORAGE_KEY, newTheme)
		} catch {
			// ignore
		}
		const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
		setResolvedTheme(resolved)
		syncDOM(resolved)
	}, [syncDOM])

	const toggleTheme = useCallback((event?: React.MouseEvent | { clientX: number; clientY: number } | HTMLElement) => {
		if (isTransitioningRef.current) return

		const nextTheme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'light' : 'dark'

		const isReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches

		const root = typeof document !== 'undefined' ? document.documentElement : null
		if (!root) {
			setTheme(nextTheme)
			return
		}

		// 确定扩散起点：优先以切换按钮的几何中心为绝对原点向外扩散
		const vw = typeof window !== 'undefined' ? (document.documentElement.clientWidth || window.innerWidth) : 1920
		const vh = typeof window !== 'undefined' ? (document.documentElement.clientHeight || window.innerHeight) : 1080

		let x = vw / 2
		let y = vh / 2

		const buttonEl =
			(event instanceof HTMLElement ? event : null) ??
			(event && 'currentTarget' in event && (event.currentTarget as HTMLElement) instanceof HTMLElement
				? (event.currentTarget as HTMLElement)
				: null) ??
			(typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-theme-toggle]') : null)

		if (buttonEl) {
			const rect = buttonEl.getBoundingClientRect()
			x = rect.left + rect.width / 2
			y = rect.top + rect.height / 2
		} else if (event && 'clientX' in event && typeof event.clientX === 'number' && event.clientX > 0) {
			x = event.clientX
			y = event.clientY
		}

		// 使用归一化视口百分比坐标，根治 Mac Retina (2x/3x) 高分屏下绝对 px 坐标造成的圆心漂移
		const xPercent = (x / vw) * 100
		const yPercent = (y / vh) * 100

		// 计算按钮到视口最远角落的真实最大几何距离（px），确保涟漪能 100% 完整覆盖全屏四角
		const maxRadius = Math.ceil(
			Math.hypot(
				Math.max(x, vw - x),
				Math.max(y, vh - y)
			) + 60
		)

		if (!isReducedMotion && typeof document !== 'undefined' && 'startViewTransition' in document) {
			isTransitioningRef.current = true
			root.classList.add('theme-vt')

			const transition = (document as any).startViewTransition(() => {
				flushSync(() => {
					setTheme(nextTheme)
				})
			})

			transition.ready
				?.then(() => {
					// 1. 确保旧画面在整个 1200ms 扩散周期内受到主动合成与绘制，绝对杜绝组件和文字瞬隐消失
					document.documentElement.animate(
						{
							opacity: [1, 1]
						},
						{
							duration: 1200,
							fill: 'forwards',
							pseudoElement: '::view-transition-old(root)'
						}
					)

					// 2. 新主题画面以切换按钮为圆心，向外平滑扩散涟漪直至覆盖全屏
					document.documentElement.animate(
						{
							clipPath: [
								`circle(0px at ${xPercent.toFixed(4)}% ${yPercent.toFixed(4)}%)`,
								`circle(${maxRadius}px at ${xPercent.toFixed(4)}% ${yPercent.toFixed(4)}%)`
							]
						},
						{
							duration: 1200,
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
							fill: 'forwards',
							pseudoElement: '::view-transition-new(root)'
						}
					)
				})
				.catch(() => {})

			transition.finished
				.catch(() => {})
				.finally(() => {
					isTransitioningRef.current = false
					root.classList.remove('theme-vt')
				})
			return
		}

		// Fallback for browsers without View Transitions or when motion is reduced
		setTheme(nextTheme)
		if (!isReducedMotion) {
			root.classList.remove('theme-anim')
			void root.offsetWidth
			root.classList.add('theme-anim')
			window.setTimeout(() => root.classList.remove('theme-anim'), 380)
		}
	}, [resolvedTheme, setTheme])

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, mounted, isSwitching, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		return {
			theme: 'system' as Theme,
			resolvedTheme: 'light' as 'light' | 'dark',
			mounted: false,
			setTheme: () => {},
			toggleTheme: () => {}
		}
	}
	return context
}
