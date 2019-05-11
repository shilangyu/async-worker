import Eev from 'eev'
import Worker from 'anyworker'

declare const postMessage: (data: any) => void
declare const onmessage: (callback: (data: any) => void) => void

let eev: Eev
let globalWorker: Worker

export function start() {
	globalWorker = new Worker(() => {
		const slaveFuncs: { [key: string]: Function } = {}

		onmessage(({ __from, funcStr, args, funcId }) => {
			switch (__from) {
				case 'task':
					try {
						const result = new Function('return (' + funcStr + ')')()(...args)
						postMessage({ __from, result })
					} catch (error) {
						postMessage({ __from, error })
					}
					break

				case 'cook':
					try {
						if (funcId && args && funcStr) {
							slaveFuncs[funcId] = new Function('return (' + funcStr + ')')()(...args)
						} else {
							const result = slaveFuncs[funcId](...args)
							postMessage({ __from, result })
						}
					} catch (error) {
						postMessage({ __from, error })
					}
					break

				case 'track':
					try {
						const tick = (progress: number) => postMessage({ __from, progress })

						const result = new Function('return (' + funcStr + ')')()(tick, ...args)
						postMessage({ __from, result })
					} catch (error) {
						postMessage({ __from, error })
					}
					break

				default:
					break
			}
		})
	})

	eev = new Eev()

	globalWorker.onmessage(({ __from, result, error, progress }) => {
		if (progress !== undefined) eev.emit(`${__from}_resolve`, { progress })
		else if (error) eev.emit(`${__from}_reject`, error)
		else eev.emit(`${__from}_resolve`, result)
	})

	globalWorker.onerror(error => {
		globalWorker.restart()
		;['task', 'cook', 'track'].forEach(name => eev.emit(`${name}_reject`, error))
	})
}

export function stop() {
	globalWorker.terminate()
}

export function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	if (!globalWorker.isRunning) {
		throw new Error(
			'Global asyncWorker was not started. Did you mean to call `asyncWorker.start()` first?'
		)
	}

	return new Promise((resolve, reject) => {
		function msg(result: any) {
			eev.off('task_resolve', msg)
			eev.off('task_reject', err)
			resolve(result as T)
		}
		function err(error: any) {
			eev.off('task_reject', err)
			eev.off('task_resolve', msg)
			if (typeof error === 'string' && error.includes('DataCloneError')) {
				reject(new TypeError('DataCloneError: Your task function returns a non-transferable value'))
			} else {
				reject(error)
			}
		}
		eev.on('task_resolve', msg)
		eev.on('task_reject', err)

		try {
			globalWorker.postMessage({ __from: 'task', funcStr: func.toString(), args })
		} catch (error) {
			eev.emit('task_reject', error)
		}
	})
}

export function cook<T, S extends any[], U extends any[]>(
	func: (...args: S) => (...args: U) => T,
	...args: S
): (...args: U) => Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}
	if (!globalWorker.isRunning) {
		throw new Error(
			'Global asyncWorker was not started. Did you mean to call `asyncWorker.start()` first?'
		)
	}

	const funcId =
		'_' +
		Math.random()
			.toString(36)
			.substr(2, 9)

	function outerErr(error: Error) {
		eev.off('cook_reject_outer', outerErr)

		throw error
	}
	eev.on('cook_reject_outer', outerErr)

	try {
		globalWorker.postMessage({ __from: 'cook', funcStr: func.toString(), funcId, args })
	} catch (error) {
		eev.emit('cook_reject_outer', error)
	}

	return function(...args: U) {
		return new Promise((resolve, reject) => {
			function msg(result: any) {
				eev.off('cook_resolve', msg)
				eev.off('cook_reject', err)
				resolve(result as T)
			}
			function err(error: Error | string) {
				eev.off('cook_resolve', msg)
				eev.off('cook_reject', err)
				if (typeof error === 'string' && error.includes('DataCloneError')) {
					reject(
						new TypeError('DataCloneError: Your task function returns a non-transferable value')
					)
				} else {
					reject(error)
				}
			}
			eev.on('cook_resolve', msg)
			eev.on('cook_reject', err)

			try {
				globalWorker.postMessage({ __from: 'cook', args, funcId })
			} catch (error) {
				eev.emit('cook_reject', error)
			}
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
	if (!globalWorker.isRunning) {
		throw new Error(
			'Global asyncWorker was not started. Did you mean to call `asyncWorker.start()` first?'
		)
	}

	let inTicker: (progress: number) => void

	const result = new Promise<T>((resolve, reject) => {
		function msg(result: any) {
			if (result.progress !== undefined) {
				if (inTicker) inTicker(result.progress)
			} else {
				eev.off('track_resolve', msg)
				eev.off('track_reject', err)
				resolve(result as T)
			}
		}
		function err(error: Error | string) {
			eev.off('track_resolve', msg)
			eev.off('track_reject', err)
			if (typeof error === 'string' && error.includes('DataCloneError')) {
				reject(new TypeError('DataCloneError: Your task function returns a non-transferable value'))
			} else {
				reject(error)
			}
		}
		eev.on('track_resolve', msg)
		eev.on('track_reject', err)
	})

	const tick = (ticker: (progress: number) => void) => {
		inTicker = ticker
	}

	try {
		globalWorker.postMessage({ __from: 'track', funcStr: func.toString(), args })
	} catch (error) {
		result.catch(() => {})
		throw error
	}

	return { result, tick }
}
