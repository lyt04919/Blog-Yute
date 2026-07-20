'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
	theme: Theme
	resolvedTheme: 'light' | 'dark'
	setTheme: (theme: Theme) => void
	toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'blog-theme'

const lightColors = {
	'--color-primary': '#111111',
	'--color-secondary': '#666666',
	'--color-brand-secondary': '#A0A0A0',
	'--color-bg': '#FAFAFA',
	'--color-border': '#E5E5E5',
	'--color-brand': '#111111',
	'--color-card': '#FFFFFF99',
	'--color-article': '#FFFFFF',
	'--color-accent': '#888888',
}

const darkColors = {
	'--color-primary': '#FFFFFF',
	'--color-secondary': '#A0A0A0',
	'--color-brand-secondary': '#00F0FF',
	'--color-bg': '#0A0A0A',
	'--color-border': '#222222',
	'--color-brand': '#00FF41',
	'--color-card': '#111111',
	'--color-article': '#111111',
	'--color-accent': '#00FF41',
}

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

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') return getSystemTheme()
	return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('system')
	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
	const [mounted, setMounted] = useState(false)

	// Apply theme colors directly to document
	const applyTheme = useCallback((newTheme: Theme) => {
		const resolved = getResolvedTheme(newTheme)
		setResolvedTheme(resolved)

		const root = document.documentElement
		const colors = resolved === 'dark' ? darkColors : lightColors

		Object.entries(colors).forEach(([key, value]) => {
			root.style.setProperty(key, value)
		})

		// Also toggle class for any CSS that uses .dark selector
		if (resolved === 'dark') {
			root.classList.add('dark')
		} else {
			root.classList.remove('dark')
		}
	}, [])

	useEffect(() => {
		const stored = getStoredTheme()
		const initialTheme = stored || 'system'
		setThemeState(initialTheme)
		applyTheme(initialTheme)
		setMounted(true)
	}, [applyTheme])

	useEffect(() => {
		if (!mounted) return
		applyTheme(theme)
	}, [theme, mounted, applyTheme])

	useEffect(() => {
		if (!mounted) return

		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = (e: MediaQueryListEvent) => {
			if (theme === 'system') {
				applyTheme('system')
			}
		}

		media.addEventListener('change', handler)
		return () => media.removeEventListener('change', handler)
	}, [theme, mounted, applyTheme])

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme)
		try {
			localStorage.setItem(STORAGE_KEY, newTheme)
		} catch {
			// ignore
		}
	}, [])

	const toggleTheme = useCallback(() => {
		const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
		setTheme(newTheme)
	}, [resolvedTheme, setTheme])

	// We remove the early return during !mounted to ensure Server Rendering matches the wrapper structure
	// Next.js handles suppressHydrationWarning on html tag which prevents mismatches for the .dark class

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		// Return default values when used outside ThemeProvider (SSR safety)
		return {
			theme: 'system' as Theme,
			resolvedTheme: 'light' as 'light' | 'dark',
			setTheme: () => {},
			toggleTheme: () => {}
		}
	}
	return context
}
