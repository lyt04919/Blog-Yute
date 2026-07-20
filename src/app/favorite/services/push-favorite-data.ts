import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { toast } from 'sonner'
import type { FavoriteItem } from '../components/favorite-item-card'

export type PushFavoriteDataParams = {
	target: string // e.g. 'gears', 'software', 'games'
	items: FavoriteItem[]
	categories?: string[] // Optional categories array to push
}

export async function pushFavoriteData(params: PushFavoriteDataParams): Promise<void> {
	const { target, items, categories } = params

	// 获取认证 token
	const token = await getAuthToken()

	toast.info('正在获取分支信息...')
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const commitMessage = `Update ${target} data`

	toast.info('正在准备文件...')
	const treeItems: TreeItem[] = []

	// Create blob for target.json
	const itemsJson = JSON.stringify(items, null, '\t')
	const itemsBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(itemsJson), 'base64')
	treeItems.push({
		path: `src/app/favorite/${target}.json`,
		mode: '100644',
		type: 'blob',
		sha: itemsBlob.sha
	})

	// Optional: Create blob for target-categories.json if passed
	if (categories) {
		const categoriesJson = JSON.stringify(categories, null, '\t')
		const categoriesBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(categoriesJson), 'base64')
		treeItems.push({
			path: `src/app/favorite/${target}-categories.json`,
			mode: '100644',
			type: 'blob',
			sha: categoriesBlob.sha
		})
	}

	// Create tree
	toast.info('正在创建文件树...')
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

	// Create commit
	toast.info('正在创建提交...')
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

	// Update branch reference
	toast.info('正在更新分支...')
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

	toast.success('发布云端成功！')
}
