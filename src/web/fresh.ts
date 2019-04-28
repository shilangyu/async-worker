export function cook<T, S extends any[], U extends any[]>(
	func: (...args: S) => (...args: U) => T,
	...args: S
): (...args: U) => Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	const worker = new Worker(
		URL.createObjectURL(
			new Blob([
				`
				let initialCall = true
				let slaveFunc
				onmessage = ({data: args}) =>  {
					if(initialCall) {
						slaveFunc = (${func})(...args)
						initialCall = false
					} else {
						postMessage(slaveFunc(...args))
					}
				}
				`
			])
		)
	)
	worker.postMessage(args)

	return function(...args: U) {
		return new Promise((resolve, reject) => {
			worker.postMessage(args)

			worker.onmessage = ({ data: result }) => {
				resolve(result as T)
			}

			worker.onerror = e => {
				reject(e.message)
			}
		})
	}
}

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

export function track<T, S extends any[]>(
	func: (tick: (progress: number) => void, ...args: S) => T,
	...args: S
): { result: Promise<T>; tick: (ticker: (progress: number) => void) => void } {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	let inTicker: (progress: number) => void

	const worker = new Worker(
		URL.createObjectURL(
			new Blob([
				`
				const tick = progress => postMessage({ progress })

				onmessage = ({data: args}) => postMessage((${func})(tick, ...args))
				`
			])
		)
	)

	const result = new Promise<T>((resolve, reject) => {
		worker.onmessage = ({ data }) => {
			if (data.progress !== undefined) {
				if (inTicker) inTicker(data.progress)
			} else {
				resolve(data as T)
				worker.terminate()
			}
		}

		worker.onerror = error => {
			reject(error)
			worker.terminate()
		}
	})

	const tick = (ticker: (progress: number) => void) => {
		inTicker = ticker
	}

	worker.postMessage(args)

	return { result, tick }
}
