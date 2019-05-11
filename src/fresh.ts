import Worker from 'anyworker'

declare const postMessage: (data: any) => void
declare const onmessage: (callback: (data: any) => void) => void

export function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	return new Promise((resolve, reject) => {
		const worker = new Worker(() => {
			let args: any

			onmessage(data => {
				if (data.__initialData !== undefined) {
					args = data.__initialData
				} else {
					postMessage(new Function('return (' + data + ')')()(...args))
				}
			})
		}, args)

		worker.onmessage(result => {
			resolve(result as T)
			worker.terminate()
		})

		worker.onerror(error => {
			reject(error.message)
			worker.terminate()
		})

		worker.postMessage(func.toString())
	})
}

export function cook<T, S extends any[], U extends any[]>(
	func: (...args: S) => (...args: U) => T,
	...args: S
): (...args: U) => Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	const worker = new Worker(
		() => {
			let slaveFunc: Function

			onmessage(data => {
				if (data.__initialData !== undefined) {
					slaveFunc = new Function('return (' + data.__initialData.funcStr + ')')()(
						...data.__initialData.args
					)
				} else {
					postMessage(slaveFunc(...data))
				}
			})
		},
		{ args, funcStr: func.toString() }
	)

	return function(...args: U) {
		return new Promise((resolve, reject) => {
			worker.onmessage(result => {
				resolve(result as T)
			})

			worker.onerror(error => {
				reject(error)
			})

			worker.postMessage(args)
		})
	}
}

export function track<T, S extends any[]>(
	func: (tick: (progress: number) => void, ...args: S) => T,
	...args: S
): { result: Promise<T>; tick: (ticker: (progress: number) => void) => void } {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	const worker = new Worker(() => {
		const tick = (__progress: number) => postMessage({ __progress })
		let args: any

		onmessage(data => {
			if (data.__initialData !== undefined) {
				args = data.__initialData
			} else {
				postMessage(new Function('return (' + data + ')')()(tick, ...args))
			}
		})
	}, args)

	let inTicker: (progress: number) => void

	const result = new Promise<T>((resolve, reject) => {
		worker.onmessage((data: any) => {
			if (data.__progress !== undefined) {
				if (inTicker) inTicker(data.__progress)
			} else {
				resolve(data as T)
				worker.terminate()
			}
		})

		worker.onerror(error => {
			reject(error)
			worker.terminate()
		})

		worker.postMessage(func.toString())
	})

	const tick = (ticker: (progress: number) => void) => {
		inTicker = ticker
	}

	return { result, tick }
}
