# async-worker

Async worker for javascripts that unlocks true asynchronous programming

- [installing](#installing)
- [API](#API)
  - [task](#task)

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

Because web workers exist in a different thread the passed function does not have access to your current context variables. To pass in variables please add them as additional parameters and accept them in your task function. This will **not** work:

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
