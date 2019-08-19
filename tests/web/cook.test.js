describe('web implementation of the cook method', () => {
	const { cook, kill } = new AsyncWorker()

	afterAll(kill)

	it(`should resolve the computed value`, async done => {
		const getRes = cook(() => () => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c
		})

		const result = await getRes()

		expect(result).toBe(4)
		done()
	})

	it(`should resolve the computed value with passed args`, async done => {
		const getRes = cook(
			d => () => {
				let a = 5
				a -= 1
				const b = 12

				var c = 1

				return b / a + c - d
			},
			5
		)

		const result = await getRes()

		expect(result).toBe(-1)
		done()
	})
	describe('cooking errors', () => {
		it(`should reject if passed parameter is not a function`, async done => {
			let wasError = false
			try {
				cook(5)
			} catch {
				wasError = true
			}

			expect(wasError).toBeTruthy()
			done()
		})

		it(`should reject if passed args are non-transferable`, async done => {
			let wasError = false
			try {
				cook(a => () => a(), () => 1)
			} catch {
				wasError = true
			}

			expect(wasError).toBeTruthy()
			done()
		})
	})

	describe('cooked function rejects', () => {
		it(`should reject if it returns a non-transferable`, async done => {
			let wasError = false
			await cook(() => () => () => 1)().catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
			done()
		})

		it(`should reject if it accepts a non-transferable`, async done => {
			let wasError = false
			await cook(() => b => 1)(() => 1).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
			done()
		})

		it(`should reject if there was an internal error`, async done => {
			let wasError = false
			await cook(() => () => {
				throw 'err'
			})().catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
			done()
		})
	})
})
