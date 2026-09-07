'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useTheme } from '@/hooks/use-theme'
import { toast } from 'sonner'
import { Dock, DockIcon } from '@/components/magicui/dock'
import { ChevronUp, Globe } from 'lucide-react'
import { ThemeToggleButton } from '@/components/theme-toggle-button'

// Nav Icons
import ScrollOutlineSVG from '@/svgs/scroll-outline.svg'
import ProjectsOutlineSVG from '@/svgs/projects-outline.svg'
import AboutOutlineSVG from '@/svgs/about-outline.svg'
import ShareOutlineSVG from '@/svgs/share-outline.svg'
import WebsiteOutlineSVG from '@/svgs/website-outline.svg'
import DiaryOutlineSVG from '@/svgs/diary-outline.svg'
import BooksOutlineSVG from '@/svgs/books-outline.svg'

// Social Icons
import GithubSVG from '@/svgs/github.svg'
import JuejinSVG from '@/svgs/juejin.svg'
import EmailSVG from '@/svgs/email.svg'
import XSVG from '@/svgs/x.svg'
import TgSVG from '@/svgs/tg.svg'
import WechatSVG from '@/svgs/wechat.svg'
import FacebookSVG from '@/svgs/facebook.svg'
import TiktokSVG from '@/svgs/tiktok.svg'
import InstagramSVG from '@/svgs/instagram.svg'
import WeiboSVG from '@/svgs/weibo.svg'
import XiaohongshuSVG from '@/svgs/小红书.svg'
import ZhihuSVG from '@/svgs/知乎.svg'
import BilibiliSVG from '@/svgs/哔哩哔哩.svg'
import QqSVG from '@/svgs/qq.svg'

const navList = [
	{ icon: ScrollOutlineSVG, label: 'Blog', href: '/blog' },
	{ icon: ProjectsOutlineSVG, label: 'Projects', href: '/projects' },
	{ icon: DiaryOutlineSVG, label: 'Diary', href: '/vault/diary' },
	{ icon: BooksOutlineSVG, label: 'Favorite', href: '/favorite' },
	{ icon: Globe, label: 'Footprints', href: '/space' }
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	github: GithubSVG,
	juejin: JuejinSVG,
	email: EmailSVG,
	wechat: WechatSVG,
	x: XSVG,
	tg: TgSVG,
	facebook: FacebookSVG,
	tiktok: TiktokSVG,
	instagram: InstagramSVG,
	weibo: WeiboSVG,
	xiaohongshu: XiaohongshuSVG,
	zhihu: ZhihuSVG,
	bilibili: BilibiliSVG,
	qq: QqSVG,
	link: () => null
}

const TooltipWrapper = ({ children, content, href, onClick, external }: { children: React.ReactNode, content: string, href?: string, onClick?: () => void, external?: boolean }) => {
	const contentNode = (
		<div className="relative group/tooltip flex items-center justify-center size-full">
			{children}
			<div className="absolute bottom-full mb-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none scale-95 group-hover/tooltip:scale-100 ease-out flex-col items-center flex z-[100]">
				<div className="bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-primary)] px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xl whitespace-nowrap">
					{content}
				</div>
				<div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--color-card)]" />
			</div>
		</div>
	)

	if (href) {
		if (external) {
			return <a href={href} target="_blank" className="size-full block">{contentNode}</a>
		}
		return <Link href={href} className="size-full block">{contentNode}</Link>
	}

	if (onClick) {
		return <button onClick={onClick} className="size-full block">{contentNode}</button>
	}

	return <div className="size-full">{contentNode}</div>
}

