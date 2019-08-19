import AsyncWorker from '../../src'

describe('node implementation of the kill method', () => {
	it('should fail if used after a kill', async () => {
		const async = new AsyncWorker()
		let wasError = false

		await async.task(a => a, 22)
		async.kill()

		try {
			await async.task(b => b, 11)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
	})

	it('should show the worker is running after constructing', async () => {
		const async = new AsyncWorker()

		expect(async.isRunning).toBeTruthy()
	})

	it('should show the worker is off after killing', async () => {
		const async = new AsyncWorker()
		async.kill()

		expect(async.isRunning).toBeFalsy()
	})
})
