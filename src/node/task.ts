import { Worker } from 'worker_threads'

export function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
	return new Promise((resolve, reject) => {
		if (typeof func !== 'function') {
			reject(new TypeError('Passed parameter is not a function'))
			return
		}

		const worker = new Worker(
			`
				const { workerData: args, parentPort } = require('worker_threads')

				parentPort.postMessage((${func})(...args))
			`,
			{ workerData: args, eval: true }
		)

		worker.on('message', result => {
			resolve(result as T)
			worker.terminate()
		})

		worker.on('error', (err: Error | string) => {
			if (typeof err === 'string' && err.includes('DataCloneError')) {
				reject(new TypeError('DataCloneError: Your task function returns a non-transferable value'))
			} else {
				reject(err)
			}
			worker.terminate()
		})
	})
}
