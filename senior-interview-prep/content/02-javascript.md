# JavaScript Deep Dive

> Senior interviews don't ask "what is a closure?". They ask *why your code has a stale value* or *what this prints*. Know the **mechanism** behind each answer.

## Scope, Hoisting & Closures

<details>
<summary>What is a closure? Give a real use case.</summary>

> 🎤 **Mock answer**
>
> A closure is a function that remembers the variables from the scope where it was created, even after that outer function has finished running. So if I write a `createCounter` function that declares `let count = 0` and returns an `increment` function, that inner function keeps access to `count`. Nobody outside can touch it, which gives you private state.
>
> In day-to-day front-end work closures are everywhere. A debounce utility keeps its timer id in a closure. Memoization keeps its cache in one. And every React hook relies on them: an event handler closes over the props and state of the render that created it.
>
> That's also the most common closure bug I see: stale closures. If you start a `setInterval` inside a `useEffect` with an empty dependency array, the callback sees the state from the first render forever. I fix that with a functional update like `setCount(c => c + 1)`, a ref, or the correct dependencies.

A closure is a function bundled with references to the variables of the scope where it was **created**. It keeps access to those variables after the outer function has returned.

```js
function createCounter() {
  let count = 0;                 // private state
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const c = createCounter();
c.inc(); c.get(); // 1. `count` is not accessible from outside
```

**Real uses:** data privacy/encapsulation, factories, `debounce`/`throttle` (the timer id lives in a closure), memoization caches, partial application, and **every React hook**: event handlers close over the props/state of the render that created them.

**Pitfall: stale closures in React.** A `setInterval` created in `useEffect(..., [])` sees the `count` from the first render forever. Fix it with a functional update `setCount(c => c + 1)`, a ref, or correct dependencies.

> 🔁 **Follow-up questions**
>
> **Q: Can closures cause memory leaks?**
> Yes. A closure keeps the variables it references alive, so if a long-lived callback, like an event listener or a global cache, closes over a large object, that object can't be garbage collected. The fix is removing listeners when they're no longer needed and not capturing more than necessary.
>
> **Q: How would you create a private variable without classes?**
> With a closure, like a factory function that declares a variable and returns functions that read or change it. The variable is only reachable through those functions. Today classes also have truly private `#fields`.
>
> **Q: Explain a stale closure with useEffect and setInterval, and three ways to fix it.**
> With an empty dependency array, the interval callback closes over the state from the first render, so it always sees the initial value. Fixes: use the functional updater `setCount(c => c + 1)`; store the latest value in a ref; or include the value in the dependency array, which recreates the interval when it changes.

</details>

<details>
<summary>var vs let vs const, hoisting and the Temporal Dead Zone</summary>

> 🎤 **Mock answer**
>
> `var` is function-scoped, `let` and `const` are block-scoped. All three are hoisted, but differently. `var` is initialised to `undefined`, so reading it before the declaration gives you `undefined`. `let` and `const` are hoisted but left uninitialised, and that period before the declaration is the Temporal Dead Zone, so accessing them there throws a ReferenceError, which is actually safer.
>
> `const` means the binding can't be reassigned. It doesn't make objects immutable: I can still push into a `const` array.
>
> My default is `const` everywhere, `let` only when I genuinely reassign, like a loop counter, and I never use `var` in modern code. The block scoping also fixes the classic loop-with-setTimeout bug.

| | Scope | Hoisted? | Re-declare | Re-assign |
|---|---|---|---|---|
| `var` | function | yes, initialised to `undefined` | yes | yes |
| `let` | block | yes, but **uninitialised (TDZ)** | no | yes |
| `const` | block | yes, but **uninitialised (TDZ)** | no | no (the *binding* is constant; objects are still mutable) |

```js
console.log(a); // undefined (var hoisted)
console.log(b); // ReferenceError: Cannot access 'b' before initialization (TDZ)
var a = 1; let b = 2;
```

Function **declarations** are hoisted completely (you can call them before the line). Function **expressions** / arrow functions follow their variable's rules.

> 🔁 **Follow-up questions**
>
> **Q: Is const object immutable? How do you make it immutable?**
> No. Only the binding is constant, so you can still change properties. `Object.freeze` makes it shallowly immutable, and for deep immutability you freeze recursively, or use readonly types in TypeScript, or Immer for safe updates.
>
> **Q: Are function declarations and function expressions hoisted the same way?**
> No. A function declaration is fully hoisted, so you can call it before its line. A function expression or arrow function follows the rules of its variable: with `const` it's in the TDZ, and with `var` it's undefined, so calling it early throws.

</details>

<details>
<summary>Classic: what does this print? for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))</summary>

> 🎤 **Mock answer**
>
> It prints `3, 3, 3`. Because `var` is function-scoped, there's only one `i` shared by every iteration. The timeouts run after the loop has finished, and by then `i` is 3.
>
> If you change it to `let`, it prints `0, 1, 2`, because `let` creates a new binding for each iteration of the loop, so each callback closes over its own copy. Before ES6, people solved it with an IIFE that captured `i` as a parameter, or by passing `i` as the third argument to `setTimeout`.
>
> The underlying lesson is about closures and the event loop: callbacks capture variables, not values, and they run later.

Prints `3 3 3`. `var` is function-scoped, so there's **one** `i` shared by all callbacks, and they run after the loop ends.

With `let`, each iteration gets a **new binding**, so it prints `0 1 2`. The pre-ES6 fix was an IIFE: `(j => setTimeout(() => console.log(j)))(i)`.

> 🔁 **Follow-up questions**
>
> **Q: How would you fix it without using let?**
> Wrap the body in an IIFE that receives `i` as a parameter, so each callback closes over its own copy, or pass `i` as the third argument to `setTimeout`, which forwards it to the callback.
>
> **Q: What if the delay is i * 1000?**
> With `var` it still prints 3 three times, just one second apart, because the delay is evaluated at loop time but the logged value is read when the callback runs.

</details>

