# React Deep Dive (React 18 → 19.x)

> Versions to know (as of late 2026): **React 19** (stable since Dec 2024), **19.1/19.2** (`<Activity>`, `useEffectEvent`), and the **React Compiler 1.0** (auto-memoization). Create React App is deprecated, so new apps use **Vite** or a framework (Next.js, React Router v7/Remix). Check the latest minor before your interview.

## Rendering Model

<details>
<summary>What triggers a re-render? What does "render" actually mean?</summary>

> 🎤 **Mock answer**
>
> A component re-renders for four main reasons: its own state changes, its parent re-renders, a context it consumes changes value, or an external store it subscribes to changes. One thing people often get wrong: by default, when a parent re-renders, all its children re-render too, even if their props didn't change, unless they're wrapped in `React.memo`.
>
> It's also important to separate rendering from updating the DOM. Rendering just means React calls the component function to produce a new description of the UI. Then reconciliation compares it with the previous one, and in the commit phase React touches only the DOM nodes that actually changed. After that, effects run.
>
> So a re-render isn't automatically a performance problem. It only becomes one when the render itself is expensive or happens very frequently across a big tree. That's why I profile with the React DevTools Profiler before optimising anything.

A component re-renders when:
1. Its **state** changes (`setState` with a new value; `Object.is` same value is bailed out).
2. Its **parent re-renders**. By default children re-render even if props didn't change.
3. A **context** it consumes changes value.
4. (A hook it uses triggers one, e.g. an external store via `useSyncExternalStore`.)

**Render ≠ DOM update.** "Render" means React calls your component function to get new elements. **Reconciliation** diffs them with the previous tree, and the **commit** phase applies only the actual DOM changes. Then effects run.

Phases: **Render** (pure, can be interrupted/restarted in concurrent mode) → **Commit** (DOM mutations, then `useLayoutEffect`, then paint, then `useEffect`).

> 🔁 **Follow-up questions**
>
> **Q: If a parent re-renders but passes the same props, does the child re-render?**
> Yes, by default. Only if the child is wrapped in `React.memo`, and the props are referentially equal, does React skip it. The React Compiler makes that automatic.
>
> **Q: Does calling setState with the same value cause a re-render?**
> React compares with `Object.is` and bails out if it's the same. It might still call the component once before bailing out, but it won't re-render the children or commit.
>
> **Q: How do you find out why a component re-rendered?**
> The React DevTools Profiler has a setting to record why each component rendered: props changed, state changed, hooks changed, or the parent rendered.

</details>

<details>
<summary>Explain reconciliation, the diffing heuristics and why keys matter</summary>

> 🎤 **Mock answer**
>
> Reconciliation is how React figures out what changed between two renders. A general tree diff is O(n³), so React uses two heuristics to make it O(n).
>
> First, if the element type changes, say a `div` becomes a `section`, or `ComponentA` becomes `ComponentB`, React throws away the whole subtree and rebuilds it, and the state is lost. If the type is the same, it keeps the DOM node or component instance and just updates the props.
>
> Second, for lists, React matches children by their `key`. That's why keys matter. If you use the array index as the key and then insert an item at the top, every item's key shifts, so React reuses the wrong components. Input values and focus end up attached to the wrong rows. So I use stable IDs from the data.
>
> Two practical tricks follow from this. You can deliberately change a key to reset a component, like `key={userId}` on a form. And you should never define a component inside another component, because it becomes a new type every render and remounts each time.

Comparing two arbitrary trees is O(n³), so React uses O(n) heuristics:
1. **Different element type** (`div` → `span`, `ComponentA` → `ComponentB`): tear down the whole subtree, state lost.
2. **Same type**: keep the DOM node/instance, update the changed props, recurse.
3. **Lists** are matched by **`key`**.

**Keys** identify items between renders. Using the **index** as key breaks things when items are inserted/removed/reordered: state (input values, focus) sticks to the *position*, not the item, and work is wasted. Use stable IDs. Use the index only for static lists that never reorder.

**Trick:** change a `key` to **reset** a component's state on purpose: `<ProfileForm key={userId} />`.

**Pitfall:** defining a component *inside* another component creates a new type every render, so it remounts every time and loses state/focus.

> 🔁 **Follow-up questions**
>
> **Q: Why is using Math.random() as a key bad?**
> The key changes every render, so React treats every item as new, unmounting and remounting all of them, losing state and focus, and doing far more DOM work.
>
> **Q: When is the index acceptable as a key?**
> When the list is static, never reordered or filtered, and items have no state. Otherwise use a stable ID from the data.
>
> **Q: How would you reset a component's state when a prop changes?**
> Give it a key based on that prop, like `key={productId}`. When it changes, React mounts a fresh instance. That's cleaner than an effect that resets state.

</details>

<details>
<summary>What is React Fiber?</summary>

> 🎤 **Mock answer**
>
> Fiber is React's reconciliation engine, introduced in React 16. Before Fiber, rendering was one recursive, synchronous pass: once it started, it couldn't be interrupted, so a large update could freeze the page.
>
> Fiber breaks the work into small units. Each component instance becomes a fiber node in a linked tree, and React can process a few units, check whether something more urgent has arrived, like a user typing, and pause, resume or even throw away work in progress. React keeps a current tree and a work-in-progress tree and swaps them when committing.
>
> That's the foundation for everything concurrent in modern React: transitions, Suspense, streaming and selective hydration. As a developer I don't use Fiber directly, but understanding it explains why the render phase must be pure, since it can run more than once, and why things like `useTransition` are possible.

Fiber (React 16+) is the reimplementation of the reconciler. Each component instance is a **fiber node** (a unit of work) in a linked tree. Because work is split into units, React can **pause, prioritise, resume or abandon** rendering. That's the foundation of **concurrent rendering** (transitions, Suspense, time-slicing). React keeps two trees, *current* and *work-in-progress*, and swaps them on commit (double buffering).

> 🔁 **Follow-up questions**
>
> **Q: Why must the render phase be pure?**
> Because in concurrent rendering React may run the render phase several times, pause it, or throw it away before committing. Side effects during render could run multiple times or for UI that never appears.
>
> **Q: What's the difference between the render phase and the commit phase?**
> Render computes what the UI should look like and can be interrupted. Commit applies the changes to the DOM synchronously and runs layout effects, and it can't be interrupted.

</details>

<details>
<summary>Virtual DOM: is it "fast"?</summary>

> 🎤 **Mock answer**
>
> The virtual DOM is a lightweight JavaScript description of what the UI should look like. When state changes, React builds a new one, compares it with the previous one and applies the minimal set of real DOM changes.
>
> But I wouldn't say it's fast in absolute terms. Carefully hand-written DOM updates would always beat it, because diffing is extra work. Its real value is the programming model: I describe the UI for a given state declaratively, and React keeps the DOM in sync efficiently enough that I rarely have to think about it.
>
> It's also fair to mention that other frameworks, like Svelte and Solid, skip the virtual DOM by compiling to direct updates or using fine-grained signals, and they can be faster. React's answer has been better scheduling with concurrent rendering, and now the React Compiler to reduce unnecessary re-renders automatically.

