import * as fresh from './fresh'

import * as globalMaker from '../globalMaker'
import { BaseWorker, ENV } from '../BaseWorker'

globalMaker.init(new BaseWorker(Worker, ENV.web))

export * from '../globalMaker'

export { fresh }
