import Eev from 'eev'

declare const postMessage: (data: any) => void
declare const onmessage: (callback: (data: any) => void) => void

let eev: Eev
let globalWorker: import('./BaseWorker').BaseWorker
let randomId: () => string

export function init(worker: import('./BaseWorker').BaseWorker, randomIdFunc: () => string) {
	worker.workerFunc = () => {
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
	}

	eev = new Eev()
	randomId = randomIdFunc
	globalWorker = worker
}

export function start() {
	globalWorker.start()

	globalWorker.onmessage(({ __from, result, error, progress }) => {
		if (progress !== undefined) eev.emit(`${__from}_resolve`, { progress })
		else if (error) eev.emit(`${__from}_reject`, error)
		else eev.emit(`${__from}_resolve`, result)
	})

	globalWorker.onerror(error => {
		;['task'].forEach(name => eev.emit(`${name}_reject`, error))

		globalWorker.restart()
	})
}

export function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
	return new Promise((resolve, reject) => {
		if (typeof func !== 'function') {
			reject(new TypeError('Passed parameter is not a function'))
			return
		}

		function msg(result: any) {
			resolve(result as T)
			eev.off('task_resolve', msg)
			eev.off('task_reject', err)
		}
		function err(error: any) {
			if (typeof error === 'string' && error.includes('DataCloneError')) {
				reject(new TypeError('DataCloneError: Your task function returns a non-transferable value'))
			} else {
				reject(error)
			}
			eev.off('task_reject', err)
			eev.off('task_resolve', msg)
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
