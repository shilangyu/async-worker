export function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
	return new Promise((resolve, reject) => {
		if (typeof func !== 'function') {
			reject(new TypeError('Passed parameter is not a function'))
			return
		}

		const worker = new Worker(
			URL.createObjectURL(
				new Blob([`onmessage = ({data: args}) => postMessage((${func})(...args))`])
			)
		)

		worker.onmessage = ({ data: result }) => {
			resolve(result as T)
			worker.terminate()
		}

		worker.onerror = e => {
			reject(e.message)
			worker.terminate()
		}

		worker.postMessage(args)
	})
}
