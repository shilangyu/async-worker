### track

used for tracking progress on a long task

```ts
const track = asyncWorker.track(tick => {
	let i = 1000000
	let result
	while (--i) {
		if (i % 1000) tick(i / 1000000)
		// calculating
	}
	return result
})

// manage ticks coming in
track.tick(progress => {
	console.log(`it is ${progress * 100}% done`)
})

// manage the result that will eventually come
track.result.then(console.log).catch(console.error)
```
