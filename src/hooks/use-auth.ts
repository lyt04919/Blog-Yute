import { create } from 'zustand'
import { clearAllAuthCache, getAuthToken as getToken, hasAuth as checkAuth, getPasswordFromCache, savePasswordToCache } from '@/lib/auth'

interface AuthStore {
	// State
	isAuth: boolean
	password: string | null
	authModalOpen: boolean

	// Actions
	setAuthModalOpen: (open: boolean) => void
	setPassword: (password: string) => Promise<void>
	clearAuth: () => void
	refreshAuthState: () => void
	getAuthToken: () => Promise<string>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	isAuth: false,
	password: null,
	authModalOpen: false,

	setAuthModalOpen: (open: boolean) => set({ authModalOpen: open }),

	setPassword: async (password: string) => {
		const res = await fetch('/api/auth/github-token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password })
		})
		const data = await res.json()
		if (!res.ok || !data.success) {
			throw new Error(data.error || '密码错误')
		}
		savePasswordToCache(password)
		set({ isAuth: true, password })
	},

	clearAuth: () => {
		clearAllAuthCache()
		set({ isAuth: false, password: null })
	},

	refreshAuthState: async () => {
		set({ isAuth: await checkAuth() })
	},

	getAuthToken: async () => {
		const token = await getToken()
		get().refreshAuthState()
		return token
	}
}))

const pwd = getPasswordFromCache()
if (pwd) {
	useAuthStore.setState({ password: pwd, isAuth: true })
}

checkAuth().then((isAuth) => {
	if (isAuth) {
		useAuthStore.setState({ isAuth: true })
	}
})
