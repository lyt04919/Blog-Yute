import '@/styles/globals.css'

import type { Metadata } from 'next'
import { Caveat } from 'next/font/google'
import Layout from '@/layout'
import Head from '@/layout/head'
import { CommandMenu } from '@/components/command-menu'
import siteContent from '@/config/site-content.json'
import { ThemeProvider } from '@/hooks/use-theme'

const caveat = Caveat({
	subsets: ['latin'],
	variable: '--font-cursive',
	display: 'swap',
})

const {
	meta: { title, description },
	theme
} = siteContent

export const metadata: Metadata = {
	title: {
		default: title,
		template: `%s - ${title}`
	},
	description,
	openGraph: {
		title: {
			default: title,
			template: `%s - ${title}`
		},
		description
	},
	twitter: {
		title: {
			default: title,
			template: `%s - ${title}`
		},
		description
	}
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en' suppressHydrationWarning className={`${caveat.variable}`}>
			<Head />

			<body>
				<script
					dangerouslySetInnerHTML={{
						__html: `
					if (/windows|win32/i.test(navigator.userAgent)) {
						document.documentElement.classList.add('windows');
					}
			      `
					}}
				/>

				<Layout>{children}</Layout>
				<CommandMenu />
			</body>
		</html>
	)
}