The VDOM is a lightweight JS description of the UI. It's **not inherently faster** than hand-written DOM updates. Its value is a **declarative model**: you describe the UI for a given state, and React computes minimal DOM operations, while staying fast enough. Alternatives such as Svelte and Solid (compile-time, fine-grained signals) skip the VDOM. A good senior answer acknowledges the trade-off.

> 🔁 **Follow-up questions**
>
> **Q: What are signals, and how do they differ?**
> Signals are reactive values that track exactly which parts of the UI read them, so updates go directly to those DOM nodes without re-running components or diffing. Solid, Preact signals, Angular and Vue use variants of this.
>
> **Q: What does the React Compiler change?**
> It automatically memoises components and values at build time, so React skips re-rendering parts that didn't change, which closes much of the performance gap without manual `useMemo` and `memo`.

</details>

<details>
<summary>What does React 18's automatic batching do?</summary>

> 🎤 **Mock answer**
>
> Batching means that when you call several state setters together, React performs one re-render instead of one per setter. Before React 18, that only happened inside React event handlers. If you updated state in a promise callback, a timeout or a native event listener, each `setState` caused its own render.
>
> Since React 18, with the new root API, batching is automatic everywhere. So after an await, setting loading to false and setting the data results in a single render, which is better for performance and avoids intermediate inconsistent states being shown.
>
> If you ever need to opt out, for example to read the DOM right after an update, there's `flushSync`, but that's rare and I'd treat it as a last resort.

Multiple `setState` calls in the same tick are batched into **one** re-render, now **everywhere** (promises, timeouts, native handlers), not only inside React event handlers. Use `flushSync` to opt out (rare, e.g. to measure the DOM immediately after an update).

> 🔁 **Follow-up questions**
>
> **Q: Are updates inside setTimeout batched in React 17?**
> No. In React 17, only updates inside React event handlers were batched. Since React 18 with `createRoot`, all updates are batched automatically.
>
> **Q: When would you use flushSync?**
> Very rarely, for example when you need the DOM updated immediately to measure it or to scroll to a newly added item. It forces a synchronous render, so it hurts performance if overused.

</details>

## Hooks

<details>
<summary>Rules of hooks, and WHY they exist</summary>

> 🎤 **Mock answer**
>
> There are two rules: only call hooks at the top level of a component or custom hook, so never inside conditions, loops or after an early return, and only call them from React function components or other custom hooks.
>
> The reason is how React stores hook state. It doesn't know hooks by name. It keeps an ordered list of hook slots on each component's fiber and matches them purely by call order. On every render, the first `useState` call gets slot one, the second gets slot two, and so on. If a hook is called conditionally, the order shifts on some renders, and a hook ends up reading another hook's state. That leads to very confusing bugs.
>
> The ESLint plugin for hooks enforces this, and I always keep it on as an error. The one exception now is the `use` API in React 19, which can be called conditionally because it's designed differently.

1. Call hooks only at the **top level** (not in loops/conditions/after early returns).
2. Call them only from **React function components or custom hooks**.

**Why:** React stores hook state in an ordered list on the fiber and matches each call **by call order**. A conditional hook shifts the order, so state gets assigned to the wrong hook. Enforced by `eslint-plugin-react-hooks`.

*Exception:* the React 19 `use()` API **can** be called conditionally.

> 🔁 **Follow-up questions**
>
> **Q: How would you conditionally run an effect?**
> Put the condition inside the effect, not around it: always call `useEffect`, and inside it return early if the condition isn't met.
>
> **Q: Can you call hooks inside a regular helper function?**
> Only if that function is itself a custom hook, named starting with `use` and called from a component or another hook. Otherwise it breaks the rules and the lint plugin will flag it.

</details>

<details>
<summary>useState: functional updates, lazy initialisation, object state</summary>

> 🎤 **Mock answer**
>
> State in React is a snapshot per render. If I call `setCount(count + 1)` twice in the same handler, both calls read the same `count`, so it only increases by one. The functional form, `setCount(c => c + 1)`, queues an updater that receives the latest pending value, so calling it twice adds two. I use the functional form whenever the new state depends on the previous one, and it also avoids stale closure problems in effects and intervals.
>
> Lazy initialisation means passing a function to `useState`, like `useState(() => parseExpensiveData())`. It runs only on the first render, instead of recomputing an expensive initial value every render and throwing it away.
>
> For object state, unlike the old class `setState`, the hook doesn't merge. It replaces. So I spread the previous object, or split unrelated values into separate state variables, or use `useReducer` when there are several related fields.

```jsx
const [count, setCount] = useState(0);
setCount(count + 1); setCount(count + 1);   // +1 (both read the same snapshot)
setCount(c => c + 1); setCount(c => c + 1); // +2 (queue of updater functions)

const [rows] = useState(() => expensiveParse(raw)); // lazy init: runs only once

setUser(u => ({ ...u, name: 'Ana' }));       // replace, don't merge (unlike class setState)
```

State is a **snapshot per render**. Reading state right after `setState` gives the old value.

> 🔁 **Follow-up questions**
>
> **Q: Why doesn't console.log show the new state right after setState?**
> Because state is a snapshot for the current render. The setter schedules a re-render, and the new value is only available in the next render.
>
> **Q: When would you use one state object versus several useState calls?**
> Separate state for values that change independently, and an object or `useReducer` for values that always change together, like the fields of one form step.
>
> **Q: What happens if you mutate state directly and call setState with the same object?**
> React sees the same reference, bails out, and the UI doesn't update. You always create a new object or array.

</details>

<details>
<summary>useEffect: what is it for, dependency array, cleanup, common mistakes</summary>

> 🎤 **Mock answer**
>
> `useEffect` is for synchronising a component with something outside React: network requests, subscriptions, timers, browser APIs, or third-party widgets. It runs after the browser paints. The dependency array tells React when to re-run it, and the cleanup function runs before the next run and on unmount, which is where I unsubscribe, clear timers or abort requests.
>
> The biggest senior-level point is knowing when not to use an effect. Derived data should be calculated during render, not copied into state with an effect, because that causes an extra render and sync bugs. Logic that responds to a user action belongs in the event handler. Resetting state when a prop changes is better done with a `key`. Chains of effects that set state and trigger other effects are a code smell.
>
> Common mistakes I look for in code review: missing cleanup, objects or functions in the dependency array that change every render and cause loops, and fetching without handling race conditions. In development, StrictMode runs effects twice to expose missing cleanups, and the right fix is a proper cleanup, not disabling StrictMode.

`useEffect` **synchronises a component with an external system** (network, subscriptions, DOM APIs, timers, analytics). It runs **after paint**.

