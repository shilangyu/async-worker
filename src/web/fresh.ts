import { taskMaker, cookMaker, trackMaker } from '../freshMaker'
import { BaseWorker, ENV } from '../BaseWorker'

declare const postMessage: (data: any) => void

const WebWorker = (workerEnv: Function) => new BaseWorker(Worker, ENV.web, workerEnv)

export const task = taskMaker(
	WebWorker(() => {
		let args: any

		onmessage = ({ data }) => {
			if (data.__initialData !== undefined) {
				args = data.__initialData
			} else {
				postMessage(new Function('return (' + data + ')')()(...args))
			}
		}
	})
)

export const cook = cookMaker(
	WebWorker(() => {
		let slaveFunc: Function
		onmessage = ({ data }) => {
			if (data.__initialData !== undefined) {
				slaveFunc = new Function('return (' + data.__initialData.funcStr + ')')()(
					...data.__initialData.args
				)
			} else {
				postMessage(slaveFunc(...data))
			}
		}
	})
)

export const track = trackMaker(
	WebWorker(() => {
		const tick = (__progress: number) => postMessage({ __progress })
		let args: any

		onmessage = ({ data }) => {
			if (data.__initialData !== undefined) {
				args = data.__initialData
			} else {
				postMessage(new Function('return (' + data + ')')()(tick, ...args))
			}
		}
	})
)
