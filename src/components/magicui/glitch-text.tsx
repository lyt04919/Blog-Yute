'use client'

import { useState, useEffect } from 'react'

const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%'

export function GlitchText({ 
    text, 
    isHovered, 
    className 
}: { 
    text: string
    isHovered: boolean
    className?: string
}) {
    const [displayText, setDisplayText] = useState('')
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (!text) return

        if (!isHovered) {
            // Un-hovered state: redacted blocks or static string
            setDisplayText('█'.repeat(Math.min(text.length, 30)))
            setIsAnimating(false)
            return
        }

        // Hovered state: Glitch decode animation
        setIsAnimating(true)
        let iteration = 0
        const maxIterations = 10
        const interval = setInterval(() => {
            setDisplayText(prev => {
                const newText = text.split('').map((char, index) => {
                    if (char === ' ') return ' '
                    if (index < (iteration / maxIterations) * text.length) {
                        return text[index]
                    }
                    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
                }).join('')
                return newText
            })

            iteration += 1
            if (iteration > maxIterations) {
                clearInterval(interval)
                setDisplayText(text)
                setIsAnimating(false)
            }
        }, 30)

        return () => clearInterval(interval)
    }, [text, isHovered])

    return (
        <span className={className}>
            {displayText}
        </span>
    )
}
