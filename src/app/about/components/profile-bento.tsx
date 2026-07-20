'use client'

import { useConfigStore } from '@/app/(home)/stores/config-store'
import { motion } from 'motion/react'
import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

const LocationMap = dynamic(() => import('./location-map'), { ssr: false })

// Import Icons
import GithubSVG from '@/svgs/github.svg'
import EmailSVG from '@/svgs/email.svg'
import WechatSVG from '@/svgs/wechat.svg'
import QqSVG from '@/svgs/qq.svg'

const iconMap: Record<string, any> = {
	github: GithubSVG,
	email: EmailSVG,
	wechat: WechatSVG,
	qq: QqSVG
}

export function ProfileBento({ 
	isEditMode = false,
	onLocationChange,
	locationValue,
}: {
	isEditMode?: boolean
	onLocationChange?: (location: string) => void
	locationValue?: string
}) {
	const { siteContent } = useConfigStore()
	const { meta, bentoConfig, socialButtons } = siteContent
	const avatarUrl = '/images/avatar.png'
	const sortedSocials = [...(socialButtons || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

	return (
		<div className="w-full">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
				
				{/* 1. Profile Box (2x2) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-card)] to-[var(--color-card)]/80 border border-[var(--color-border)]/50 p-8 flex flex-col justify-end hover:shadow-xl hover:shadow-[var(--color-brand)]/10 transition-all duration-500"
				>
					{/* Ambient Glow */}
					<div className="absolute -top-12 -left-12 w-48 h-48 bg-[var(--color-brand)]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
					<div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)]/5 to-transparent opacity-50 z-0" />
					
					{/* Pulsing Status indicator */}
					<div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 backdrop-blur-sm z-10 shadow-sm shadow-green-500/5">
						<span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
						ACTIVE NOW
					</div>

					<div className="relative z-10 flex flex-col gap-6">
						<div className="w-24 h-24 rounded-[1.8rem] overflow-hidden ring-4 ring-[var(--color-brand)]/10 group-hover:ring-[var(--color-brand)]/25 border-2 border-[var(--color-border)] shadow-xl bg-[var(--color-bg)] transition-all duration-500">
							<img src={avatarUrl} alt={meta.username} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
						</div>
						<div>
							<h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight mb-2">
								{meta.title || meta.username}
							</h1>
							<p className="text-[var(--color-secondary)] text-sm sm:text-base leading-relaxed opacity-90 line-clamp-2">
								{meta.description}
							</p>
						</div>
					</div>
				</motion.div>

				{/* 2. Location Box (1x1) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="col-span-1 md:col-span-2 row-span-1 group relative overflow-hidden rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)]/50 hover:shadow-xl hover:shadow-[var(--color-brand)]/10 transition-all duration-500"
				>
					<div className="absolute inset-0 z-0 pointer-events-none">
						<LocationMap location={locationValue ?? bentoConfig?.location ?? 'New Zealand'} />
					</div>
					
					{/* Darken map overlay slightly for consistency */}
					<div className="absolute inset-0 pointer-events-none bg-black/5 dark:bg-black/25 z-0" />

					{/* Frosted bottom banner overlay */}
					<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[var(--color-card)] via-[var(--color-card)]/90 to-transparent pt-12 pb-4 px-6 text-center z-10 flex flex-col items-center justify-end">
						<div className="flex items-center gap-1.5 text-[var(--color-primary)] font-extrabold text-xl tracking-tight">
							<MapPin className="w-4 h-4 text-[var(--color-brand)] animate-bounce" />
							{isEditMode ? (
								<input
									type="text"
									value={locationValue ?? bentoConfig?.location ?? ''}
									onChange={(e) => onLocationChange?.(e.target.value)}
									className="bg-transparent border-b border-[var(--color-border)]/50 focus:border-[var(--color-brand)] outline-none text-center w-36 transition-colors rounded-sm"
								/>
							) : (
								<span>{bentoConfig?.location || 'Earth'}</span>
							)}
						</div>
						<p className="text-[var(--color-secondary)] text-[10px] uppercase font-bold tracking-widest mt-1 opacity-75">
							Base Station
						</p>
					</div>
				</motion.div>

				{/* 3. Social Box (1x1) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="col-span-1 md:col-span-2 row-span-1 group relative overflow-hidden rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)]/50 p-6 flex flex-col items-center justify-center hover:shadow-xl hover:shadow-[var(--color-brand)]/10 transition-all duration-500"
				>
					<h3 className="font-extrabold text-xs text-[var(--color-secondary)] tracking-widest uppercase mb-4 opacity-80">
						Connect with me
					</h3>
					<div className="grid grid-cols-2 gap-3 w-full max-w-[340px]">
						{sortedSocials.map(social => {
							const Icon = iconMap[social.type] || GithubSVG
							let href = social.value
							if (social.type === 'email') href = `mailto:${social.value}`
							else if (!href.startsWith('http') && social.type !== 'wechat' && social.type !== 'qq') href = `https://${social.value}`

							const label = social.type === 'email' ? 'EMAIL' : social.type.toUpperCase()

							return (
								<a
									key={social.id}
									href={social.type === 'wechat' || social.type === 'qq' ? '#' : href}
									target="_blank"
									rel="noreferrer"
									onClick={(e) => {
										if (social.type === 'wechat' || social.type === 'qq') {
											e.preventDefault()
											alert(`${social.type.toUpperCase()}: ${social.value}`)
										}
									}}
									className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-[var(--color-bg)]/70 hover:bg-[var(--color-brand)]/5 border border-[var(--color-border)]/50 hover:border-[var(--color-brand)]/20 text-[var(--color-secondary)] hover:text-[var(--color-brand)] transition-all duration-300 shadow-sm hover:shadow"
								>
									<Icon className="w-4 h-4 shrink-0" />
									<span className="text-[10px] font-bold tracking-wide truncate">{label}</span>
								</a>
							)
						})}
					</div>
				</motion.div>
			</div>
		</div>
	)
}
