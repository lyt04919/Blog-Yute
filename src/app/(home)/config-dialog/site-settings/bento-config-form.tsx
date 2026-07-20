'use client'

import type { SiteContent } from '../../stores/config-store'

interface BentoConfigFormProps {
	formData: SiteContent
	setFormData: React.Dispatch<React.SetStateAction<SiteContent>>
}

export function BentoConfigForm({ formData, setFormData }: BentoConfigFormProps) {
	const bentoConfig = formData.bentoConfig || {
		location: "New Zealand",
		uptime: "99.9%",
		currentResearch: "Cryptography & Web3"
	}

	const updateBentoConfig = (key: string, value: any) => {
		setFormData({
			...formData,
			bentoConfig: {
				...bentoConfig,
				[key]: value
			}
		})
	}

	return (
		<>
			<h3 className="text-sm font-bold border-b border-border pb-2 mt-4 mb-2">Bento Grid 配置</h3>
			<div className='grid grid-cols-2 gap-2'>
				<div>
					<label className='mb-2 block text-sm font-medium'>所在地 (Location)</label>
					<input
						type='text'
						value={bentoConfig.location}
						onChange={e => updateBentoConfig('location', e.target.value)}
						className='bg-secondary/10 w-full rounded-lg border px-4 py-2 text-sm'
					/>
				</div>

				<div>
					<label className='mb-2 block text-sm font-medium'>在线率 (Uptime)</label>
					<input
						type='text'
						value={bentoConfig.uptime}
						onChange={e => updateBentoConfig('uptime', e.target.value)}
						className='bg-secondary/10 w-full rounded-lg border px-4 py-2 text-sm'
					/>
				</div>
			</div>

			<div>
				<label className='mb-2 block text-sm font-medium'>当前研究方向 (Current Research)</label>
				<input
					type='text'
					value={bentoConfig.currentResearch}
					onChange={e => updateBentoConfig('currentResearch', e.target.value)}
					className='bg-secondary/10 w-full rounded-lg border px-4 py-2 text-sm'
				/>
			</div>

			<div className="mt-4 border-t border-border pt-4">
				<h4 className="text-sm font-bold mb-2">正在折腾 (Currently Building) 配置</h4>
				<div className="space-y-3">
					<div>
						<label className='mb-1 block text-xs font-medium'>项目名称</label>
						<input
							type='text'
							value={bentoConfig.buildingName ?? '数字花园 & 全栈 UI 重构'}
							onChange={e => updateBentoConfig('buildingName', e.target.value)}
							className='bg-secondary/10 w-full rounded-lg border px-4 py-2 text-sm'
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className='mb-1 block text-xs font-medium'>技术栈 / 简述</label>
							<input
								type='text'
								value={bentoConfig.buildingTech ?? 'Next.js 15 / React / Tailwind'}
								onChange={e => updateBentoConfig('buildingTech', e.target.value)}
								className='bg-secondary/10 w-full rounded-lg border px-4 py-2 text-sm'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium'>完成进度 ({bentoConfig.buildingProgress ?? 85}%)</label>
							<input
								type='number'
								min='0'
								max='100'
								value={bentoConfig.buildingProgress ?? 85}
								onChange={e => updateBentoConfig('buildingProgress', parseInt(e.target.value) || 0)}
								className='bg-secondary/10 w-full rounded-lg border px-4 py-2 text-sm'
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 border-t border-border pt-4">
				<h4 className="text-sm font-bold mb-2">地图视图配置</h4>
				
				<div className="space-y-4">
					<div>
						<div className="flex justify-between items-center mb-1">
							<label className="text-sm font-medium">缩放比例 (Zoom): {bentoConfig.mapZoom ?? 1.6}</label>
						</div>
						<input
							type="range"
							min="1.0"
							max="4.0"
							step="0.1"
							value={bentoConfig.mapZoom ?? 1.6}
							onChange={e => updateBentoConfig('mapZoom', parseFloat(e.target.value))}
							className="w-full h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="flex justify-between items-center mb-1">
								<label className="text-sm font-medium">中心纬度 (Lat): {bentoConfig.mapCenterLat ?? 15}°</label>
							</div>
							<input
								type="range"
								min="-90"
								max="90"
								step="1"
								value={bentoConfig.mapCenterLat ?? 15}
								onChange={e => updateBentoConfig('mapCenterLat', parseInt(e.target.value))}
								className="w-full h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer"
							/>
						</div>

						<div>
							<div className="flex justify-between items-center mb-1">
								<label className="text-sm font-medium">中心经度 (Lng): {bentoConfig.mapCenterLng ?? 90}°</label>
							</div>
							<input
								type="range"
								min="-180"
								max="180"
								step="1"
								value={bentoConfig.mapCenterLng ?? 90}
								onChange={e => updateBentoConfig('mapCenterLng', parseInt(e.target.value))}
								className="w-full h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer"
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
