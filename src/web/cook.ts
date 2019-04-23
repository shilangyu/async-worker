export function cook<T, S extends any[], U extends any[]>(
	func: (...args: S) => (...args: U) => T,
	...args: S
): (...args: U) => Promise<T> {
	if (typeof func !== 'function') {
		throw new TypeError('Passed parameter is not a function')
	}

	const worker = new Worker(
		URL.createObjectURL(
			new Blob([
				`
				let initialCall = true
				let slaveFunc
				onmessage = ({data: args}) =>  {
					if(initialCall) {
						slaveFunc = (${func})(...args)
						initialCall = false
					} else {
						postMessage(slaveFunc(...args))
					}
				}
				`
			])
		)
	)
	worker.postMessage(args)

	return function(...args: U) {
		return new Promise((resolve, reject) => {
			worker.postMessage(args)

			worker.onmessage = ({ data: result }) => {
				resolve(result as T)
			}

			worker.onerror = e => {
				reject(e.message)
			}
		})
	}
}
