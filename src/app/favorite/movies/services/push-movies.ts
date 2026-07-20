import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import type { Movie } from '../../components/movie-card'
import type { LogoItem } from '../../components/logo-upload-dialog'
import { getFileExt } from '@/lib/utils'
import { toast } from 'sonner'

export type PushMoviesParams = {
	movies: Movie[]
	categories: string[]
	logoItems?: Map<string, LogoItem>
}

export async function pushMovies(params: PushMoviesParams): Promise<void> {
	const { movies, categories, logoItems } = params

	// 获取认证 token（自动从全局认证状态获取）
	const token = await getAuthToken()

	toast.info('正在获取分支信息...')
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const commitMessage = `更新电影列表与分类`

	toast.info('正在准备文件...')

	const treeItems: TreeItem[] = []
	const uploadedHashes = new Set<string>()
	let updatedMovies = [...movies]

	// Process poster uploads
	if (logoItems && logoItems.size > 0) {
		toast.info('正在上传海报...')
		for (const [name, logoItem] of logoItems.entries()) {
			if (logoItem.type === 'file') {
				const hash = logoItem.hash || (await hashFileSHA256(logoItem.file))
				const ext = getFileExt(logoItem.file.name)
				const filename = `${hash}${ext}`
				const publicPath = `/images/movie/${filename}`

				if (!uploadedHashes.has(hash)) {
					const path = `public/images/movie/${filename}`
					const contentBase64 = await fileToBase64NoPrefix(logoItem.file)
					const blobData = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, contentBase64, 'base64')
					treeItems.push({
						path,
						mode: '100644',
						type: 'blob',
						sha: blobData.sha
					})
					uploadedHashes.add(hash)
				}

				// Update movie poster URL
				updatedMovies = updatedMovies.map(m => (m.name === name ? { ...m, poster: publicPath } : m))
			}
		}
	}

	// Create blob for movies.json
	const moviesJson = JSON.stringify(updatedMovies, null, '\t')
	const moviesBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(moviesJson), 'base64')
	treeItems.push({
		path: 'src/data/movies.json',
		mode: '100644',
		type: 'blob',
		sha: moviesBlob.sha
	})

	// Create blob for categories.json
	const categoriesJson = JSON.stringify(categories, null, '\t')
	const categoriesBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(categoriesJson), 'base64')
	treeItems.push({
		path: 'src/app/favorite/categories.json',
		mode: '100644',
		type: 'blob',
		sha: categoriesBlob.sha
	})

	// Create tree
	toast.info('正在创建文件树...')
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

	// Create commit
	toast.info('正在创建提交...')
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

	// Update branch reference
	toast.info('正在更新分支...')
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

	toast.success('发布成功！')
}
