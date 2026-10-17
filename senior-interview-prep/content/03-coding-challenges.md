# Coding Challenges (with Solutions)

> **Practise rule:** read the prompt, close the solution, set a timer (JS utilities: 10–15 min, React components: 30–45 min), write it, *then* compare. Talk out loud while you code; that's what you'll be graded on.

## JavaScript Utilities

<details>
<summary>Implement debounce (with cancel and flush)</summary>

> 🎤 **Mock answer**
>
> Before coding, I'd clarify: do we need leading or trailing execution, and do we need cancel? I'll assume trailing with cancel and flush.
>
> My approach: debounce returns a new function, and the timer lives in a closure. Every call clears the existing timer and starts a new one, so the original function only runs once calls have stopped for `wait` milliseconds. I store the latest arguments and `this` so it works correctly as a method, and I call the function with `apply`.
>
> `cancel` just clears the timer. `flush` runs the pending call immediately if one exists.
>
> To test it, I'd call it rapidly three times and check it fires once with the last arguments, then check that cancel prevents the call. I'd also mention that in React the debounced function must be created once, with `useMemo` or a ref, otherwise every render creates a new timer and debouncing silently stops working.

```js
function debounce(fn, wait = 300) {
  let timer = null;
  let lastArgs, lastThis;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;              // preserve `this` for method usage
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, wait);
  }
  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  debounced.flush = () => {
    if (timer) { clearTimeout(timer); timer = null; fn.apply(lastThis, lastArgs); }
  };
  return debounced;
}
```

Talking points: closure holds `timer`; `this` and args are preserved; follow-ups include a `leading` option, and **in React you must keep the debounced function stable** (`useMemo`/`useRef`) or every render creates a new timer.

> 🔁 **Follow-up questions**
>
> **Q: How would you add a leading option?**
> On a call, if there's no active timer and leading is enabled, run the function immediately. Then start the timer as usual. On the trailing edge, only call again if there were further calls during the wait.
>
> **Q: How would you add a maxWait?**
> Track when the first call in the current burst happened. If the time since then exceeds `maxWait`, run immediately even though calls are still coming. That's what lodash does, and it effectively combines debounce with throttle.
>
> **Q: How do you test it?**
> With fake timers: call it several times, advance time by less than the wait and assert it hasn't run, advance past the wait and assert it ran once with the last arguments. Then test cancel and flush.

</details>

<details>
<summary>Implement throttle</summary>

> 🎤 **Mock answer**
>
> I'd clarify whether they want a leading call, a trailing call, or both. I'll implement both, because that's what users expect: an immediate response, plus a final call so the last value isn't lost.
>
> I track the timestamp of the last execution. On each call I compute how much time remains in the current window. If no time remains, I run immediately and update the timestamp. If we're still inside the window and no trailing call is scheduled, I schedule one for the remaining time, so the last event in a burst still gets handled.
>
> I'd test it by firing many calls quickly with fake timers and checking it runs at most once per interval, plus once at the end. Then I'd mention that for visual updates on scroll, `requestAnimationFrame` is often better than a fixed interval, and for visibility, `IntersectionObserver` avoids scroll listeners entirely.

```js
function throttle(fn, wait = 200) {
  let last = 0;
  let timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer); timer = null;
      last = now;
      fn.apply(this, args);                 // leading call
    } else if (!timer) {
      timer = setTimeout(() => {            // trailing call
        last = Date.now(); timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between your throttle and requestAnimationFrame throttling?**
> Mine uses a fixed time interval. rAF throttling runs at most once per frame, synced with the display, which is better for visual updates like following the mouse, and it pauses automatically in background tabs.
>
> **Q: Why keep the trailing call?**
> Without it, the final event in a burst can be lost, for example the final scroll position, so the UI ends in a stale state.

</details>

<details>
<summary>Implement Promise.all (and allSettled)</summary>

> 🎤 **Mock answer**
>
> The requirements are: return a promise that resolves to an array of results in the same order as the input, reject as soon as any one rejects, accept non-promise values, and resolve immediately with an empty array for empty input.
>
> Inside a new Promise, I create a results array and a counter. For each item I wrap it with `Promise.resolve`, so plain values work too. When one resolves, I store the value at its original index, not in completion order, which is the bug people usually make. Then I increment the counter, and when the counter equals the length, I resolve with the results. Any rejection calls `reject` directly. Since a promise can only settle once, later results or rejections are ignored automatically.
>
> For allSettled, I'd map every input to a promise that never rejects, converting each outcome into an object with a status and a value or reason, and then reuse Promise.all.

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let done = 0;
    if (items.length === 0) return resolve([]);
    items.forEach((item, i) => {
      Promise.resolve(item)            // handles non-promise values
        .then(value => {
          results[i] = value;          // keep ORDER, not completion order
          if (++done === items.length) resolve(results);
        })
        .catch(reject);                // first rejection wins
    });
  });
}

function promiseAllSettled(items) {
  return Promise.all(items.map(p =>
    Promise.resolve(p).then(
      value => ({ status: 'fulfilled', value }),
      reason => ({ status: 'rejected', reason })
    )
  ));
}
```

> 🔁 **Follow-up questions**
>
> **Q: What happens to the other promises when one rejects?**
> They keep running. Promise.all just stops waiting for them, because promises can't be cancelled. If you need real cancellation, pass an AbortSignal to the underlying operations and abort it on failure.
>
> **Q: Implement Promise.race.**
> Return a new promise and, for each input, call `Promise.resolve(item).then(resolve, reject)`. The first one to settle wins, because a promise can only settle once.
>
> **Q: Implement Promise.any.**
> Like all, but inverted: resolve on the first fulfilment, collect rejections by index, and when every input has rejected, reject with an `AggregateError` of the reasons.

</details>

<details>
<summary>Run async tasks with a concurrency limit (e.g. max 3 uploads at a time)</summary>

