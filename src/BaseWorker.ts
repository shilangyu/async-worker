export enum ENV {
	node,
	web
}

type MessageCallback = (data: any) => void
type ErrorCallback = (error: Error | ErrorEvent) => void

export class BaseWorker {
	public worker: Worker | import('worker_threads').Worker | null = null
	public isRunning = false
	private _workerFuncStr: string = ''
	private _messageCallback: MessageCallback | null = null
	private _errorCallback: ErrorCallback | null = null
	private _initialData: any

	constructor(
		private SquashedWorker: typeof import('worker_threads').Worker | typeof Worker,
		public env: ENV
	) {}

	set workerFunc(value: Function) {
		const rawFuncStr = value.toString()
		let cookedFuncStr = ''

		this.either(
			() => {
				cookedFuncStr = `() => {
				const { parentPort } = require('worker_threads');
				${rawFuncStr
					.replace(/^(\(\) ?=> ?\{|function ?\(\) ?\{)/, '')
					.replace(/postMessage/g, 'parentPort.postMessage')
					.replace(/onmessage\(/g, "parentPort.on('message',")}
				`
			},
			() => {
				cookedFuncStr = rawFuncStr.replace(
					/onmessage\((\((\w+)\) ?=>|function\((\w+)\))/g,
					'onmessage = (function({data: $2$3})'
				)
			}
		)

		this._workerFuncStr = `(${cookedFuncStr})()`
	}

	start(initialData?: any) {
		this._initialData = initialData
		this.isRunning = true

		this.either(
			worker => {
				this.worker = worker
				this.worker = new this.SquashedWorker(this._workerFuncStr, {
					eval: true
				})
			},
			worker => {
				this.worker = worker
				this.worker = new this.SquashedWorker(URL.createObjectURL(new Blob([this._workerFuncStr])))
			}
		)

		if (initialData !== undefined) this.worker!.postMessage({ __initialData: initialData })
	}

	onmessage(callback: MessageCallback) {
		this._messageCallback = callback

		this.either(
			worker => {
				worker.on('message', callback)
			},
			worker => {
				worker.onmessage = ({ data }) => callback(data)
			}
		)
	}

	onerror(callback: ErrorCallback) {
		this._errorCallback = callback

		this.either(
			worker => {
				worker.on('error', callback)
			},
			worker => {
				worker.onerror = callback
			}
		)
	}

	terminate() {
		this.isRunning = false
		this.worker!.terminate()
	}

	restart() {
		this.terminate()
		this.start(this._initialData)
		this.onmessage(this._messageCallback!)
		this.onerror(this._errorCallback!)
	}

	postMessage(data: any) {
		this.worker!.postMessage(data)
	}

	private either(
		node: (worker: import('worker_threads').Worker) => void,
		web: (worker: Worker) => void
	) {
		switch (this.env) {
			case ENV.node:
				node(this.worker as import('worker_threads').Worker)
				break
			case ENV.web:
				web(this.worker as Worker)
				break
		}
	}
}
