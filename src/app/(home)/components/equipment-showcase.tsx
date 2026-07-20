'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import ScrollFloat from '@/components/scroll-float/ScrollFloat'
import { Laptop, Keyboard, Briefcase, Camera } from 'lucide-react'
import StarBadge from '@/components/ui/star-badge'

interface GearItem {
	name: string
	category: string
	desc: string
	image: string
	icon: any
}

export default function EquipmentShowcase() {
	const gears: GearItem[] = [
		{
			name: 'MacBook Pro M1 Max',
			category: 'Workstation',
			desc: '16-inch, 64GB RAM, 2TB SSD. The ultimate compile & design machine.',
			image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop',
			icon: Laptop
		},
		{
			name: 'AULA F99 Keyboard',
			category: 'Peripherals',
			desc: 'Custom linear switches, satisfying acoustics, and custom PBT keycaps.',
			image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
			icon: Keyboard
		},
		{
			name: 'Peak Design Backpack',
			category: 'Travel Gear',
			desc: 'Everyday Backpack 20L. Functional divider compartments and weatherproof.',
			image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop',
			icon: Briefcase
		},
		{
			name: 'Sony Alpha 7 IV',
			category: 'Photography',
			desc: 'High-fidelity full-frame mirrorless camera for capturing logs & trips.',
			image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop',
			icon: Camera
		}
	]

	return (
		<section className="mx-auto w-full max-w-7xl px-6 py-12">
			{/* Scenic Landscape Banner with Floating Widgets */}
			<div className="w-full rounded-[40px] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden relative min-h-[580px] p-6 md:p-10 flex flex-col justify-between gap-8 select-none group">
				{/* Parallax Background Zoom */}
				<div 
					className="absolute inset-0 z-0 transition-transform duration-[1500ms] ease-out group-hover:scale-[1.04]"
					style={{
						backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop')`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundRepeat: 'no-repeat'
					}}
				/>
				{/* 1. Header (Centered White Title) */}
				<div className="text-center w-full max-w-2xl mx-auto z-10 pt-4 mb-4">
					<div className="flex justify-center mb-4">
						<StarBadge text="★ GEARS" className="bg-white/10 border-white/20 text-white dark:bg-white/10 dark:border-white/20 dark:text-white" />
					</div>
					<ScrollFloat
						animationDuration={1}
						ease='back.inOut(2)'
						scrollStart='center bottom+=50%'
						scrollEnd='bottom bottom-=40%'
						stagger={0.03}
						containerClassName="mb-4"
						textClassName="text-4xl md:text-5xl lg:text-6xl font-serif text-white drop-shadow-md tracking-tight"
					>
						Creative *Arsenal* Setup
					</ScrollFloat>
					<p className="text-sm text-white/90 font-medium leading-relaxed drop-shadow-sm max-w-md mx-auto">
						The essential tools and setups that power my development, design, and photography workflows.
					</p>
				</div>

				{/* 2. Floating Cards Grid (Exactly 4 Items) */}
				<div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10 items-stretch">
					{gears.map((item, idx) => {
						const IconComponent = item.icon
						return (
							<motion.div
								key={item.name}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
								className="rounded-3xl border border-zinc-200/50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl p-5 flex flex-col justify-between h-full group/card"
							>
								<div>
									{/* Card Header Label */}
									<div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
										<span>{item.category}</span>
										<IconComponent className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
									</div>

									{/* Product Image */}
									<div className="relative w-full h-28 rounded-2xl overflow-hidden mb-4 bg-slate-50 dark:bg-zinc-800/10">
										<Image 
											src={item.image} 
											alt={item.name} 
											fill 
											unoptimized={true}
											className="object-cover transition-transform duration-500 group-hover/card:scale-105" 
										/>
									</div>

									{/* Product Name */}
									<h4 className="text-xs font-extrabold text-zinc-950 dark:text-white leading-snug">
										{item.name}
									</h4>

									{/* Product Description */}
									<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
										{item.desc}
									</p>
								</div>

								{/* Bottom Action / Tech Label */}
								<div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
									<span>Setup Spec</span>
									<span className="text-zinc-455 group-hover/card:text-blue-500 transition-colors">
										Active
									</span>
								</div>
							</motion.div>
						)
					})}
				</div>

				<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none rounded-[40px]" />
			</div>
		</section>
	)
}
