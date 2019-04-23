import {
	writeFileSync,
	readdirSync,
	readFileSync,
	mkdirSync,
	unlinkSync,
	existsSync,
	lstatSync,
	rmdirSync
} from 'fs'
import { join, basename, dirname } from 'path'

interface TemplEnv {
	jestEnv: string
	importPath: string
	outPath: string
	desc: string
}

const templs: TemplEnv[] = [
	{ jestEnv: 'node', importPath: '../../src/node', outPath: './node', desc: 'node' },
	{ jestEnv: 'jsdom', importPath: '../../src/web', outPath: './web', desc: 'web' }
]

templs.forEach(templ => {
	const path = join(__dirname, templ.outPath)
	;(function delRec(path: string) {
		if (existsSync(path)) {
			readdirSync(path).forEach(file => {
				var currPath = path + '/' + file
				if (lstatSync(currPath).isDirectory()) {
					delRec(currPath)
				} else {
					unlinkSync(currPath)
				}
			})
			rmdirSync(path)
		}
	})(path)
})

readdirSync(__dirname)
	.map(filename => join(__dirname, filename))
	.filter(file => file !== __filename)
	.forEach(file => {
		if (file === 'C:\\Coding\\github\\async-worker\\tests\\node') return
		const strFile = readFileSync(file, { encoding: 'utf8' })

		templs.forEach(templ => {
			const templated = strFile
				.replace('{JEST-ENV}', templ.jestEnv)
				.replace('{IMPORT-PATH}', templ.importPath)
				.replace('{DESC}', templ.desc)

			const outPath = join(__dirname, templ.outPath, basename(file))
			mkdirSync(dirname(outPath), { recursive: true })
			writeFileSync(outPath, templated)
		})
	})
