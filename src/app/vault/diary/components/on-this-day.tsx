'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { Diary } from './diary-card'
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
				className="rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center cursor-default"
			>
				<Clock size={22} className="text-gray-400 mb-1.5" />
				<span className="text-xs text-gray-400 font-medium">往年今日</span>
				<span className="text-[10px] text-gray-300 mt-0.5">无回忆</span>
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
				className="relative cursor-pointer" 
				style={{ width: 220, height: 160, minWidth: 220, flexShrink: 0 }} 
				onClick={() => setIsDetailOpen(true)} 
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				title="往年今日"
			>
				{/* Stacked Cards Background (only if multiple) */}
				{historicalDiaries.length >= 3 && (
					<div 
						className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center origin-center transition-all duration-500 ease-out"
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
							<div className="w-full h-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"><Clock size={20} className="text-gray-400" /></div>
						)}
					</div>
				)}

				{historicalDiaries.length >= 2 && (
					<div 
						className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center origin-center transition-all duration-500 ease-out"
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
							<div className="w-full h-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"><Clock size={24} className="text-gray-400" /></div>
						)}
					</div>
				)}
				
				{/* Main Front Card */}
				<div 
					className="absolute inset-0 rounded-2xl overflow-hidden border border-gray-200 bg-white transition-all duration-500 ease-out z-10"
					style={{
						transform: isHovered ? 'translateY(-16px)' : 'translateY(0)',
						boxShadow: isHovered ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : '0 1px 2px 0 rgb(0 0 0 / 0.05)'
					}}
				>
					{coverUrl ? (
						<img 
							src={coverUrl} 
							alt={`往年今日`} 
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
							className="group-hover:scale-105 transition-transform duration-500"
						/>
					) : (
						<div style={{ width: '100%', height: '100%' }} className="flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
							<Clock size={28} className="text-gray-400" />
						</div>
					)}
					<div className="absolute inset-x-0 bottom-0 py-1.5 px-2 bg-gradient-to-t from-black/60 to-transparent text-center flex items-center justify-center">
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
