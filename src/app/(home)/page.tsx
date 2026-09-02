'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import HeroSection from './components/hero-section'

const EditorialProjects = dynamic(() => import('./components/editorial-projects'), { ssr: false })
const NomadTrajectoryMap = dynamic(() => import('./components/nomad-trajectory-map'), { ssr: false })
const AudioCinemaLounge = dynamic(() => import('./components/audio-cinema-lounge'), { ssr: false })
const GeekIdentityBento = dynamic(
	() => import('@/components/geek-identity-bento').then((mod) => mod.GeekIdentityBento),
	{ ssr: false }
)

function LazySection({
	children,
	minHeight,
	rootMargin = '300px',
}: {
	children: React.ReactNode
	minHeight: string
	rootMargin?: string
}) {
	const [isVisible, setIsVisible] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isVisible) return
		const el = containerRef.current
		if (!el) return
		if (typeof IntersectionObserver === 'undefined') {
			setIsVisible(true)
			return
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setIsVisible(true)
					observer.disconnect()
				}
			},
			{ rootMargin }
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [isVisible, rootMargin])

	return (
		<div ref={containerRef} className="w-full" style={{ minHeight: isVisible ? undefined : minHeight }}>
			{isVisible ? children : <div style={{ height: minHeight }} aria-hidden="true" />}
		</div>
	)
}

export default function Home() {
	return (
		<main className="relative w-full min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-primary)] overflow-hidden transition-colors duration-300">
			{/* Minimalist dot grid background */}
			<div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

			<div className="relative z-10 w-full flex flex-col items-center pb-24">
				{/* 1. 原版第一个页面：3D 卡片与双层 Orbit 卫星环绕系统 */}
				<HeroSection />

				{/* 2. 极客全景看板：Magic UI Bento Grid (Engineering, Nomad Time, Vinyl, GitHub, Setup) */}
				<LazySection minHeight="720px">
					<section className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20 pt-6">
						<div className="flex flex-col items-center text-center mb-8 sm:mb-12">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 mb-3 shadow-xs">
								<span>✦ Digital Identity</span>
							</div>
							<h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-primary)]">
								极客全景看板
							</h2>
							<p className="text-xs sm:text-sm text-[var(--color-secondary)] max-w-md mt-2 leading-relaxed opacity-90 font-medium">
								工程哲学 · 数字游民 · 黑胶声浪 · 开源脉冲 · 桌面生产力
							</p>
						</div>
						<GeekIdentityBento />
					</section>
				</LazySection>

				{/* 3. 项目展示：Selected Works 3 联 App Browser Mockup */}
				<LazySection minHeight="620px">
					<EditorialProjects />
				</LazySection>

				{/* 4. 足迹航线：Nomad Trajectory 真实地理矢量地图与图钉挂照 */}
				<LazySection minHeight="720px">
					<NomadTrajectoryMap />
				</LazySection>

				{/* 5. 影音书香客厅：Audio & Cinema Lounge 黑胶唱机与全分类画廊展架 */}
				<LazySection minHeight="850px">
					<AudioCinemaLounge />
				</LazySection>
			</div>
		</main>
	)
}