## `this`, call/apply/bind

<details>
<summary>How is `this` determined? (the 5 rules)</summary>

> 🎤 **Mock answer**
>
> `this` isn't decided where a function is written. It's decided by how the function is called. There are a few rules in order of priority. If it's called with `new`, `this` is the newly created object. If it's called with `call`, `apply` or `bind`, `this` is whatever you passed explicitly. If it's called as a method, like `user.getName()`, `this` is the object to the left of the dot. Otherwise it's the default binding: `undefined` in strict mode and modules, or the global object in sloppy mode.
>
> Arrow functions are the exception: they don't have their own `this` at all. They take it lexically from the surrounding scope, and `bind` can't change that.
>
> The classic bug is passing a method as a callback, like `setTimeout(user.getName)`, which loses the implicit binding. You fix it with an arrow function or `bind`. In React with function components this mostly disappears, but it's still important in class components and plain JS.

In order of precedence:

1. **`new`**: `this` is the new object.
2. **Explicit**: `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)`.
3. **Implicit**: `obj.fn()` makes `this === obj` (whatever is left of the dot *at call time*).
4. **Default**: plain `fn()` gives `undefined` in strict mode / modules, or `globalThis` in sloppy mode.
5. **Arrow functions** have no own `this`. They use `this` **lexically** from the enclosing scope, and `call`/`bind` can't change it.

```js
const user = {
  name: 'Ana',
  regular() { return this.name; },
  arrow: () => this?.name,      // lexical: module scope, so undefined
  later() { setTimeout(() => console.log(this.name)); }, // arrow keeps `this`, so 'Ana'
};
const f = user.regular;
f();            // undefined: lost implicit binding (classic bug passing methods as callbacks)
```

> 🔁 **Follow-up questions**
>
> **Q: What is `this` inside a class method passed as an onClick in a React class component?**
> It's undefined, because the method is called without its object. That's why class components bound methods in the constructor or used arrow function class fields, which capture `this` lexically.
>
> **Q: What does `this` refer to inside an arrow function defined as an object property?**
> Not the object. The arrow takes `this` from the surrounding scope where the object literal is defined, usually the module, so it's undefined. Use a regular method syntax if you need the object.
>
> **Q: What happens with `this` in event listeners added with addEventListener?**
> With a regular function, `this` is the element the listener is attached to, the same as `event.currentTarget`. With an arrow function, it's the outer `this`.

</details>

<details>
<summary>Difference between call, apply and bind?</summary>

> 🎤 **Mock answer**
>
> All three let you set `this` explicitly. `call` and `apply` invoke the function immediately. The only difference is how you pass arguments: `call` takes them one by one, `apply` takes an array. A memory trick is "A for array".
>
> `bind` doesn't call the function. It returns a new function with `this` permanently set, and optionally some arguments pre-filled, which is partial application. That's useful for callbacks and event handlers.
>
> One subtle point: a bound function's `this` can't be overridden by another `bind` or `call`, but if you call it with `new`, the `new` binding wins. With spread syntax, `apply` is used much less these days.

- `fn.call(thisArg, a, b)`: invoke now, args listed.
- `fn.apply(thisArg, [a, b])`: invoke now, args as an array.
- `fn.bind(thisArg, a)`: returns a **new function** with `this` (and optional leading args) permanently bound. Calling `new` on a bound function ignores the bound `this`.

> 🔁 **Follow-up questions**
>
> **Q: Can you rebind a bound function?**
> No. Calling `bind` again on a bound function doesn't change `this`; the first binding wins. The only override is calling it with `new`.
>
> **Q: When would you use apply today?**
> Rarely, since spread syntax covers most cases, like `Math.max(...numbers)`. It's mostly seen in older code or generic utility functions forwarding `arguments`.

</details>

## Prototypes & Classes

<details>
<summary>Explain prototypal inheritance. How do classes relate?</summary>

> 🎤 **Mock answer**
>
> In JavaScript, objects inherit directly from other objects. Every object has a hidden link to its prototype. When you access a property, the engine looks on the object first, and if it's not there it walks up the prototype chain until it finds it or reaches `null`. That's how arrays get `map` and `filter`: they live on `Array.prototype`.
>
> Classes are mostly syntax sugar over this. Methods defined in a class go onto `ClassName.prototype`, and `extends` wires up the chain. There are real differences: class bodies are always in strict mode, classes aren't usable before their declaration, they must be called with `new`, and they support private `#fields`.
>
> When you use `new`, the engine creates an object linked to the constructor's prototype, runs the constructor with `this` set to that object, and returns it. In React work I rarely write classes, but understanding the chain helps with things like debugging `instanceof` failures or why methods are shared and not copied per instance.

Every object has an internal `[[Prototype]]` link (`Object.getPrototypeOf(obj)`). A property lookup walks up the **prototype chain** until it finds the property or reaches `null`.

`class` is mostly **syntax sugar** over constructor functions + prototypes: methods go on `Class.prototype`, and `extends` sets up the chain. Real differences: classes are always strict mode, not hoisted (TDZ), must be called with `new`, and support `#private` fields and `static` blocks.

```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return this.name + ' makes a sound'; };
const dog = new Animal('Rex');
dog.speak();                        // found on Animal.prototype
Object.getPrototypeOf(dog) === Animal.prototype; // true
```

What `new` does: 1) create an object linked to `Ctor.prototype`, 2) run the constructor with `this` = that object, 3) return it (unless the constructor returns an object).

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between __proto__ and prototype?**
> `prototype` is a property on constructor functions; it's the object that instances will be linked to. `__proto__` is the legacy accessor on an instance pointing to its actual prototype. The modern way to read it is `Object.getPrototypeOf`.
>
> **Q: How do you create an object with no prototype, and why?**
> `Object.create(null)`. It has no inherited keys like `toString` or `constructor`, so it's a safe dictionary. Though today I'd normally just use a Map.
>
> **Q: Composition or inheritance?**
> I prefer composition. Deep inheritance hierarchies are rigid and hard to change. In React this is the official guidance too: compose components with children and props, and share logic with hooks.

