'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'

export type LogoItem = { type: 'url'; url: string } | { type: 'file'; file: File; previewUrl: string; hash?: string }

interface LogoUploadDialogProps {
	currentLogo?: string
	onClose: () => void
	onSubmit: (logo: LogoItem) => void
}

export default function LogoUploadDialog({ currentLogo, onClose, onSubmit }: LogoUploadDialogProps) {
	const [previewFile, setPreviewFile] = useState<{ file: File; previewUrl: string } | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('请选择图片文件')
			return
		}

		const previewUrl = URL.createObjectURL(file)
		setPreviewFile({ file, previewUrl })
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (previewFile) {
			try {
				setIsUploading(true)
				const formData = new FormData()
				formData.append('file', previewFile.file)
				
				const res = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				})
				
				if (!res.ok) throw new Error('Upload failed')
				const data = await res.json()
				
				onSubmit({
					type: 'url',
					url: data.url
				})
			} catch (err) {
				console.error(err)
				toast.error('上传图片失败，请重试')
				return
			} finally {
				setIsUploading(false)
			}
		} else if (currentLogo) {
			onSubmit({
				type: 'url',
				url: currentLogo
			})
		} else {
			toast.error('请上传图片')
			return
		}

		setPreviewFile(null)
		onClose()
	}

	const handleClose = () => {
		if (previewFile) {
			URL.revokeObjectURL(previewFile.previewUrl)
		}
		setPreviewFile(null)
		onClose()
	}
	return (
		<DialogModal open onClose={handleClose} className='card w-md'>
			<h2 className='mb-4 text-xl font-bold'>选择图标</h2>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label className='text-secondary mb-2 block text-sm font-medium'>上传图片</label>
					<input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileSelect} />
					<div
						onClick={() => fileInputRef.current?.click()}
						className='mx-auto flex h-32 w-32 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-secondary/10 transition-colors hover:bg-gray-200 overflow-hidden'>
						{previewFile ? (
							<img src={previewFile.previewUrl} alt='preview' className='h-full w-full object-cover' />
						) : currentLogo ? (
							<img src={currentLogo} alt='current' className='h-full w-full object-cover' />
						) : (
							<div className='text-center'>
								<Plus className='text-secondary mx-auto mb-1 h-8 w-8' />
								<p className='text-secondary text-xs'>点击上传图片</p>
							</div>
						)}
					</div>
				</div>

				<div className='flex gap-3 pt-4'>
					<button type='submit' disabled={isUploading} className='brand-btn flex-1 justify-center rounded-lg px-6 py-2.5 disabled:opacity-50'>
						{isUploading ? '上传中...' : '确认'}
					</button>
					<button
						type='button'
						onClick={handleClose}
						className='flex-1 rounded-lg border border-gray-300 bg-white dark:bg-[#27272a] px-6 py-2.5 transition-colors hover:bg-gray-50'>
						取消
					</button>
				</div>
			</form>
		</DialogModal>
	)
}
