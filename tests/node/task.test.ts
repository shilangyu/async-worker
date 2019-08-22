import AsyncWorker from '../../src'

describe('node implementation of the task method', () => {
	const { task, kill } = new AsyncWorker()
	afterAll(kill)

	it('should resolve the computed value', async () => {
		const result = await task(() => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c
		})

		expect(result).toBe(4)
	})

	it('should resolve the computed value with passed args', async () => {
		const result = await task(d => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c - d
		}, 5)

		expect(result).toBe(-1)
	})

	it('should reject if passed parameter is not a function', async () => {
		expect(() => task(5 as any)).toThrowError()
	})

	it('should reject if passed args are non-transferable', async () => {
		await expect(task(a => a(), () => 1)).rejects.toThrowError()
	})

	it('should reject if it returns a non-transferable', async () => {
		await expect(task(() => () => 1)).rejects.toThrowError()
	})

	it('should reject if there was an internal error', async () => {
		let wasError = false
		await task(() => {
			throw 'err'
		}).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})
})
