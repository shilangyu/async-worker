import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
	entry: './dist/web/index.js',
	target: 'web',
	output: {
		filename: 'asyncWorker.web.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'asyncWorker',
		libraryTarget: 'umd'
	},
	mode: 'production'
}

export default config
