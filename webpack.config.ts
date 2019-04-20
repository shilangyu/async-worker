import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
	entry: './dist/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	mode: 'production'
}

export default config
