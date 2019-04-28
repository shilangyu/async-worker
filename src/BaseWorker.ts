export enum ENV {
	node,
	web
}

export class BaseWorker {
	public worker: Worker | import('worker_threads').Worker | null = null

	constructor(
		private SquashedWorker: typeof import('worker_threads').Worker | typeof Worker,
		public env: ENV,
		public workerFunc: Function
	) {}

	start(initialData: any) {
		const workerStr = `(${this.workerFunc})()`

		this.either(
			worker => {
				this.worker = worker
				this.worker = new this.SquashedWorker(workerStr, {
					workerData: initialData,
					eval: true
				})
			},
			worker => {
				this.worker = worker
				this.worker = new this.SquashedWorker(URL.createObjectURL(new Blob([workerStr])))

				this.worker.postMessage({ __initialData: initialData })
			}
		)
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
