import { resolve } from 'path'
import { Configuration } from 'webpack'

export default {
	entry: './dist/index.js',
	target: 'web',
	output: {
		filename: 'async-worker.web.js',
		path: resolve(__dirname, 'dist'),
		library: 'AsyncWorker',
		libraryTarget: 'umd',
		libraryExport: 'default',
	},
	mode: 'production',
} as Configuration
