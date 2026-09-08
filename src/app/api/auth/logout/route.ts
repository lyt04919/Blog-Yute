import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/server-auth'

export async function POST() {
	const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
	response.cookies.set({
		name: ADMIN_COOKIE_NAME,
		value: '',
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 0
	})
	return response
}

export async function GET() {
	return POST()
}