> 🎤 **Mock answer**
>
> A real example is uploading twenty files with at most three at a time. I'd take an array of task functions, not promises, because a promise has already started running when it's created.
>
> My approach is a worker pool. I create `limit` workers. Each worker loops: it claims the next index from a shared counter, awaits that task, stores the result at that index, and keeps going until there are no tasks left. Because JavaScript is single-threaded, incrementing the shared counter is safe. Then I `await Promise.all` over the workers, and return results in the original order.
>
> Edge cases to mention: the limit being larger than the number of tasks, error handling (whether one failure should stop everything or be collected like allSettled), and progress reporting, for example updating a progress bar per file. I'd also mention that the browser already limits connections per host, but explicit limits matter for things like rate-limited APIs.

```js
async function runWithLimit(tasks, limit = 3) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;                       // claim an index (single-threaded, so safe)
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
// usage: runWithLimit(files.map(f => () => upload(f)), 3)
```

> 🔁 **Follow-up questions**
>
> **Q: How would you stop everything on the first error?**
> Set a shared `failed` flag; each worker checks it before claiming the next task, and the outer promise rejects with the first error. For in-flight tasks, pass an AbortSignal and abort it.
>
> **Q: How would you report progress?**
> Accept an `onProgress` callback and call it with the completed count after each task finishes, for example to update a progress bar per file upload.

</details>

<details>
<summary>Retry with exponential backoff</summary>

> 🎤 **Mock answer**
>
> I'd write an async function that takes the operation and options like the number of retries and a base delay. In a loop, I try the operation and return on success. On failure, if I've used up the retries, I rethrow the last error. Otherwise I wait for the base delay times two to the power of the attempt number, plus some random jitter, and try again.
>
> The jitter matters at scale: if thousands of clients fail at the same moment, you don't want them all retrying in sync and hammering the server again.
>
> The senior points I'd raise: only retry things that are safe to repeat, meaning GET requests or POSTs with an idempotency key. On something like a checkout order submission, a blind retry could create a duplicate order. Also, don't retry 4xx errors except 429, respect the `Retry-After` header, and support an abort signal so the user can cancel.

```js
async function retry(fn, { retries = 3, baseMs = 300 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const jitter = Math.random() * baseMs;
      await new Promise(r => setTimeout(r, baseMs * 2 ** attempt + jitter));
    }
  }
}
```

Mention: only retry **idempotent** requests (GET, or POST with an idempotency key), don't retry 4xx, add **jitter** to avoid thundering herds, and respect the `Retry-After` header.

> 🔁 **Follow-up questions**
>
> **Q: Which errors should not be retried?**
> Most 4xx errors, like 400 validation errors, 401 or 403 auth errors and 404s, because retrying won't change the result. Retry network failures, 5xx, and 429 when rate limited, respecting `Retry-After`.
>
> **Q: Why jitter?**
> Without jitter, many clients that failed at the same time retry at the same moments, creating synchronised traffic spikes that can keep a recovering server down. Randomness spreads them out.

</details>

<details>
<summary>Deep clone (handle arrays, objects, Date, Map, Set, cycles)</summary>

