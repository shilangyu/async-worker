import { cook, fresh } from '../src/node'

describe('node implementation of the cook function for both fresh and global', () => {
	const each = test.each`
		name        | cook
		${'fresh'}  | ${fresh.cook}
		${'global'} | ${cook}
	`

	each(
		'should resolve the computed value: $name',
		async ({ cook }: { cook: typeof fresh.cook }) => {
			const getRes = cook(() => () => {
				let a = 5
				a -= 1
				const b = 12

				var c = 1

				return b / a + c
			})

			const result = await getRes()

			expect(result).toBe(4)
		}
	)

	each(
		'should resolve the computed value with passed args: $name',
		async ({ cook }: { cook: typeof fresh.cook }) => {
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
		}
	)
	describe('cooking errors', () => {
		each(
			'should reject if passed parameter is not a function: $name',
			async ({ cook }: { cook: typeof fresh.cook }) => {
				let wasError = false
				try {
					cook(5 as any)
				} catch {
					wasError = true
				}

				expect(wasError).toBeTruthy()
			}
		)

		each(
			'should reject if passed args are non-transferable: $name',
			async ({ cook }: { cook: typeof fresh.cook }) => {
				let wasError = false
				try {
					cook(a => () => a(), () => 1)
				} catch {
					wasError = true
				}

				expect(wasError).toBeTruthy()
			}
		)
	})

	describe('cooked function rejects', () => {
		each(
			'should reject if it returns a non-transferable: $name',
			async ({ cook }: { cook: typeof fresh.cook }) => {
				let wasError = false
				await cook(() => () => () => 1)().catch(err => (wasError = true))

				expect(wasError).toBeTruthy()
			}
		)

		each(
			'should reject if it accepts a non-transferable: $name',
			async ({ cook }: { cook: typeof fresh.cook }) => {
				let wasError = false
				await cook(() => b => 1)(() => 1).catch(err => (wasError = true))

				expect(wasError).toBeTruthy()
			}
		)

		each(
			'should reject if there was an internal error: $name',
			async ({ cook }: { cook: typeof fresh.cook }) => {
				let wasError = false
				await cook(() => () => {
					throw 'err'
				})().catch(err => (wasError = true))

				expect(wasError).toBeTruthy()
			}
		)
	})
})