</details>

## The Event Loop & Async

<details>
<summary>Explain the event loop, including microtasks vs macrotasks.</summary>

> 🎤 **Mock answer**
>
> JavaScript runs on a single thread with one call stack. Anything asynchronous, like timers, network requests or user events, is handled by the browser, which queues a callback when it's ready.
>
> The event loop runs one task, for example the main script or a click handler, until the call stack is empty. Then it drains the entire microtask queue: promise callbacks, `await` continuations, `queueMicrotask`. Only after that does the browser get a chance to render, and then it picks the next macrotask, like a `setTimeout` callback.
>
> So in an output-order question, synchronous logs come first, then promise callbacks, then timeouts, even a `setTimeout` of zero.
>
> The practical reason this matters for a senior front-end developer is performance. A long synchronous task blocks rendering and input, which directly hurts INP. At Bell, when we had heavy work on interactions, the fixes were breaking the work into chunks, yielding to the main thread, using `useTransition` in React, or moving computation to a Web Worker.

JS runs on a **single thread** with one **call stack**. Async work (timers, network, I/O) is handled by the host (browser/Node), which queues callbacks.

Loop (browser):
1. Run the current script / task until the call stack is empty.
2. **Drain the entire microtask queue**: Promise reactions (`.then`, `await` continuations), `queueMicrotask`, `MutationObserver`. Microtasks added during draining also run now.
3. If it's time, **render**: `requestAnimationFrame` callbacks, style, layout, paint.
4. Take the **next macrotask** (setTimeout/setInterval, I/O, UI events, `MessageChannel`) and repeat.

```js
console.log('1');
setTimeout(() => console.log('2'));
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));
(async () => { console.log('5'); await null; console.log('6'); })();
console.log('7');
// 1 5 7 3 4 6 2
```

**Why it matters:** a long synchronous task (> 50 ms) blocks rendering and input, which hurts **INP**. Break work up (`scheduler.yield()`, `setTimeout`, chunking), move it to a **Web Worker**, or use `useTransition` in React. An infinite microtask loop freezes the page even though nothing is "synchronous".

Node extras: `process.nextTick` runs before other microtasks; phases are timers → poll → check (`setImmediate`).

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between setTimeout(fn, 0) and queueMicrotask(fn)?**
> `queueMicrotask` runs right after the current task, before rendering and before any timers. `setTimeout` with zero schedules a new macrotask, which runs after microtasks and possibly after a render, and browsers clamp nested timeouts to at least 4 ms.
>
> **Q: Where does requestAnimationFrame fit?**
> It runs right before the browser paints the next frame, after microtasks. It's the right place for visual updates and animations, because it syncs with the display refresh rate.
>
> **Q: Can a promise chain freeze the page?**
> Yes. Microtasks run until the queue is empty, so an infinite chain of microtasks never lets the browser render or handle input, even though each step is "async".

</details>

<details>
<summary>Promises: states, chaining, error handling, and the combinators</summary>

> 🎤 **Mock answer**
>
> A promise represents a future value. It starts pending and settles exactly once, either fulfilled or rejected. `.then` always returns a new promise, which is what makes chaining work: returning a value fulfils the next promise, throwing rejects it, and returning another promise makes the chain wait for it.
>
> For error handling I put a `.catch` at the end of the chain, or use try/catch with async/await. The common mistake is forgetting to return inside a `.then`, which breaks the chain silently.
>
> For combining promises: `Promise.all` waits for everything but fails fast on the first rejection, which is good when all results are required. `allSettled` gives you every outcome, which is better for a dashboard where some widgets can fail independently. `race` settles with whichever finishes first, which is useful for timeouts. `any` gives the first success. I pick based on whether a partial failure should fail the whole operation.

States: **pending → fulfilled | rejected** (settled once, immutable). `.then` always returns a **new promise**, which enables chaining. Returning a value fulfils it, throwing rejects it, and returning a promise adopts its state.

| Combinator | Resolves when | Rejects when |
|---|---|---|
| `Promise.all` | all fulfil (array of values, in order) | **first** rejection (fail-fast) |
| `Promise.allSettled` | all settle (`{status, value/reason}`) | never |
| `Promise.race` | first to settle (either way) | first to settle with rejection |
| `Promise.any` | first to fulfil | all reject → `AggregateError` |

Also: `Promise.withResolvers()` (ES2024) returns `{ promise, resolve, reject }`.

Pitfalls: forgetting to `return` inside `.then` breaks the chain; an unhandled rejection triggers an `unhandledrejection` event; `async` functions in `forEach` are **not awaited** (use `for...of` or `Promise.all(arr.map(...))`).

> 🔁 **Follow-up questions**
>
> **Q: What happens if you throw inside a .then?**
> The promise returned by that `.then` is rejected with the error, and it skips forward to the next `.catch` or rejection handler in the chain.
>
> **Q: What's the difference between .catch at the end and the second argument of .then?**
> The second argument of `.then` only handles rejections from earlier in the chain, not errors thrown in the success handler of that same `.then`. A `.catch` at the end catches both.
>
> **Q: How do you add a timeout to a promise?**
> Race it against a promise that rejects after a delay with `Promise.race`. For fetch specifically, the better option is `AbortSignal.timeout(ms)`, because it actually cancels the request instead of just ignoring it.

</details>

<details>
<summary>async/await: sequential vs parallel, and error handling</summary>

> 🎤 **Mock answer**
>
> `async/await` is syntax over promises that makes async code read top to bottom. The trap I look for in code review is accidental sequential awaits. If you `await getUser()` and then `await getOrders()` and they're independent, you pay for both latencies one after another. Starting them together with `Promise.all` means you only wait for the slowest one.
>
> For errors I use try/catch. Two details matter. First, `fetch` doesn't reject on a 404 or 500, only on network failure, so I always check `response.ok` and throw. Second, if I'm cancelling requests with an AbortController, I check for `AbortError` and ignore it, because that's intentional.
>
> One more gotcha: `forEach` doesn't wait for async callbacks. If I need to process items sequentially I use `for...of` with `await`, and in parallel I use `Promise.all` with `map`.

