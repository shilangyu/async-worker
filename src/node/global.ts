import { Worker } from 'worker_threads'
import { randomBytes } from 'crypto'
import * as globalMaker from '../globalMaker'
import { BaseWorker, ENV } from '../BaseWorker'

globalMaker.init(new BaseWorker(Worker, ENV.node), () => randomBytes(12).toString('base64'))
globalMaker.start()

export const task = globalMaker.task
export const cook = globalMaker.cook
export const track = globalMaker.track
