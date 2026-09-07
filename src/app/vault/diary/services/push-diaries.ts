import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import type { Diary } from '@/types/diary'
import type { ImageItem } from '@/app/projects/components/image-upload-dialog'
import { getFileExt } from '@/lib/utils'
import { toast } from 'sonner'
import { commitFilesToGitHub, type GitCommitFile } from '@/lib/github-client'

export type PushDiariesParams = {
	diaries: Diary[]
	imageItems?: Map<string, ImageItem>
}

function encodeUtf8Base64(str: string): string {
	const bytes = new TextEncoder().encode(str)
	let binary = ''
	const len = bytes.byteLength
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}

export async function pushDiaries(params: PushDiariesParams): Promise<void> {
	const { diaries, imageItems } = params
	let updatedDiaries = [...diaries]
	const isDev = process.env.NODE_ENV === 'development'

	const localFiles: { path: string; contentBase64: string }[] = []
	const githubFiles: GitCommitFile[] = []

	if (imageItems && imageItems.size > 0) {
		for (const [id, imageItem] of imageItems.entries()) {
			if (imageItem.type === 'file') {
				const hash = imageItem.hash || (await hashFileSHA256(imageItem.file))
				const ext = getFileExt(imageItem.file.name)
				const filename = `${hash}${ext}`
				const publicPath = `/images/diary/${filename}`
				const relPath = `public/images/diary/${filename}`
				const contentBase64 = await fileToBase64NoPrefix(imageItem.file)

				localFiles.push({ path: relPath, contentBase64 })
				githubFiles.push({ path: relPath, content: contentBase64, encoding: 'base64' })

				updatedDiaries = updatedDiaries.map(d => {
					if (d.id === id) {
						const currentMedia = d.media || []
						const media = currentMedia.includes(publicPath) ? currentMedia : [...currentMedia, publicPath]
						return { ...d, media, image: publicPath }
					}
					return d
				})
			}
		}
	}

	const jsonContent = JSON.stringify(updatedDiaries, null, '\t')
	const diaryJsonPath = 'src/data/private/diary.json'

	if (isDev) {
		toast.info('正在保存到本地...')
		localFiles.push({
			path: diaryJsonPath,
			contentBase64: encodeUtf8Base64(jsonContent)
		})

		const res = await fetch('/api/save-local', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				files: localFiles,
				deletedFiles: []
			})
		})

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}))
			throw new Error(errorData.error || '本地数据保存失败')
		}
	} else {
		toast.info('正在提交到 GitHub 仓库...')
		githubFiles.push({
			path: diaryJsonPath,
			content: jsonContent
		})
		await commitFilesToGitHub(githubFiles, '更新私密日记列表')
	}
}