```js
// ❌ Sequential: total = a + b
const user = await getUser();
const orders = await getOrders();

// ✅ Parallel when independent: total = max(a, b)
const [user2, orders2] = await Promise.all([getUser(), getOrders()]);

// Error handling
try {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('HTTP ' + res.status); // fetch does NOT reject on 404/500!
  return await res.json();
} catch (err) {
  if (err.name === 'AbortError') return;    // cancelled on purpose
  throw err;
}
```

`await` pauses only the current async function; the rest of the thread keeps running. `return await` matters inside `try/catch`, because without the `await` the catch won't see the rejection.

> 🔁 **Follow-up questions**
>
> **Q: What does an async function return if you return a plain value?**
> It always returns a promise, resolved with that value. And if the function throws, the promise is rejected.
>
> **Q: How would you run requests in parallel but tolerate failures?**
> `Promise.allSettled`, then handle the fulfilled and rejected results separately, for example showing the widgets that loaded and an error state for the ones that didn't.
>
> **Q: Is top-level await allowed?**
> Yes, in ES modules. But it blocks the evaluation of every module that imports that module, so I use it carefully, mainly for config loading or scripts.

</details>

<details>
<summary>How do you cancel a fetch? Why does that matter in React?</summary>

> 🎤 **Mock answer**
>
> I use an `AbortController`. You create a controller, pass `controller.signal` into `fetch`, and calling `controller.abort()` cancels the request and rejects it with an `AbortError`.
>
> In React this matters a lot, because of race conditions. Take a search box: the user types "ip", then "iphone". If the response for "ip" comes back after the response for "iphone", it overwrites the correct results. So in my `useEffect` I create a controller and return a cleanup that aborts it. Whenever the query changes or the component unmounts, the previous request is cancelled. I also ignore `AbortError` in the catch so it doesn't show an error message.
>
> At Bell we had exactly this with product filtering: fast filter clicks could show stale results. Aborting stale requests fixed it. In production code I usually let TanStack Query or RTK Query handle this, since they pass an abort signal and key results by query.

Use `AbortController`:

```js
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/search?q=' + q, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort();   // cleanup on q change / unmount
}, [q]);
```

It prevents **race conditions**: response for "ab" arriving after "abc" and overwriting it. It also avoids wasted bandwidth and setting state after unmount. `AbortSignal.timeout(5000)` gives timeouts and `AbortSignal.any([...])` combines signals.

> 🔁 **Follow-up questions**
>
> **Q: Does aborting stop the server from processing the request?**
> Not necessarily. Aborting closes the connection on the client, but the server may already be processing it. That's why non-idempotent operations like orders need server-side protection, such as idempotency keys.
>
> **Q: How do you cancel with axios?**
> Modern axios also accepts an AbortController `signal`. The old CancelToken API is deprecated.
>
> **Q: How do you combine a timeout with user cancellation?**
> `AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])` creates a signal that aborts on whichever happens first.

</details>

## Types, Equality & Coercion

<details>
<summary>== vs ===, and the falsy values</summary>

> 🎤 **Mock answer**
>
> Triple equals compares value and type with no conversion. Double equals applies type coercion first, so `'1' == 1` is true, and there are confusing cases like `null == 0` being false while `null == undefined` is true.
>
> I use triple equals everywhere, enforced by ESLint. The one idiom I accept is `x == null`, because it neatly checks for both `null` and `undefined`.
>
> For falsy values, there are only a few: `false`, `0`, `-0`, `0n`, empty string, `null`, `undefined` and `NaN`. Everything else is truthy, including empty arrays, empty objects and the string "0". That's why I prefer the nullish coalescing operator `??` for defaults. With `||`, a legitimate value like a quantity of `0` would be replaced by the default.

`===` compares without type conversion. `==` applies the abstract equality algorithm (coercion): `'1' == 1`, `null == undefined` (true), `null == 0` (false), `NaN == NaN` (false).

Falsy: `false, 0, -0, 0n, '', null, undefined, NaN` (and `document.all`). Everything else is truthy, **including `[]`, `{}` and `'0'`**.

Use `===` everywhere. The one common idiom is `x == null` to check null *or* undefined. Use `Object.is` for `NaN`/`-0` edge cases. Use `??` (nullish) instead of `||` when `0` or `''` are valid values: `count ?? 10`.

> 🔁 **Follow-up questions**
>
> **Q: What is Object.is and how does it differ from ===?**
> It's almost the same, but it treats `NaN` as equal to `NaN`, and `+0` and `-0` as different. React uses `Object.is` to compare state and dependencies.
>
> **Q: What does [] == false return, and why?**
> True. Both sides are converted to numbers: the empty array becomes an empty string, then 0, and false becomes 0. It's a good example of why I avoid `==`.

</details>

<details>
<summary>Primitive vs reference types; shallow vs deep copy</summary>

> 🎤 **Mock answer**
>
> Primitives, like strings, numbers and booleans, are immutable and copied by value. Objects, arrays and functions are reference types: when you assign or pass them, you share a reference to the same object, so mutating it through one variable affects every other variable holding it.
>
> A shallow copy, like spread or `Object.assign`, only copies the top level. Nested objects are still shared. For a deep copy I use `structuredClone`, which handles dates, maps, sets and circular references. The old `JSON.parse(JSON.stringify())` trick loses dates, `undefined` and functions.
>
> This matters a lot in React and Redux because they detect changes by reference. If you mutate state in place, the reference doesn't change, so React may not re-render and memoized selectors break. That's one reason Redux Toolkit uses Immer: you write mutating code, and it produces a new immutable object for you.

Primitives (`string, number, bigint, boolean, undefined, null, symbol`) are immutable and copied by value. Objects (including arrays and functions) are passed by *sharing a reference*.