> 🎤 **Mock answer**
>
> First, I'd mention that in real code I'd use `structuredClone`. Then I'd implement it to show the thinking.
>
> It's a recursive function. Primitives and null are returned as they are. For objects, I keep a WeakMap of already-cloned objects, which handles circular references: if I've seen this object, I return its existing clone instead of recursing forever. Then I handle special types: a Date becomes a new Date, a RegExp a new RegExp, and for Map and Set I create a new one and recursively clone the entries. For arrays and plain objects, I create an empty copy, preserving the prototype, register it in the WeakMap before recursing, then copy each own key, including symbol keys, by cloning the value.
>
> Limitations to mention: functions are shared rather than cloned, and DOM nodes and class instances with private state can't be truly cloned. This is also why deep cloning is rarely needed in React: normally we do targeted immutable updates instead.

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);           // cycles
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) {
    const m = new Map(); seen.set(value, m);
    value.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set(); seen.set(value, s);
    value.forEach(v => s.add(deepClone(v, seen)));
    return s;
  }
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) copy[key] = deepClone(value[key], seen);
  return copy;
}
```

Then say: "In real code I'd use `structuredClone`."

> 🔁 **Follow-up questions**
>
> **Q: Why use a WeakMap rather than a Map for the seen cache?**
> It doesn't keep the original objects alive after cloning finishes. A Map would work too, since it's local to one call, but WeakMap expresses the intent and avoids holding references longer than necessary.
>
> **Q: How do you clone class instances properly?**
> My version preserves the prototype with `Object.create`, so methods work, but private fields and internal state can't be copied from the outside. Usually the class should provide its own `clone` method.

</details>

<details>
<summary>Deep equal</summary>

> 🎤 **Mock answer**
>
> I start with `Object.is`, which handles identical references, primitives, and even NaN equal to NaN. If either value isn't an object, or is null, and they weren't equal already, I return false.
>
> Then I check that both are arrays or both are not, compare the number of keys, and for every key in the first object, check that the second object has it as its own property and that the values are recursively deep-equal.
>
> Edge cases I'd discuss: Dates and Maps would need special handling, circular structures would need a visited set, and performance on large objects. I'd also point out where this comes up in React. `React.memo` uses shallow comparison by default, not deep, because deep equality on every render can cost more than the re-render it avoids.

```js
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}
```

> 🔁 **Follow-up questions**
>
> **Q: How would you handle circular references?**
> Keep a map of pairs already being compared. If we see the same pair of objects again, treat them as equal for that path, which stops infinite recursion.
>
> **Q: Why doesn't React use deep comparison for props?**
> Because deep comparison can be more expensive than re-rendering, especially for big objects, and it would run on every render. Shallow comparison plus immutable updates is cheap and good enough.

</details>

<details>
<summary>Flatten a nested array (with depth), without using .flat()</summary>

> 🎤 **Mock answer**
>
> The recursive version uses reduce: for each item, if it's an array and we still have depth left, I recursively flatten it with depth minus one and concatenate the result. Otherwise I append the item. The default depth is Infinity.
>
> Then I'd mention the recursion limit: a very deeply nested array could overflow the stack, so I'd show an iterative version using an explicit stack. I copy the input onto a stack, pop items, push array contents back onto the stack, and collect non-arrays into the output. Because popping reverses the order, I reverse the result at the end.
>
> Complexity is O(n) in the total number of elements. And of course in production code I'd just use the built-in `flat`.

```js
function flatten(arr, depth = Infinity) {
  return arr.reduce((acc, item) =>
    Array.isArray(item) && depth > 0
      ? acc.concat(flatten(item, depth - 1))
      : acc.concat([item]), []);
}
// Iterative version (no recursion limit):
function flattenIter(arr) {
  const stack = [...arr], out = [];
  while (stack.length) {
    const item = stack.pop();
    Array.isArray(item) ? stack.push(...item) : out.push(item);
  }
  return out.reverse();
}
```

> 🔁 **Follow-up questions**
>
> **Q: What's the time and space complexity?**
> O(n) time in the total number of elements, including nested ones. Space is O(n) for the output, plus O(d) recursion depth for the recursive version, or the explicit stack for the iterative one.
>
> **Q: How would you flatten a nested object into dot-notation keys?**
> Recursively walk the object, building a path prefix. When the value is a primitive or array, set `result[path] = value`; otherwise recurse with `path + '.' + key`. That's useful for form libraries or translation files.

</details>

<details>
<summary>Memoize a function</summary>

> 🎤 **Mock answer**
>
> Memoize returns a wrapper with a cache, a Map, in its closure. On each call I build a key from the arguments. JSON.stringify works for simple arguments, but I'd let the caller pass a custom key function. If the key is in the cache, I return the cached result. Otherwise I call the original function, store the result, and return it.
>
> Then the senior discussion. First, memory: an unbounded cache is a memory leak in a long-running app, so I'd add an LRU limit, or use a WeakMap when the key is an object. Second, async functions: I'd cache the promise itself rather than the result, so two concurrent calls with the same argument share one request instead of both fetching. And if the promise rejects, I remove it from the cache so we can retry. Third, it only makes sense for pure functions.

```js
function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function (...args) {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

Discuss: unbounded cache (memory leak), so use LRU or a WeakMap for object keys. For async functions cache the **promise** so concurrent calls dedupe.

> 🔁 **Follow-up questions**
>
> **Q: Why is JSON.stringify a weak cache key?**
> It's slow for large arguments, fails on circular structures, loses functions and undefined, and objects with the same keys in a different order produce different keys. A custom key function is safer.
>
> **Q: How is this different from useMemo?**
> My memoize caches results for all arguments forever, across calls. `useMemo` caches only the most recent value per component instance and recalculates when its dependencies change.

</details>

<details>
<summary>Curry</summary>

> 🎤 **Mock answer**
>
> Currying transforms a function that takes several arguments into a chain of functions that can take them one or a few at a time.
>
> My implementation returns a `curried` function that collects arguments. If the number of arguments collected so far is at least the original function's `length`, I call the original function. Otherwise I return a new function that accepts more arguments and calls `curried` again with the old and new arguments combined.
>
> The limitation I'd mention is that it relies on `fn.length`, which doesn't count rest parameters or parameters with default values. A practical use is creating specialised functions, for example a currency formatter preconfigured with the locale, though in React code plain closures usually cover this.

```js
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn.apply(this, args)
      : (...more) => curried.apply(this, [...args, ...more]);
  };
}
const add3 = curry((a, b, c) => a + b + c);
add3(1)(2)(3); add3(1, 2)(3); // 6
```

> 🔁 **Follow-up questions**
>
> **Q: Where is currying actually useful in front-end code?**
> Creating preconfigured functions, like event handler factories, `handleChange('email')`, or formatters bound to a locale, and building pipelines in functional style. In everyday React code, a simple closure is usually clearer.
>
> **Q: How would you support placeholders?**
> Use a special placeholder symbol in the arguments, and when merging new arguments, fill placeholders first before appending. Only call the function when all required positions are filled with real values.

</details>

<details>
<summary>EventEmitter (on, off, once, emit)</summary>

> 🎤 **Mock answer**
>
> I'd store listeners in a Map from event name to a Set of handlers. A Set avoids duplicates and makes removal easy.
>
> `on` adds the handler and returns an unsubscribe function, a pattern I like because it fits naturally into a React `useEffect` cleanup. `off` deletes the handler. `once` wraps the handler in a function that first removes itself and then calls the original. `emit` calls every handler with the arguments.
>
> One subtle bug to avoid: in `emit`, I iterate over a copy of the handlers, because a handler might unsubscribe itself during the emit, and modifying a collection while iterating it can skip handlers. Other things I'd mention: error isolation, so one throwing handler doesn't stop the others, and memory leaks if components subscribe and never unsubscribe.

```js
class EventEmitter {
  #events = new Map();
  on(name, fn) {
    if (!this.#events.has(name)) this.#events.set(name, new Set());
    this.#events.get(name).add(fn);
    return () => this.off(name, fn);           // unsubscribe handle
  }
  off(name, fn) { this.#events.get(name)?.delete(fn); }
  once(name, fn) {
    const wrapper = (...args) => { this.off(name, wrapper); fn(...args); };
    return this.on(name, wrapper);
  }
  emit(name, ...args) {
    [...(this.#events.get(name) ?? [])].forEach(fn => fn(...args)); // copy: safe if handlers unsubscribe
  }
}
```

> 🔁 **Follow-up questions**
>
> **Q: How would you make once() removable with off() using the original handler?**
> Store a reference from the original handler to its wrapper, for example in a WeakMap, so `off(name, originalFn)` can find and remove the wrapper.
>
> **Q: How would you use this pattern in React?**
> Subscribe in a `useEffect` and return the unsubscribe function as the cleanup, or better, wrap the emitter in `useSyncExternalStore` if components need to read state from it.

</details>

<details>
<summary>LRU Cache (O(1) get/put)</summary>

> 🎤 **Mock answer**
>
> The requirement is O(1) for both get and put, with the least recently used item evicted when capacity is exceeded.
>
> In JavaScript, a Map makes this elegant because it remembers insertion order. On `get`, if the key exists, I delete it and set it again, which moves it to the end as most recently used, then return the value. On `put`, I delete the key if it exists, set it, and if the size exceeds capacity, I evict the first key from `map.keys()`, which is the oldest.
>
> If they want the classic implementation, I'd explain a hash map pointing into a doubly linked list. The map gives O(1) lookup, and the list gives O(1) moving a node to the front and removing the tail. In front-end terms, I'd use this for things like caching autocomplete results or API responses with bounded memory.

```js
class LRUCache {
  constructor(capacity) { this.capacity = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key); this.map.set(key, value);   // move to most-recent
    return value;
  }
  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);  // oldest = first inserted
    }
  }
}
```

A Map preserves insertion order, which is what makes this neat. The "classic" answer is a hashmap + doubly linked list.

> 🔁 **Follow-up questions**
>
> **Q: Why is the Map solution O(1)?**
> `get`, `set`, `delete` and `has` on a Map are O(1) on average, and getting the first key from the iterator is O(1). Re-inserting a key moves it to the end of the insertion order.
>
> **Q: How would you add a time-to-live?**
> Store an expiry time with each value. On `get`, if it's expired, delete it and return a miss. Optionally clean up periodically.

</details>

<details>
<summary>Polyfill Array.prototype.map / filter / reduce</summary>

> 🎤 **Mock answer**
>
> For map, I add a method to Array.prototype using a regular function so `this` refers to the array. I create an output array of the same length, loop over the indices, and for each index that actually exists, I call the callback with the value, the index and the array, using the optional `thisArg`, and store the result. Checking `i in this` preserves holes in sparse arrays, which matches the spec.
>
> For reduce, the tricky part is the initial value. If one is provided, I start with it at index 0. If not, I use the first existing element as the accumulator and start from the next index. If the array is empty with no initial value, I throw a TypeError like the native version. Then I loop and update the accumulator.
>
> I'd also mention that in real projects you shouldn't modify built-in prototypes. This is just to show understanding.

```js
Array.prototype.myMap = function (cb, thisArg) {
  const out = new Array(this.length);
  for (let i = 0; i < this.length; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this); // skip holes
  }
  return out;
};

Array.prototype.myReduce = function (cb, ...init) {
  let i = 0, acc;
  if (init.length) acc = init[0];
  else {
    while (i < this.length && !(i in this)) i++;
    if (i >= this.length) throw new TypeError('Reduce of empty array with no initial value');
    acc = this[i++];
  }
  for (; i < this.length; i++) if (i in this) acc = cb(acc, this[i], i, this);
  return acc;
};
```

> 🔁 **Follow-up questions**
>
> **Q: Why should you avoid modifying built-in prototypes in real code?**
> It can conflict with future language features or other libraries, which has actually happened, and it creates surprising global behaviour. Polyfills should be spec-compliant and only defined if missing.
>
> **Q: Implement filter.**
> Same structure as map: loop over indices that exist, call the callback with value, index and array, and push the value into the result if the callback returns truthy.

</details>

<details>
<summary>Implement Function.prototype.bind</summary>

> 🎤 **Mock answer**
>
> `bind` returns a new function with `this` fixed and optionally some arguments preset.
>
> Inside `myBind`, `this` is the original function, so I save it. I return a `bound` function that, when called, applies the original function with the saved context and the preset arguments followed by the new arguments.
>
> The edge case that shows deeper knowledge is `new`. If the bound function is called with `new`, the spec says the bound `this` is ignored and a new instance is created. I check `new.target`, and if it's set, I construct the original function with all the arguments. A complete implementation would also preserve the prototype and set the name and length, but I'd mention those rather than code them unless asked.

```js
Function.prototype.myBind = function (ctx, ...preset) {
  const fn = this;
  return function bound(...args) {
    if (new.target) return new fn(...preset, ...args); // `new` ignores bound this
    return fn.apply(ctx, [...preset, ...args]);
  };
};
```

> 🔁 **Follow-up questions**
>
> **Q: Why use new.target?**
> To detect whether the bound function was called with `new`. In that case the spec says the bound `this` is ignored and a new instance of the original function is created.
>
> **Q: How is bind different from an arrow function wrapper?**
> Functionally similar for `this`, but bind also supports partial application, works with `new`, and creates a function with a specific name and length.

</details>

<details>
<summary>Get a nested value by path: get(obj, 'a.b[0].c', default)</summary>

> 🎤 **Mock answer**
>
> This is like lodash's `get`. The function takes an object, a path and a default value. The path can be a string with dots and brackets, or an array of keys.
>
> First I normalise the string path: I convert bracket notation, like `[0]`, into dot notation with a regex, split on dots, and filter out empty segments. Then I walk through the keys. If at any point the current value is null or undefined, I return the default. Otherwise I move one level deeper. At the end, if the result is undefined, I return the default, otherwise the value.
>
> I'd mention that with modern JavaScript, optional chaining covers most static cases, so a helper like this is mainly useful when the path is dynamic, for example form field names like "address.postalCode" in a form library.

```js
function get(obj, path, fallback) {
  const keys = Array.isArray(path) ? path : path.replace(/\[(\w+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return fallback;
    cur = cur[k];
  }
  return cur === undefined ? fallback : cur;
}
```

> 🔁 **Follow-up questions**
>
> **Q: Now implement set(obj, path, value).**
> Walk the path, creating an object or array at each missing level, depending on whether the next key is numeric, and assign the value at the last key. For immutable versions, copy each level along the path instead of mutating.
>
> **Q: What about keys that contain dots?**
> Accept the path as an array of keys, which removes the ambiguity. String paths are a convenience, not the canonical format.

</details>

<details>
<summary>Classic algorithm warm-ups that appear in front-end screens</summary>

> 🎤 **Mock answer**
>
> For front-end screens the algorithm questions are usually moderate, and the key is to talk through complexity.
>
> My general approach: clarify the input and edge cases, describe a brute-force solution and its complexity, then optimise. Most of these optimise with the right data structure. A hash map turns lookups like two-sum or finding duplicates into O(n). A stack handles matching brackets or undo history. Sorting first helps with interval merging. BFS and DFS show up as tree problems, and in front end the tree is often the DOM itself, like finding all elements matching a condition or computing the depth of nested comments.
>
> I always state time and space complexity at the end, test with an empty input and a single element, and mention the trade-off if there's one, like using extra memory for speed.

- **Two-sum** → hash map, O(n).
- **Valid parentheses** → stack.
- **Group anagrams** → Map keyed by sorted string.
- **Find duplicates / first non-repeating char** → frequency Map.
- **Merge intervals** → sort by start, then merge.
- **Binary search**, **BFS on a tree** (e.g. traverse the DOM: `document.body` children level by level).
- **Get element by id without the API** → DFS over `node.children`.

Always state the time/space complexity.

> 🔁 **Follow-up questions**
>
> **Q: What's the complexity of two-sum with a hash map?**
> O(n) time and O(n) space: one pass, checking if the complement is in the map before adding the current number.
>
> **Q: How would you find all elements with a given class name without the DOM API?**
> Traverse the tree from the root, depth-first with recursion or a stack, checking each node's `classList` and collecting matches. That's O(n) in the number of nodes.

</details>

## React Components & Hooks

<details>
<summary>useDebounce hook + search box with cancellation</summary>

> 🎤 **Mock answer**
>
> I'd break this into two pieces. First, a `useDebounce` hook: it keeps a debounced copy of a value in state, and in an effect, sets a timeout to update it after the delay. The cleanup clears the timeout, so each keystroke resets the timer.
>
> Then the search component: the input is controlled, so typing is instant, and the fetch effect depends on the debounced query instead of the raw input. In that effect I create an AbortController and return a cleanup that aborts it, so a slow response for an old query can never overwrite newer results. I track status as idle, loading, success or error, rather than separate booleans, and I ignore AbortErrors.
>
> For accessibility, the input has a label and loading and error messages are announced with a status or alert role. And I'd close by saying that in production I'd use TanStack Query, with the debounced query in the query key, which also gives me caching, so going back to a previous search is instant.

```jsx
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function Search() {
  const [query, setQuery] = useState('');
  const q = useDebounce(query.trim(), 300);
  const [state, setState] = useState({ status: 'idle', data: [] });

  useEffect(() => {
    if (!q) { setState({ status: 'idle', data: [] }); return; }
    const ctrl = new AbortController();
    setState(s => ({ ...s, status: 'loading' }));
    fetch('/api/search?q=' + encodeURIComponent(q), { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => setState({ status: 'success', data }))
      .catch(err => { if (err.name !== 'AbortError') setState({ status: 'error', data: [] }); });
    return () => ctrl.abort();
  }, [q]);

  return (
    <div>
      <label htmlFor="search">Search products</label>
      <input id="search" value={query} onChange={e => setQuery(e.target.value)} />
      {state.status === 'loading' && <p role="status">Loading…</p>}
      {state.status === 'error' && <p role="alert">Something went wrong.</p>}
      <ul>{state.data.map(item => <li key={item.id}>{item.name}</li>)}</ul>
    </div>
  );
}
```

Mention: in production, use **TanStack Query** (`queryKey: ['search', q]`), which gives caching, dedupe and cancellation for free.

> 🔁 **Follow-up questions**
>
> **Q: Why debounce the value rather than the fetch function?**
> Debouncing a value is idiomatic with React's data flow. The effect just depends on the debounced value, and cleanup is automatic. Debouncing a function requires keeping it stable across renders and cancelling it on unmount.
>
> **Q: How would you show previous results while new ones load?**
> Keep the old data in state and only replace it on success, with a subtle loading indicator. TanStack Query does that with `placeholderData: keepPreviousData`.
>
> **Q: How would you test this component?**
> With MSW for the API and fake timers: type into the input, advance timers past the debounce, and assert with `findBy` that the results appear, plus an error-state test with a failing handler.

</details>

<details>
<summary>Accessible Autocomplete / Typeahead (the most common senior question)</summary>

> 🎤 **Mock answer**
>
> I'd start with requirements: minimum characters, debounce delay, max results, keyboard support, whether the data is local or remote, and whether to cache.
>
> The architecture is a controlled input, a debounced query, and an effect that fetches suggestions with an AbortController to prevent race conditions. I'd add a small cache in a ref keyed by query, so backspacing or retyping is instant.
>
> For keyboard and screen readers I follow the ARIA combobox pattern: the input has `role="combobox"`, `aria-expanded`, `aria-controls` pointing to the listbox, and `aria-activedescendant` pointing to the highlighted option. Arrow keys move the active index, Enter selects, and Escape closes. One detail people miss: clicking an option fires blur on the input first, which can close the list before the click registers, so I prevent default on mousedown.
>
> At Bell, a real example is the address autocomplete for checking internet availability: debounce, cancellation and caching all mattered there. For scale I'd add virtualisation for long lists and highlighting of the matched text.

Requirements to ask about: min chars? debounce? highlight matches? keyboard nav? async source? caching? max results?

```jsx
function Autocomplete({ fetchSuggestions, onSelect }) {
  const [input, setInput] = useState('');
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const cache = useRef(new Map());
  const q = useDebounce(input.trim(), 250);
  const listId = useId();

  useEffect(() => {
    if (q.length < 2) { setItems([]); return; }
    if (cache.current.has(q)) { setItems(cache.current.get(q)); return; }
    const ctrl = new AbortController();
    fetchSuggestions(q, ctrl.signal)
      .then(res => { cache.current.set(q, res); setItems(res); setOpen(true); setActive(-1); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [q, fetchSuggestions]);

  const choose = item => { setInput(item.label); setOpen(false); onSelect(item); };

  const onKeyDown = e => {
    if (!open || !items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % items.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => (i - 1 + items.length) % items.length); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(items[active]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="autocomplete">
      <input
        role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? listId + '-' + active : undefined}
        value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      />
      {open && items.length > 0 && (
        <ul role="listbox" id={listId}>
          {items.map((item, i) => (
            <li key={item.id} id={listId + '-' + i} role="option" aria-selected={i === active}
                onMouseDown={e => e.preventDefault()} onClick={() => choose(item)}>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Talking points: debounce, **abort stale requests**, **cache**, ARIA combobox pattern, keyboard support, `onMouseDown` preventDefault so blur doesn't close it before the click, `fetchSuggestions` should be stable (`useCallback`), and virtualise if there are many results. Bell tie-in: **address autocomplete for the serviceability check**.

> 🔁 **Follow-up questions**
>
> **Q: How would you highlight the matching text?**
> Split the label around the matched substring, case-insensitively, and wrap the match in a `mark` element. Never use `dangerouslySetInnerHTML` for this, because the suggestions may contain user content.
>
> **Q: How would you handle 10,000 suggestions?**
> Don't render them all: limit to the top N from the server, or virtualise the listbox. And keep `aria-setsize` and `aria-posinset` correct so screen readers know the real count.
>
> **Q: How does a screen reader user know results appeared?**
> Through a polite live region announcing "8 results available", plus `aria-expanded` changing on the combobox, and `aria-activedescendant` announcing the highlighted option as they arrow through.

</details>

<details>
<summary>Infinite scroll with IntersectionObserver</summary>

> 🎤 **Mock answer**
>
> I'd keep items, page, a hasMore flag and loading in state. One effect fetches the current page and appends the results, with an ignore flag in the cleanup so a late response after unmount doesn't set state.
>
> Instead of listening to scroll events, I put an empty sentinel element after the list and observe it with an IntersectionObserver. When it becomes visible and we're not already loading, I increment the page. I use a `rootMargin` of a couple of hundred pixels so the next page starts loading before the user actually hits the bottom. The observer is disconnected in the cleanup.
>
> The senior points: for thousands of items, I'd add virtualisation so the DOM stays small. I'd use cursor-based pagination on the API so new items don't cause duplicates. I'd preserve scroll position when the user navigates back. And for accessibility, I'd consider a "Load more" button, because pure infinite scroll makes the footer unreachable and is hard for keyboard users.

```jsx
function InfiniteList({ fetchPage }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchPage(page).then(({ data, hasMore }) => {
      if (ignore) return;
      setItems(prev => [...prev, ...data]);
      setHasMore(hasMore);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, [page, fetchPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) setPage(p => p + 1);
    }, { rootMargin: '200px' });               // prefetch before reaching the bottom
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading]);

  return (
    <>
      <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>
      {loading && <p role="status">Loading…</p>}
      {hasMore ? <div ref={sentinel} /> : <p>No more results</p>}
    </>
  );
}
```

Senior extras: **virtualisation** (TanStack Virtual / react-window) for thousands of rows, cursor-based pagination, preserving scroll position on back navigation, a "Load more" button fallback for a11y and footer reachability, and `useInfiniteQuery`.

> 🔁 **Follow-up questions**
>
> **Q: How would you restore scroll position when the user comes back?**
> Cache the loaded pages, for example with a query cache like `useInfiniteQuery`, and save the scroll offset in session storage or the router's history state, then restore it after the list renders.
>
> **Q: Why cursor-based pagination?**
> With offsets, if new items are inserted while the user scrolls, page two shifts and items are duplicated or skipped. A cursor points to a specific item, so pages stay stable.
>
> **Q: Why might you avoid infinite scroll altogether?**
> The footer becomes unreachable, users lose their place, it's hard for keyboard and screen reader users, and it's bad when people need to compare items. For e-commerce listings, a "Load more" button or pagination is often better.

</details>

<details>
<summary>Accessible Modal (portal, focus trap, Esc, restore focus)</summary>

> 🎤 **Mock answer**
>
> My first choice today is the native `dialog` element with `showModal()`. It renders in the top layer, so there are no z-index problems, traps focus, closes on Escape, and makes the background inert, which covers most of the accessibility work for free.
>
> In React I keep an `open` prop and use an effect to call `showModal` or `close` on a ref. I listen for the native close event to sync state back up through `onClose`, which handles the Escape key. I give it `aria-labelledby` pointing to the title, close it on a backdrop click by checking that the click target is the dialog itself, and render it into `document.body` with a portal.
>
> Things I'd mention if I were building it without `dialog`: a manual focus trap, `role="dialog"` with `aria-modal`, setting `inert` on the rest of the page, locking background scroll, and, importantly, returning focus to the button that opened the modal when it closes.

```jsx
function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();   // native <dialog>: focus trap + Esc + inert background
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return createPortal(
    <dialog ref={ref} aria-labelledby="modal-title" onClose={onClose}
            onClick={e => { if (e.target === ref.current) onClose(); }}>
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </dialog>,
    document.body
  );
}
```

Talking points: the native `<dialog>` + `showModal()` handles the top layer, `Esc`, background inertness and focus. Also cover returning focus to the trigger on close, preventing background scroll, and `aria-labelledby`. Without `<dialog>`: a manual focus trap, `inert` on siblings, and `role="dialog" aria-modal="true"`.

> 🔁 **Follow-up questions**
>
> **Q: How do you prevent the page behind from scrolling?**
> With `showModal()` most browsers handle inertness, but scroll may still chain, so I add `overflow: hidden` on the body while open, or `overscroll-behavior: contain` on the dialog, and restore it on close.
>
> **Q: How do you return focus to the trigger?**
> Save `document.activeElement` when opening, and call `.focus()` on it after closing. The native dialog does this automatically in modern browsers, but I verify it.
>
> **Q: When would you not use a modal at all?**
> For long forms or content that users want to reference while doing something else. A separate page or inline expansion is often better, especially on mobile.

</details>

<details>
<summary>Tabs component (compound component pattern)</summary>

> 🎤 **Mock answer**
>
> I'd use the compound component pattern so the API reads naturally: `Tabs` contains a `TabList` with `Tab` children, plus `TabPanel` children. The parent `Tabs` holds the selected value in state and shares it through context, so each Tab and TabPanel can read whether it's active without prop drilling.
>
> For accessibility, the list has `role="tablist"`, each tab is a button with `role="tab"`, `aria-selected` and `aria-controls`, and each panel has `role="tabpanel"` with `aria-labelledby` pointing back to its tab. I use a roving tabindex: only the selected tab is in the tab order, and arrow keys move between tabs, which is the expected keyboard pattern.
>
> Extensions I'd mention: supporting both controlled and uncontrolled modes with a `value` and `onChange`, lazy rendering of panels, and throwing a helpful error if a Tab is used outside Tabs. This is exactly the kind of component that belongs in a design system.

```jsx
const TabsCtx = createContext(null);

