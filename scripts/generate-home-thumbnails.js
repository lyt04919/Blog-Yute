#!/usr/bin/env node

/**
 * Script to generate high-quality, lightweight WebP thumbnails
 * for high-resolution images used on the homepage.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')

const IMAGES_TO_OPTIMIZE = [
	{
		src: 'public/images/uploads/7ef4d45667098fa8.jpeg',
		dest: 'public/images/uploads/7ef4d45667098fa8.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	},
	{
		src: 'public/images/uploads/0c004c6f642839f2.jpeg',
		dest: 'public/images/uploads/0c004c6f642839f2.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	},
	{
		src: 'public/images/uploads/844b159ea02995f4.jpeg',
		dest: 'public/images/uploads/844b159ea02995f4.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	},
	{
		src: 'public/images/footprints/img_1782661993747_6.jpg',
		dest: 'public/images/footprints/img_1782661993747_6.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	},
	{
		src: 'public/images/footprints/img_1782661993749_9.jpg',
		dest: 'public/images/footprints/img_1782661993749_9.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	},
	{
		src: 'public/images/footprints/img_1782661993745_5.jpg',
		dest: 'public/images/footprints/img_1782661993745_5.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	},
	{
		src: 'public/images/footprints/fp_1784013203171_cover.jpg',
		dest: 'public/images/footprints/fp_1784013203171_cover.thumb.webp',
		width: 400,
		height: 400,
		fit: 'cover',
		quality: 82
	}
]

async function generateThumbnails() {
	console.log('🚀 Generating optimized WebP thumbnails for homepage images...\n')
	let totalOriginalBytes = 0
	let totalOptimizedBytes = 0

	for (const item of IMAGES_TO_OPTIMIZE) {
		const srcPath = path.join(ROOT, item.src)
		const destPath = path.join(ROOT, item.dest)

		if (!fs.existsSync(srcPath)) {
			console.warn(`⚠️ Source file not found: ${item.src}`)
			continue
		}

		const originalSize = fs.statSync(srcPath).size
		totalOriginalBytes += originalSize

		await sharp(srcPath)
			.resize(item.width, item.height, { fit: item.fit })
			.webp({ quality: item.quality, effort: 6 })
			.toFile(destPath)

		const optimizedSize = fs.statSync(destPath).size
		totalOptimizedBytes += optimizedSize

		const ratio = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1)
		console.log(`  ✅ ${path.basename(item.src)}: ${(originalSize / 1024).toFixed(1)} KB -> ${(optimizedSize / 1024).toFixed(1)} KB (Saved ${ratio}%)`)
	}

	console.log('\n📊 Summary:')
	console.log(`  Total Original Size: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`)
	console.log(`  Total WebP Thumbnail Size: ${(totalOptimizedBytes / 1024).toFixed(2)} KB`)
	console.log(`  Total Reduction: ${(((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(1)}%`)
}

generateThumbnails().catch((err) => {
	console.error('Error generating thumbnails:', err)
	process.exit(1)
})