- **Shallow copy:** `{...obj}`, `[...arr]`, `Object.assign`. Nested objects are still shared.
- **Deep copy:** `structuredClone(obj)` handles Dates, Maps, Sets and cycles, but **not functions, DOM nodes or class prototypes**. `JSON.parse(JSON.stringify())` loses `undefined`, functions, Dates (become strings), `Infinity`, and fails on cycles.

React relies on **immutability**: new references signal change (`setState`, `React.memo` and selectors compare by reference).

> 🔁 **Follow-up questions**
>
> **Q: Is JavaScript pass-by-reference?**
> Technically it's always pass-by-value, but for objects the value is a reference. So you can mutate the object inside a function, but reassigning the parameter doesn't affect the caller's variable.
>
> **Q: How do you update a nested object immutably?**
> Spread each level that changes, like copying the user, then copying the address with a new city. For deeper or frequent updates I use Immer, which Redux Toolkit already includes.
>
> **Q: What can't structuredClone copy?**
> Functions, DOM nodes, symbols as values, and class prototypes: class instances come back as plain objects, and getters are lost.

</details>

<details>
<summary>What does typeof return for null, arrays, functions? How do you check types reliably?</summary>

> 🎤 **Mock answer**
>
> `typeof null` returns "object", which is a historical bug. Arrays also return "object", functions return "function", and `NaN` returns "number".
>
> So for reliable checks I use specific tools: `Array.isArray` for arrays, a strict `=== null` check for null, `Number.isNaN` for NaN, and `instanceof` for class instances like `Date`, with the caveat that `instanceof` can fail across iframes. The most generic option is `Object.prototype.toString.call(value)`, which returns things like "[object Date]".
>
> In practice, with TypeScript most of these checks become type guards and narrowing, but at runtime boundaries, like API data, I'd validate with a schema library like Zod rather than hand-written typeof checks.

`typeof null === 'object'` (a historic bug), `typeof [] === 'object'`, `typeof function(){} === 'function'`, `typeof NaN === 'number'`.

Reliable checks: `Array.isArray(x)`, `x === null`, `Number.isNaN(x)`, `x instanceof Date` (fails across iframes/realms), and `Object.prototype.toString.call(x)` returns `'[object Date]'`.

> 🔁 **Follow-up questions**
>
> **Q: How do you check if a value is a plain object?**
> Check it's not null, `typeof` is "object", and `Object.getPrototypeOf(value)` is either `Object.prototype` or null. That excludes arrays, dates and class instances.
>
> **Q: Why can instanceof fail?**
> Each realm, like an iframe, has its own global constructors, so an array from an iframe isn't an instance of the parent page's Array. That's why `Array.isArray` exists.

</details>

## Modern Language Features

<details>
<summary>Map/Set vs Object/Array; WeakMap/WeakRef</summary>

> 🎤 **Mock answer**
>
> I use a `Map` when keys are dynamic, are not strings, or are added and removed frequently. It accepts any key type including objects, keeps insertion order, has a `size` property, and has no risk of colliding with prototype keys like "constructor". A plain object is still great for fixed, known shapes like a config or a DTO.
>
> A `Set` is for unique values. Deduplicating an array is just spreading a new Set, and lookups are O(1), unlike `array.includes`.
>
> `WeakMap` and `WeakSet` hold their keys weakly, so they don't prevent garbage collection. That makes them perfect for attaching metadata or caches to objects or DOM nodes without leaking memory. The trade-off is that they're not iterable. `WeakRef` exists too, but I'd rarely reach for it in application code.

- **Map:** any key type (objects too), insertion order, `.size`, no prototype key collisions, better for frequent add/delete.
- **Set:** unique values; ES2025 adds set methods `union`, `intersection`, `difference`, `isSubsetOf`...
- **WeakMap/WeakSet:** keys must be objects and are held **weakly**, so they don't prevent garbage collection. Not iterable. Use them for caching metadata about DOM nodes/objects without leaks.
- **WeakRef / FinalizationRegistry:** advanced, rarely needed.

> 🔁 **Follow-up questions**
>
> **Q: How do you deduplicate an array of objects by id?**
> Use a Map keyed by id: `[...new Map(items.map(i => [i.id, i])).values()]`. That keeps the last item for each id in O(n).
>
> **Q: Why can't you iterate a WeakMap?**
> Because its entries can disappear at any time when keys are garbage collected, so iteration results would be non-deterministic. That's by design.
>
> **Q: Can you JSON.stringify a Map?**
> Not directly; it becomes an empty object. You convert it first, for example with `Object.fromEntries(map)` or `[...map]`.

</details>

<details>
<summary>ES Modules vs CommonJS</summary>

> 🎤 **Mock answer**
>
> ES Modules use `import` and `export`. Their structure is static, so bundlers can analyse them at build time, and that's what enables tree-shaking. They load asynchronously, support top-level await, and work natively in browsers.
>
> CommonJS uses `require` and `module.exports`. It's synchronous and dynamic, which makes it hard to tree-shake, and it's the legacy Node format.
>
> For front-end work, ESM is the standard. One very practical feature is dynamic `import()`, which returns a promise and is the basis of code splitting. `React.lazy` uses it to load a route only when it's needed. That's one of the techniques I used to improve load times on the Bell site. I also watch for libraries that only ship CommonJS, because they can bloat the bundle.

| ESM (`import/export`) | CJS (`require/module.exports`) |
|---|---|
| Static structure, so tree-shakable | Dynamic, hard to tree-shake |
| Async loading, top-level `await` | Synchronous |
| Live bindings | Copies of exported values |
| Native in browsers (`type="module"`) | Node legacy |

Dynamic `import()` returns a promise. It's the basis of **code splitting** (`React.lazy(() => import('./Page'))`). Mention `"type": "module"`, the `exports` field in package.json, and dual packages.