export default function TopNav() {
	const pathname = usePathname()
	const { siteContent } = useConfigStore()
	const activeNavList = navList

	const { resolvedTheme, toggleTheme } = useTheme()

	const [isDockVisible, setIsDockVisible] = useState(true)

	const activeIndex = useMemo(() => {
		const index = activeNavList.findIndex(item => pathname === item.href)
		return index >= 0 ? index : -1
	}, [pathname, activeNavList])

	const sortedSocialButtons = useMemo(() => {
		const buttons = (siteContent.socialButtons || []) as any[]
		return [...buttons].sort((a, b) => a.order - b.order)
	}, [siteContent.socialButtons])

	const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
	const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node
			Object.keys(openDropdowns).forEach(buttonId => {
				if (openDropdowns[buttonId]) {
					const buttonRef = buttonRefs.current[buttonId]
					const dropdownRef = dropdownRefs.current[buttonId]
					if (buttonRef && !buttonRef.contains(target) && dropdownRef && !dropdownRef.contains(target)) {
						setOpenDropdowns(prev => ({ ...prev, [buttonId]: false }))
					}
				}
			})
		}

		if (Object.values(openDropdowns).some(Boolean)) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => {
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}
	}, [openDropdowns])

	return (
		<>
			{/* Dock */}
			<AnimatePresence>
				{isDockVisible && (
					<motion.div
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 100, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						className="dock-nav-container fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
					>
						<Dock style={{ height: 56 }} iconMagnification={64} iconDistance={140} className="relative flex p-1.5 sm:p-2 w-fit gap-1.5 sm:gap-2 bg-white/95 dark:bg-[var(--color-card)]/90 border border-[#e4e4e7] dark:border-[var(--color-border)] backdrop-blur-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] shadow-black/5 rounded-full">

							{/* Home */}
							<DockIcon className="rounded-3xl cursor-pointer bg-white dark:bg-[var(--color-card)] border border-[#e4e4e7] dark:border-[var(--color-border)] shadow-sm">
							<TooltipWrapper content="Home" href="/">
								<img src='/images/avatar.png' alt='avatar' className='size-full object-cover rounded-3xl grayscale hover:grayscale-0 transition-transform p-0.5' />
							</TooltipWrapper>
							</DockIcon>

						{/* Nav Links */}
						{activeNavList.map((item, index) => {
							const isActive = activeIndex === index
							return (
								<DockIcon key={item.href} className={cn(
									"rounded-3xl cursor-pointer bg-white dark:bg-[var(--color-card)] border border-[#e4e4e7] dark:border-[var(--color-border)] shadow-sm relative",
									isActive ? "text-[var(--color-accent)]" : "text-[#52525b] dark:text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
									)}>
										{isActive && (
											<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]" />
										)}
										<TooltipWrapper content={item.label} href={item.href}>
											<item.icon className="size-full p-0.5" />
										</TooltipWrapper>
									</DockIcon>
								)
								})}

							<div className="h-8 w-[1px] bg-[#e4e4e7] dark:bg-[#27272a] mx-1 shrink-0" />

							{/* Social Links */}
							{sortedSocialButtons.map((button) => {
								const Icon = iconMap[button.type]
								if (!Icon) return null

								const commonDockIconProps = {
								className: "rounded-3xl cursor-pointer bg-white dark:bg-[var(--color-card)] border border-[#e4e4e7] dark:border-[var(--color-border)] shadow-sm text-[#52525b] dark:text-[var(--color-secondary)] hover:text-black dark:hover:text-[var(--color-primary)] transition-colors"
							}

								const label = button.type.charAt(0).toUpperCase() + button.type.slice(1);

								if (button.type === 'email' || button.type === 'wechat' || button.type === 'qq') {
									const isImagePath = button.value.startsWith('/images/social-buttons/')
									if (isImagePath && (button.type === 'wechat' || button.type === 'qq')) {
										const isOpen = openDropdowns[button.id] || false
										return (
											<DockIcon key={button.id} {...commonDockIconProps}>
												<button ref={el => { buttonRefs.current[button.id] = el }} className="size-full">
													<TooltipWrapper content={label} onClick={() => setOpenDropdowns(prev => ({ ...prev, [button.id]: !prev[button.id] }))}>
														<Icon className='size-full p-0.5' />
													</TooltipWrapper>
												</button>
												{typeof window !== 'undefined' && createPortal(
													<AnimatePresence>
														{isOpen && (
															<>
																<motion.div
																	initial={{ opacity: 0 }}
																	animate={{ opacity: 1 }}
																	exit={{ opacity: 0 }}
																	onClick={() => setOpenDropdowns(prev => ({ ...prev, [button.id]: false }))}
																	className='fixed inset-0 z-40'
																/>
																<motion.div
																		ref={el => { dropdownRefs.current[button.id] = el }}
																		initial={{ opacity: 0, y: 8, scale: 0.95 }}
																		animate={{ opacity: 1, y: 0, scale: 1 }}
																		exit={{ opacity: 0, y: 8, scale: 0.95 }}
																		transition={{ duration: 0.2 }}
																		className='bg-[var(--color-card)] fixed z-50 rounded-2xl border border-[var(--color-border)] p-4 backdrop-blur-xl shadow-2xl'
																		style={{
																			top: buttonRefs.current[button.id] ? `${buttonRefs.current[button.id]!.getBoundingClientRect().top - 210}px` : '0px',
																			left: buttonRefs.current[button.id] ? `${buttonRefs.current[button.id]!.getBoundingClientRect().left - 80}px` : '0px',
																		}}>
																		<img src={button.value} alt='QR Code' className='w-40 h-40 object-cover rounded-lg' />
																	</motion.div>
															</>
														)}
													</AnimatePresence>,
													document.body
												)}
											</DockIcon>
										)
									}

									return (
										<DockIcon key={button.id} {...commonDockIconProps}>
											<TooltipWrapper
												content={label}
												onClick={() => {
													navigator.clipboard.writeText(button.value).then(() => {
														toast.success('已复制到剪贴板')
													})
												}}
											>
												<Icon className='size-full p-0.5' />
											</TooltipWrapper>
										</DockIcon>
									)
								}

								return (
									<DockIcon key={button.id} {...commonDockIconProps}>
										<TooltipWrapper content={label} href={button.value} external>
											<Icon className='size-full p-0.5' />
										</TooltipWrapper>
									</DockIcon>
								)
							})}

							<div className="h-8 w-[1px] bg-[#e4e4e7] dark:bg-[#27272a] mx-1 shrink-0" />

							{/* Theme Toggle */}
							<DockIcon className="rounded-3xl cursor-pointer bg-white dark:bg-[var(--color-card)] border border-[#e4e4e7] dark:border-[var(--color-border)] shadow-sm text-[#52525b] dark:text-[var(--color-secondary)] hover:text-black dark:hover:text-[var(--color-primary)] transition-colors">
								<TooltipWrapper content={resolvedTheme === 'dark' ? '切换亮色' : '切换暗色'}>
									<ThemeToggleButton className="size-full text-inherit" />
								</TooltipWrapper>
							</DockIcon>
						</Dock>
					</motion.div>
				)}
			</AnimatePresence>

			{/* 展开导航栏按钮 - 当dock隐藏时常驻显示，优雅且随时可点击还原 */}
			<AnimatePresence>
				{!isDockVisible && (
					<motion.button
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 20, opacity: 0 }}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setIsDockVisible(true)}
						className="dock-nav-indicator fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[var(--color-card)]/90 border border-[#e4e4e7] dark:border-[var(--color-border)] backdrop-blur-xl shadow-lg text-xs font-medium text-[#52525b] dark:text-[var(--color-secondary)] hover:text-black dark:hover:text-[var(--color-primary)] transition-colors cursor-pointer"
						title="展开导航栏"
					>
						<ChevronUp className="w-3.5 h-3.5" />
						<span>展开导航</span>
					</motion.button>
				)}
			</AnimatePresence>
		</>
	)
}
