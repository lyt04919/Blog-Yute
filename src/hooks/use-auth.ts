import { create } from 'zustand'
import { clearAllAuthCache, getAuthToken as getToken, hasAuth as checkAuth, getPasswordFromCache, savePasswordToCache } from '@/lib/auth'

interface AuthStore {
	// State
	isAuth: boolean
	password: string | null

	// Actions
	setPassword: (password: string) => void
	clearAuth: () => void
	refreshAuthState: () => void
	getAuthToken: () => Promise<string>
	setPrivateKey: (key: string) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	isAuth: false,
	password: null,

	setPassword: async (password: string) => {
		set({ isAuth: password === '111', password })
		if (password === '111') {
			await savePasswordToCache(password)
		} else {
			throw new Error('密码错误')
		}
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
	},

	setPrivateKey: (key: string) => {
		console.log('setPrivateKey called, token authorization is used instead.')
	}
}))

const pwd = getPasswordFromCache()
if (pwd) {
	useAuthStore.setState({ password: pwd, isAuth: pwd === '111' })
}

checkAuth().then((isAuth) => {
	if (isAuth) {
		useAuthStore.setState({ isAuth })
	}
})
