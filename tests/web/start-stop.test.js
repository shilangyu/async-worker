describe('node implementation of the start&stop functions', () => {
	it('should fail if not started prior', () => {
		asyncWorker.stop()
		let wasError = false

		try {
			asyncWorker.task(() => 1)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
	})

	it('should pass if started prior', async done => {
		asyncWorker.start()
		const result = await asyncWorker.task(a => a, 22)
		asyncWorker.stop()

		expect(result).toBe(22)
		done()
	})

	it('should fail if used after a stop', async done => {
		let wasError = false

		asyncWorker.start()
		await asyncWorker.task(a => a, 22)
		asyncWorker.stop()

		try {
			await asyncWorker.task(b => b, 11)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
		done()
	})
})
