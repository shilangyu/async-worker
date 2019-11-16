import AsyncWorker from '../../src'

describe('node implementation of the cook method', () => {
	const { cook, kill } = new AsyncWorker()
	afterAll(kill)

	it('should resolve the computed value', async () => {
		const getRes = cook(() => () => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c
		})

		const result = await getRes()

		expect(result).toBe(4)
	})

	it('should resolve the computed value with passed args', async () => {
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
	})
	describe('cooking errors', () => {
		it('should reject if passed parameter is not a function', async () => {
			expect(() => cook(5 as any)).toThrowError()
		})

		it('should reject if passed args are non-transferable', async () => {
			expect(() =>
				cook(
					a => () => a(),
					() => 1
				)
			).toThrowError()
		})
	})

	describe('cooked function rejects', () => {
		it('should reject if it returns a non-transferable', async () => {
			expect(cook(() => () => () => 1)()).rejects.toThrowError('DataCloneError')
		})

		it('should reject if it accepts a non-transferable', async () => {
			await expect(cook(() => b => 1)(() => 1)).rejects.toThrowError()
		})

		it('should reject if there was an internal error', async () => {
			let wasError = false
			await cook(() => () => {
				throw 'err'
			})().catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
		})
	})
})
