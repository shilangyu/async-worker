import { Worker } from 'worker_threads'
import { taskMaker, cookMaker, trackMaker } from '../freshMaker'
import { BaseWorker, ENV } from '../BaseWorker'

const NodeWorker = (workerEnv: Function) => new BaseWorker(Worker, ENV.node, workerEnv)

export const task = taskMaker(
	NodeWorker(() => {
		const { workerData: args, parentPort } = require('worker_threads')

		parentPort.on('message', (funcStr: string) => {
			parentPort.postMessage(new Function('return (' + funcStr + ')')()(...args))
		})
	})
)

export const cook = cookMaker(
	NodeWorker(() => {
		const {
			workerData: { funcStr, args },
			parentPort
		} = require('worker_threads')

		let slaveFunc = new Function('return (' + funcStr + ')')()(...args)
		parentPort.on('message', (args: any[]) => {
			parentPort.postMessage(slaveFunc(...args))
		})
	})
)

export const track = trackMaker(
	NodeWorker(() => {
		const { workerData: args, parentPort } = require('worker_threads')

		const tick = (__progress: number) => parentPort.postMessage({ __progress })

		parentPort.on('message', (funcStr: string) => {
			parentPort.postMessage(new Function('return (' + funcStr + ')')()(tick, ...args))
		})
	})
)
