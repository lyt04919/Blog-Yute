import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import type { Diary } from '../components/diary-card'
import type { ImageItem } from '@/app/projects/components/image-upload-dialog'
import { getFileExt } from '@/lib/utils'
import { toast } from 'sonner'

export type PushDiariesParams = {
	diaries: Diary[]
	imageItems?: Map<string, ImageItem>
}

export async function pushDiaries(params: PushDiariesParams): Promise<void> {
	const { diaries, imageItems } = params

	let updatedDiaries = [...diaries]
	const files: { path: string; contentBase64: string }[] = []

	if (imageItems && imageItems.size > 0) {
		for (const [id, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const hash = imageItem.hash || (await hashFileSHA256(imageItem.file))
				const ext = getFileExt(imageItem.file.name)
				const filename = `${hash}${ext}`
				const publicPath = `/images/diary/${filename}`

				const path = `public/images/diary/${filename}`
				const contentBase64 = await fileToBase64NoPrefix(imageItem.file)
				files.push({ path, contentBase64 })

				updatedDiaries = updatedDiaries.map(s => (s.id === id ? { ...s, image: publicPath } : s))
			}
		}
	}

	toast.info('正在保存到本地...')
	
	if (files.length > 0) {
		const res = await fetch('/api/save-local', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				files,
				deletedFiles: []
			})
		})

		if (!res.ok) {
			const errorData = await res.json()
			throw new Error(errorData.error || '本地图片保存失败')
		}
	}
	
	const resList = await fetch('/api/save-local', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			files: [
				{
					path: 'src/data/private/diary.json',
					contentBase64: btoa(unescape(encodeURIComponent(JSON.stringify(updatedDiaries, null, '\t'))))
				}
			],
			deletedFiles: []
		})
	})
	
	if (!resList.ok) {
		const errorData = await resList.json()
		throw new Error(errorData.error || '本地数据保存失败')
	}

	// Remove trailing toasts as page.tsx already toasts success, but it's okay.
}