- No deps: runs after every render. `[]`: after mount (plus cleanup on unmount). `[a, b]`: when `a` or `b` change (`Object.is`).
- **Cleanup** runs before the next effect and on unmount.
- In **StrictMode (dev)**, React mounts → unmounts → mounts again to surface missing cleanups.

**"You might not need an effect"** (very common senior topic):
- ❌ Deriving state: `useEffect(() => setFullName(first + ' ' + last))`. ✅ Compute during render: `const fullName = first + ' ' + last`.
- ❌ Reacting to an event in an effect. ✅ Put the logic in the **event handler**.
- ❌ Resetting state when a prop changes via an effect. ✅ Use `key`.
- ❌ Fetching in effects without race handling. ✅ Use a data library, or handle abort/ignore.
- ❌ Chains of effects setting state that triggers other effects.

**Object/function deps** change every render, which causes infinite loops. Move them inside the effect, memoize them, or depend on primitives.

> 🔁 **Follow-up questions**
>
> **Q: How would you fetch data in an effect correctly?**
> Create an AbortController or an ignore flag in the effect, fetch with the signal, only set state if not cancelled, and abort in the cleanup. Include all inputs in the dependency array. And in production, prefer a data library or framework loaders.
>
> **Q: Why does my effect run twice in development?**
> StrictMode mounts, unmounts and remounts components in development to check that effects clean up correctly. It doesn't happen in production. If running twice causes a problem, the effect needs a proper cleanup.
>
> **Q: How do you avoid an infinite loop with an object dependency?**
> Move the object creation inside the effect, memoise it with `useMemo`, or depend on its primitive fields instead of the object.

</details>

<details>
<summary>useEffect vs useLayoutEffect vs useInsertionEffect</summary>

> 🎤 **Mock answer**
>
> `useEffect` runs after the browser has painted, so it doesn't block the user from seeing the update. That's the right default for almost everything.
>
> `useLayoutEffect` runs synchronously after React has updated the DOM but before the browser paints. I use it when I need to measure the layout and adjust before the user sees anything, for example positioning a tooltip based on the trigger's size, or scrolling to a position. With a normal effect, the user might see a flicker of the wrong position. The cost is that it blocks painting, so heavy work there hurts performance, and it doesn't run on the server.
>
> `useInsertionEffect` runs even earlier, before layout effects, and it's really only for CSS-in-JS libraries that need to inject styles before anything reads layout. In application code I've never needed it.

- `useEffect`: after paint, non-blocking. The default.
- `useLayoutEffect`: after DOM mutation, **before paint**, synchronous. Use it to **measure layout** (tooltip position) and avoid flicker. It blocks paint, so use it sparingly. Warns in SSR.
- `useInsertionEffect`: before layout effects, for CSS-in-JS libraries injecting styles.

> 🔁 **Follow-up questions**
>
> **Q: Give a concrete example where useEffect causes a visible flicker.**
> A tooltip that measures its trigger and then positions itself. With `useEffect`, the browser paints it in the default position first, then moves it. With `useLayoutEffect`, it's positioned before the first paint.
>
> **Q: What happens to useLayoutEffect during server rendering?**
> It doesn't run on the server. For SSR you either use `useEffect` or make sure the measurement only matters on the client.

</details>

<details>
<summary>useRef: two use cases</summary>

> 🎤 **Mock answer**
>
> `useRef` has two main uses. The first is accessing a DOM element: I attach the ref to an element and can call things like `focus()` or measure it. A common example is focusing the first invalid field after form validation.
>
> The second is storing a mutable value that persists across renders but doesn't cause a re-render when it changes. That's perfect for timer IDs, an AbortController, the previous value of a prop, or the latest version of a callback, to avoid stale closures.
>
> The guideline is that I don't read or write refs during render, only in effects and event handlers, because that would make rendering impure. And in React 19, `ref` can be passed as a normal prop to function components, so `forwardRef` is no longer needed, and ref callbacks can return a cleanup function.

1. **DOM access**: `inputRef.current.focus()`.
2. **A mutable value that persists across renders without causing re-renders**: timer IDs, previous values, the latest callback, instance variables, "is mounted", AbortController.

Don't read/write `ref.current` during render (except lazy init), because it makes rendering impure.

React 19: `ref` is a **regular prop** for function components, so `forwardRef` is no longer needed. Ref callbacks can return a **cleanup function**.

> 🔁 **Follow-up questions**
>
> **Q: Why not store the value in a regular variable instead of a ref?**
> A regular variable inside the component is recreated every render, so it's lost. A variable outside the component is shared by every instance. A ref is persistent per instance.
>
> **Q: How do you keep the latest callback in a ref?**
> Assign `callbackRef.current = callback` in an effect or layout effect after each render, then call `callbackRef.current()` inside long-lived listeners. React 19.2's `useEffectEvent` is now the official solution for this.
>
> **Q: What is a callback ref?**
> Passing a function as the `ref` prop. React calls it with the DOM node when it mounts and, in React 19, you can return a cleanup function, which is great for attaching observers to elements.

</details>

<details>
<summary>useMemo, useCallback, React.memo: when do they actually help?</summary>

> 🎤 **Mock answer**
>
> `React.memo` lets a component skip re-rendering when its props are shallowly equal. `useMemo` caches a computed value between renders, and `useCallback` caches a function reference.
>
> They only help in two situations. One is a genuinely expensive calculation, which I confirm by profiling rather than guessing. The other is referential stability: when I pass an object or function to a child wrapped in `React.memo`, or use it as a dependency of another hook. Without stable references, memo is useless because the props change every render.
>
> Outside those cases they add complexity and memory for no benefit, so I don't wrap everything by default. Often better fixes come first: moving state down closer to where it's used, passing components as `children` so they don't re-render, or splitting context.
>
> It's also worth mentioning the React Compiler, which reached 1.0 in 2025. It memoizes automatically at build time, so in codebases that adopt it, most manual `useMemo` and `useCallback` calls become unnecessary, as long as the code follows the rules of React.

- `React.memo(Component)`: skip re-rendering if props are shallow-equal.
- `useMemo(() => compute(a), [a])`: cache a **value** between renders.
- `useCallback(fn, [deps])`: cache a **function reference** (= `useMemo(() => fn)`).

They help only when:
1. A computation is **measurably expensive** (profile it: > ~1 ms).
2. You pass a value/function to a **`React.memo` child**, or it's a **dependency of another hook**, so referential stability matters.

They're **wasted** when the child isn't memoized, deps change every render, or the computation is trivial. They also add memory and complexity.

**Better first fixes:** move state down (colocation), lift content up (`children` as props), split context.

**React Compiler (1.0, 2025)** auto-memoizes at build time, so manual `useMemo/useCallback/memo` becomes mostly unnecessary in compiled codebases. Know it exists, that it requires following the Rules of React, and that you can adopt it incrementally.