function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}
function TabList({ children }) { return <div role="tablist">{children}</div>; }
function Tab({ value, children }) {
  const ctx = useContext(TabsCtx);
  const selected = ctx.value === value;
  return (
    <button role="tab" id={'tab-' + value} aria-selected={selected} aria-controls={'panel-' + value}
            tabIndex={selected ? 0 : -1} onClick={() => ctx.setValue(value)}>
      {children}
    </button>
  );
}
function TabPanel({ value, children }) {
  const ctx = useContext(TabsCtx);
  if (ctx.value !== value) return null;
  return <div role="tabpanel" id={'panel-' + value} aria-labelledby={'tab-' + value}>{children}</div>;
}
// <Tabs defaultValue="plans"><TabList><Tab value="plans">Plans</Tab>...</TabList><TabPanel value="plans">…</TabPanel></Tabs>
```

Extras: arrow-key navigation (roving tabindex), controlled + uncontrolled modes, and a lazy-mounted panel.

> 🔁 **Follow-up questions**
>
> **Q: Implement arrow key navigation.**
> On keydown in the tablist, find the current tab's index, and on ArrowRight or ArrowLeft move to the next or previous tab with wrap-around, focusing it and, for automatic activation, selecting it. Home and End jump to the first and last tab.
>
> **Q: How do you support both controlled and uncontrolled usage?**
> Accept optional `value` and `onValueChange` props. If `value` is provided, use it as the source of truth, otherwise keep internal state initialised from `defaultValue`, and always call `onValueChange` on change.

</details>

<details>
<summary>Data table: sort, filter, paginate (with useMemo)</summary>

> 🎤 **Mock answer**
>
> State is the sort key and direction, the filter text, and the current page. The visible rows are derived data, so I compute them during render with `useMemo` instead of storing them in state. I filter first, then sort with `toSorted`, so I don't mutate the props. Then I slice the current page.
>
> Clicking a column header toggles the direction if it's the same column, otherwise sorts that column ascending. Changing the filter resets to page one, otherwise you can end up on an empty page.
>
> For accessibility, the header buttons are real buttons, and the `th` has `aria-sort` reflecting the current state.
>
> Then the scale discussion: for large data, sorting, filtering and pagination should move to the server. I'd put sort, filter and page into the URL so views are shareable and the back button works. And for complex tables I'd use TanStack Table for the headless logic, plus virtualisation for many rows.

```jsx
function ProductTable({ rows }) {
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 10;

  const visible = useMemo(() => {
    const f = filter.toLowerCase();
    const filtered = rows.filter(r => r.name.toLowerCase().includes(f));
    return filtered.toSorted((a, b) => {
      const cmp = a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, filter, sort]);

  const pageRows = visible.slice(page * PAGE, page * PAGE + PAGE);
  const toggle = key => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return (
    <>
      <input aria-label="Filter" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} />
      <table>
        <thead><tr>
          {['name', 'price'].map(k => (
            <th key={k} aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <button onClick={() => toggle(k)}>{k}</button>
            </th>
          ))}
        </tr></thead>
        <tbody>{pageRows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.price}</td></tr>)}</tbody>
      </table>
      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
      <button disabled={(page + 1) * PAGE >= visible.length} onClick={() => setPage(p => p + 1)}>Next</button>
    </>
  );
}
```

Senior extras: put sort/filter/page in the **URL** (shareable, back button works), use server-side pagination for big data, and TanStack Table for headless logic.

> 🔁 **Follow-up questions**
>
> **Q: How would you make the table work with 100,000 rows?**
> Move sorting, filtering and pagination to the server, and if the UI must scroll through many rows, virtualise them. Also debounce the filter input.
>
> **Q: Why derive visible rows instead of storing them in state?**
> Storing derived data creates two sources of truth that can get out of sync. Computing it from the source data and the filter and sort state during render is always correct, and `useMemo` keeps it cheap.

</details>

<details>
<summary>useFetch / useAsync hook with status, abort and refetch</summary>

> 🎤 **Mock answer**
>
> The hook takes a URL and returns status, data, error and a refetch function. I model status as a single field, idle, loading, success or error, to avoid impossible combinations.
>
> The effect runs when the URL changes. It creates an AbortController, sets loading, fetches with the signal, checks `response.ok` because fetch doesn't reject on HTTP errors, and sets success or error. AbortErrors are ignored, and the cleanup aborts the request, which handles both race conditions and unmounting. For refetch, I keep a counter in state and include it in the dependencies, so incrementing it re-runs the effect.
>
> I'd point out a common pitfall: passing an options object as a dependency causes an infinite loop because it's a new object every render. And I'd finish by saying this is a good exercise, but in production I'd use TanStack Query or RTK Query, because caching, deduplication, retries and background refresh are hard to get right.

```jsx
function useFetch(url, options) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    setState(s => ({ ...s, status: 'loading', error: null }));
    fetch(url, { ...options, signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(data => setState({ status: 'success', data, error: null }))
      .catch(error => { if (error.name !== 'AbortError') setState({ status: 'error', data: null, error }); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, nonce]);   // options intentionally excluded: callers would pass a new object each render

  return { ...state, refetch: () => setNonce(n => n + 1) };
}
```

Say explicitly: "This is fine for an interview, but in production I'd use TanStack Query or RTK Query for caching, dedupe, retries and stale-while-revalidate."

> 🔁 **Follow-up questions**
>
> **Q: Why is options not in the dependency array?**
> Callers usually pass a new object literal every render, which would re-run the effect in an infinite loop. Better designs accept primitive dependencies, a stable key, or memoised options.
>
> **Q: What does TanStack Query give you that this hook doesn't?**
> A shared cache across components, request deduplication, stale-while-revalidate, retries, refetch on window focus, pagination helpers, mutations with invalidation, and devtools.

</details>

<details>
<summary>Multi-step form (checkout) with validation</summary>

> 🎤 **Mock answer**
>
> I'd keep a single form data object for all steps, plus the current step and an errors object. Keeping one source of truth means going back doesn't lose data.
>
> Each step has its own validation. Clicking Next validates the current step's fields, and only advances if there are no errors. Errors are shown next to fields, connected with `aria-describedby`, and the input gets `aria-invalid`. On the last step, submit sets a submitting flag, disables the button to prevent double orders, calls the API, and shows a form-level error if it fails, without clearing the user's data.
>
> I'd also show progress with an ordered list and `aria-current="step"`, and move focus to the first invalid field or the new step's heading.
>
> In production, based on checkout work at Bell, I'd use React Hook Form with a Zod schema that can be shared with the backend, save a draft to sessionStorage so a refresh doesn't lose progress, and use an idempotency key on the order submission.

Key design: a single source of truth for form data; per-step validation; Next disabled until valid; going back keeps data; on submit, prevent double-submit and handle server errors per field.

```jsx
const steps = ['Plan', 'Details', 'Review'];

function Checkout() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ plan: '', name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (step === 0 && !data.plan) e.plan = 'Choose a plan';
    if (step === 1) {
      if (!data.name) e.name = 'Name is required';
      if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'Enter a valid email';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate() && setStep(s => s + 1);
  const update = field => e => setData(d => ({ ...d, [field]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try { await placeOrder(data); /* navigate to confirmation */ }
    catch (err) { setErrors({ form: 'Order failed, please try again.' }); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} noValidate>
      <ol aria-label="Progress">{steps.map((s, i) => <li key={s} aria-current={i === step ? 'step' : undefined}>{s}</li>)}</ol>
      {step === 1 && (
        <>
          <label htmlFor="name">Name</label>
          <input id="name" value={data.name} onChange={update('name')}
                 aria-invalid={!!errors.name} aria-describedby="name-err" />
          {errors.name && <p id="name-err" role="alert">{errors.name}</p>}
          {/* email similar */}
        </>
      )}
      {errors.form && <p role="alert">{errors.form}</p>}
      {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)}>Back</button>}
      {step < steps.length - 1
        ? <button type="button" onClick={next}>Next</button>
        : <button type="submit" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'}</button>}
    </form>
  );
}
```

Production: React Hook Form + Zod (schema shared with the backend), focus the first invalid field, persist the draft in sessionStorage, and React 19 `useActionState` for server actions.

> 🔁 **Follow-up questions**
>
> **Q: How would you handle a server validation error for a specific field?**
> Map the server's error response to field errors, navigate to the step containing that field, show the message next to it, and move focus to it.
>
> **Q: How would you persist progress if the user refreshes?**
> Save the form data, excluding sensitive fields like card numbers, to sessionStorage on change, debounced, restore it on load, and clear it after a successful submission.
>
> **Q: How would you structure the validation?**
> One Zod schema per step, composed into a full schema for the final submit, and ideally shared with the backend so both sides validate the same rules.

</details>

<details>
<summary>Other components to practise (no solution: do them timed)</summary>

> 🎤 **Mock answer**
>
> For any of these, I use the same approach in the interview. First I clarify requirements and edge cases out loud. Then I sketch the state model, deciding what's actual state and what's derived. For example, in tic-tac-toe the winner is derived from the board and shouldn't be stored separately.
>
> Then I build the simplest working version, and narrate as I go: why I'm using a ref for a timer, why I'm cleaning up an interval, why a value is derived. After it works, I go back over accessibility (keyboard, roles, live regions for toasts), edge cases like rapid clicks and unmounting, and reduced motion for carousels.
>
> I finish by saying what I'd add with more time: tests with React Testing Library, error states, and how the component would fit into a design system. The interviewer is grading the process and communication as much as the final code.

1. **Star rating** (hover preview, keyboard, radio-group semantics).
2. **Accordion** (one/many open, `aria-expanded`, `<details>`?).
3. **Countdown timer / stopwatch** (`useRef` for interval, cleanup, pause/resume, drift correction using `Date.now()`).
4. **Toast notification system** (context + portal + auto-dismiss + `aria-live="polite"`).
5. **Nested comments / file tree** (recursive component, expand/collapse).
6. **Traffic light** (state machine with timers).
7. **Progress bars with a concurrency limit** (only 3 filling at a time).
8. **Kanban drag and drop** (HTML5 DnD or pointer events, keyboard alternative).
9. **Image carousel** (autoplay pause on hover/focus, `prefers-reduced-motion`).
10. **Tic-tac-toe / memory game** (state modelling, derived winner).
11. **Plan comparison selector** (Bell-flavoured: pick a phone + plan + add-ons, live price total, derived state).

> 🔁 **Follow-up questions**
>
> **Q: What do interviewers usually look for in these exercises?**
> A clear state model, working code early, handling edge cases like cleanup on unmount and rapid clicks, accessibility, and clear communication of trade-offs, more than a perfect final result.
>
> **Q: What do you do if you get stuck?**
> Say what I'm thinking, simplify the problem, get a basic version working, and ask a clarifying question if needed. Interviewers reward visible reasoning and collaboration.

</details>
