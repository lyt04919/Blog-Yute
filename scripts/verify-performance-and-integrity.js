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

	// 6. Verify AudioCinemaLounge integrates all 6 categories with CSS mask feathering
	test('AudioCinemaLounge integrates all 6 categories with CSS mask feathering and geek tools', () => {
		const loungeContent = fs.readFileSync(path.join(ROOT, 'src/app/(home)/components/audio-cinema-lounge.tsx'), 'utf8')
		assert.ok(loungeContent.includes("import shareData from '@/app/favorite/share/list.json'"), 'AudioCinemaLounge must import shareData')
		assert.ok(loungeContent.includes('Web & Tools · 灵感工具与极客站点'), 'AudioCinemaLounge must have Web & Tools section')
		assert.ok(loungeContent.includes('mask-image:linear-gradient'), 'AudioCinemaLounge must use CSS mask-image for feathering')
		assert.ok(loungeContent.includes('handleCopyUrl'), 'AudioCinemaLounge modal must support copy URL for web tools')
	})

	console.log(`\n🏁 Test Results: ${passed}/${total} passed.`)
	if (passed === total) {
		console.log('✨ All performance and integrity tests PASSED successfully!\n')
	}
}

runTests()
