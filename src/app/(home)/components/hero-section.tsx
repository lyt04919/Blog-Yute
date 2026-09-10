'use client'

import { useState } from 'react'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { CardContainer, CardBody, CardItem } from './3d-card'

const roles = [
	'Frontend Engineer',
	'UI Reconstructor',
	'React Developer',
	'Next.js Practitioner',
	'Open Source Contributor',
	'Digital Nomad',
	'Creative Coder'
]

export default function HeroSection() {
	const avatarUrl = '/images/avatar.png'
	const username = 'Suni'
	
	// Track hover states for focus list dimming and 3D text pop-out scaling
	const [hoveredRoleIndex, setHoveredRoleIndex] = useState<number | null>(null)
	const [isHovered, setIsHovered] = useState(false)

	return (
		<section 
			id="home" 
			className="relative w-full py-32 md:py-40 flex items-center justify-center transition-colors duration-500 select-none"
		>
			{/* Custom inline CSS override to bypass Tailwind build system caching for SVG strokes and card gradients */}
			<style dangerouslySetInnerHTML={{__html: `
				@keyframes suni-orbit {
					0% { transform: translate(-50%, -50%) rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg); }
					100% { transform: translate(-50%, -50%) rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg); }
				}
				.suni-orbit-item {
					animation: suni-orbit calc(var(--duration) * 1s) linear infinite;
					will-change: transform;
					transform: translateZ(0);
				}
				.suni-inner-orbit {
					stroke: rgba(0, 0, 0, 0.35) !important;
				}
				.dark .suni-inner-orbit {
					stroke: rgba(255, 255, 255, 0.35) !important;
				}
				.suni-outer-orbit {
					stroke: rgba(0, 0, 0, 0.12) !important;
				}
				.dark .suni-outer-orbit {
					stroke: rgba(255, 255, 255, 0.12) !important;
				}
				
				/* Horizontal CSS gradient running from right (slate-200 gray-white) to left (pure white) */
				:root {
					--suni-card-bg: linear-gradient(to left, rgba(226, 232, 240, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
				}
				.dark {
					--suni-card-bg: linear-gradient(to left, rgba(39, 39, 42, 0.96) 0%, rgba(9, 9, 11, 0.99) 100%);
				}
			`}} />

			{/* Orbit Dashed Circle Path 1 (Inner - Radius 300px) - Darker & bolder stroke */}
			<svg className="pointer-events-none absolute inset-0 h-full w-full z-0">
				<circle 
					className="suni-inner-orbit" 
					strokeWidth="1" 
					strokeDasharray="4 4" 
					cx="50%" 
					cy="50%" 
					r="300" 
					fill="none" 
				/>
			</svg>
			
			{/* Orbit Item 1: VS Code (Inner) */}
			<div 
				style={{ 
					'--duration': 10, 
					'--radius': 300, 
					'--delay': -20,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-[60px] w-[60px] bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="VS Code" 
					className="drop-shadow-lg" 
					style={{ width: '50px', height: '50px' }}
					decoding="async"
					src="/images/tech-icons/vscode.svg"
				/>
			</div>

			{/* Orbit Item 2: React (Inner) */}
			<div 
				style={{ 
					'--duration': 20, 
					'--radius': 300, 
					'--delay': -20,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-14 w-14 bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="React" 
					className="drop-shadow-lg" 
					style={{ width: '50px', height: '50px' }}
					decoding="async"
					src="/images/tech-icons/react.svg"
				/>
			</div>

			{/* Orbit Item 3: Obsidian (Inner) */}
			<div 
				style={{ 
					'--duration': 16, 
					'--radius': 300, 
					'--delay': -15,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-10 w-10 bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="Obsidian" 
					className="drop-shadow-lg" 
					style={{ width: '40px', height: '40px' }}
					decoding="async"
					src="/images/tech-icons/obsidian.svg"
				/>
			</div>

			{/* Orbit Item 4: Notion (Inner) */}
			<div 
				style={{ 
					'--duration': 18, 
					'--radius': 300, 
					'--delay': -12,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-14 w-14 bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="Notion" 
					className="drop-shadow-lg bg-white rounded-md p-1 border border-neutral-200/50" 
					style={{ width: '46px', height: '46px' }}
					decoding="async"
					src="/images/tech-icons/notion.svg"
				/>
			</div>

			{/* Outer Orbit Dashed Circle Path 2 (Outer - Radius 350px) - Fainter & lighter stroke */}
			<svg className="pointer-events-none absolute inset-0 h-full w-full z-0">
				<circle 
					className="suni-outer-orbit" 
					strokeWidth="1" 
					strokeDasharray="4 4" 
					cx="50%" 
					cy="50%" 
					r="350" 
					fill="none" 
				/>
			</svg>

			{/* Orbit Item 5 (Concentric Outer Avatar): Suni Avatar (Outer) */}
			<div 
				style={{ 
					'--duration': 9, 
					'--radius': 350, 
					'--delay': -20,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-48 w-48 bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="avatar" 
					className="relative mr-16 mt-24 shadow-xl rounded-full w-40 h-40 object-cover border-4 border-white dark:border-zinc-900 bg-orange-400" 
					decoding="async"
					src={avatarUrl}
				/>
			</div>

			{/* Orbit Item 6: Antigravity Logo (Outer) */}
			<div 
				style={{ 
					'--duration': 12, 
					'--radius': 350, 
					'--delay': -5,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-14 w-14 bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="Antigravity" 
					className="drop-shadow-lg" 
					style={{ width: '48px', height: '48px' }}
					decoding="async"
					src="/images/tech-icons/gemini.svg"
				/>
			</div>

			{/* Orbit Item 7: Codex Logo (Outer) */}
			<div 
				style={{ 
					'--duration': 14, 
					'--radius': 350, 
					'--delay': -8,
					position: 'absolute',
					top: '50%',
					left: '50%'
				} as React.CSSProperties} 
				className="suni-orbit-item flex transform-gpu items-center justify-center rounded-full h-14 w-14 bg-transparent [animation-delay:calc(var(--delay)*1000ms)] z-0"
			>
				<img 
					alt="Codex" 
					className="drop-shadow-lg rounded-full" 
					style={{ width: '46px', height: '46px' }}
					decoding="async"
					src="/images/tech-icons/chatgpt.svg"
				/>
			</div>

			{/* 3D Tilted Glass Card Container */}
			<div 
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className="z-10 mx-auto"
			>
				<CardContainer className="pointer-events-auto">
					{/* CardBody using CSS variable native gradient background, completely stripped of Tailwind bg override classes */}
					<CardBody 
						className="p-8 relative rounded-3xl shadow-2xl flex flex-col justify-between border border-white/50 dark:border-white/15 backdrop-blur-xl transition-all duration-500"
						style={{ 
							background: 'var(--suni-card-bg)',
							width: '410px', 
							minWidth: '410px', 
							minHeight: '480px', 
							flexShrink: 0 
						}}
					>
						
						{/* My name is */}
						<CardItem translateZ="50" className="w-fit">
							<p className="text-lg font-bold text-slate-700 dark:text-zinc-300">My name is:</p>
						</CardItem>

						{/* Suni Title & Standalone 3D Divider Line */}
						<div className="w-full mt-2 [transform-style:preserve-3d]">
							<h1 className="pb-5 w-full [transform-style:preserve-3d]">
								<div 
									className="z-10 inline-block relative px-2 text-orange-400 font-bold text-5xl md:text-6xl whitespace-nowrap"
									style={{ 
										fontFamily: "Georgia, 'Times New Roman', serif",
										transform: isHovered ? 'translateZ(90px) scale(1.08)' : 'translateZ(0px) scale(1)',
										textShadow: isHovered 
											? '0 16px 30px rgba(249, 115, 22, 0.5)' 
											: '0 2px 4px rgba(249, 115, 22, 0.15)',
										transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
									}}
								>
									{username}
								</div>
							</h1>
							
							{/* Standalone 3D Horizontal Line Divider with explicit inline background styles for visibility */}
							<div 
								className="w-full shadow-md"
								style={{
									height: '2px',
									backgroundColor: 'rgba(51, 65, 85, 0.7)',
									transform: isHovered ? 'translateZ(60px)' : 'translateZ(0px)',
									transformStyle: 'preserve-3d',
									transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
								}}
							/>
						</div>

						{/* I'm a Section & Roles */}
						<div className="flex flex-col gap-4 mt-6 w-full">
							<CardItem translateZ="60" className="w-fit self-start">
								<p className="text-lg font-bold text-slate-700 dark:text-zinc-300">I'm a:</p>
							</CardItem>
							
							<CardItem translateZ="85" className="w-full">
								<div className="text-md md:text-xl leading-tight text-end flex flex-col items-end gap-1.5 w-full">
									{roles.map((role, idx) => {
										const isItemHovered = hoveredRoleIndex === idx
										const isAnyItemHovered = hoveredRoleIndex !== null
										
										return (
											<div
												key={idx}
												onMouseEnter={() => setHoveredRoleIndex(idx)}
												onMouseLeave={() => setHoveredRoleIndex(null)}
												className={`transition-all duration-300 cursor-pointer font-medium ${
													isItemHovered 
														? 'text-slate-800 dark:text-neutral-100 scale-105 opacity-100' 
														: isAnyItemHovered 
															? 'text-slate-400/30 dark:text-zinc-600/30 scale-95 opacity-40' 
															: 'text-slate-600 dark:text-zinc-300 opacity-100'
												}`}
											>
												{role}
											</div>
										)
									})}
								</div>
							</CardItem>
						</div>

						{/* Orange decoration dot floating in deep 3D background behind the card */}
						<CardItem 
							translateZ="-30" 
							className="bg-orange-400 w-16 h-16 absolute -left-4 -bottom-4 rounded-full -z-10 shadow-lg"
							as="div"
						/>
					</CardBody>
				</CardContainer>
			</div>

		</section>
	)
}
