import * as fresh from './fresh'

import { Worker } from 'worker_threads'
import * as globalMaker from '../globalMaker'
import { BaseWorker, ENV } from '../BaseWorker'

globalMaker.init(new BaseWorker(Worker, ENV.node))

export * from '../globalMaker'

export { fresh }
