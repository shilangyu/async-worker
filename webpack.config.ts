import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
	entry: './dist/index.js',
	target: 'web',
	output: {
		filename: 'async-worker.web.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'AsyncWorker',
		libraryTarget: 'umd',
		libraryExport: 'default'
	},
	mode: 'production'
}

export default config
