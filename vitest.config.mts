/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
	test: {
		hookTimeout: 240_000,
		testTimeout: 240_000,
		pool: 'forks',
		passWithNoTests: true,
		reporters: process.env.GITHUB_ACTIONS ? ['basic', 'github-actions'] : ['basic'],
	},
	plugins: [swc.vite()],
})