> 🔁 **Follow-up questions**
>
> **Q: What's a barrel file and why can it hurt?**
> An `index.js` that re-exports everything from a folder. It's convenient, but it can make bundlers pull in or evaluate far more code than needed, and slows down dev servers and tests. I use them carefully, especially in large apps.
>
> **Q: What does "sideEffects": false in package.json do?**
> It tells the bundler that importing a module doesn't run any code with side effects, so unused exports and modules can be safely removed. If files like CSS imports do have side effects, you list them explicitly.
>
> **Q: What are live bindings?**
> With ESM, an imported variable reflects the current value of the exported variable. With CommonJS, you get a copy at the time of require.

</details>

<details>
<summary>Generators and iterators: where are they actually used?</summary>

> 🎤 **Mock answer**
>
> A generator function, written with `function*`, returns an iterator. Each `yield` pauses execution and produces a value, and the function resumes when you call `next()`. That makes generators good for lazy or infinite sequences, where you only compute values as they're needed.
>
> Where I've actually seen them: custom iterables using `Symbol.iterator`; async generators with `for await...of`, which are a really clean way to consume paginated APIs page by page; and redux-saga, which is built entirely on generators for managing side effects. There are also new iterator helpers in the language that allow lazy `map` and `filter` over iterators.
>
> That said, in typical React application code I rarely write generators directly. I'd mention them mainly for pagination streams and legacy saga code.

`function*` returns an iterator; `yield` pauses execution. Uses: lazy/infinite sequences, custom iterables (`[Symbol.iterator]`), paginated API readers with `async function*` + `for await...of`, and redux-saga. ES2025 adds **Iterator helpers** (`iter.map().filter().take()`), which are lazy.

> 🔁 **Follow-up questions**
>
> **Q: How would you consume a paginated API with an async generator?**
> Write an async generator that fetches a page, yields each item, follows the next cursor, and stops when there isn't one. The caller just uses `for await` over it, without knowing about pagination.
>
> **Q: What's the difference between an iterable and an iterator?**
> An iterable has a `Symbol.iterator` method that returns an iterator. An iterator has a `next()` method that returns objects with a `value` and a `done` flag.

</details>

<details>
<summary>Optional chaining, nullish coalescing, logical assignment, other modern syntax you should use</summary>

> 🎤 **Mock answer**
>
> The modern syntax I use daily: optional chaining, like `user?.address?.city`, which short-circuits to undefined instead of throwing. Nullish coalescing `??`, which only falls back on null or undefined, unlike `||`, which also replaces `0` and empty strings. And logical assignment, like `options.retries ??= 3`.
>
> For arrays, I like the non-mutating methods: `toSorted`, `toReversed` and `with`, because they return new arrays, which fits React state perfectly. I don't have to copy before sorting anymore. `at(-1)` gets the last element, and `Object.groupBy` replaces a lot of reduce boilerplate.
>
> Also `structuredClone` for deep copies, `Promise.withResolvers`, and private class fields with `#`. Using these well makes code shorter and removes whole categories of bugs.

`a?.b?.[key]?.()`, `x ?? fallback`, `a ||= b`, `a ??= b`, `arr.at(-1)`, `Object.groupBy(items, i => i.type)`, `arr.toSorted() / toReversed() / with(i, v)` (non-mutating, great for React state), `structuredClone`, `Array.prototype.findLast`, `Promise.withResolvers`, top-level `await`, `#private` class fields.

> 🔁 **Follow-up questions**
>
> **Q: When is optional chaining a code smell?**
> When it's sprinkled everywhere to hide unclear data contracts. If a value should always exist, I'd rather validate at the boundary and fail clearly than silently render undefined deep in the UI.
>
> **Q: Difference between a ||= b and a ??= b?**
> `||=` assigns when `a` is falsy, including 0 and an empty string. `??=` assigns only when `a` is null or undefined.

</details>

## Memory & Performance

<details>
<summary>How does garbage collection work, and what causes memory leaks in front-end apps?</summary>

> 🎤 **Mock answer**
>
> JavaScript engines like V8 use a mark-and-sweep garbage collector. Starting from roots, such as global variables and the current call stack, it marks everything reachable, and anything not reachable is freed. It's generational: new objects are collected frequently and cheaply, and long-lived ones are moved to an old generation that's collected less often.
>
> So a memory leak in a front-end app means something is still reachable that shouldn't be. The most common causes I've seen are event listeners, intervals or subscriptions that aren't cleaned up when a component unmounts, which in React means a missing `useEffect` cleanup. Others are detached DOM nodes still referenced from JavaScript, closures holding large objects, and caches that grow forever.
>
> To debug, I use the Memory panel in Chrome DevTools: take a heap snapshot, perform the action several times, take another, and compare what grew. The "detached elements" view is very useful. For caches, I use an LRU limit or a WeakMap.

V8 uses **mark-and-sweep**: anything reachable from the roots (globals, the stack) is kept. It's generational: a young generation (scavenger, frequent) and an old generation (mark-compact).

Common leaks:
- Event listeners / `setInterval` / subscriptions **not removed on unmount** (missing `useEffect` cleanup).
- Detached DOM nodes still referenced by JS.
- Closures holding big objects; ever-growing caches/maps (use LRU or WeakMap).
- Global variables, observers (`ResizeObserver`, `IntersectionObserver`) not disconnected.

**Debugging:** DevTools Memory → heap snapshots (compare before/after), "Detached elements", allocation timeline.

> 🔁 **Follow-up questions**
>
> **Q: Walk me through finding a leak in a React app.**
> I'd reproduce the action several times, like opening and closing a modal, taking a heap snapshot before and after, and comparing. If retained objects grow, the retainers view shows what's holding them, often a listener or subscription without cleanup, or detached DOM nodes.
>
> **Q: Does React automatically remove event listeners?**
> For listeners declared in JSX, like `onClick`, yes. For anything added manually in an effect, such as `window.addEventListener`, an observer or a subscription, you must remove it in the cleanup.

</details>

