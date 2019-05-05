import { Worker } from 'worker_threads'
import { taskMaker, cookMaker, trackMaker } from '../freshMaker'
import { BaseWorker, ENV } from '../BaseWorker'

const NodeWorker = () => new BaseWorker(Worker, ENV.node)

export const task = taskMaker(NodeWorker())

export const cook = cookMaker(NodeWorker())

export const track = trackMaker(NodeWorker())
