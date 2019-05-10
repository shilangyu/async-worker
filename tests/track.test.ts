import { track, fresh, start } from '../src'

describe('node implementation of the track function for both fresh and global', () => {
	const each = test.each`
		name        | track
		${'fresh'}  | ${fresh.track}
		${'global'} | ${track}
	`

	start()

	each(
		'should resolve the computed value: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			const tracker = track(tick => {
				for (let i = 0; i < 5; i++) {
					tick(i / 4)
				}
				return 4
			})

			const result = await tracker.result

			expect(result).toBe(4)
		}
	)

	each(
		'should resolve the computed value with passed args: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			const tracker = track((tick, a) => {
				for (let i = 0; i < 5; i++) {
					tick(i / 4)
				}
				return 4 + a
			}, -5)

			const result = await tracker.result

			expect(result).toBe(-1)
		}
	)

	each('should track the ticks: $name', async ({ track }: { track: typeof fresh.track }) => {
		const tracker = track(tick => {
			for (let i = 0; i < 5; i++) {
				tick(i / 4)
			}
			return 4
		})
		let result: number[] = []

		tracker.tick(progress => result.push(progress * 100))

		await tracker.result

		expect(result).toEqual([0, 25, 50, 75, 100])
	})

	each(
		'should track the ticks with passed args: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			const tracker = track((tick, a) => {
				for (let i = 0; i < 5; i++) {
					tick(i + a)
				}
				return 4
			}, -1)
			let result: number[] = []

			tracker.tick(progress => result.push(progress * 100))

			await tracker.result

			expect(result).toEqual([-100, 0, 100, 200, 300])
		}
	)

	each(
		'should reject if passed parameter is not a function: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			let wasError = false
			try {
				track(5 as any)
			} catch {
				wasError = true
			}

			expect(wasError).toBeTruthy()
		}
	)

	each(
		'should reject if passed args are non-transferable: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			let wasError = false
			try {
				track((tick, a) => a(), () => 1)
			} catch {
				wasError = true
			}

			expect(wasError).toBeTruthy()
		}
	)

	each(
		'should reject if it returns a non-transferable: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			let wasError = false
			await track(() => () => 1).result.catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
		}
	)

	each(
		'should reject if there was an internal error: $name',
		async ({ track }: { track: typeof fresh.track }) => {
			let wasError = false
			await track(() => {
				throw 'err'
			}).result.catch(err => (wasError = true))

			expect(wasError).toBeTruthy()
		}
	)
})
