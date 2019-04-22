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

		worker.on('error', e => {
			reject(e.message)
			worker.terminate()
		})
	})
}
