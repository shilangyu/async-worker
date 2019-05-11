import * as fresh from './fresh'
import isNode from 'detect-node'
import * as globalMaker from './globalMaker'
import { BaseWorker, ENV } from './BaseWorker'

const UnifiedWorker = () =>
	new BaseWorker(
		isNode ? require('worker_threads'.trim()).Worker : Worker,
		ENV[isNode ? 'node' : 'web']
	)

globalMaker.init(UnifiedWorker())

export * from './globalMaker'
export { fresh }
