interface Froms<T> {
	task: T
	cook: T
}

interface MessageData {
	__from: keyof Froms<any>
	funcStr: string
	args: any[]
	funcId: string
}

interface Streamer {
	emit: (result: any) => any
	collect: (result: any) => any
	throw: (error: any) => any
	catch: (error: any) => any
}

const resultStream: Froms<Streamer> = {
	task: {
		emit: (result: any) => resultStream.task.collect(result),
		collect: (result: any) => result,
		throw: (error: any) => resultStream.task.catch(error),
		catch: (error: any) => error
	},
	cook: {
		emit: (result: any) => resultStream.cook.collect(result),
		collect: (result: any) => result,
		throw: (error: any) => resultStream.cook.catch(error),
		catch: (error: any) => error
	}
}

declare const postMessage: (data: any) => void

const workerEnv = () => {
	const slaveFuncs: { [key: string]: Function } = {}

	onmessage = ({ data: { __from, funcStr, args, funcId } }: { data: MessageData }) => {
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

			default:
				break
		}
	}
}
let worker: Worker

function restartWorker() {
	worker = new Worker(URL.createObjectURL(new Blob([`(${workerEnv})()`])))

	worker.onmessage = ({ data: { __from, result, error } }) => {
		// @ts-ignore
		if (error) resultStream[__from].throw(error)
		// @ts-ignore
		else resultStream[__from].emit(result)
	}

	worker.onerror = error => {
		// @ts-ignore
		Object.keys(resultStream).forEach(key => resultStream[key].throw(error))

		restartWorker()
	}
}

restartWorker()

export function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T> {
	return new Promise((resolve, reject) => {
		if (typeof func !== 'function') {
			reject(new TypeError('Passed parameter is not a function'))
			return
		}

		resultStream.task.collect = (result: any) => {
			resolve(result as T)
		}

		resultStream.task.catch = (error: Error | string) => {
			if (typeof error === 'string' && error.includes('DataCloneError')) {
				reject(new TypeError('DataCloneError: Your task function returns a non-transferable value'))
			} else {
				reject(error)
			}
		}

		try {
			worker.postMessage({ __from: 'task', funcStr: func.toString(), args })
		} catch (error) {
			resultStream.task.throw(error)
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

	const funcId =
		'_' +
		Math.random()
			.toString(36)
			.substr(2, 9)

	resultStream.cook.catch = (error: Error | string) => {
		throw error
	}

	try {
		worker.postMessage({ __from: 'cook', funcStr: func.toString(), funcId, args })
	} catch (error) {
		resultStream.cook.throw(error)
	}

	return function(...args: U) {
		return new Promise((resolve, reject) => {
			resultStream.cook.collect = (result: any) => {
				resolve(result as T)
			}

			resultStream.cook.catch = (error: Error | string) => {
				if (typeof error === 'string' && error.includes('DataCloneError')) {
					reject(
						new TypeError('DataCloneError: Your task function returns a non-transferable value')
					)
				} else {
					reject(error)
				}
			}

			try {
				worker.postMessage({ __from: 'cook', args, funcId })
			} catch (error) {
				resultStream.cook.throw(error)
			}
		})
	}
}
