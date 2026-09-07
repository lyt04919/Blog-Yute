'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import type { Diary } from '@/types/diary'
import { Clock } from 'lucide-react'
import DiaryDetailModal from './diary-detail-modal'
import HistoricalDiariesModal from './historical-diaries-modal'

interface OnThisDayProps {
	diaries: Diary[]
}

export default function OnThisDay({ diaries }: OnThisDayProps) {
	const [isDetailOpen, setIsDetailOpen] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

	const todayStr = dayjs().format('MM-DD')
	const currentYear = dayjs().year()

	const historicalDiaries = diaries.filter(d => {
		const dDate = dayjs(d.date)
		return dDate.format('MM-DD') === todayStr && dDate.year() < currentYear
	}).sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())

	if (historicalDiaries.length === 0) {
		return (
			<div 
				style={{ width: 220, height: 160, minWidth: 220, flexShrink: 0 }}
				className="rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700/60 flex flex-col items-center justify-center text-center cursor-default bg-neutral-50/50 dark:bg-neutral-800/10"
			>
				<Clock size={22} className="text-neutral-400 dark:text-neutral-500 mb-1.5" />
				<span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">往年今日</span>
				<span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">今天暂无往年回忆</span>
			</div>
		)
	}

	const diary = historicalDiaries[0]
	
	const getCoverUrl = (d?: Diary) => {
		if (!d) return null
		return (d.media && d.media.length > 0 && typeof d.media[0] === 'string') 
			? d.media[0] 
			: d.image
	}

	const coverUrl = getCoverUrl(historicalDiaries[0])
	const coverUrl2 = getCoverUrl(historicalDiaries[1])
	const coverUrl3 = getCoverUrl(historicalDiaries[2])

	const hasMultiple = historicalDiaries.length > 1

	return (
		<>
			<div 
				className="relative cursor-pointer select-none" 
				style={{ width: 220, height: 160, minWidth: 220, flexShrink: 0 }} 
				onClick={() => setIsDetailOpen(true)} 
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				title="往年今日回忆"
			>
				{/* Stacked Cards Background (only if >= 3) */}
				{historicalDiaries.length >= 3 && (
					<div 
						className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden flex items-center justify-center origin-center transition-all duration-500 ease-out"
						style={{
							transform: isHovered 
								? 'rotate(-16deg) translateX(-56px) translateY(-8px) scale(1)' 
								: 'rotate(-6deg) translateX(-12px) translateY(8px) scale(0.95)',
							opacity: isHovered ? 1 : 0.8
						}}
					>
						{coverUrl3 ? (
							<img src={coverUrl3} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						) : (
							<div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"><Clock size={20} className="text-neutral-400" /></div>
						)}
					</div>
				)}

				{/* Stacked Cards Background (only if >= 2) */}
				{historicalDiaries.length >= 2 && (
					<div 
						className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden flex items-center justify-center origin-center transition-all duration-500 ease-out"
						style={{
							transform: isHovered 
								? 'rotate(16deg) translateX(56px) translateY(-4px) scale(1)' 
								: 'rotate(6deg) translateX(12px) translateY(4px) scale(0.98)',
							opacity: isHovered ? 1 : 0.9
						}}
					>
						{coverUrl2 ? (
							<img src={coverUrl2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						) : (
							<div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"><Clock size={24} className="text-neutral-400" /></div>
						)}
					</div>
				)}
				
				{/* Main Front Card */}
				<div 
					className="absolute inset-0 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-500 ease-out z-10"
					style={{
						transform: isHovered ? 'translateY(-14px)' : 'translateY(0)',
						boxShadow: isHovered ? '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.05)'
					}}
				>
					{coverUrl ? (
						<img 
							src={coverUrl} 
							alt="往年今日" 
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
							className="transition-transform duration-500 hover:scale-105"
						/>
					) : (
						<div style={{ width: '100%', height: '100%' }} className="flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 p-4 text-center">
							<Clock size={28} className="text-brand mb-2" />
							<span className="text-xs font-serif font-bold text-[var(--color-primary)] line-clamp-2">{diary.content}</span>
						</div>
					)}
					<div className="absolute inset-x-0 bottom-0 py-1.5 px-2 bg-gradient-to-t from-black/70 to-transparent text-center flex items-center justify-center">
						<span className="text-[11px] text-white font-bold">往年今日</span>
					</div>
					
					{/* Badge for multiple diaries */}
					{hasMultiple && (
						<div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
							{historicalDiaries.length} 篇回忆
						</div>
					)}
				</div>
			</div>

			{isDetailOpen && (
				hasMultiple ? (
					<HistoricalDiariesModal diaries={historicalDiaries} onClose={() => setIsDetailOpen(false)} />
				) : (
					<DiaryDetailModal diary={diary} onClose={() => setIsDetailOpen(false)} />
				)
			)}
		</>
	)
}
