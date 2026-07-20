import { NextResponse } from 'next/server'
import { signAppJwt, getInstallationId, createInstallationToken } from '@/lib/github-client'
import { GITHUB_CONFIG } from '@/consts'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { password } = body

		// Check simple password
		if (password !== '111') {
			return NextResponse.json({ error: 'Unauthorized: Invalid password' }, { status: 401 })
		}

		// Check for private key in environment variable
		// Use regex to replace actual \n string with actual newline characters if they are escaped in Vercel UI
		let privateKey = process.env.GITHUB_PRIVATE_KEY
		if (!privateKey) {
			console.error('GITHUB_PRIVATE_KEY is not set in environment variables.')
			return NextResponse.json({ error: 'Server configuration error: Missing GITHUB_PRIVATE_KEY' }, { status: 500 })
		}
		
		// In some environments, \n is passed as a literal string '\\n', we need to unescape it
		privateKey = privateKey.replace(/\\n/g, '\n')

		const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)
		
		const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)
		
		const token = await createInstallationToken(jwt, installationId)

		return NextResponse.json({ success: true, token })
	} catch (error: any) {
		console.error('Failed to generate GitHub token:', error)
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
	}
}
