import * as globalMaker from '../globalMaker'
import { BaseWorker, ENV } from '../BaseWorker'

interface Froms<T> {
	task: T
	cook: T
	track: T
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
	},
	track: {
		emit: (result: any) => resultStream.track.collect(result),
		collect: (result: any) => result,
		throw: (error: any) => resultStream.track.catch(error),
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
	}
}
let worker: Worker

function restartWorker() {
	worker = new Worker(URL.createObjectURL(new Blob([`(${workerEnv})()`])))

	worker.onmessage = ({ data: { __from, result, error, progress } }) => {
		// @ts-ignore
		if (progress !== undefined) resultStream[__from].emit({ progress })
		// @ts-ignore
		else if (error) resultStream[__from].throw(error)
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

globalMaker.init(
	new BaseWorker(Worker, ENV.web),
	() =>
		'_' +
		Math.random()
			.toString(36)
			.substr(2, 9)
)
globalMaker.start()

export const task = globalMaker.task
export const cook = globalMaker.cook

export function track<T, S extends any[]>(
	func: (tick: (progress: number) => void, ...args: S) => T,
	...args: S
): { result: Promise<T>; tick: (ticker: (progress: number) => void) => void } {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	let inTicker: (progress: number) => void

	const result = new Promise<T>((resolve, reject) => {
		resultStream.track.collect = (data: any) => {
			if (data.progress !== undefined) {
				if (inTicker) inTicker(data.progress)
			} else {
				resolve(data as T)
			}
		}

		resultStream.track.catch = (error: Error | string) => {
			if (typeof error === 'string' && error.includes('DataCloneError')) {
				reject(new TypeError('DataCloneError: Your task function returns a non-transferable value'))
			} else {
				reject(error)
			}
		}
	})

	const tick = (ticker: (progress: number) => void) => {
		inTicker = ticker
	}

	worker.postMessage({ __from: 'track', funcStr: func.toString(), args })

	return { result, tick }
}
