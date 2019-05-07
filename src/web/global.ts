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
globalMaker.start()

export const task = globalMaker.task
export const cook = globalMaker.cook
export const track = globalMaker.track
