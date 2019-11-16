import Worker from 'anyworker'
import Eev from 'eev'

declare const postMessage: (data: any) => void
declare const onmessage: (callback: (data: any) => void) => void

export default class {
	private _worker: Worker
	private _eev: Eev

	constructor() {
		this._worker = new Worker(
			`() => {
			const slaveFuncs = {}

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
							if(error.name === 'DataCloneError')
								error = { name: error.name, message: error.message }
							postMessage({ __from, error })
						}
						break

					case 'track':
						try {
							const tick = progress => postMessage({ __from, progress })
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
		}` as any
		)

		this._eev = new Eev()

		this._worker.onmessage(({ __from, result, error, progress }) => {
			if (progress !== undefined) this._eev.emit(`${__from}_resolve`, { progress })
			else if (error) this._eev.emit(`${__from}_reject`, error)
			else this._eev.emit(`${__from}_resolve`, result)
		})

		this._worker.onerror(error => {
			this._worker.restart()
			;['task', 'cook', 'track'].forEach(name => this._eev.emit(`${name}_reject`, error))
		})
	}

	kill = () => this._worker.terminate()

	get isRunning() {
		return this._worker.isRunning
	}

	task = <T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> => {
		if (typeof func !== 'function') {
			throw new TypeError('Passed parameter is not a function')
		}

		if (!this.isRunning)
			throw new Error('This AsyncWorker was already killed and is no longer running')

		return new Promise((resolve, reject) => {
			const msg = (result: any) => {
				this._eev.off('task_resolve', msg)
				this._eev.off('task_reject', err)
				resolve(result as T)
			}
			const err = (error: any) => {
				this._eev.off('task_reject', err)
				this._eev.off('task_resolve', msg)
				if (typeof error === 'string' && error.includes('DataCloneError')) {
					reject(
						new TypeError('DataCloneError: Your task function returns a non-transferable value')
					)
				} else {
					reject(error)
				}
			}
			this._eev.on('task_resolve', msg)
			this._eev.on('task_reject', err)

			try {
				this._worker.postMessage({ __from: 'task', funcStr: func.toString(), args })
			} catch (error) {
				this._eev.emit('task_reject', error)
			}
		})
	}

	cook = <T, S extends any[], U extends any[]>(
		func: (...args: S) => (...args: U) => T,
		...args: S
	): ((...args: U) => Promise<T>) => {
		if (typeof func !== 'function') {
			throw new TypeError('Passed parameter is not a function')
		}

		if (!this.isRunning)
			throw new Error('This AsyncWorker was already killed and is no longer running')

		const funcId =
			'_' +
			Math.random()
				.toString(36)
				.substr(2, 9)

		const outerErr = (error: Error) => {
			this._eev.off('cook_reject_outer', outerErr)

			throw error
		}
		this._eev.on('cook_reject_outer', outerErr)

		try {
			this._worker.postMessage({ __from: 'cook', funcStr: func.toString(), funcId, args })
		} catch (error) {
			this._eev.emit('cook_reject_outer', error)
		}

		return (...args: U) => {
			return new Promise((resolve, reject) => {
				const msg = (result: any) => {
					this._eev.off('cook_resolve', msg)
					this._eev.off('cook_reject', err)
					resolve(result as T)
				}
				const err = (error: Error | string) => {
					this._eev.off('cook_resolve', msg)
					this._eev.off('cook_reject', err)
					if (typeof error !== 'string' && error.name === 'DataCloneError') {
						reject(
							new TypeError('DataCloneError: Your cook function returns a non-transferable value')
						)
					} else {
						reject(error)
					}
				}
				this._eev.on('cook_resolve', msg)
				this._eev.on('cook_reject', err)

				try {
					this._worker.postMessage({ __from: 'cook', args, funcId })
				} catch (error) {
					this._eev.emit('cook_reject', error)
				}
			})
		}
	}

	track = <T, S extends any[]>(
		func: (tick: (progress: number) => void, ...args: S) => T,
		...args: S
	): { result: Promise<T>; tick: (ticker: (progress: number) => void) => void } => {
		if (typeof func !== 'function') {
			throw new TypeError('Passed parameter is not a function')
		}

		if (!this.isRunning)
			throw new Error('This AsyncWorker was already killed and is no longer running')

		let inTicker: (progress: number) => void

		const result = new Promise<T>((resolve, reject) => {
			const msg = (result: any) => {
				if (result.progress !== undefined) {
					if (inTicker) inTicker(result.progress)
				} else {
					this._eev.off('track_resolve', msg)
					this._eev.off('track_reject', err)
					resolve(result as T)
				}
			}
			const err = (error: Error | string) => {
				this._eev.off('track_resolve', msg)
				this._eev.off('track_reject', err)
				if (typeof error === 'string' && error.includes('DataCloneError')) {
					reject(
						new TypeError('DataCloneError: Your track function returns a non-transferable value')
					)
				} else {
					reject(error)
				}
			}
			this._eev.on('track_resolve', msg)
			this._eev.on('track_reject', err)
		})

		const tick = (ticker: (progress: number) => void) => {
			inTicker = ticker
		}

		try {
			this._worker.postMessage({ __from: 'track', funcStr: func.toString(), args })
		} catch (error) {
			result.catch(() => {})
			throw error
		}

		return { result, tick }
	}
}
