'use client'

import React, { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

interface CardSpotlightProps {
	children: React.ReactNode
	className?: string
	glowColor?: string
	maxTilt?: number // maximum rotation in degrees
}

export function CardSpotlight({
	children,
	className = '',
	glowColor = 'rgba(124, 58, 237, 0.07)',
	maxTilt = 7
}: CardSpotlightProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const [isHovered, setIsHovered] = useState(false)

	// Motion values and spring configs for smooth tilting
	const rotateXVal = useMotionValue(0)
	const rotateYVal = useMotionValue(0)

	const springConfig = { damping: 25, stiffness: 220, mass: 0.8 }
	const rotateX = useSpring(rotateXVal, springConfig)
	const rotateY = useSpring(rotateYVal, springConfig)

	// Spotlight coordinates for tracking cursor glow
	const [glowCoords, setGlowCoords] = useState({ x: 0, y: 0 })

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) return

		const rect = cardRef.current.getBoundingClientRect()
		const width = rect.width
		const height = rect.height

		// Mouse position relative to center of card (-0.5 to 0.5)
		const relativeX = (e.clientX - rect.left) / width - 0.5
		const relativeY = (e.clientY - rect.top) / height - 0.5

		// Update rotations: Y axis rotation controls left-right tilt, X axis controls up-down tilt
		rotateXVal.set(-relativeY * maxTilt)
		rotateYVal.set(relativeX * maxTilt)

		// Update absolute glow coordinates
		setGlowCoords({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		})
	}

	const handleMouseEnter = () => {
		setIsHovered(true)
	}

	const handleMouseLeave = () => {
		setIsHovered(false)
		// Reset card rotations smoothly
		rotateXVal.set(0)
		rotateYVal.set(0)
	}

	return (
		<motion.div
			ref={cardRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			style={{
				rotateX,
				rotateY,
				transformStyle: 'preserve-3d',
				perspective: 1000
			}}
			className={`relative transition-shadow duration-300 ${className}`}
		>
			{/* Radial Cursor Spotlight Glow */}
			<div
				className={`absolute inset-0 pointer-events-none transition-opacity duration-500 z-0 ${
					isHovered ? 'opacity-100' : 'opacity-0'
				}`}
				style={{
					background: `radial-gradient(350px circle at ${glowCoords.x}px ${glowCoords.y}px, ${glowColor}, transparent 80%)`
				}}
			/>
			
			{/* Content Wrapper */}
			<div style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }} className="relative z-10 w-full h-full">
				{children}
			</div>
		</motion.div>
	)
}
