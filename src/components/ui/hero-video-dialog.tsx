"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Play, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

export type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out"

export interface HeroVideoProps {
  animationStyle?: AnimationStyle
  videoSrc: string
  thumbnailSrc: string
  thumbnailAlt?: string
  className?: string
}

export function getEmbedVideoUrl(url: string, autoplay = true): { embedUrl: string; canEmbed: boolean } {
  if (!url) return { embedUrl: '', canEmbed: false }

  if (url.includes('/embed/')) {
    let embed = url
    if (autoplay && !embed.includes('autoplay=')) {
      embed = `${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`
    }
    return { embedUrl: embed, canEmbed: true }
  }

  if (url.includes('youtube.com/watch')) {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      const v = parsed.searchParams.get('v')
      if (v) {
        return {
          embedUrl: `https://www.youtube.com/embed/${v}${autoplay ? '?autoplay=1' : ''}`,
          canEmbed: true,
        }
      }
    } catch {}
  }

  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    if (id) {
      return {
        embedUrl: `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`,
        canEmbed: true,
      }
    }
  }

  if (url.includes('bilibili.com/video/')) {
    const bvid = url.match(/video\/(BV\w+)/)?.[1]
    if (bvid) {
      return {
        embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=${autoplay ? '1' : '0'}&page=1`,
        canEmbed: true,
      }
    }
  }

  if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) {
    return { embedUrl: url, canEmbed: true }
  }

  return { embedUrl: url, canEmbed: false }
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
}

export function HeroVideoModal({
  isOpen,
  onClose,
  videoSrc,
  animationStyle = "from-center",
}: {
  isOpen: boolean
  onClose: () => void
  videoSrc: string
  animationStyle?: AnimationStyle
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!mounted) return null

  const selectedAnimation = animationVariants[animationStyle]
  const { embedUrl } = getEmbedVideoUrl(videoSrc, true)

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 999999 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 md:p-6"
          onClick={onClose}
        >
          <motion.div
            variants={selectedAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ width: "100%", maxWidth: "896px", aspectRatio: "16 / 9" }}
            className="relative mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              type="button"
              onClick={onClose}
              className="absolute -top-14 sm:-top-16 right-0 rounded-full bg-neutral-900/60 p-2 text-xl text-white ring-1 ring-white/20 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black cursor-pointer shadow-lg hover:bg-neutral-900/80"
              aria-label="关闭视频"
            >
              <XIcon className="size-5" />
            </motion.button>
            <div 
              style={{ width: "100%", height: "100%" }}
              className="relative isolate z-1 overflow-hidden rounded-2xl border-2 border-white shadow-2xl bg-black"
            >
              <iframe
                src={embedUrl}
                title="Hero Video player"
                style={{ width: "100%", height: "100%", border: 0 }}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              ></iframe>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Play video"
        className="group relative cursor-pointer border-0 bg-transparent p-0"
        onClick={() => setIsVideoOpen(true)}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
        />
        <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
          <div className="bg-primary/10 flex size-28 items-center justify-center rounded-full backdrop-blur-md">
            <div
              className={`from-primary/30 to-primary relative flex size-20 scale-100 items-center justify-center rounded-full bg-gradient-to-b shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]`}
            >
              <Play
                className="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
                style={{
                  filter:
                    "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                }}
              />
            </div>
          </div>
        </div>
      </button>

      <HeroVideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoSrc={videoSrc}
        animationStyle={animationStyle}
      />
    </div>
  )
}




