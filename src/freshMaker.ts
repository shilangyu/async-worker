export function taskMaker(worker: import('./BaseWorker').BaseWorker) {
	return function<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
		return new Promise((resolve, reject) => {
			if (typeof func !== 'function') {
				reject(new TypeError('Passed parameter is not a function'))
				return
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
