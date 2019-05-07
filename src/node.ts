import * as freshMaker from './freshMaker'

import { Worker } from 'worker_threads'
import * as globalMaker from './globalMaker'
import { BaseWorker, ENV } from './BaseWorker'

const NodeWorker = () => new BaseWorker(Worker, ENV.node)

globalMaker.init(NodeWorker())

export * from './globalMaker'

export const fresh = {
	task: freshMaker.taskMaker(NodeWorker()),
	cook: freshMaker.cookMaker(NodeWorker()),
	track: freshMaker.trackMaker(NodeWorker())
}
