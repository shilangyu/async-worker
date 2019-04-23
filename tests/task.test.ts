import { task } from '../src/node'

describe('node implementation of the task function', () => {
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
		let wasError = false
		await task(5 as any).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})

	it('should reject if passed args are non-transferable', async () => {
		let wasError = false
		let res = await task(a => a(), () => 1).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})

	it('should reject if it returns a non-transferable', async () => {
		let wasError = false
		await task(() => () => 1).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})

	it('should reject if there was an internal error', async () => {
		let wasError = false
		await task(() => {
			throw 'err'
		}).catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})
})
