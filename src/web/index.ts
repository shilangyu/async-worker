import * as fresh from './fresh'

import * as globalMaker from '../globalMaker'
import { BaseWorker, ENV } from '../BaseWorker'

globalMaker.init(
	new BaseWorker(Worker, ENV.web),
	() =>
		'_' +
		Math.random()
			.toString(36)
			.substr(2, 9)
)

export * from '../globalMaker'

export { fresh }
