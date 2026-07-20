'use client'

import { AboutItemPageTemplate } from '../components/about-item-page-template'
import initialSoftware from '../software.json'

export default function AboutSoftwarePage() {
	return (
		<AboutItemPageTemplate
			initialItems={initialSoftware}
			targetType="software"
			pageTitle="Software"
			pageDescription="开发工具与效率软件：陪伴我日常编程、设计以及内容创作的主力应用程序与云服务。"
			backUrl="/about"
			backLabel="About"
		/>
	)
}
