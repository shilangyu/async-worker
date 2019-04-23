import { Worker } from 'worker_threads'

export function cook<T, S extends any[], U extends any[]>(
	func: (...args: S) => (...args: U) => T,
	...args: S
): (...args: U) => Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	const worker = new Worker(
		`
			const { workerData: args, parentPort } = require('worker_threads')

			let slaveFunc = (${func})(...args)
			parentPort.on('message', args => {
				parentPort.postMessage(slaveFunc(...args))
			})
		`,
		{ workerData: args, eval: true }
	)

	return function(...args: U) {
		return new Promise((resolve, reject) => {
			worker.postMessage(args)

			worker.on('message', result => {
				resolve(result as T)
			})

			worker.on('error', (err: Error | string) => {
				if (typeof err === 'string' && err.includes('DataCloneError')) {
					reject(
						new TypeError('DataCloneError: Your task function returns a non-transferable value')
					)
				} else {
					reject(err)
				}
			})
		})
	}
}
