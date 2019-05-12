const taskTest = (name, task) => {
	describe('node implementation of the task function for both fresh and global', () => {
		asyncWorker.start()

		it(`should resolve the computed value: ${name}`, async done => {
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

		it(`should resolve the computed value with passed args: ${name}`, async done => {
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

		it(`should reject if passed parameter is not a function: ${name}`, async done => {
			let wasError = false
			try {
				task(5)
			} catch {
				wasError = true
			}

			expect(wasError).toBeTruthy()
			done()
		})

		it(`should reject if passed args are non-transferable: ${name}`, async done => {
			let wasError = false
			await task(a => a(), () => 1).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
			done()
		})

		it(`should reject if it returns a non-transferable: ${name}`, async done => {
			let wasError = false
			await task(() => () => 1).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
			done()
		})

		it(`should reject if there was an internal error: ${name}`, async done => {
			let wasError = false
			await task(() => {
				throw 'err'
			}).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
			done()
		})
	})
}

taskTest('fresh', asyncWorker.fresh.task)
taskTest('global', asyncWorker.task)
