import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Below two are necessary for loading FFmpeg WASM. Else it won't fetch
	optimizeDeps: {
		exclude: [
			"@ffmpeg/ffmpeg",
			"@ffmpeg/util",
		]
	},
	server: {
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedded-Policy": "require-corp",
		}
	}
});
