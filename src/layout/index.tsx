'use client'
import { PropsWithChildren } from 'react'
import { useCenterInit } from '@/hooks/use-center'
import TopNav from '@/components/top-nav'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useSize, useSizeInit } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { ScrollTopButton } from '@/components/scroll-top-button'
import ModeToggle from '@/components/mode-toggle'
import { ThemeProvider } from '@/hooks/use-theme'
import Footer from './footer'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/hooks/use-auth'
import { NavigationProgressBar } from '@/components/navigation-progress-bar'

const ConfigDialog = dynamic(() => import('@/app/(home)/config-dialog'), { ssr: false })
const HomeDisplayModal = dynamic(() => import('@/app/(home)/components/home-display-modal').then(mod => mod.HomeDisplayModal), { ssr: false })
const MusicPlayerDock = dynamic(() => import('@/app/favorite/components/music-player-dock').then(mod => mod.MusicPlayerDock), { ssr: false })
const GlobalAudioEngine = dynamic(() => import('@/components/audio/global-audio-engine').then(mod => mod.GlobalAudioEngine), { ssr: false })

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useSizeInit()
	const { cardStyles, siteContent, configDialogOpen, setConfigDialogOpen } = useConfigStore()
	const { isAuth } = useAuthStore()
	const { maxSM, init } = useSize()

	const backgroundImages = (siteContent.backgroundImages ?? []) as Array<{ id: string; url: string }>
	const currentBackgroundImageId = siteContent.currentBackgroundImageId
	const currentBackgroundImage =
		currentBackgroundImageId && currentBackgroundImageId.trim() ? backgroundImages.find(item => item.id === currentBackgroundImageId) : null

	useEffect(() => {
		const handler = (e: ErrorEvent) => {
			fetch('/api/log-error', { method: 'POST', body: e.message + '\n' + e.error?.stack })
		}
		window.addEventListener('error', handler)
		const rejectionHandler = (e: PromiseRejectionEvent) => {
			fetch('/api/log-error', { method: 'POST', body: 'Unhandled Rejection: ' + e.reason })
		}
		window.addEventListener('unhandledrejection', rejectionHandler)
		return () => {
			window.removeEventListener('error', handler)
			window.removeEventListener('unhandledrejection', rejectionHandler)
		}
	}, [])

	const pathname = usePathname()
	const isHome = pathname === '/'
	const isFullMap = pathname === '/space'
	const isWrite = pathname?.startsWith('/write')

	return (
		<ThemeProvider>
			<NavigationProgressBar />
			<Toaster
				position='bottom-right'
				richColors
				icons={{
					success: <CircleCheckIcon className='size-4' />,
					info: <InfoIcon className='size-4' />,
					warning: <TriangleAlertIcon className='size-4' />,
					error: <OctagonXIcon className='size-4' />,
					loading: <Loader2Icon className='size-4 animate-spin' />
				}}
				style={
					{
						'--border-radius': '12px'
					} as React.CSSProperties
				}
			/>
			{!isHome && !isFullMap && currentBackgroundImage && (
				<div
					className='fixed inset-0 z-0 overflow-hidden'
					style={{
						backgroundImage: `url(${currentBackgroundImage.url})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundRepeat: 'no-repeat'
					}}
				/>
			)}

			<main className={
				isFullMap 
					? 'relative z-10 w-full h-screen overflow-hidden' 
					: isHome 
						? 'relative z-10 w-full min-h-screen' 
						: 'relative z-10 min-h-full pt-8 pb-40'
			}>
				{children}
			</main>

			<ModeToggle />
			{isAuth && configDialogOpen && (
				<ConfigDialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} />
			)}
			{isAuth && <HomeDisplayModal />}
			{!isWrite && <TopNav />}
			<GlobalAudioEngine />
			{!isWrite && <MusicPlayerDock />}

			{!isFullMap && !isWrite && init && <ScrollTopButton className='bg-brand/20 fixed right-6 bottom-24 z-40 shadow-md' />}
			{!isHome && !isFullMap && <Footer />}
		</ThemeProvider>
	)
}
