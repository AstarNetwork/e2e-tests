/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
	test: {
		hookTimeout: 600_000,
		testTimeout: 600_000,
		pool: 'forks',
		poolOptions: { forks: { singleFork: !!process.env.GITHUB_ACTIONS } },
		passWithNoTests: true,
	},
	plugins: [swc.vite()],
})
