export enum ENV {
	node,
	web
}

export class BaseWorker {
	public worker: Worker | import('worker_threads').Worker | null = null
	private _workerFuncStr: string = ''

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

	onmessage(callback: (data: any) => void) {
		this.either(
			worker => {
				worker.on('message', callback)
			},
			worker => {
				worker.onmessage = ({ data }) => callback(data)
			}
		)
	}

	onerror(callback: (error: Error | ErrorEvent) => void) {
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
		this.worker!.terminate()
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