<details>
<summary>Debounce vs throttle: when do you use each?</summary>

> 🎤 **Mock answer**
>
> Both limit how often a function runs, but in different ways. Debounce waits until activity stops: the function runs only after there have been, say, 300 milliseconds of no new calls. Throttle guarantees the function runs at most once per interval during continuous activity.
>
> I use debounce for search inputs, autocomplete and autosave, where I care about the final value. At Bell, the address lookup for checking which internet services are available was a perfect case: we only call the API once the user pauses typing.
>
> I use throttle for continuous events like scroll position, resize or mouse move, where I want regular updates but not hundreds per second.
>
> That said, for many scroll use cases there are better tools: `IntersectionObserver` for detecting visibility, like lazy loading or infinite scroll, and `requestAnimationFrame` for visual updates. In React, I make sure the debounced function is stable across renders, otherwise each render creates a new timer.

- **Debounce:** run **after** activity stops for N ms. Use it for search input, autosave and window-resize-end. Example: "fire the serviceability lookup 300 ms after the user stops typing".
- **Throttle:** run **at most once per** N ms during continuous activity. Use it for scroll position, mousemove, drag and analytics on scroll.

For animation-tied work prefer `requestAnimationFrame`. For visibility prefer `IntersectionObserver` over scroll handlers. Implementations are in Coding Challenges.

> 🔁 **Follow-up questions**
>
> **Q: What delay would you choose for a search box?**
> Around 250 to 300 milliseconds. Shorter makes too many requests, longer feels sluggish. I'd confirm with real usage, and combine it with cancellation and caching.
>
> **Q: How do you debounce correctly in a React component?**
> Either debounce the value with a `useDebounce` hook, or create the debounced function once with `useMemo` or a ref, and cancel it on unmount. Creating it inline means a new debounced function every render, which breaks it.
>
> **Q: What's leading versus trailing debounce?**
> Trailing runs after the activity stops, which is the default. Leading runs immediately on the first call and then ignores calls until things are quiet, which is good for preventing double clicks on a button.

</details>

<details>
<summary>What are Web Workers? When would you use one?</summary>

> 🎤 **Mock answer**
>
> Web Workers let you run JavaScript on a background thread, separate from the main thread. They don't have access to the DOM, and they communicate with the page by posting messages. Data is copied, or transferred without copying for things like ArrayBuffers.
>
> I'd use one for CPU-heavy work that would otherwise block the main thread and make the UI unresponsive: parsing a big JSON or CSV file, image processing, building a search index on the client, or complex calculations. Moving that work off the main thread directly helps INP. Libraries like Comlink make the messaging feel like normal async function calls.
>
> It's worth distinguishing Service Workers, which act as a network proxy for caching, offline support and push notifications, and Shared Workers, which can be shared across tabs. The main trade-off with Web Workers is the messaging overhead and added complexity, so I only use them when profiling shows a real long-task problem.

Separate threads with no DOM access, communicating via `postMessage` (structured clone, or **transferable** objects for zero-copy). Use them for CPU-heavy work that would block the main thread: parsing large JSON/CSV, image processing, crypto, search indexes, diffing. Libraries such as Comlink make the API nicer.

**Service Workers** are different: a network proxy for offline/caching/push (PWA). **Shared Workers** are shared across tabs.

> 🔁 **Follow-up questions**
>
> **Q: Can a Web Worker access localStorage or the DOM?**
> No. Workers have no DOM and no localStorage. They do have fetch, IndexedDB, timers and WebSockets.
>
> **Q: What are transferable objects?**
> Objects like ArrayBuffer whose ownership can be transferred to a worker instead of copied, which makes passing large binary data almost free. After transfer, the sender can't use it anymore.
>
> **Q: How do you use a worker in a Vite or webpack project?**
> Create it with `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`. Both bundlers recognise that pattern and bundle the worker file.

</details>

## DOM & Browser

<details>
<summary>Event delegation, bubbling and capturing</summary>

> 🎤 **Mock answer**
>
> When an event happens, it travels in three phases: capturing down from the window to the target, the target phase, then bubbling back up through the ancestors. By default, listeners fire during bubbling.
>
> Event delegation takes advantage of bubbling: instead of attaching a listener to every item in a list, you attach one listener to the parent and use `event.target.closest()` to figure out which item was clicked. It uses less memory and automatically works for items added later.
>
> `stopPropagation` stops the event from travelling further, and `preventDefault` cancels the browser's default action, like a form submission. Note that some events, like `focus` and `blur`, don't bubble, so you use `focusin` and `focusout` instead.
>
> In React this is built in: React uses delegation itself, attaching listeners at the root container, and since React 17 that's the root element rather than the document, which made running multiple React versions on a page safer.

Events go through **capture** (window → target), then the **target**, then **bubble** (target → window). Delegation means attaching one listener on a parent and checking `event.target.closest('[data-id]')`. It uses less memory and works for dynamically added children.

`stopPropagation()` stops further propagation; `preventDefault()` cancels default behaviour (form submit, link navigation). Some events don't bubble (`focus`, `blur`; use `focusin`/`focusout`).

React note: since React 17, React attaches listeners at the **root container**, not `document`.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between target and currentTarget?**
> `target` is the element where the event actually happened, like an icon inside a button. `currentTarget` is the element the listener is attached to.
>
> **Q: When would you use the capture phase?**
> When a parent must see an event before children can stop it, like closing a dropdown on any outside click, or for analytics that must observe every click.
>
> **Q: How do you detect a click outside a component in React?**
> Add a listener on the document for `pointerdown`, and check whether `ref.current.contains(event.target)`. If not, close it. Remove the listener in the cleanup.

</details>

<details>
<summary>What happens when you type a URL and press Enter? (front-end-focused answer)</summary>

