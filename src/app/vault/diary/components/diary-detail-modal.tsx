'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import type { Diary } from './diary-card'
import Lightbox from '@/components/lightbox'

interface DiaryDetailModalProps {
	diary: Diary
	onClose: () => void
}

export default function DiaryDetailModal({ diary, onClose }: DiaryDetailModalProps) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
	const mediaList = (diary.media && diary.media.length > 0) ? diary.media : (diary.image ? [diary.image] : [])
	const hasMedia = mediaList.length > 0

	return (
		<>
			<DialogModal open onClose={onClose} className='card max-w-3xl w-full max-h-[90vh] relative bg-white dark:bg-[#27272a] flex flex-col shadow-2xl overflow-hidden'>
				<style>{`
					.diary-modal-body {
						display: flex;
						flex-direction: column;
						flex: 1;
						min-height: 0;
						overflow-y: auto;
					}
					.diary-modal-left {
						flex-shrink: 0;
						width: 100%;
						display: flex;
						flex-direction: column;
						align-items: center;
						padding: 24px;
					}
					.diary-modal-right {
						flex: 1;
						min-width: 0;
						padding: 24px;
						padding-top: 0;
					}
					.diary-image-wrapper {
						width: 120px;
						flex-shrink: 0;
						border-radius: 12px;
						overflow: hidden;
						box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
						margin-bottom: 16px;
						border: 1px solid rgba(0,0,0,0.05);
						cursor: pointer;
						transition: transform 0.2s;
					}
					.diary-image-wrapper:hover {
						transform: scale(1.02);
					}
					.diary-image-content {
						width: 100%;
						height: auto;
						display: block;
					}
					
					@media (min-width: 768px) {
						.diary-modal-body {
							flex-direction: row;
							overflow: hidden;
						}
						.diary-modal-left {
							width: 200px;
							align-items: flex-start;
							padding: 40px 24px 40px 40px;
							overflow-y: auto;
						}
						.diary-modal-right {
							padding: 40px 40px 40px 16px;
							overflow-y: auto;
						}
					}
				`}</style>

				<div className='absolute top-4 right-4 md:top-6 md:right-6 z-20 bg-white dark:bg-[#27272a]/80 rounded-full backdrop-blur-sm'>
					<button onClick={onClose} className='p-2 text-[#a1a1aa] hover:text-[#18181b] transition-colors'>
						<X className='w-5 h-5' />
					</button>
				</div>

				<div className='diary-modal-body custom-scrollbar'>
					{/* Left Side: Fixed Small Image */}
					{hasMedia && (
						<div className='diary-modal-left custom-scrollbar'>
							{mediaList.map((src, idx) => {
								const isVideo = src.endsWith('.mp4') || src.endsWith('.webm')
								const mediaSrc = isVideo ? `${src}#t=0.001` : src
								return (
									<div key={idx} className='diary-image-wrapper' onClick={() => setLightboxIndex(idx)}>
										{isVideo ? (
											<video src={mediaSrc} className='diary-image-content' controls playsInline preload="metadata" />
										) : (
											<img
												src={mediaSrc}
												alt={`Diary Media ${idx + 1}`}
												className='diary-image-content'
												loading="lazy"
												decoding="async"
											/>
										)}
									</div>
								)
							})}
						</div>
					)}

					{/* Right Side: Independently Scrollable Text Area */}
					<div className='diary-modal-right custom-scrollbar'>
						{/* Header */}
						<div style={{ marginBottom: '32px', paddingRight: '32px' }}>
							<h2 className='text-3xl md:text-4xl font-extrabold text-[#18181b] tracking-tight font-serif mb-4 break-words'>
								{diary.date}
							</h2>
							{(diary.mood || diary.weather) && (
								<div className='flex flex-wrap gap-2'>
									{diary.mood && (
										<span className='px-3 py-1 rounded-full bg-[#f4f4f5] text-[#52525b] text-xs font-medium'>
											{diary.mood}
										</span>
									)}
									{diary.weather && (
										<span className='px-3 py-1 rounded-full bg-[#f4f4f5] text-[#52525b] text-xs font-medium'>
											{diary.weather}
										</span>
									)}
								</div>
							)}
						</div>

						{/* Body Content */}
						<div className='prose prose-neutral max-w-none'>
							<p className='text-base md:text-[17px] text-[#3f3f46] leading-loose whitespace-pre-wrap font-light break-words'>
								{diary.content}
							</p>
						</div>
					</div>
				</div>
			</DialogModal>

			{lightboxIndex !== null && (
				<Lightbox 
					mediaList={mediaList} 
					initialIndex={lightboxIndex} 
					onClose={() => setLightboxIndex(null)} 
				/>
			)}
		</>
	)
}
