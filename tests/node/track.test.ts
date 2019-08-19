import AsyncWorker from '../../src'

describe('node implementation of the track method', () => {
	const { track, kill } = new AsyncWorker()
	afterAll(kill)

	it('should resolve the computed value', async () => {
		const tracker = track(tick => {
			for (let i = 0; i < 5; i++) {
				tick(i / 4)
			}
			return 4
		})

		const result = await tracker.result

		expect(result).toBe(4)
	})

	it('should resolve the computed value with passed args', async () => {
		const tracker = track((tick, a) => {
			for (let i = 0; i < 5; i++) {
				tick(i / 4)
			}
			return 4 + a
		}, -5)

		const result = await tracker.result

		expect(result).toBe(-1)
	})

	it('should track the ticks', async () => {
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

	it('should track the ticks with passed args', async () => {
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
	})

	it('should reject if passed parameter is not a function', async () => {
		let wasError = false
		try {
			track(5 as any)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
	})

	it('should reject if passed args are non-transferable', async () => {
		let wasError = false
		try {
			track((tick, a) => a(), () => 1)
		} catch {
			wasError = true
		}

		expect(wasError).toBeTruthy()
	})

	it('should reject if it returns a non-transferable', async () => {
		let wasError = false
		await track(() => () => 1).result.catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})

	it('should reject if there was an internal error', async () => {
		let wasError = false
		await track(() => {
			throw 'err'
		}).result.catch(err => (wasError = true))

		expect(wasError).toBeTruthy()
	})
})
