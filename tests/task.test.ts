import { task, fresh, start } from '../src'

describe('node implementation of the task function for both fresh and global', () => {
	const each = test.each`
		name        | task
		${'fresh'}  | ${fresh.task}
		${'global'} | ${task}
	`

	start()

	each(
		'should resolve the computed value: $name',
		async ({ task }: { task: typeof fresh.task }) => {
			const result = await task(() => {
				let a = 5
				a -= 1
				const b = 12

				var c = 1

				return b / a + c
			})

			expect(result).toBe(4)
		}
	)

	each(
		'should resolve the computed value with passed args: $name',
		async ({ task }: { task: typeof fresh.task }) => {
			const result = await task(d => {
				let a = 5
				a -= 1
				const b = 12

				var c = 1

				return b / a + c - d
			}, 5)

			expect(result).toBe(-1)
		}
	)

	each(
		'should reject if passed parameter is not a function: $name',
		async ({ task }: { task: typeof fresh.task }) => {
			let wasError = false
			try {
				task(5 as any)
			} catch {
				wasError = true
			}

			expect(wasError).toBeTruthy()
		}
	)

	each(
		'should reject if passed args are non-transferable: $name',
		async ({ task }: { task: typeof fresh.task }) => {
			let wasError = false
			await task(a => a(), () => 1).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
		}
	)

	each(
		'should reject if it returns a non-transferable: $name',
		async ({ task }: { task: typeof fresh.task }) => {
			let wasError = false
			await task(() => () => 1).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
		}
	)

	each(
		'should reject if there was an internal error: $name',
		async ({ task }: { task: typeof fresh.task }) => {
			let wasError = false
			await task(() => {
				throw 'err'
			}).catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
		}
	)
})
