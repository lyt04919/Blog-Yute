'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgressBar() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [progress, setProgress] = useState(0)
	const [visible, setVisible] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const autoFinishTimerRef = useRef<NodeJS.Timeout | null>(null)

	const startLoading = () => {
		if (timerRef.current) clearInterval(timerRef.current)
		if (autoFinishTimerRef.current) clearTimeout(autoFinishTimerRef.current)

		setVisible(true)
		setProgress(15)

		timerRef.current = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 90) {
					if (timerRef.current) clearInterval(timerRef.current)
					return 90
				}
				const diff = (90 - prev) * 0.18
				return prev + Math.max(diff, 1)
			})
		}, 80)

		// 10s safety timeout to prevent infinite stuck progress bar
		autoFinishTimerRef.current = setTimeout(() => {
			completeLoading()
		}, 10000)
	}

	const completeLoading = () => {
		if (timerRef.current) clearInterval(timerRef.current)
		if (autoFinishTimerRef.current) clearTimeout(autoFinishTimerRef.current)

		setProgress(100)
		const hideTimer = setTimeout(() => {
			setVisible(false)
			setProgress(0)
		}, 250)

		return () => clearTimeout(hideTimer)
	}

	// Route transition completed when pathname or searchParams changes
	useEffect(() => {
		completeLoading()
	}, [pathname, searchParams])

	// Intercept all internal navigation link clicks
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			// Ignore if already prevented or modified click (cmd/ctrl/shift/alt)
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
				return
			}

			// Find closest <a> tag
			let target = e.target as HTMLElement | null
			while (target && target.tagName !== 'A') {
				target = target.parentElement
			}

			if (!target || target.tagName !== 'A') return

			const anchor = target as HTMLAnchorElement
			const href = anchor.getAttribute('href')

			// Ignore anchors, javascript:, external links, and new tabs
			if (!href || href.startsWith('#') || href.startsWith('javascript:') || anchor.target === '_blank') {
				return
			}

			// Check origin
			const currentOrigin = window.location.origin
			let targetUrl: URL
			try {
				targetUrl = new URL(anchor.href, currentOrigin)
			} catch {
				return
			}

			if (targetUrl.origin !== currentOrigin) {
				return
			}

			// If navigating to the exact same full path + search, do not start
			const currentUrl = new URL(window.location.href)
			if (
				targetUrl.pathname === currentUrl.pathname &&
				targetUrl.search === currentUrl.search
			) {
				return
			}

			startLoading()
		}

		const handlePopState = () => {
			startLoading()
		}

		window.addEventListener('click', handleClick, true)
		window.addEventListener('popstate', handlePopState)

		return () => {
			window.removeEventListener('click', handleClick, true)
			window.removeEventListener('popstate', handlePopState)
			if (timerRef.current) clearInterval(timerRef.current)
			if (autoFinishTimerRef.current) clearTimeout(autoFinishTimerRef.current)
		}
	}, [])

	if (!visible && progress === 0) return null

	return (
		<div
			aria-hidden="true"
			className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px]"
		>
			<div
				className="h-full bg-gradient-to-r from-brand via-orange-400 to-amber-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-all ease-out"
				style={{
					width: `${progress}%`,
					transitionDuration: progress === 100 ? '200ms' : '120ms',
					opacity: visible ? 1 : 0,
				}}
			/>
		</div>
	)
}
