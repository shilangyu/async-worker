import * as freshMaker from './freshMaker'

import * as globalMaker from './globalMaker'
import { BaseWorker, ENV } from './BaseWorker'

const WebWorker = () => new BaseWorker(Worker, ENV.web)

globalMaker.init(WebWorker())

export * from './globalMaker'

export const fresh = {
	task: freshMaker.taskMaker(WebWorker()),
	cook: freshMaker.cookMaker(WebWorker()),
	track: freshMaker.trackMaker(WebWorker())
}
