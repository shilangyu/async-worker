import { taskMaker, cookMaker, trackMaker } from '../freshMaker'
import { BaseWorker, ENV } from '../BaseWorker'

declare const postMessage: (data: any) => void

const WebWorker = () => new BaseWorker(Worker, ENV.web)

export const task = taskMaker(WebWorker())

export const cook = cookMaker(WebWorker())

export const track = trackMaker(WebWorker())
