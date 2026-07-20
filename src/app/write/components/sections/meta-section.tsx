import { motion } from 'motion/react'
import { useWriteStore } from '../../stores/write-store'
import { TagInput } from '../ui/tag-input'
import { useCategories } from '@/hooks/use-categories'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { Select } from '@/components/select'
import projectsList from '@/data/projects.json'
import { useState, useEffect } from 'react'

type MetaSectionProps = {
	delay?: number
}

export function MetaSection({ delay = 0 }: MetaSectionProps) {
	const { form, updateForm } = useWriteStore()
	console.log(form.date)

	const { categories } = useCategories()
	const { siteContent } = useConfigStore()
	const enableCategories = siteContent.enableCategories ?? false

	const categoryOptions = [{ value: '', label: '未分类' }, ...categories.map(cat => ({ value: cat, label: cat }))]

	const [showCustomFields, setShowCustomFields] = useState(false)

	useEffect(() => {
		const matched = projectsList.some(p => p.url === form.projectUrl)
		if (form.projectUrl && !matched) {
			setShowCustomFields(true)
		}
	}, [form.projectUrl])

	const projectOptions = [
		{ value: '', label: '无关联项目' },
		...projectsList.map(p => ({ value: p.url, label: `项目: ${p.name}` })),
		{ value: 'custom_project', label: '自定义关联项目...' }
	]

	const matchedProject = projectsList.find(p => p.url === form.projectUrl)
	const projectSelectValue = form.projectUrl
		? (matchedProject ? form.projectUrl : 'custom_project')
		: (showCustomFields ? 'custom_project' : '')

	const handleProjectSelect = (val: string) => {
		if (val === 'custom_project') {
			setShowCustomFields(true)
			updateForm({ projectUrl: '', projectName: '' })
		} else if (val === '') {
			setShowCustomFields(false)
			updateForm({ projectUrl: '', projectName: '' })
		} else {
			setShowCustomFields(false)
			const proj = projectsList.find(p => p.url === val)
			if (proj) {
				updateForm({ projectUrl: proj.url, projectName: proj.name })
			}
		}
	}

	return (
		<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }} className='relative'>
			<div className='flex items-center justify-between mb-3 px-1'>
				<h2 className='text-sm font-semibold text-[var(--color-primary)]'>属性</h2>
			</div>

			<div className='mt-3 space-y-2'>
				<textarea
					placeholder='为这篇文章写一段简短摘要'
					rows={2}
					className='bg-card block w-full resize-none rounded-xl border p-3 text-sm'
					value={form.summary}
					onChange={e => updateForm({ summary: e.target.value })}
				/>

				<TagInput tags={form.tags} onChange={tags => updateForm({ tags })} />
				{enableCategories && (
					<Select className='w-full text-sm' value={form.category || ''} onChange={value => updateForm({ category: value })} options={categoryOptions} />
				)}
				<input
					type='datetime-local'
					placeholder='日期'
					className='bg-card w-full rounded-lg border px-3 py-2 text-sm'
					value={form.date}
					onChange={e => {
						updateForm({ date: e.target.value })
					}}
				/>

				{/* Project Association */}
				<div className="space-y-2 pt-1 border-t border-[var(--color-border)]/50 mt-1">
					<span className="text-xs font-medium text-[var(--color-secondary)] px-1 block">关联项目 (可选)</span>
					<Select
						className='w-full text-sm'
						value={projectSelectValue}
						onChange={handleProjectSelect}
						options={projectOptions}
					/>
					
					{showCustomFields && (
						<motion.div 
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-2 p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50"
						>
							<input
								type='text'
								placeholder='自定义项目名称'
								className='bg-card w-full rounded-lg border px-3 py-1.5 text-xs'
								value={form.projectName || ''}
								onChange={e => updateForm({ projectName: e.target.value })}
							/>
							<input
								type='url'
								placeholder='自定义项目链接 (https://...)'
								className='bg-card w-full rounded-lg border px-3 py-1.5 text-xs'
								value={form.projectUrl || ''}
								onChange={e => updateForm({ projectUrl: e.target.value })}
							/>
						</motion.div>
					)}
				</div>

				<div className='flex items-center gap-2 pt-2'>
					<input
						type='checkbox'
						id='hidden-check'
						checked={form.hidden || false}
						onChange={e => updateForm({ hidden: e.target.checked })}
						className='h-4 w-4 rounded border-gray-300'
					/>
					<label htmlFor='hidden-check' className='cursor-pointer text-sm text-gray-600 select-none'>
						隐藏此文章（仅管理员可见）
					</label>
				</div>
			</div>
		</motion.div>
	)
}
