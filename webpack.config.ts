import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
	entry: './dist/index.js',
	output: {
		filename: 'asyncWorker.browser.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'asyncWorker',
		libraryTarget: 'umd'
	},
	mode: 'production'
}

export default config
