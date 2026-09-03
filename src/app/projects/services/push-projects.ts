import { commitFilesToGitHub, type GitCommitFile } from '@/lib/github-client'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import type { Project } from '../components/project-card'
import type { ImageItem } from '../components/image-upload-dialog'
import { getFileExt } from '@/lib/utils'

export type PushProjectsParams = {
	projects: Project[]
	imageItems?: Map<string, ImageItem>
}

export async function pushProjects(params: PushProjectsParams): Promise<void> {
	const { projects, imageItems } = params
	const files: GitCommitFile[] = []
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
					const content = await fileToBase64NoPrefix(imageItem.file)
					files.push({
						path,
						content,
						encoding: 'base64'
					})
					uploadedHashes.add(hash)
				}

				updatedProjects = updatedProjects.map(p => (p.url === url ? { ...p, image: publicPath } : p))
			}
		}
	}

	files.push({
		path: 'src/data/projects.json',
		content: JSON.stringify(updatedProjects, null, '\t')
	})

	await commitFilesToGitHub(files, '更新项目列表')
}

