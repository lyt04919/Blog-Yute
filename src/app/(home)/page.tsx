'use client'

import HeroSection from './components/hero-section'
import FeaturedProjects from './components/featured-projects'
import FootprintBento from './components/footprint-bento'
import LiveStatus from './components/live-status'
import RecentInsights from './components/recent-insights'

// Force rebuild trigger to clear next.js dev cache
export default function Home() {
	return (
		<main className="relative w-full min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-primary)] overflow-hidden">
			{/* High-fidelity background dot pattern */}
			<div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

			<div className="relative z-10 w-full flex flex-col gap-12 md:gap-20 pt-8 pb-36">
				{/* 1. Hero Bento Header */}
				<HeroSection />

				{/* 2. Featured Works 精选代表作与工具展柜 */}
				<FeaturedProjects />

				{/* 3. Live Status & Favorites 个人状态与收藏 */}
				<LiveStatus />

				{/* 4. Bento Dashboard 数字足迹 (旅行地图与相册) */}
				<FootprintBento />

				{/* 5. Recent Insights 最新文章 */}
				<RecentInsights />
			</div>
		</main>
	)
}