> 🎤 **Mock answer**
>
> First the browser resolves the domain through DNS, then opens a TCP connection and does the TLS handshake, or uses QUIC with HTTP/3. Then it sends the HTTP request. Ideally a CDN edge answers from cache. Otherwise the request goes to the origin server, and the time to the first byte is TTFB.
>
> As HTML arrives, the browser parses it and builds the DOM. When it finds CSS, it fetches it and builds the CSSOM, and CSS is render-blocking. A regular script tag blocks parsing, which is why we use `defer` or modules. The DOM and CSSOM combine into the render tree, then layout calculates geometry, paint fills pixels, and compositing puts layers together on the GPU. Then JavaScript runs, and in a framework like Next.js, hydration makes the page interactive.
>
> I like this question because every step has an optimisation: preconnect and DNS prefetch, CDN caching, Brotli compression, critical CSS, deferred scripts, preloading the LCP image, and reducing JavaScript to speed up hydration. That's essentially the checklist I used on the Bell performance work.

1. **DNS** lookup (cached?) → **TCP + TLS** handshake (or QUIC for HTTP/3).
2. HTTP request → maybe a **CDN** edge cache hit → server response (watch **TTFB**).
3. The browser **parses HTML** → builds the **DOM**. It finds CSS (render-blocking) → **CSSOM**. A sync `<script>` blocks parsing (use `defer`/`async`/`type=module`).
4. DOM + CSSOM → **render tree** → **layout** (geometry) → **paint** → **composite** (GPU layers).
5. JS executes → hydration (in SSR frameworks) → the page becomes interactive.

Optimisations at each step: preconnect/dns-prefetch, CDN, compression (Brotli), HTTP/2–3, critical CSS, `defer` scripts, preload the LCP image, and so on.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between async and defer on scripts?**
> Both download without blocking parsing. `async` runs as soon as it downloads, in any order. `defer` runs in document order after parsing finishes. App bundles should use `defer` or `type="module"`, which is deferred by default.
>
> **Q: What does HTTP/2 change for front-end optimisation?**
> It multiplexes many requests over one connection, so old tricks like bundling everything into one file or domain sharding matter less, and granular code splitting becomes more attractive.
>
> **Q: Which of these steps would you look at first on a slow page?**
> TTFB first, because nothing happens before the HTML arrives, then render-blocking resources, then the LCP resource and how late it's discovered, and then JavaScript execution time.

</details>

<details>
<summary>Reflow vs repaint; how do you avoid layout thrashing?</summary>

> 🎤 **Mock answer**
>
> Reflow, also called layout, is when the browser recalculates the size and position of elements. It's expensive because it can cascade through the page. Repaint is redrawing pixels without changing geometry, like a colour change, which is cheaper. Cheapest of all are changes to `transform` and `opacity`, which can be handled by the compositor on the GPU, so those are what I animate.
>
> Layout thrashing happens when code alternates reading layout values, like `offsetHeight` or `getBoundingClientRect`, with writing styles, typically in a loop. Each read after a write forces the browser to recalculate layout synchronously. The fix is to batch: do all the reads first, then all the writes, or schedule writes with `requestAnimationFrame`.
>
> Other tools: CSS `contain` and `content-visibility: auto` let the browser skip work for off-screen content. I'd use the Performance panel to confirm, because forced reflows show up there clearly with a warning.

**Reflow (layout)** recalculates geometry and is expensive. **Repaint** redraws pixels. **Composite-only** changes (`transform`, `opacity`) are cheapest, so animate those.

**Layout thrashing** means alternating DOM reads (`offsetHeight`, `getBoundingClientRect`) with writes in a loop, which forces synchronous layout each time. Fix: batch reads, then writes (or use `requestAnimationFrame`), and use `will-change` sparingly. CSS `contain` and `content-visibility: auto` can skip work for off-screen content.

> 🔁 **Follow-up questions**
>
> **Q: Which CSS properties are cheapest to animate?**
> `transform` and `opacity`, because they can be handled by the compositor without layout or paint. Animating `width`, `height`, `top` or `left` triggers layout every frame.
>
> **Q: What does will-change do and when is it harmful?**
> It hints that an element will animate, so the browser can promote it to its own layer in advance. Overusing it creates too many layers and wastes memory, so I apply it just before an animation and remove it after.

</details>

<details>
<summary>localStorage vs sessionStorage vs cookies vs IndexedDB</summary>

> 🎤 **Mock answer**
>
> Cookies are small, about 4 KB, and they're sent with every request to the server, so they're the right place for session or auth data, especially with the `HttpOnly`, `Secure` and `SameSite` flags, so JavaScript can't read them.
>
> localStorage holds around 5 to 10 MB per origin and persists forever, while sessionStorage is scoped to a single tab and cleared when it closes. Both are synchronous, so they can block the main thread with large data, and both store only strings. Importantly, any script on the page can read them, so I never store auth tokens there, because an XSS bug would leak them.
>
> IndexedDB is asynchronous, can store large amounts of structured data, and is what you'd use for offline-capable apps. The Cache API stores HTTP responses for Service Workers.
>
> So my rule: auth goes in HttpOnly cookies, small user preferences like language go in localStorage, and anything large or offline goes in IndexedDB.

| | Size | Sent to server | Lifetime | Notes |
|---|---|---|---|---|
| Cookie | ~4 KB | every request | configurable | `HttpOnly`, `Secure`, `SameSite`: **use for auth sessions** |
| localStorage | ~5–10 MB | no | permanent | sync API (blocks), strings only, XSS-readable: **never store tokens** |
| sessionStorage | ~5 MB | no | per tab | |
| IndexedDB | large | no | permanent | async, structured data, offline apps |
| Cache API | large | no | permanent | Service Worker responses |

> 🔁 **Follow-up questions**
>
> **Q: How do you sync state across tabs?**
> Listen to the `storage` event, which fires in other tabs when localStorage changes, or use a `BroadcastChannel`. For a cart, that keeps the count consistent across open tabs.
>
> **Q: What happens if localStorage is full or blocked?**
> `setItem` throws a quota error, and in some privacy modes access itself can throw. So I always wrap storage access in try/catch and make the app work without it.

</details>
