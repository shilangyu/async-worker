import { start, task, stop } from '../src'

describe('node implementation of the start&stop functions', () => {
	it('should fail if not started prior', () => {
		let wasError = false

		try {
			task(() => 1)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
	})

	it('should pass if started prior', async () => {
		start()
		const result = await task(a => a, 22)
		stop()

		expect(result).toBe(22)
	})

	it('should fail if used after a stop', async () => {
		let wasError = false

		start()
		await task(a => a, 22)
		stop()

		try {
			await task(b => b, 11)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
	})
})
