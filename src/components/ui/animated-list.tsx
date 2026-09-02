'use client'

import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export interface AnimatedListProps {
	className?: string
	children: React.ReactNode
	delay?: number
}

export const AnimatedList = React.memo(
	({ className, children, delay = 1800 }: AnimatedListProps) => {
		const [index, setIndex] = useState(0)
		const childrenArray = useMemo(
			() => React.Children.toArray(children),
			[children]
		)

		useEffect(() => {
			const interval = setInterval(() => {
				setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length)
			}, delay)

			return () => clearInterval(interval)
		}, [delay, childrenArray.length])

		const itemsToShow = useMemo(() => {
			const result = []
			for (let i = 0; i < Math.min(3, childrenArray.length); i++) {
				const itemIdx = (index - i + childrenArray.length) % childrenArray.length
				result.push(childrenArray[itemIdx])
			}
			return result
		}, [index, childrenArray])

		return (
			<div className={`flex flex-col items-center gap-3 w-full ${className || ''}`}>
				<AnimatePresence initial={false}>
					{itemsToShow.map((item, idx) => (
						<AnimatedListItem key={(item as ReactElement)?.key || idx}>
							{item}
						</AnimatedListItem>
					))}
				</AnimatePresence>
			</div>
		)
	}
)

AnimatedList.displayName = 'AnimatedList'

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			initial={{ scale: 0.85, opacity: 0, y: -20 }}
			animate={{ scale: 1, opacity: 1, y: 0, originY: 0 }}
			exit={{ scale: 0.85, opacity: 0, y: 20 }}
			transition={{ type: 'spring', stiffness: 350, damping: 25 }}
			className="mx-auto w-full"
		>
			{children}
		</motion.div>
	)
}
