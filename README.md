# async-worker

Async worker for javascripts that unlocks true asynchronous programming

- [installing](#installing)
- [API](#API)
  - [task](#task)
  - [cook](#cook)
- [common mistakes](#common-mistakes)

### installing

Install from npm:

```sh
npm i --save async-worker
```

`asyncWorker` supports node and the browser. Depending on what is your target import accordingly:

```ts
import * as asyncWorker from 'async-worker/web' // target web
import * as asyncWorker from 'async-worker/node' // target node
```

Alternatively use the embeded script tag (`asyncWorker` will be available globally):

```html
<script src="https://cdn.jsdelivr.net/npm/async-worker/dist/asyncWorker.web.js"></script>
```

### API

#### task

To perform a long, expensive tasks outside of the main thread use `asyncWorker.task`

```ts
function task<T, S extends any[]>(func: (...args: S) => T, ...args: S): Promise<T>
```

```ts
//...
const primes = await asyncWorker.task(
	(from, to) => {
		let computedPrimes = []
		// im computing big data that would otherwise block the main thread
		return computedPrimes
	},
	10,
	1000000
)
//...
```

#### cook

To cook a function into an asynchronous one use `asyncWorker.task`

```ts
export declare function cook<T, S extends any[], U extends any[]>(
	func: (...args: S) => (...args: U) => T,
	...args: S
): (...args: U) => Promise<T>
```

```ts
//...
const asyncFibo = asyncWorker.cook(() => n => {
	let [first, second] = [0, 1]

	if (n < 0) return NaN
	if (n === 1) return 0
	if (n === 2) return 1

	while (--n) [first, second] = [second, first + second]

	return first
})

const res = await asyncFibo(5)
console.log(`5th fibonnaci number is ${res}`)
//...
```

### common mistakes

Because web workers exist in a different thread the passed function does not have access to your current context variables. To pass in variables please add them as additional parameters and accept them in your functions. This will **not** work:

```ts
//...
const from = 10
const to = 1000000
const primes = await asyncWorker.task(() => {
	console.log(from) // error during worker runtime: 'from' is not defined
	console.log(to) // error during worker runtime: 'to' is not defined
})
//...
```

Do instead:

```ts
//...
const from = 10
const to = 1000000
const primes = await asyncWorker.task(
	(from, to) => {
		console.log(from) // :)
		console.log(to) // :)
	},
	from,
	to
)
//...
```

Some types are not [transferable](https://developer.mozilla.org/en-US/docs/Web/API/Transferable). Meaning you cannot send them to or recieve from a web worker. Notably functions are not transderable. The following will **not** work:

```ts
//...
const answer = () => 42
const result = await asyncWorker.task(answer => {
	// DataCloneError: could not clone '() => 42'
}, answer)
//...
```

Nor will:

```ts
//...
const func = await asyncWorker.task(() => {
	return () => 42
	// DataCloneError: could not clone '() => 42'
})
//...
```
