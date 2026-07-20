'use client'

import { AboutItemPageTemplate } from '../components/about-item-page-template'
import initialGears from '../gears.json'

export default function AboutGearsPage() {
	return (
		<AboutItemPageTemplate
			initialItems={initialGears}
			targetType="gears"
			pageTitle="Gears"
			pageDescription="桌面装备与数码配件：展示在写代码和日常生活中伴随我的硬核生产力工具。"
			backUrl="/about"
			backLabel="About"
		/>
	)
}
