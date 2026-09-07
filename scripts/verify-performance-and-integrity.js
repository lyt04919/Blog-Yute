#!/usr/bin/env node

/**
 * Verification Test Suite for Home Performance Optimization & Dead Code Removal
 */

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const ROOT = path.resolve(__dirname, '..')

function runTests() {
	console.log('🧪 Starting Performance & Integrity Verification Tests...\n')
	let passed = 0
	let total = 0

	function test(description, fn) {
		total++
		try {
			fn()
			console.log(`  ✅ PASS: ${description}`)
			passed++
		} catch (err) {
			console.error(`  ❌ FAIL: ${description}`)
			console.error(err)
			process.exitCode = 1
		}
	}

	// 1. Check Homepage Structure
	test('HomePage uses dynamic imports and LazySection for below-fold modules', () => {
		const homePageContent = fs.readFileSync(path.join(ROOT, 'src/app/(home)/page.tsx'), 'utf8')
		assert.ok(homePageContent.includes("import HeroSection from './components/hero-section'"), 'HeroSection must be statically/synchronously imported')
		assert.ok(homePageContent.includes("dynamic(() => import('./components/editorial-projects')"), 'EditorialProjects must be dynamically imported')
		assert.ok(homePageContent.includes("dynamic(() => import('./components/nomad-trajectory-map')"), 'NomadTrajectoryMap must be dynamically imported')
		assert.ok(homePageContent.includes("dynamic(() => import('./components/audio-cinema-lounge')"), 'AudioCinemaLounge must be dynamically imported')
		assert.ok(homePageContent.includes('IntersectionObserver'), 'HomePage must use native IntersectionObserver')
		assert.ok(homePageContent.includes('<LazySection minHeight="620px">'), 'EditorialProjects placeholder must be present')
		assert.ok(homePageContent.includes('<LazySection minHeight="720px">'), 'NomadTrajectoryMap placeholder must be present')
		assert.ok(homePageContent.includes('<LazySection minHeight="850px">'), 'AudioCinemaLounge placeholder must be present')
	})

	// 2. Check Pictures Page
	test('Pictures page dynamically imports DomeGallery, PicturesTimeline, LocationAlbumGrid', () => {
		const picturesPageContent = fs.readFileSync(path.join(ROOT, 'src/app/pictures/page.tsx'), 'utf8')
		assert.ok(/dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/components\/dome-gallery['"]\)/.test(picturesPageContent), 'DomeGallery must be dynamically imported')
		assert.ok(/dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/components\/location-album-grid['"]\)/.test(picturesPageContent), 'LocationAlbumGrid must be dynamically imported')
		assert.ok(/dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/components\/pictures-timeline['"]\)/.test(picturesPageContent), 'PicturesTimeline must be dynamically imported')
		assert.ok(/dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/components\/upload-dialog['"]\)/.test(picturesPageContent), 'UploadDialog must be dynamically imported')
	})

	// 3. Check Modals Dynamic Import
	test('MovieTop250Modal and MovieReportModal are dynamically imported and conditionally rendered', () => {
		const gridView = fs.readFileSync(path.join(ROOT, 'src/app/favorite/movie-grid-view.tsx'), 'utf8')
		assert.ok(gridView.includes("dynamic(() => import('./components/movie-top250-modal')"), 'MovieTop250Modal must be dynamic in movie-grid-view')
		assert.ok(gridView.includes('{isTop250ModalOpen && ('), 'MovieTop250Modal must be conditionally rendered')

		const movieStats = fs.readFileSync(path.join(ROOT, 'src/app/favorite/components/movie-stats-panel.tsx'), 'utf8')
		assert.ok(movieStats.includes("dynamic(() => import('./movie-report-modal')"), 'MovieReportModal must be dynamic in movie-stats-panel')
	})

	// 4. Verify no dangling references to deleted components
	test('Deleted home components have no active references across src/', () => {
		const deletedNames = [
			'bento-map',
			'connect-section',
			'editorial-audio-cinema',
			'editorial-code-style',
			'editorial-code-toolbox',
			'editorial-footer',
			'editorial-garden',
			'editorial-hero',
			'equipment-showcase',
			'featured-projects',
			'footprint-bento',
			'interactive-connect-colophon',
			'live-status',
			'movie-vault-showcase',
			'portal-articles',
			'portal-footprints',
			'portal-media-vault',
			'portal-projects',
			'portal-snippets-tools',
			'portal-terminal',
			'quick-stats-bar',
			'recent-insights',
			'space-map-settings-client',
			'space-map-settings-dialog',
			'ScrollFloat'
		]

		function walkDir(dir) {
			let results = []
			const list = fs.readdirSync(dir)
			list.forEach((file) => {
				const fullPath = path.join(dir, file)
				const stat = fs.statSync(fullPath)
				if (stat && stat.isDirectory()) {
					results = results.concat(walkDir(fullPath))
				} else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
					results.push(fullPath)
				}
			})
			return results
		}

		const srcFiles = walkDir(path.join(ROOT, 'src'))
		for (const file of srcFiles) {
			const content = fs.readFileSync(file, 'utf8')
			for (const name of deletedNames) {
				const importPattern = new RegExp(`from\\s+['"][^'"]*${name}['"]|import\\(['"][^'"]*${name}['"]\\)`, 'g')
				const matches = content.match(importPattern)
				assert.strictEqual(matches, null, `Found orphaned reference to ${name} in ${file}`)
			}
		}
	})

	// 5. Verify core data integrity
	test('Core JSON data sources are valid and loadable', () => {
		const dataFiles = [
			'src/data/footprints.json',
			'src/data/movies.json',
			'src/data/books.json',
			'src/data/projects.json',
			'src/app/favorite/music.json',
			'src/app/favorite/games.json',
			'src/app/favorite/videos.json',
			'src/app/favorite/share/list.json'
		]

		for (const file of dataFiles) {
			const filePath = path.join(ROOT, file)
			assert.ok(fs.existsSync(filePath), `Data file ${file} should exist`)
			const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
			assert.ok(Array.isArray(parsed) || typeof parsed === 'object', `Data file ${file} should be valid JSON`)
		}
	})

	// 6. Verify AudioCinemaLounge and GeekIdentityBento Web & Tools integration
	test('AudioCinemaLounge integrates media lounge and GeekIdentityBento integrates InfiniteSpiral web & tools', () => {
		const loungeContent = fs.readFileSync(path.join(ROOT, 'src/app/(home)/components/audio-cinema-lounge.tsx'), 'utf8')
		assert.ok(loungeContent.includes('mask-image:linear-gradient'), 'AudioCinemaLounge must use CSS mask-image for feathering')
		assert.ok(loungeContent.includes('HeroVideoModal'), 'AudioCinemaLounge must integrate HeroVideoModal for cinema video playback')
		assert.ok(loungeContent.includes('audioRef'), 'AudioCinemaLounge must integrate audioRef for home music playback')
		assert.ok(loungeContent.includes('playTrackAudio'), 'AudioCinemaLounge must support dynamic audio playback')

		const geekBentoContent = fs.readFileSync(path.join(ROOT, 'src/components/geek-identity-bento.tsx'), 'utf8')
		assert.ok(geekBentoContent.includes("import shareData from '@/app/favorite/share/list.json'"), 'GeekIdentityBento must import shareData for Web & Tools')
		assert.ok(geekBentoContent.includes('InfiniteSpiral'), 'GeekIdentityBento must integrate InfiniteSpiral')
	})

	// 8. Verify Magic UI BentoGrid and GeekIdentityBento components
	test('BentoGrid, BentoCard and GeekIdentityBento components exist and are integrated', () => {
		const bentoGridPath = path.join(ROOT, 'src/components/ui/bento-grid.tsx')
		assert.ok(fs.existsSync(bentoGridPath), 'src/components/ui/bento-grid.tsx should exist')
		const bentoContent = fs.readFileSync(bentoGridPath, 'utf8')
		assert.ok(bentoContent.includes('export function BentoGrid'), 'BentoGrid must be exported')
		assert.ok(bentoContent.includes('export function BentoCard'), 'BentoCard must be exported')

		const geekBentoPath = path.join(ROOT, 'src/components/geek-identity-bento.tsx')
		assert.ok(fs.existsSync(geekBentoPath), 'src/components/geek-identity-bento.tsx should exist')
		const geekContent = fs.readFileSync(geekBentoPath, 'utf8')
		assert.ok(geekContent.includes("top: '36px'"), 'GeekIdentityBento book marquee should be positioned at top: 36px')
		assert.ok(geekContent.includes("width: '112px'"), 'GeekIdentityBento book covers should strictly enforce width: 112px for 2:3 vertical book proportion')
		assert.ok(geekContent.includes('b.isShowOnHome !== false'), 'GeekIdentityBento must filter out inactive books')
		assert.ok(geekContent.includes('gap="1.5rem"'), 'GeekIdentityBento book marquee should use 1.5rem gap')
		assert.ok(geekContent.includes('rounded-xl'), 'GeekIdentityBento book covers must consistently use rounded-xl')
		assert.ok(bentoContent.includes('<ProgressiveBlur'), 'BentoCard must integrate ProgressiveBlur for seamless lower-half blur')
		assert.ok(bentoContent.includes('rounded-xl border shadow-xs'), 'BentoCard must feature unified squircle icon badge')
		assert.ok(geekContent.includes('bg-zinc-100/70 dark:bg-[#08080f]'), 'Movie showcase card must be adaptive in light/dark modes')

		const marqueePath = path.join(ROOT, 'src/components/ui/marquee.tsx')
		assert.ok(fs.existsSync(marqueePath), 'src/components/ui/marquee.tsx should exist')
		const marqueeContent = fs.readFileSync(marqueePath, 'utf8')
		assert.ok(marqueeContent.includes('gap?: string | number'), 'Marquee must support custom gap prop')

		const profileBentoPath = path.join(ROOT, 'src/app/about/components/profile-bento.tsx')
		const profileContent = fs.readFileSync(profileBentoPath, 'utf8')
		assert.ok(profileContent.includes('BentoGrid'), 'ProfileBento must integrate BentoGrid')
		assert.ok(profileContent.includes('BentoCard'), 'ProfileBento must integrate BentoCard')
	})

	// 9. Verify Projects Page and Data Integrity
	test('Projects page uses dynamic tag extraction and valid project data assets', () => {
		const projectsPageContent = fs.readFileSync(path.join(ROOT, 'src/app/projects/page.tsx'), 'utf8')
		assert.ok(projectsPageContent.includes('categoryTabs'), 'Projects page must compute categoryTabs')
		assert.ok(projectsPageContent.includes('cascadingToolbarTags'), 'Projects page must compute cascadingToolbarTags')
		assert.ok(projectsPageContent.includes('extraRightActions={viewModeToggle}'), 'View mode switcher must be integrated in toolbar')
		assert.ok(projectsPageContent.includes('isFeatured'), 'Projects page must support featured project layout')
		assert.ok(projectsPageContent.includes('ProjectPreviewModal'), 'Projects page must dynamically import ProjectPreviewModal')
		assert.ok(projectsPageContent.includes('onPreview={setPreviewProject}'), 'Projects page must wire onPreview to ProjectCard')

		const projectsCardContent = fs.readFileSync(path.join(ROOT, 'src/app/projects/components/project-card.tsx'), 'utf8')
		assert.ok(projectsCardContent.includes('isFeatured'), 'ProjectCard must support isFeatured')
		assert.ok(projectsCardContent.includes('onPreview'), 'ProjectCard must accept onPreview callback')
		assert.ok(projectsCardContent.includes('copiedNpm'), 'ProjectCard must support NPM command copy')

		const previewModalPath = path.join(ROOT, 'src/app/projects/components/project-preview-modal.tsx')
		assert.ok(fs.existsSync(previewModalPath), 'ProjectPreviewModal component file must exist')
		const modalContent = fs.readFileSync(previewModalPath, 'utf8')
		assert.ok(modalContent.includes('deviceMode'), 'ProjectPreviewModal must support multi-device switcher')
		assert.ok(modalContent.includes('iframe'), 'ProjectPreviewModal must render iframe preview')

		const createDialogPath = path.join(ROOT, 'src/app/projects/components/create-dialog.tsx')
		assert.ok(fs.existsSync(createDialogPath), 'CreateDialog component file must exist')
		const dialogContent = fs.readFileSync(createDialogPath, 'utf8')
		assert.ok(dialogContent.includes('featured:'), 'CreateDialog must support toggling featured status')
		assert.ok(dialogContent.includes('PROJECT_CATEGORIES'), 'CreateDialog must support project categories')

		const projectsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/projects.json'), 'utf8'))
		for (const p of projectsJson) {
			assert.ok(!p.image.startsWith('blob:'), `Project ${p.name} image should not be a temporary blob URL`)
			assert.ok(p.name && p.url && p.description, `Project ${p.name} must have name, url, and description`)
			assert.ok(p.category, `Project ${p.name} must have category defined`)
		}
	})

	// 10. Verify Blog Page Deep Overhaul, Dynamic Tags, BlogGridCard & BlogEditorialCard
	test('Blog page uses dynamic tags, BlogGridCard, BlogEditorialCard, live search, 3 view modes, and proper padding', () => {
		const blogPagePath = path.join(ROOT, 'src/app/blog/page.tsx')
		assert.ok(fs.existsSync(blogPagePath), 'src/app/blog/page.tsx should exist')
		const blogPageContent = fs.readFileSync(blogPagePath, 'utf8')
		assert.ok(blogPageContent.includes('dynamicTags'), 'Blog page must compute dynamicTags')
		assert.ok(blogPageContent.includes('tags={dynamicTags}'), 'Blog page must pass dynamicTags to StandardToolbar')
		assert.ok(blogPageContent.includes('<BlogGridCard'), 'Blog page must use BlogGridCard component')
		assert.ok(blogPageContent.includes('<BlogEditorialCard'), 'Blog page must use BlogEditorialCard component')
		assert.ok(blogPageContent.includes('searchFilteredItems'), 'Blog page must support live search filtering')
		assert.ok(blogPageContent.includes('featuredArticle'), 'Blog page must support featured article spotlight')
		assert.ok(blogPageContent.includes('isRead={isRead(blog.slug)}'), 'Blog page must pass isRead to cards')
		assert.ok(blogPageContent.includes('pb-48'), 'Blog page must provide pb-48 for bottom dock clearance')

		const blogCardPath = path.join(ROOT, 'src/components/blog-grid-card.tsx')
		assert.ok(fs.existsSync(blogCardPath), 'src/components/blog-grid-card.tsx should exist')
		const blogCardContent = fs.readFileSync(blogCardPath, 'utf8')
		assert.ok(blogCardContent.includes('isRead'), 'BlogGridCard must support isRead state')
		assert.ok(blogCardContent.includes('Clock'), 'BlogGridCard must include reading time estimate')

		const blogEditorialPath = path.join(ROOT, 'src/components/blog-editorial-card.tsx')
		assert.ok(fs.existsSync(blogEditorialPath), 'src/components/blog-editorial-card.tsx should exist')
		const editorialContent = fs.readFileSync(blogEditorialPath, 'utf8')
		assert.ok(editorialContent.includes('isHero'), 'BlogEditorialCard must support isHero variant')

		const toolbarPath = path.join(ROOT, 'src/components/ui/standard-toolbar.tsx')
		const toolbarContent = fs.readFileSync(toolbarPath, 'utf8')
		assert.ok(toolbarContent.includes('standardToolbarActivePill'), 'StandardToolbar must support smooth sliding pill layoutId')

		const blogIndexJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/blogs/index.json'), 'utf8'))
		assert.ok(Array.isArray(blogIndexJson), 'public/blogs/index.json should be an array')
		for (const b of blogIndexJson) {
			assert.ok(b.slug && b.title && b.date, `Blog item ${b.slug} must have slug, title, and date`)
		}
	})

	// 11. Verify Homepage Performance Overhaul & GPU Optimization
	test('Homepage animations, ProgressiveBlur, InfiniteSpiral, and thumbnails are optimized for 60FPS performance', () => {
		// 1. Check ProgressiveBlur layer capping & hardware acceleration
		const bentoGridContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/bento-grid.tsx'), 'utf8')
		assert.ok(bentoGridContent.includes('translateZ(0)'), 'ProgressiveBlur must apply translateZ(0) hardware acceleration')
		assert.ok(bentoGridContent.includes('willChange'), 'ProgressiveBlur must declare willChange')

		// 2. Check InfiniteSpiral offscreen pausing and removal of per-frame filter blur
		const spiralContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/infinite-spiral.tsx'), 'utf8')
		assert.ok(spiralContent.includes('cancelAnimationFrame'), 'InfiniteSpiral must cancelAnimationFrame when offscreen')
		assert.ok(!spiralContent.includes('card.style.filter ='), 'InfiniteSpiral must not execute per-frame style.filter updates')

		// 3. Check DriftWall viewport awareness
		const driftContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/drift-wall.tsx'), 'utf8')
		assert.ok(driftContent.includes("animationPlayState: isInView ? 'running' : 'paused'"), 'DriftWall must pause tracks when offscreen')

		// 4. Check Marquee viewport awareness
		const marqueeContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/marquee.tsx'), 'utf8')
		assert.ok(marqueeContent.includes("animationPlayState: isInView ? 'running' : 'paused'"), 'Marquee must pause tracks when offscreen')

		// 5. Check SVG WorldMapBase memoization
		const mapContent = fs.readFileSync(path.join(ROOT, 'src/app/(home)/components/nomad-trajectory-map.tsx'), 'utf8')
		assert.ok(mapContent.includes('WorldMapBase = React.memo'), 'nomad-trajectory-map must wrap 147KB SVG path in React.memo')

		// 6. Check WebP thumbnails generation and size under 50KB
		const thumbFiles = [
			'public/images/uploads/7ef4d45667098fa8.thumb.webp',
			'public/images/uploads/0c004c6f642839f2.thumb.webp',
			'public/images/uploads/844b159ea02995f4.thumb.webp',
			'public/images/footprints/img_1782661993747_6.thumb.webp',
			'public/images/footprints/img_1782661993749_9.thumb.webp'
		]
		for (const thumb of thumbFiles) {
			const thumbPath = path.join(ROOT, thumb)
			assert.ok(fs.existsSync(thumbPath), `Thumbnail ${thumb} must exist`)
			const stat = fs.statSync(thumbPath)
			assert.ok(stat.size < 50 * 1024, `Thumbnail ${thumb} must be under 50KB (actual: ${(stat.size / 1024).toFixed(1)}KB)`)
		}
	})

	// 12. Verify Diary Module Architecture, Data Integrity & Code Quality
	test('Diary module implements decoupled architecture, unified metadata, and clean component contracts', () => {
		// 1. Verify types exist and are properly structured
		const typesPath = path.join(ROOT, 'src/types/diary.ts')
		assert.ok(fs.existsSync(typesPath), 'src/types/diary.ts must exist')
		const typesContent = fs.readFileSync(typesPath, 'utf8')
		assert.ok(typesContent.includes('export interface Diary'), 'Diary interface must be exported')
		assert.ok(typesContent.includes('export type MoodType'), 'MoodType must be exported')
		assert.ok(typesContent.includes('export type WeatherType'), 'WeatherType must be exported')

		// 2. Verify metadata constants and reading stats calculation
		const metaPath = path.join(ROOT, 'src/app/vault/diary/constants/meta.ts')
		assert.ok(fs.existsSync(metaPath), 'src/app/vault/diary/constants/meta.ts must exist')
		const metaContent = fs.readFileSync(metaPath, 'utf8')
		assert.ok(metaContent.includes('export const MOOD_LIST'), 'MOOD_LIST must be exported')
		assert.ok(metaContent.includes('export const WEATHER_LIST'), 'WEATHER_LIST must be exported')
		assert.ok(metaContent.includes('export function calculateReadingStats'), 'calculateReadingStats must be exported')

		// 3. Verify diary.json data validity
		const diaryJsonPath = path.join(ROOT, 'src/data/private/diary.json')
		assert.ok(fs.existsSync(diaryJsonPath), 'src/data/private/diary.json must exist')
		const diaries = JSON.parse(fs.readFileSync(diaryJsonPath, 'utf8'))
		assert.ok(Array.isArray(diaries), 'diary.json must be an array')
		for (const item of diaries) {
			assert.ok(item.id, `Diary item ${item.id} must have id`)
			assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date), `Diary item ${item.id} date must be formatted YYYY-MM-DD (got: ${item.date})`)
			assert.ok(typeof item.content === 'string', `Diary item ${item.id} must have string content`)
		}

		// 4. Verify no inline <style> tags in modal
		const modalPath = path.join(ROOT, 'src/app/vault/diary/components/diary-detail-modal.tsx')
		const modalContent = fs.readFileSync(modalPath, 'utf8')
		assert.ok(!modalContent.includes('<style>'), 'diary-detail-modal.tsx must not contain inline <style> tags')

		// 5. Verify push-diaries has no deprecated unescape and supports GitHub commit
		const pushPath = path.join(ROOT, 'src/app/vault/diary/services/push-diaries.ts')
		const pushContent = fs.readFileSync(pushPath, 'utf8')
		assert.ok(!pushContent.includes('unescape('), 'push-diaries.ts must not use deprecated unescape')
		assert.ok(pushContent.includes('commitFilesToGitHub'), 'push-diaries.ts must support commitFilesToGitHub for production')

		// 6. Verify calendar boundary check
		const calendarPath = path.join(ROOT, 'src/app/vault/diary/components/diary-calendar.tsx')
		const calendarContent = fs.readFileSync(calendarPath, 'utf8')
		assert.ok(calendarContent.includes("day.isSame(endDate, 'day')"), 'diary-calendar must include the end of the week')

		// 7. Verify memory heatmap supports onSelectDate
		const heatmapPath = path.join(ROOT, 'src/app/vault/diary/components/memory-heatmap.tsx')
		const heatmapContent = fs.readFileSync(heatmapPath, 'utf8')
		assert.ok(heatmapContent.includes('onSelectDate?: (dateStr: string) => void'), 'memory-heatmap must support onSelectDate prop')
	})

	console.log(`\n🏁 Test Results: ${passed}/${total} passed.`)
	if (passed === total) {
		console.log('✨ All performance and integrity tests PASSED successfully!\n')
	}
}

runTests()