> 🔁 **Follow-up questions**
>
> **Q: Does useMemo guarantee the value won't be recomputed?**
> No. React treats it as a performance hint and may discard the cache. Code must still be correct if it recomputes.
>
> **Q: Why would React.memo not work even though you wrapped the child?**
> Usually because a prop is a new object, array or function created inline every render, so shallow comparison fails. Children passed as JSX are also new elements each render.
>
> **Q: When would you not use the React Compiler?**
> When the codebase breaks the rules of React, like mutating props or reading refs during render, since the compiler's assumptions would be wrong. I'd adopt it incrementally, starting with the lint rules.

</details>

<details>
<summary>useReducer: when is it better than useState?</summary>

> 🎤 **Mock answer**
>
> I reach for `useReducer` when state has several related values that change together, or when the next state depends on the previous one in non-trivial ways. A checkout flow is a good example: the current step, form data, validation errors and submission status all interact. Putting every transition in a reducer makes the logic explicit and easy to unit test, since the reducer is just a pure function.
>
> Other benefits: event handlers become simple, they just dispatch an action describing what happened, and `dispatch` is a stable function, so I can pass it down without `useCallback`.
>
> For a single boolean or input value, `useState` is simpler and clearer. And when state needs to be shared widely, a reducer plus context is a lightweight option, but for complex global state I'd move to Redux Toolkit or Zustand.

When state has **multiple sub-values that change together**, the next state depends on the previous one in complex ways, or you want transitions **testable as a pure function** (e.g. a checkout step machine). `dispatch` is stable, so you can pass it down without `useCallback`. Combined with Context it gives a mini-Redux.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'added': return { ...state, items: [...state.items, action.item] };
    case 'removed': return { ...state, items: state.items.filter(i => i.id !== action.id) };
    default: throw new Error('Unknown action ' + action.type);
  }
}
```

> 🔁 **Follow-up questions**
>
> **Q: Where do side effects go when using a reducer?**
> Not in the reducer, which must be pure. Side effects go in event handlers or effects that dispatch actions with the results.
>
> **Q: How do you test a reducer?**
> Call it directly with a state and an action, and assert on the returned state. No rendering needed, which is one of its biggest advantages.

</details>

<details>
<summary>useContext: performance problems and fixes</summary>

> 🎤 **Mock answer**
>
> Context is great for passing values deep into the tree without prop drilling. Things like the theme, the current locale, and at Bell the language was a great example, plus the authenticated user and feature flags.
>
> The performance issue is that every component consuming a context re-renders whenever the provider's value changes, and the change is detected by reference. A very common mistake is passing an inline object as the value, which is new on every render, so every consumer re-renders every time the provider renders. The fix is to memoize the value.
>
> The second issue is putting everything in one big context, so any change re-renders everyone. I split contexts by domain, or separate state from dispatch, so components that only dispatch don't re-render.
>
> And I see context as dependency injection, not a state manager. For frequently changing shared state, like a cart, I'd use a store with selector-based subscriptions, like Redux Toolkit or Zustand, so components only re-render when their slice changes.

Every consumer re-renders when the Provider's `value` changes (by reference). Problems:
- `value={{ user, setUser }}` creates a new object every render, so all consumers re-render. Fix: `useMemo` the value.
- One big context holding everything re-renders everyone on any change. Fix: **split contexts** (state vs dispatch, or by domain).
- Context isn't a state manager. It's **dependency injection**. For high-frequency updates use Zustand/Redux (selector-based subscriptions) or `useSyncExternalStore`.

Good uses: theme, locale (EN/FR!), auth user, feature flags.

React 19: `<Context value={...}>` can be used directly as the provider.

> 🔁 **Follow-up questions**
>
> **Q: How would you let components subscribe to only part of a context?**
> Context doesn't support selectors natively. Options are splitting the context, wrapping consumers in memoised components that receive only what they need, or using a store with selectors like Zustand, or the `use-context-selector` library.
>
> **Q: Where should the language (EN/FR) live?**
> In context, or in the i18n library's provider, plus the URL. It changes rarely, so the context re-render cost is irrelevant, and the URL makes it shareable and SEO-friendly.

</details>

<details>
<summary>Custom hooks: what makes a good one?</summary>

> 🎤 **Mock answer**
>
> A custom hook is a way to reuse stateful logic, not state itself. Every component that calls the hook gets its own independent state.
>
> What makes a good one: it does one thing and has a clear name starting with `use`. It hides the messy details like subscriptions, cleanup, cancellation and edge cases, and exposes a small, simple API. For example, `useDebounce`, `useMediaQuery`, `useOnClickOutside`, or at Bell something like `useCart`, which wraps selectors and dispatches so components don't know whether the cart lives in Redux or a query cache.
>
> It should also be easy to test. I test hooks with `renderHook` from Testing Library. And I avoid hooks that do too much or return a huge object, because then every consumer re-renders on any change. Good custom hooks make components read like a description of what they do, not how.

A custom hook shares **stateful logic**, not state. Each call has its own state. Good ones: `useDebounce`, `useMediaQuery`, `useOnClickOutside`, `useLocalStorage`, `useCart`, `useFeatureFlag`. Name them `useX`, return a minimal API, handle cleanup, and test them with `renderHook`.

> 🔁 **Follow-up questions**
>
> **Q: Do two components using the same custom hook share state?**
> No. Each call gets its own state. To share state, the hook has to read from shared storage, like context or an external store.
>
> **Q: How do you test a custom hook?**
> With `renderHook` from React Testing Library, wrapping it with any needed providers, and asserting on `result.current`, using `act` for updates and fake timers or MSW for async behaviour.

</details>

<details>
<summary>useId, useSyncExternalStore, useImperativeHandle, useDebugValue</summary>

> 🎤 **Mock answer**
>
> `useId` generates a unique ID that's stable and identical on server and client. I use it to connect labels and ARIA attributes, like `htmlFor` and `aria-describedby`, in reusable components where hard-coded IDs would collide. It's not meant for list keys.
>
> `useSyncExternalStore` is how you subscribe to a store outside React, like Redux, Zustand or a browser API such as online status, in a way that's safe with concurrent rendering. It prevents tearing, where different parts of the UI show different values of the same store during one render. Most of us use it indirectly through libraries.
>
> `useImperativeHandle` lets a component expose a limited imperative API through a ref, like `focus` or `scrollToTop`, instead of exposing the whole DOM node. And `useDebugValue` just labels custom hooks in DevTools.

- `useId`: stable unique IDs that match between server and client (for `htmlFor`/ARIA). Not for list keys.
- `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`: subscribe to external stores (Redux and Zustand use it) **without tearing** under concurrent rendering.
- `useImperativeHandle`: expose a limited imperative API (`focus()`, `scrollToTop()`) via a ref.
- `useDebugValue`: label custom hooks in DevTools.

> 🔁 **Follow-up questions**
>
> **Q: Why not use Math.random() for IDs in components?**
> It produces different values on the server and the client, causing hydration mismatches, and changes on every render. `useId` is stable and consistent.
>
> **Q: What's tearing?**
> When concurrent rendering pauses mid-render and an external store changes, different components can display different versions of the same data in one frame. `useSyncExternalStore` prevents that.

</details>

<details>
<summary>What is useEffectEvent (19.2)?</summary>

> 🎤 **Mock answer**
>
> `useEffectEvent`, stable in React 19.2, solves a long-standing problem with effects. Sometimes an effect needs to read the latest value of a prop or state, but you don't want changes to that value to re-run the effect.
>
> The classic example is a chat connection. The effect should reconnect when the room ID changes, but it also shows a notification using the current theme. If I put theme in the dependency array, changing the theme disconnects and reconnects the chat, which is wrong. If I leave it out, the linter complains and I get a stale value.
>
> With `useEffectEvent`, I wrap the notification logic in an effect event. It always sees the latest props and state, but it isn't a dependency, so the effect only re-runs for the room ID. It replaces the old workaround of storing the latest callback in a ref.

It lets you read the **latest** props/state inside an effect **without adding them as dependencies**. It solves "my effect re-subscribes whenever `theme` changes, but I only use theme inside the callback".

```jsx
const onConnected = useEffectEvent(() => showToast('Connected', theme));
useEffect(() => {
  const conn = connect(roomId);
  conn.on('connected', () => onConnected());
  return () => conn.disconnect();
}, [roomId]);  // theme is NOT a dependency
```

> 🔁 **Follow-up questions**
>
> **Q: What did people do before useEffectEvent?**
> Stored the latest callback in a ref updated on every render, and called the ref inside the effect. Or they disabled the exhaustive-deps lint rule, which was risky.
>
> **Q: Can you call an effect event from an event handler?**
> No. It's designed to be called only from inside effects. For regular event handlers you just use a normal function.

</details>

## Concurrent React & Suspense

<details>
<summary>useTransition and useDeferredValue: what problem do they solve?</summary>

> 🎤 **Mock answer**
>
> Both let me tell React that some updates are less urgent than others, so the UI stays responsive.
>
> With `useTransition`, I wrap a state update in `startTransition`. For example, in a product filter, updating the text in the input is urgent, but re-rendering a large filtered list isn't. React renders the transition in the background and can interrupt it if the user types again, and `isPending` lets me show a subtle loading indicator. In React 19, transitions can also be async, which is the basis of Actions.
>
> `useDeferredValue` does the same thing, but when I only have a value, not control of the setter, for example a prop coming from a parent. It gives me a version of the value that lags behind during heavy rendering.
>
> The key point is that these don't make the work faster. They make it interruptible, which improves responsiveness and INP. For network requests, debouncing is still useful, because transitions don't reduce the number of API calls.

They mark updates as **non-urgent**, so urgent updates (typing, clicking) stay responsive (good for **INP**).

```jsx
const [isPending, startTransition] = useTransition();
const onChange = e => {
  setInput(e.target.value);                         // urgent: input stays snappy
  startTransition(() => setFilter(e.target.value)); // can be interrupted
};

