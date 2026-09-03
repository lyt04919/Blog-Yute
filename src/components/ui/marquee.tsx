import { type ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

export interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
	/**
	 * Optional CSS class name to apply custom styles
	 */
	className?: string
	/**
	 * Whether to reverse the animation direction
	 * @default false
	 */
	reverse?: boolean
	/**
	 * Whether to pause the animation on hover
	 * @default false
	 */
	pauseOnHover?: boolean
	/**
	 * Content to be displayed in the marquee
	 */
	children: React.ReactNode
	/**
	 * Whether to animate vertically instead of horizontally
	 * @default false
	 */
	vertical?: boolean
	/**
	 * Number of times to repeat the content
	 * @default 4
	 */
	repeat?: number
	/**
	 * Custom animation duration (e.g. '40s' or 40)
	 */
	duration?: string | number
	/**
	 * Spacing gap between marquee items (e.g. '1rem' or '16px')
	 * @default '1rem'
	 */
	gap?: string | number
}

export function Marquee({
	className,
	reverse = false,
	pauseOnHover = false,
	children,
	vertical = false,
	repeat = 4,
	duration = '40s',
	gap = '1rem',
	style,
	...props
}: MarqueeProps) {
	const durationStr = typeof duration === 'number' ? `${duration}s` : duration
	const gapStr = typeof gap === 'number' ? `${gap}px` : gap

	return (
		<div
			{...props}
			style={{
				['--gap' as any]: gapStr,
				['--duration' as any]: durationStr,
				gap: gapStr,
				...style,
			}}
			className={cn(
				'group flex overflow-hidden p-2 select-none',
				{
					'flex-row': !vertical,
					'flex-col': vertical,
				},
				className
			)}
		>
			<style>{`
				@keyframes marquee-infinite {
					from {
						transform: translateX(0);
					}
					to {
						transform: translateX(calc(-100% - var(--gap, 1rem)));
					}
				}
				@keyframes marquee-infinite-vertical {
					from {
						transform: translateY(0);
					}
					to {
						transform: translateY(calc(-100% - var(--gap, 1rem)));
					}
				}
				.marquee-item-track {
					will-change: transform;
				}
				.group:hover .marquee-item-track.pause-on-hover {
					animation-play-state: paused !important;
				}
			`}</style>
			{Array(repeat)
				.fill(0)
				.map((_, i) => (
					<div
						key={i}
						style={{
							animationName: vertical ? 'marquee-infinite-vertical' : 'marquee-infinite',
							animationDuration: durationStr,
							animationTimingFunction: 'linear',
							animationIterationCount: 'infinite',
							animationDirection: reverse ? 'reverse' : 'normal',
							gap: gapStr,
						}}
						className={cn('marquee-item-track flex shrink-0', {
							'flex-row': !vertical,
							'flex-col': vertical,
							'pause-on-hover': pauseOnHover,
						})}
					>
						{children}
					</div>
				))}
		</div>
	)
}
