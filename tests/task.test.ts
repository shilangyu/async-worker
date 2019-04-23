/**
 * @jest-environment {JEST-ENV}
 */
import { task } from '{IMPORT-PATH}'

describe('{DESC} implementation of the task function', () => {
	it('should return the computed value', async () => {
		const result = await task(() => {
			let a = 5
			a -= 1
			const b = 12

			var c = 1

			return b / a + c
		})

		expect(result).toBe(4)
	})
})
