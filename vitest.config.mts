/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
	test: {
		hookTimeout: 300_000,
		testTimeout: 30,
		pool: 'forks',
		passWithNoTests: true,
		reporters: process.env.GITHUB_ACTIONS ? ['basic', 'github-actions'] : ['verbose'],
	},
	plugins: [swc.vite()],
})
