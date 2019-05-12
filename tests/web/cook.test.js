const cookTest = (name, cook) => {
	describe('node implementation of the cook function for both fresh and global', () => {
		asyncWorker.start()

		it(`should resolve the computed value: ${name}`, async done => {
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

		it(`should resolve the computed value with passed args: ${name}`, async done => {
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
			it(`should reject if passed parameter is not a function: ${name}`, async done => {
				let wasError = false
				try {
					cook(5)
				} catch {
					wasError = true
				}

				expect(wasError).toBeTruthy()
				done()
			})

			it(`should reject if passed args are non-transferable: ${name}`, async done => {
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
			it(`should reject if it returns a non-transferable: ${name}`, async done => {
				let wasError = false
				await cook(() => () => () => 1)().catch(err => (wasError = true))

				expect(wasError).toBeTruthy()
				done()
			})

			it(`should reject if it accepts a non-transferable: ${name}`, async done => {
				let wasError = false
				await cook(() => b => 1)(() => 1).catch(err => (wasError = true))

				expect(wasError).toBeTruthy()
				done()
			})

			it(`should reject if there was an internal error: ${name}`, async done => {
				let wasError = false
				await cook(() => () => {
					throw 'err'
				})().catch(err => (wasError = true))

				expect(wasError).toBeTruthy()
				done()
			})
		})
	})
}

cookTest('fresh', asyncWorker.fresh.cook)
cookTest('global', asyncWorker.cook)
