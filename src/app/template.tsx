'use client'

import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
			animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className="w-full min-h-screen"
		>
			{children}
		</motion.div>
	)
}
