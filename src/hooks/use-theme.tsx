'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
	theme: Theme
	resolvedTheme: 'light' | 'dark'
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
	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
		if (typeof window === 'undefined') return 'light'
		return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
	})
	const [mounted, setMounted] = useState(false)
	const [isSwitching, setIsSwitching] = useState(false)

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

	const toggleTheme = useCallback((target?: React.MouseEvent | { clientX: number; clientY: number } | HTMLElement) => {
		const nextTheme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'light' : 'dark'

		const motionOK =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: no-preference)').matches

		const root = typeof document !== 'undefined' ? document.documentElement : null
		if (!root) {
			setTheme(nextTheme)
			return
		}

		let buttonEl: HTMLElement | null = null
		let x: number | undefined
		let y: number | undefined

		if (target instanceof HTMLElement) {
			buttonEl = target
			const rect = buttonEl.getBoundingClientRect()
			x = rect.left + rect.width / 2
			y = rect.top + rect.height / 2
		} else if (target && 'currentTarget' in target && (target.currentTarget as HTMLElement) instanceof HTMLElement) {
			buttonEl = target.currentTarget as HTMLElement
			const rect = buttonEl.getBoundingClientRect()
			x = rect.left + rect.width / 2
			y = rect.top + rect.height / 2
		} else if (target && 'clientX' in target && typeof target.clientX === 'number') {
			x = target.clientX
			y = target.clientY
			buttonEl = document.querySelector<HTMLElement>('[data-theme-toggle]')
		} else {
			buttonEl = document.querySelector<HTMLElement>('[data-theme-toggle]')
			if (buttonEl) {
				const rect = buttonEl.getBoundingClientRect()
				x = rect.left + rect.width / 2
				y = rect.top + rect.height / 2
			} else {
				x = window.innerWidth / 2
				y = window.innerHeight / 2
			}
		}

		if (motionOK && typeof document !== 'undefined' && 'startViewTransition' in document && x !== undefined && y !== undefined) {
			const endRadius =
				Math.hypot(
					Math.max(x, window.innerWidth - x),
					Math.max(y, window.innerHeight - y)
				) + 20

			setIsSwitching(true)
			root.classList.add('theme-vt')
			buttonEl?.classList.add('is-switching')

			const vt = (document as any).startViewTransition(() => {
				setTheme(nextTheme)
			})

			vt.ready?.then(() => {
				document.documentElement.animate(
					{
						clipPath: [
							`circle(0px at ${x}px ${y}px)`,
							`circle(${endRadius}px at ${x}px ${y}px)`
						]
					},
					{
						duration: 650,
						easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
						pseudoElement: '::view-transition-new(root)'
					}
				)
			})

			vt.finished
				.catch(() => {})
				.finally(() => {
					setIsSwitching(false)
					buttonEl?.classList.remove('is-switching')
					root.classList.remove('theme-vt')
				})
			return
		}

		// Fallback for browsers without View Transitions or when motion is reduced
		setTheme(nextTheme)
		if (motionOK) {
			root.classList.remove('theme-anim')
			void root.offsetWidth
			root.classList.add('theme-anim')
			window.setTimeout(() => root.classList.remove('theme-anim'), 380)
		}
	}, [resolvedTheme, setTheme])

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, isSwitching, setTheme, toggleTheme }}>
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
			setTheme: () => {},
			toggleTheme: () => {}
		}
	}
	return context
}
