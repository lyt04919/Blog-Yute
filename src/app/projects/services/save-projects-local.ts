import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import type { Project } from '../components/project-card'
import type { ImageItem } from '../components/image-upload-dialog'
import { getFileExt } from '@/lib/utils'
import { toast } from 'sonner'

export type SaveProjectsLocalParams = {
	projects: Project[]
	imageItems?: Map<string, ImageItem>
}

export async function saveProjectsLocal(params: SaveProjectsLocalParams): Promise<void> {
	const { projects, imageItems } = params

	toast.info('正在本地保存项目...')

	const apiFiles: { path: string; contentBase64: string }[] = []
	const uploadedHashes = new Set<string>()
	let updatedProjects = [...projects]

	if (imageItems && imageItems.size > 0) {
		for (const [url, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const hash = imageItem.hash || (await hashFileSHA256(imageItem.file))
				const ext = getFileExt(imageItem.file.name)
				const filename = `${hash}${ext}`
				const publicPath = `/images/project/${filename}`

				if (!uploadedHashes.has(hash)) {
					const path = `public/images/project/${filename}`
					const contentBase64 = await fileToBase64NoPrefix(imageItem.file)
					apiFiles.push({ path, contentBase64 })
					uploadedHashes.add(hash)
				}

				updatedProjects = updatedProjects.map(p => (p.url === url ? { ...p, image: publicPath } : p))
			}
		}
	}

	// 1. Save local images if any
	if (apiFiles.length > 0) {
		const resImg = await fetch('/api/save-local', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ files: apiFiles })
		})
		if (!resImg.ok) {
			const err = await resImg.json()
			throw new Error(err.error || '保存本地图片失败')
		}
	}

	// 2. Save projects JSON data
	const resData = await fetch('/api/save-data', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			target: 'projects',
			data: updatedProjects
		})
	})

	if (!resData.ok) {
		const err = await resData.json()
		throw new Error(err.error || '保存本地项目数据失败')
	}

	toast.success('本地保存成功！')
}
