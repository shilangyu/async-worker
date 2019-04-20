# async worker concept

```ts
type AsyncWorker = {
	task<T>(): (task: () => T | CookedTask) => T
	spawn(): (process: (thread: SpawnedWorker) => void | fs.PathLike) => SpawnedWorker
}

type SpawnedWorker = {
	terminate(): () => void
	on(): (eventName: string, callback: (data: any) => void) => SpawnedWorker
	off(): (eventName: string, callback: (data: any) => void) => boolean
	ask(): (questionName: string, data: any) => Promise<any>
	question(): (questionName: string, callback: (data: any) => any) => void
	emit(): (eventName: string, data: any) => void
}

type CookedTask = any
```

### single task

used for fast one-task actions that might take a long time to compute, will be terminated automatically right after finishing the task

```ts
async function compute() {
	const result = await asyncWorker.task(() => {
		console.log('im computing big data that would otherwise block the main thread')
		/* performing task */
		return computedData
	})
}
```

### cooked task

calling a task is expensive. If you plan on creating a similar task often you should cook your function

```ts
const asyncFibo = asyncWorker.cook(n => {
	let [first, second] = [0, 1]

	if (n < 0) return NaN
	if (n === 1) return 0
	if (n === 2) return 1

	while (--n) [first, second] = [second, first + second]

	return first
}) // you just created a asynchronous function

asyncFibo(5).then(res => console.log(`5th fibonnaci number is ${res}`))
```

### spawn worker

used for a long-term background process. Either runs a function or a file

```ts
const worker = asyncWorker.spawn(() => {
	setInterval(async () => {
		const res = await fetch('https://url')
		/* doing something */
	}, 20000) // a task that runs periodically in the background
})

// once done using, terminate
worker.terminate()
```

### listen to the worker and emition

used for loose event listeners

```ts
enum Listeners {
	newData,
	endMe
}

const worker = asyncWorker.spawn(thread => {
	setInterval(async () => {
		const res = await fetch('https://url')
		thread.emit(Listeners.newData, res) // send message about having some data ready
	}, 20000) // a task that runs periodically in the background

	setTimeout(() => thread.emit(Listeners.endMe, 'i had enough'), 100000) // sends a termination request in 100s
})

// create listeners
worker
	.on(Listeners.newData, data => console.log('thanks for the data'))
	.on(Listeners.endMe, data => worker.terminate())
```

### turn off listening to a worker

used to unsubscribe to an event

```ts
enum Listeners {
	newData,
	endMe
}

const worker = asyncWorker.spawn(thread => {
	setInterval(async () => {
		const res = await fetch('https://url')
		thread.emit(Listeners.newData, res)
	}, 20000) // a task that runs periodically in the background

	setTimeout(() => thread.emit(Listeners.endMe, 'i had enough'), 100000) // sends a termination request in 100s
})

// create listener
const event = data => console.log('thanks for the data')
worker.on(Listeners.newData, event)
worker.off(Listeners.endMe, event) // to turn off an event you must use the same event
```

### ask the worker a question

used to get data right away and accept questions

```ts
const worker = asyncWorker.spawn(thread => {
		const counter = 0

		thread.question('how many times did you fetch?', () => counter)

		setInterval(async () => {
			const res = await fetch('https://url')
			counter++
		}, 20000) // a task that runs periodically in the background
	})

	// ask question
;(async () => {
	const answer = await worker.ask('how many times did you fetch?', {})
	console.log(`The worker fetched ${answer} times!`)
})()
```
