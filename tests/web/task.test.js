describe('web implementation of the task method', () => {
	const { task, kill } = new AsyncWorker()
	afterAll(kill)

	it(`should resolve the computed value`, async done => {
		const result = await task(() => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c
		})

		expect(result).toBe(4)
		done()
	})

	it(`should resolve the computed value with passed args`, async done => {
		const result = await task(d => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c - d
		}, 5)

		expect(result).toBe(-1)
		done()
	})

	it(`should reject if passed parameter is not a function`, async done => {
		let wasError = false
		try {
			task(5)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
		done()
	})

	it(`should reject if passed args are non-transferable`, async done => {
		let wasError = false
		await task(a => a(), () => 1).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
		done()
	})

	it(`should reject if it returns a non-transferable`, async done => {
		let wasError = false
		await task(() => () => 1).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
		done()
	})

	it(`should reject if there was an internal error`, async done => {
		let wasError = false
		await task(() => {
			throw 'err'
		}).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
		done()
	})
})
