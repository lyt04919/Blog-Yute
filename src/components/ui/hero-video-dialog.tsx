"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Play, XIcon, ExternalLink } from "lucide-react"
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

export function getEmbedVideoUrl(url: string, autoplay = false): { embedUrl: string; canEmbed: boolean } {
  if (!url) return { embedUrl: '', canEmbed: false }

  if (url.includes('/embed/')) {
    let embed = url
    // 自动切换为 nocookie 域名以兼容 Safari 本地开发环境的跨域拦截
    if (embed.includes('youtube.com/embed/')) {
      embed = embed.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/')
    }
    if (autoplay && !embed.includes('autoplay=')) {
      embed = `${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`
    }
    return { embedUrl: embed, canEmbed: true }
  }

  // 2. YouTube 链接 (watch?v=..., shorts/..., youtu.be/...)
  if (url.includes('youtube.com/watch')) {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      const v = parsed.searchParams.get('v')
      if (v) {
        return {
          embedUrl: `https://www.youtube-nocookie.com/embed/${v}${autoplay ? '?autoplay=1' : ''}`,
          canEmbed: true,
        }
      }
    } catch {}
  }

  if (url.includes('youtube.com/shorts/')) {
    const id = url.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('/')[0]
    if (id) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`,
        canEmbed: true,
      }
    }
  }

  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0]
    if (id) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`,
        canEmbed: true,
      }
    }
  }

  if (url.includes('bilibili.com/video/')) {
    const bvid = url.match(/video\/(BV\w+)/)?.[1]
    if (bvid) {
      return {
        embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1`,
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
  const { embedUrl, canEmbed } = getEmbedVideoUrl(videoSrc, false)

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 999999 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6 pt-20"
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
            {/* 浮动在视频右上角外侧的圆形关闭按钮 (与 Magic UI 官方红框位置 100% 对齐) */}
            <motion.button
              type="button"
              onClick={onClose}
              className="absolute -top-16 right-0 flex size-10 items-center justify-center rounded-full bg-neutral-900/60 text-white ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-neutral-900/90 dark:bg-neutral-100/50 dark:text-black cursor-pointer shadow-2xl"
              aria-label="关闭视频"
            >
              <XIcon className="size-5" />
            </motion.button>
            <div 
              style={{ width: "100%", height: "100%" }}
              className="relative isolate z-1 overflow-hidden rounded-2xl border-2 border-white shadow-2xl bg-black"
            >
              {canEmbed ? (
                <iframe
                  src={embedUrl}
                  title="Hero Video player"
                  style={{ width: "100%", height: "100%", border: 0 }}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-950">
                  <p className="text-base text-zinc-200">
                    该视频源（如 Netflix / 专属版权站）限制直接内嵌，点击前往官方播放
                  </p>
                  <a
                    href={videoSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xl"
                  >
                    <span>前往官方源站观看</span>
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              )}
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





