declare const postMessage: (data: any) => void
declare const onmessage: (callback: (data: any) => void) => void

export function taskMaker(worker: import('./BaseWorker').BaseWorker) {
	return function<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
		if (typeof func !== 'function') {
			throw new TypeError('Passed parameter is not a function')
		}

		return new Promise((resolve, reject) => {
			worker.workerFunc = () => {
				let args: any

				onmessage(data => {
					if (data.__initialData !== undefined) {
						args = data.__initialData
					} else {
						postMessage(new Function('return (' + data + ')')()(...args))
					}
				})
			}

			worker.start(args)

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
}

export function cookMaker(worker: import('./BaseWorker').BaseWorker) {
	return function<T, S extends any[], U extends any[]>(
		func: (...args: S) => (...args: U) => T,
		...args: S
	): (...args: U) => Promise<T> {
		if (typeof func !== 'function') {
			throw new TypeError('Passed parameter is not a function')
		}

		worker.workerFunc = () => {
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
		}

		worker.start({ args, funcStr: func.toString() })

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
}

export function trackMaker(worker: import('./BaseWorker').BaseWorker) {
	return function<T, S extends any[]>(
		func: (tick: (progress: number) => void, ...args: S) => T,
		...args: S
	): { result: Promise<T>; tick: (ticker: (progress: number) => void) => void } {
		if (typeof func !== 'function') {
			throw new TypeError('Passed parameter is not a function')
		}

		worker.workerFunc = () => {
			const tick = (__progress: number) => postMessage({ __progress })
			let args: any

			onmessage(data => {
				if (data.__initialData !== undefined) {
					args = data.__initialData
				} else {
					postMessage(new Function('return (' + data + ')')()(tick, ...args))
				}
			})
		}

		worker.start(args)

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
}