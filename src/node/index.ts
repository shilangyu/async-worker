import * as fresh from './fresh'

import { Worker } from 'worker_threads'
import { randomBytes } from 'crypto'
import * as globalMaker from '../globalMaker'
import { BaseWorker, ENV } from '../BaseWorker'

globalMaker.init(new BaseWorker(Worker, ENV.node), () => randomBytes(12).toString('base64'))

export * from '../globalMaker'

export { fresh }