const deferredQuery = useDeferredValue(query);      // lagging copy of a value
const results = useMemo(() => heavyFilter(items, deferredQuery), [items, deferredQuery]);
```

- `useTransition`: you control the **setter**. React 19 allows **async** functions in transitions (Actions).
- `useDeferredValue`: you only have the **value** (e.g. a prop).

They don't make work faster. They make it **interruptible**. Debounce is still useful for network calls.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between useTransition and debouncing?**
> Debouncing delays the work by a fixed time and reduces how many times it happens, which is great for network requests. Transitions start immediately but can be interrupted by urgent updates, which suits expensive rendering.
>
> **Q: Can you use a transition to update a controlled input's value?**
> No. Updates to an input's value must be urgent, otherwise typing becomes laggy or broken. You keep the input update urgent and mark only the expensive derived update as a transition.

</details>

<details>
<summary>How does Suspense work?</summary>

> 🎤 **Mock answer**
>
> Suspense lets a component declare that it's waiting for something, and a parent `Suspense` boundary shows a fallback until it's ready. A component suspends when it's waiting for lazy-loaded code from `React.lazy`, or data from a Suspense-enabled source, like the `use` API with a promise, framework loaders, or TanStack Query's suspense hooks, or server components streaming in.
>
> The big advantage is that loading states become declarative and are controlled by where I place boundaries, instead of every component having its own `isLoading` check. I can wrap a whole page for one spinner, or wrap each slow widget separately so the rest of the page shows immediately.
>
> On the server, Suspense enables streaming SSR: the server sends the HTML shell first and streams in each section as its data resolves, and selective hydration means React hydrates whatever the user interacts with first. Combined with transitions, React can keep showing the current UI instead of flashing a fallback when navigating.

`<Suspense fallback={<Spinner/>}>` shows a fallback while a child **suspends**, which happens when it's waiting on lazy code (`React.lazy`), data via a Suspense-enabled source (`use(promise)`, framework loaders, TanStack Query `useSuspenseQuery`), or RSC streaming.

Benefits: declarative loading states, coordinated reveal, **streaming SSR** (send HTML for ready parts first, then stream the rest), selective hydration. Nested boundaries define the loading UX granularity. Transitions keep showing old UI instead of falling back to the spinner again.

> 🔁 **Follow-up questions**
>
> **Q: Can you use Suspense for data fetching with useEffect?**
> No. Suspense only works with data sources that integrate with it, like `use(promise)`, framework loaders, or libraries like TanStack Query's suspense hooks. A fetch in an effect doesn't suspend.
>
> **Q: What's a waterfall, and how does Suspense relate?**
> A waterfall is when a child only starts fetching after its parent finishes, so requests run in sequence. Suspense doesn't fix that by itself; you fix it by starting fetches earlier, in parallel, at the route level, or on the server.
>
> **Q: Where would you put Suspense boundaries on a product page?**
> Around independent slow sections, like reviews and recommendations, so the main product info and the add-to-cart button aren't blocked by them.

</details>

<details>
<summary>Error boundaries</summary>

> 🎤 **Mock answer**
>
> An error boundary catches JavaScript errors thrown while rendering its children and shows a fallback UI instead of unmounting the whole app. They still have to be class components, using `getDerivedStateFromError` to show the fallback and `componentDidCatch` to log, or most teams use the `react-error-boundary` package.
>
> They don't catch errors in event handlers, asynchronous code, server-side rendering, or the boundary itself, so I still need try/catch in handlers and proper error states for requests.
>
> The senior part is where to place them. I put one at the route level, and smaller ones around independent widgets. On an e-commerce page, if the recommendations widget crashes, it should disappear or show a small message, not take down the checkout button. I log errors to monitoring like Sentry with the component stack, and offer a "try again" button that resets the boundary.

Components that catch **render/lifecycle errors** in their subtree and show a fallback. They are still **class components** (`static getDerivedStateFromError` + `componentDidCatch`), or you use `react-error-boundary`.

They **don't catch**: event handler errors (use try/catch), async code, SSR errors, or errors in the boundary itself.

Senior use: put boundaries around **independent widgets** (recommendations, reviews) so one failure doesn't blank the checkout; log to Sentry in `componentDidCatch`; offer a "Try again" reset. React 19 adds root options `onCaughtError` / `onUncaughtError`.

> 🔁 **Follow-up questions**
>
> **Q: How do you handle errors from event handlers?**
> With try/catch in the handler, setting error state to show a message, and reporting the error to monitoring. If you want it to reach a boundary, you can set state that throws during the next render.
>
> **Q: How do you reset an error boundary?**
> Provide a reset function, for example a "Try again" button that clears the error state, and reset automatically when certain keys change, like the route. react-error-boundary supports both.

</details>

## React 19 Features

<details>
<summary>What's new in React 19? (be able to list 6–8)</summary>

> 🎤 **Mock answer**
>
> The headline feature is Actions. You can pass async functions to transitions and to a form's `action` prop, and React handles pending states, errors and form resets. Alongside that come new hooks: `useActionState` returns the result of an action plus a pending flag, `useFormStatus` lets a submit button know whether its parent form is submitting, and `useOptimistic` shows an optimistic value that automatically reverts if the action fails.
>
> There's also the new `use` API, which reads a promise or context and can be called conditionally. Server Components and Server Actions are now stable for frameworks.
>
> Several quality-of-life changes: `ref` is a regular prop, so no more `forwardRef`, ref callbacks can return cleanup functions, a context can be used directly as its provider, and you can render `title` and `meta` tags anywhere and React hoists them into the head. Hydration errors are much clearer too.
>
> Then in 19.2 we got the `Activity` component for keeping hidden UI alive and pre-rendering it, and `useEffectEvent`. Alongside React 19, the React Compiler reached 1.0 for automatic memoization.

1. **Actions**: async functions in transitions handle pending state, errors and optimistic updates. `<form action={fn}>` accepts functions.
2. **`useActionState`**: `[state, formAction, isPending] = useActionState(action, initial)`.
3. **`useFormStatus`**: read the parent form's pending state in a child (e.g. a submit button).
4. **`useOptimistic`**: show an optimistic value while the async action runs; it reverts automatically on failure.
5. **`use(resource)`**: read a promise (suspends) or context, **conditionally** allowed.
6. **Server Components & Server Actions** (`'use server'`) are stable for frameworks.
7. **`ref` as a prop** (no `forwardRef`), ref cleanup functions, `<Context>` as a provider.
8. **Document metadata**: `<title>`, `<meta>`, `<link>` rendered anywhere get hoisted to `<head>`. Stylesheet precedence, `preload`/`preinit` resource APIs.
9. Better hydration error messages, custom elements support.
10. **19.2**: `<Activity mode="hidden">` (keep state of hidden UI, pre-render), `useEffectEvent`, Performance tracks in DevTools.

```jsx
function AddToCart({ productId }) {
  const [state, formAction, isPending] = useActionState(async (prev, formData) => {
    const res = await addToCart(productId, formData.get('qty'));
    return res.ok ? { ok: true } : { error: 'Could not add item' };
  }, {});
  return (
    <form action={formAction}>
      <input name="qty" type="number" defaultValue={1} min={1} />
      <button disabled={isPending}>{isPending ? 'Adding…' : 'Add to cart'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between useActionState and useFormStatus?**
> `useActionState` wraps an action and gives you its last result and a pending flag in the component that owns the form. `useFormStatus` is called in a child of a form, like a submit button, to read whether that form is submitting.
>
> **Q: Have you migrated a project to React 19? What broke?**
> [Answer honestly.] Common issues: removed legacy APIs like string refs and `propTypes` checks, `forwardRef` becoming unnecessary, and third-party libraries needing updates. Codemods handle much of it.
>
> **Q: What does the use API do with context?**
> It reads context like `useContext`, but it can be called conditionally, for example after an early return.

</details>

<details>
<summary>React Server Components (RSC): explain them clearly</summary>

> 🎤 **Mock answer**
>
> Server Components are components that run only on the server, either at build time or per request. Their code is never sent to the browser, so they add zero JavaScript to the bundle. They can be async and fetch data directly, from a database or an internal service, and they can safely use secrets.
>
> Client Components are the interactive ones we've always written. You mark the entry point with `'use client'`, and they can use state, effects and browser APIs. They're still pre-rendered to HTML on the server, then hydrated in the browser.
>
> The rules: server components can render client components, but client components can't import server components, although they can receive them as children. Props crossing from server to client must be serialisable. And `'use client'` marks a boundary, so I push it as far down the tree as possible.
>
> I'd stress that RSC isn't the same as SSR. SSR turns components into HTML for the first load. RSC produces a serialised component tree that can be streamed and refetched without full page reloads.
>
> For something like Bell's product pages this is a big win: the product details, specs and pricing render on the server with no client JS, and only the plan selector and add-to-cart button are client components. That means a smaller bundle, better LCP and INP, and good SEO.

**Server Components** render **only on the server** (at build or request time). Their code **never ships to the browser**: zero JS bundle cost. They can be `async` and access data directly (DB, internal APIs, secrets).

**Client Components** (`'use client'` at the top of a file) are the familiar interactive components. They're pre-rendered to HTML on the server (SSR) **and** hydrated on the client. They can use state, effects and browser APIs.

Rules:
- Server components can import and render client components; client components **cannot import** server components (but can receive them as `children`/props).
- Props from server to client must be **serialisable** (no functions, except Server Actions).
- `'use client'` marks a **boundary**: everything imported below it becomes client code. Push it to the **leaves**.

**RSC ≠ SSR.** SSR produces HTML from components for the first load. RSC produces a serialised component tree (the RSC payload) and can refetch parts without a full page reload. Frameworks combine both.

**Why it matters for e-commerce like Bell:** product/plan pages render on the server with data close to the source, ship less JS (better LCP/INP), get better SEO, and keep only the "Add to cart" and "Plan selector" interactive.

> 🔁 **Follow-up questions**
>
> **Q: Can a server component use useState?**
> No. Server components can't use state, effects or browser APIs, because they don't run in the browser. You extract the interactive part into a client component.
>
> **Q: How do you pass a server component into a client component?**
> As `children` or another prop. The client component can't import it, but it can render what the server passed to it.
>
> **Q: Do server components replace data fetching libraries?**
> For initial page data, often yes. For client-side interactions, like infinite scrolling or optimistic updates, client libraries like TanStack Query are still useful.

</details>

<details>
<summary>Server Actions: what are they and what are the security concerns?</summary>

> 🎤 **Mock answer**
>
> Server Actions are async functions marked with `'use server'` that run on the server but can be called directly from client components or used as a form's `action`. The framework turns each one into an HTTP endpoint and handles the request for you, so you don't write a separate API route for simple mutations.
>
> The security point is the most important part of the answer: a Server Action is a public endpoint. Anyone can call it with any arguments, not just your UI. So inside every action I validate the input, ideally with a Zod schema, and I check authentication and authorisation right there, never relying on the UI hiding a button. I don't trust hidden form fields, like a price, and I re-read sensitive data from the server.
>
> Frameworks like Next.js add CSRF protection by checking the origin, and encrypt values captured in closures, but auth and validation are still my responsibility.

Functions marked `'use server'` that run on the server and are callable from client components/forms. The framework creates an endpoint for them.

**Security:** they're **public HTTP endpoints**. Always validate input (Zod), **authenticate and authorize inside the action**, don't trust hidden fields, and watch out for leaking closures/secrets. Frameworks add CSRF protection (origin checks), but you're still responsible for auth.

> 🔁 **Follow-up questions**
>
> **Q: How do you show validation errors from a server action?**
> Return an error object from the action and read it with `useActionState`, rendering the errors next to the fields.
>
> **Q: Are server actions good for fetching data?**
> Not really. They're designed for mutations and run sequentially. For reads, use server components or route handlers.

</details>

## Patterns & Architecture

<details>
<summary>Controlled vs uncontrolled components</summary>

> 🎤 **Mock answer**
>
> In a controlled component, React state is the source of truth: the input gets its value from state and updates through `onChange`. That makes it easy to validate as the user types, format input like a phone number or postal code, or enable a button based on the value. The cost is a re-render on every keystroke, which is usually fine but can matter in large forms.
>
> In an uncontrolled component, the DOM keeps the value. I set a `defaultValue` and read it when needed, through a ref or from `FormData` on submit. It's simpler and has fewer re-renders, and it fits naturally with native forms and React 19 form actions.
>
> Libraries like React Hook Form use uncontrolled inputs under the hood for performance. One gotcha: an input must not switch between controlled and uncontrolled, which usually happens when the value starts as undefined, and React warns about it.

- **Controlled:** React state is the source of truth (`value` + `onChange`). Enables instant validation and formatting (phone/postal code masks), but re-renders on each keystroke.
- **Uncontrolled:** the DOM holds the value (`defaultValue`, read with a ref or `FormData`). Fewer re-renders and simpler with native forms / React 19 actions.

React Hook Form uses uncontrolled inputs + refs for performance. Don't switch a component between the two (the warning comes from `value` going from `undefined` to defined).

> 🔁 **Follow-up questions**
>
> **Q: How does React Hook Form achieve good performance?**
> It registers inputs as uncontrolled with refs, so typing doesn't re-render the whole form. It only re-renders components that subscribe to specific field values or errors.
>
> **Q: How do you reset an uncontrolled form?**
> Call `form.reset()` on the form element, change the `key` to remount it, or use the form library's reset. React 19 resets forms automatically after a successful action.

</details>

<details>
<summary>Composition patterns: children, render props, HOCs, compound components, headless</summary>

> 🎤 **Mock answer**
>
> My default is plain composition with `children` and props. It's simple, and it's even a performance tool: content passed as children doesn't re-render when the wrapper's state changes.
>
> For components with several related parts, I use compound components, like `Tabs` with `Tab` and `TabPanel`, which share state through context. That gives a flexible, readable API.
>
> Render props and higher-order components were the older ways to share logic. Custom hooks have mostly replaced them, though you still see HOCs like `withAuth` or Redux's `connect` in legacy code, and I've migrated some of those to hooks at Bell.
>
> For design systems, I like headless components, such as Radix or React Aria. They handle behaviour and accessibility, like keyboard navigation and ARIA, and we provide the styling. That way we don't re-implement a combobox or dialog and get accessibility subtly wrong.

- **Composition / children:** the default. Also a **performance trick**: `children` created by the parent don't re-render when the wrapper's state changes.
- **Compound components:** `<Tabs><Tab/><TabPanel/></Tabs>` sharing implicit state via context.
- **Render props / HOCs:** older logic-sharing patterns, mostly replaced by **custom hooks**. HOCs still exist (`withAuth`, `connect`).
- **Headless components:** logic + a11y, no styles (Radix UI, React Aria, Headless UI, TanStack Table). Great for design systems: accessible behaviour with your brand's styles.
- **Container/presentational:** less strict today, but "smart data hooks + dumb UI components" remains good for testing.
- **Polymorphic components:** `<Button as="a" href>` / `asChild` (Radix Slot).

> 🔁 **Follow-up questions**
>
> **Q: What's the "children as a performance trick"?**
> If a stateful wrapper receives its expensive content as `children`, that content was created by the parent. When the wrapper's state changes, React can reuse those elements and doesn't re-render them.
>
> **Q: When is a HOC still a reasonable choice?**
> For cross-cutting behaviour applied to many components at the boundary, like analytics tracking or permission checks, or when working with existing APIs like Redux `connect`. For new logic sharing, hooks are better.

</details>

<details>
<summary>How do you structure a large React codebase?</summary>

> 🎤 **Mock answer**
>
> I organise by feature rather than by file type. Instead of global `components`, `reducers` and `utils` folders, there's a `features/cart` folder with the cart's components, hooks, API calls, state, types and tests together. Changes to one feature stay in one place, and it's easier to see what can be deleted.
>
> Shared building blocks live in a separate UI or design-system area, and general utilities in a lib folder. Each feature exposes a public API through an index file, and I enforce boundaries with lint rules so features don't import each other's internals. That stops the codebase turning into spaghetti.
>
> On top of that come consistency tools: TypeScript in strict mode, ESLint and Prettier, path aliases, and CODEOWNERS so the right people review changes. When there are several apps sharing a design system, I'd use a monorepo with Nx or Turborepo, so changes across the app and the shared library happen in one pull request.

- **Feature-based folders** (`features/cart`, `features/checkout`) over type-based (`components/`, `reducers/`): colocate components, hooks, tests, API and types.
- `shared/` or `ui/` for design-system primitives; `lib/` for utilities.
- Clear **public API per feature** (`index.ts`), with lint rules forbidding deep imports across features (eslint-plugin-boundaries, Nx module boundaries).
- Absolute imports / path aliases.
- **Monorepo** (Nx/Turborepo + pnpm workspaces) when there are several apps sharing a design system.
- Enforce consistency with ESLint, Prettier, TS strict, commit hooks and a CODEOWNERS file.

> 🔁 **Follow-up questions**
>
> **Q: How do you prevent features from importing each other's internals?**
> Expose a public API through each feature's index file, and enforce boundaries with lint rules like eslint-plugin-boundaries or Nx module boundaries, so violations fail in CI.
>
> **Q: Where do you put shared components?**
> Truly generic ones, like Button and Modal, go in the design system or a shared UI package. Components shared by only two features stay in one of them until they're really reused.

</details>

<details>
<summary>StrictMode: what does it do?</summary>

> 🎤 **Mock answer**
>
> StrictMode is a development-only tool that helps find bugs early. It renders components twice, and calls initialisers and reducers twice, to catch impure rendering logic. It also mounts components, unmounts them and mounts them again, which runs effects and their cleanups an extra time to reveal effects that don't clean up properly. And it warns about deprecated APIs.
>
> None of this happens in production, so there's no performance cost for users.
>
> The common confusion is when a developer sees their API call fire twice in development and wants to remove StrictMode. My answer is that the double call is revealing a real issue: if the effect can't safely run twice, it probably also has race conditions or leaks. The right fix is a proper cleanup, like aborting the request, or using a data-fetching library.

Dev only: double-invokes render functions, initialisers and reducers, and runs effects mount → unmount → mount, to catch **impure renders and missing cleanups**. It also warns about deprecated APIs. No production impact. If your fetch fires twice in dev, that's StrictMode, and your fix is a correct cleanup/abort, **not** removing StrictMode.

> 🔁 **Follow-up questions**
>
> **Q: Should StrictMode be enabled in production?**
> It doesn't affect production at all; its checks only run in development. So you leave it on in the code.
>
> **Q: What kind of bug does the double render catch?**
> Impure render logic, like mutating a variable outside the component or pushing to an array during render, which would give different results when rendered twice.

</details>

<details>
<summary>Portals: when and gotchas</summary>

> 🎤 **Mock answer**
>
> A portal renders a child into a different DOM node, usually directly under `body`, while keeping it in the same place in the React tree. I use them for modals, tooltips, dropdown menus and toast notifications, because those need to escape parent containers with `overflow: hidden` or stacking context problems with z-index.
>
> The main gotcha is that events bubble through the React tree, not the DOM tree. So a click inside a portal-rendered modal will trigger `onClick` handlers on the React parent, even though in the DOM it's somewhere else entirely. Context also flows through normally, which is usually what you want.
>
> Also worth mentioning: modern browser features reduce the need for portals. The native `dialog` element and the Popover API render in the top layer, which sits above everything without any z-index fights.

`createPortal(child, domNode)` renders outside the parent DOM hierarchy (modals, tooltips, toasts) to escape `overflow: hidden`/`z-index` stacking. **Events still bubble through the React tree**, not the DOM tree. Context still works. Today, the native `<dialog>` and the **Popover API** (`popover` attribute) + CSS anchor positioning reduce the need for portals.

> 🔁 **Follow-up questions**
>
> **Q: Do React context and events work through a portal?**
> Yes. Context flows normally, and events bubble through the React tree, which can surprise you, for example a click in a modal triggering a parent's onClick.
>
> **Q: Is a portal enough to make a modal accessible?**
> No. A portal only changes where it renders. You still need focus management, keyboard handling, ARIA labelling and inert background content.

</details>

<details>
<summary>Hydration: what is it and what causes hydration mismatches?</summary>

> 🎤 **Mock answer**
>
> When a page is server-rendered, the browser receives complete HTML first, so the user sees content quickly. Hydration is the process where React loads in the browser, walks through that existing HTML, and attaches event handlers and state to it instead of rebuilding it. For that to work, the first render in the browser must produce exactly the same output as the server.
>
> A hydration mismatch happens when they differ. Common causes are using `Date.now()` or random values during render, checking `typeof window` to render something different on the client, formatting dates and numbers with a different locale or timezone on the server than in the browser, invalid HTML nesting like a `div` inside a `p`, and browser extensions modifying the page.
>
> For a bilingual site like Bell's, the locale one is very real: a price formatted in French on the server and English in the browser causes a mismatch. Fixes: make the server and client use the same locale and timezone explicitly, render client-only values after mount in an effect, use `suppressHydrationWarning` only for unavoidable cases like timestamps, or render that component on the client only.

Hydration attaches React's event handlers and state to **server-rendered HTML** instead of re-creating it. React expects the client's first render to **exactly match** the server HTML.

Mismatch causes: `Date.now()`/`Math.random()`, `typeof window` branches, locale/timezone formatting differences (**EN/FR number/date formats!**), invalid HTML nesting (`<div>` inside `<p>`), and browser extensions.

Fixes: render client-only values in `useEffect` after mount, `suppressHydrationWarning` for unavoidable cases (timestamps), consistent locale/timezone on the server, dynamic import with `ssr: false`.

> 🔁 **Follow-up questions**
>
> **Q: How do you render something that depends on window or localStorage?**
> Render a neutral version on the server and the first client render, then update in an effect after mount, or render that component on the client only.
>
> **Q: What's selective hydration?**
> With streaming and Suspense, React hydrates sections independently and prioritises the part the user interacts with, so the page becomes interactive faster.
>
> **Q: What does a hydration mismatch cost?**
> In React 18 and 19, React may discard the server HTML for that part and re-render it on the client, which wastes time, can cause visible flicker, and hurts performance.

</details>

<details>
<summary>How would you debug a slow React page?</summary>

> 🎤 **Mock answer**
>
> I always start by measuring, not guessing. I reproduce the problem in the Chrome Performance panel with CPU throttling to simulate a mid-range phone, and I use the React DevTools Profiler to record the interaction. That shows which components rendered, how long each took, and why they rendered.
>
> From there I identify the category. Is it too many re-renders, one expensive component, a very long list, layout thrashing, or is the page actually waiting on a large bundle or slow network? Each has a different fix.
>
> Then I fix in order of impact: move state down so fewer components re-render, split context, stop creating new objects in props, memoize where the profiler shows it helps, virtualise long lists, wrap heavy updates in `useTransition`, code-split heavy components, and move expensive computation to a Web Worker.
>
> Finally, I measure again with the same steps to confirm the improvement, and if possible add a guard against regressions, like a performance budget in CI. That's the same process I followed for the performance work at Bell.

1. **Reproduce and measure**: Chrome Performance panel (with CPU throttling), React DevTools **Profiler** ("why did this render?", flame graph, commit durations), the 19.2 Performance tracks.
2. Identify: too many re-renders? one expensive component? huge lists? layout thrashing? a big bundle/slow network?
3. Fix, in order of leverage: colocate state, split context, avoid new object/array props, memoize *where profiling shows benefit*, **virtualise** long lists, `useTransition`/`useDeferredValue` for heavy updates, code-split, move heavy work to a worker.
4. Verify with the same measurement; add a regression guard.

> 🔁 **Follow-up questions**
>
> **Q: What does the Profiler's flame graph show?**
> For each commit, which components rendered and how long each took, coloured by duration, plus why they rendered. It quickly shows whether one slow component or many unnecessary renders is the problem.
>
> **Q: How do you know whether the problem is React or the network?**
> In the Performance panel, look at whether the time is spent in scripting, meaning JavaScript, or waiting on network requests. The network waterfall shows TTFB and download times separately.

</details>
