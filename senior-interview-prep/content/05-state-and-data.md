# State Management & Data Fetching

> Your résumé says you **refactored legacy code to Redux Toolkit**, so expect deep questions here. The senior framing: **separate server state from client state**, and pick the simplest tool for each.

## The mental model

| Kind of state | Examples (Bell) | Best home |
|---|---|---|
| **Local UI** | dropdown open, input value, hover | `useState` / `useReducer` in the component |
| **Shared client** | cart drawer open, selected plan during configuration, wizard step | lift state up / Context / Zustand / Redux |
| **Server (remote) cache** | product catalog, prices, user's account, cart from API | **TanStack Query / RTK Query / SWR** / RSC |
| **URL** | filters, sort, page, selected tab, search query | `searchParams` (router) |
| **Form** | checkout fields + validation | React Hook Form / native forms + actions |
| **Persistent** | language preference, recently viewed | cookies / localStorage |

**Key insight:** most "global state" in older Redux apps is actually **server cache**, which you had to hand-manage (loading flags, refetching, invalidation). Moving it to a query library removes a lot of code.

## Redux & Redux Toolkit

<details>
<summary>Explain Redux's core principles and data flow</summary>

> 🎤 **Mock answer**
>
> Redux is built on three principles. There's a single store that holds the application state. That state is read-only: you can't change it directly, you dispatch actions, which are plain objects describing what happened, like "item added to cart". And changes are made by reducers, which are pure functions that take the current state and an action and return the new state.
>
> The data flow is one-directional. The UI dispatches an action, it passes through middleware, for things like async logic or logging, the reducers compute the new state, and components subscribed with `useSelector` re-render only if the slice they selected changed.
>
> The benefits are predictability, easy testing because reducers are pure, and great debugging with the DevTools, where you can see every action and even time-travel. The cost is indirection and, in classic Redux, a lot of boilerplate, which is what Redux Toolkit solves, and which is why we moved to it at Bell.

1. **Single source of truth**: one store.
2. **State is read-only**: changed only by dispatching **actions** (plain objects describing *what happened*).
3. **Pure reducers**: `(state, action) => newState`, no side effects.

Flow: UI → `dispatch(action)` → middleware (thunks, logging) → reducers → new state → subscribed components re-render if their **selected** slice changed (react-redux `useSelector` uses `useSyncExternalStore` and a reference comparison).

Benefits: predictable, DevTools time-travel, easy testing, a clear pattern for big teams. Cost: indirection and boilerplate (which RTK solves).

> 🔁 **Follow-up questions**
>
> **Q: Why must reducers be pure?**
> So that the same state and action always produce the same result. That makes them predictable, easy to test, and enables time-travel debugging and replaying actions. Side effects belong in middleware or thunks.
>
> **Q: When would you NOT use Redux?**
> For small apps, or apps where most state is server data. Local state plus a query library is simpler. Redux pays off with complex shared client state and larger teams.

</details>

<details>
<summary>What does Redux Toolkit add over classic Redux? Show an example.</summary>

> 🎤 **Mock answer**
>
> Redux Toolkit is now the official way to write Redux, and it removes most of the boilerplate. `configureStore` sets up the store with good defaults: DevTools, thunk middleware, and development checks that catch accidental mutations and non-serialisable values.
>
> `createSlice` generates the action creators and the reducer together from one object. It uses Immer internally, so I can write code that looks like mutation, such as pushing an item into the cart array, and it produces a correct immutable update. That alone removed a whole class of bugs for us.
>
> For async logic there's `createAsyncThunk`, which dispatches pending, fulfilled and rejected actions automatically. `createEntityAdapter` gives normalised state with ready-made CRUD reducers and selectors. And `createSelector` gives memoised derived data, like the cart total.
>
> On top of that, RTK Query handles data fetching and caching, which can replace a lot of hand-written thunks and loading flags. When I refactored legacy state at Bell, these tools cut the amount of state code significantly and made the patterns consistent across the team.

- `configureStore`: good defaults (DevTools, thunk, serializability + immutability checks in dev).
- `createSlice`: actions + reducer in one; **Immer** lets you write "mutating" code safely.
- `createAsyncThunk`: pending/fulfilled/rejected lifecycle actions.
- `createEntityAdapter`: normalised CRUD state (`ids` + `entities`) + selectors.
- `createSelector` (Reselect): memoised derived data.
- **RTK Query**: data fetching + caching built in.
- `createListenerMiddleware`: side effects that react to actions (a lighter alternative to sagas).

```ts
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as CartItem[], status: 'idle' as Status },
  reducers: {
    itemAdded(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(i => i.sku === action.payload.sku);
      if (existing) existing.qty += action.payload.qty;   // Immer: safe "mutation"
      else state.items.push(action.payload);
    },
    itemRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.sku !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(applyPromo.pending, state => { state.status = 'loading'; })
      .addCase(applyPromo.fulfilled, (state, action) => { state.status = 'idle'; state.items = action.payload.items; })
      .addCase(applyPromo.rejected, state => { state.status = 'error'; });
  },
});

export const selectCartTotal = createSelector(
  [(s: RootState) => s.cart.items],
  items => items.reduce((sum, i) => sum + i.price * i.qty, 0)
);
```

> 🔁 **Follow-up questions**
>
> **Q: How does Immer work?**
> It gives you a draft proxy of the state. You "mutate" the draft, Immer records the changes, and produces a new immutable state with structural sharing, so unchanged parts keep their references.
>
> **Q: Can you both mutate the draft and return a value in a createSlice reducer?**
> No. Either mutate the draft, or return a completely new state, but not both. Immer throws an error if you do both.
>
> **Q: What is the serializability check for?**
> It warns when non-serialisable values like class instances, promises or functions go into the store or actions, because they break DevTools, persistence and time-travel.

</details>

<details>
<summary>How did you migrate a legacy Redux codebase to RTK? (tie to your story)</summary>

> 🎤 **Mock answer**
>
> At Bell, our cart and checkout state used older patterns with a lot of boilerplate, and we had bugs where data got out of sync. A big-bang rewrite wasn't an option, because we were shipping features continuously. So I did it incrementally.
>
> The first step was replacing `createStore` with `configureStore`. Existing reducers keep working, so it's a very low-risk change that gives you DevTools and the mutation checks immediately. Then I converted reducers one at a time to `createSlice`, starting with the cart. Old and new slices lived side by side in the same store. Hand-written loading, success and failure action types became `createAsyncThunk`, and for pure server data, RTK Query is the next step.
>
> I added memoised selectors with `createSelector` for derived values like totals, which also cut unnecessary re-renders, and migrated components from `connect` to the hooks as we touched them. I wrote tests for each slice and documented the pattern so the rest of the team could continue it.
>
> The result was less code, fewer out-of-sync bugs, and faster onboarding because there was one consistent way of doing things. And the migration never blocked feature delivery.

1. Swap `createStore` for `configureStore`. The existing reducers still work, so it's a zero-risk first PR.
2. Convert **one reducer at a time** to `createSlice`; old and new coexist in `combineReducers`.
3. Replace hand-written action types/creators with slice actions; codemods/regex help.
4. Replace hand-rolled `FETCH_X_REQUEST/SUCCESS/FAILURE` with `createAsyncThunk`, and later **RTK Query** for pure server data.
5. Add `createSelector` for derived data (cart totals, filtered lists) to stop unnecessary re-renders.
6. Migrate `connect()` HOCs to `useSelector`/`useDispatch` hooks as components are touched.
7. Typed hooks: `useAppDispatch`, `useAppSelector`.
8. Tests for each slice (pure reducer tests are trivial).

Results to mention: less code, fewer sync bugs, faster onboarding (one pattern), and Immer removed accidental-mutation bugs.

> 🔁 **Follow-up questions**
>
> **Q: How long did it take, and how did you track progress?**
> [Real numbers: about X sprints alongside features.] I kept a simple checklist of slices and components to migrate, and we migrated a component whenever we touched it for a feature, plus a few dedicated tickets.
>
> **Q: What would you do differently?**
> [Honest reflection.] For example, moving server data to RTK Query earlier, instead of first converting those fetches to thunks, would have saved a step.
>
> **Q: How did you get the rest of the team on board?**
> I paired on the first migrations, wrote a short guide with before and after examples, and reviewed the early pull requests closely so the pattern was consistent.

</details>

<details>
<summary>Why normalise state? What does it look like?</summary>

> 🎤 **Mock answer**
>
> Normalising means storing each entity once, in a lookup by ID, and referring to it by ID everywhere else, a lot like tables in a database. For example, products are stored as a list of IDs plus an object mapping each ID to the product, and the cart lines just store a product ID and a quantity.
>
> The benefits are that there's no duplicated data, so if a price updates, it updates in one place and every view is consistent. Lookups by ID are O(1). Reducers stay simple and flat instead of updating deeply nested structures. And updating one item doesn't create new references for unrelated items, which helps memoisation.
>
> Redux Toolkit's `createEntityAdapter` does all of this for you. With query libraries like TanStack Query, data is cached per query, so normalisation matters less, but for client-side state with relationships it's still the right approach.

Store entities by ID once, and reference them by ID elsewhere:

```js
{ products: { ids: ['p1','p2'], entities: { p1: {...}, p2: {...} } },
  cart: { lines: [{ productId: 'p1', qty: 2 }] } }
```

There's no duplication (update a price in one place), O(1) lookups, and simpler reducers. `createEntityAdapter` does it for you. Query libraries cache per *query*, so normalisation matters less there.

> 🔁 **Follow-up questions**
>
> **Q: How do you denormalise for the UI?**
> With memoised selectors that combine entities, for example building cart lines with their product details from the IDs, so components get exactly the shape they need without recomputing every render.
>
> **Q: When is normalisation overkill?**
> For small, flat data that's only read in one place, or for server data in a query cache that's refetched as a whole. It's most valuable when the same entities appear in several places and get updated.

</details>

<details>
<summary>Thunks vs sagas vs listener middleware</summary>

> 🎤 **Mock answer**
>
> Thunks are the simplest option: an action creator returns a function that receives `dispatch` and `getState`, so you can do async work and dispatch results. They're the default in Redux Toolkit and cover most needs.
>
> Redux-Saga uses generator functions and is very powerful for complex flows: cancellation, racing requests, debouncing, long-running background processes. But it has a steep learning curve and is verbose, and I mostly see it in legacy codebases now.
>
> Listener middleware is the modern, lightweight option in Redux Toolkit. You say, "when this action happens, run this side effect", which is great for things like analytics, saving to localStorage, or reacting to an action from another slice.
>
> And in practice, RTK Query removes most of the fetching logic that people used thunks or sagas for. So my default is RTK Query for data, thunks for occasional custom async logic, and listeners for cross-cutting side effects.

- **Thunks**: functions that can dispatch and read state; simple async. The default.
- **Redux-Saga**: generator-based, powerful for complex flows (cancellation, races, debouncing, long-running processes), but steep to learn and verbose. Mostly legacy now.
- **Listener middleware**: "when action X happens, run this effect" (analytics, syncing to localStorage, cross-slice reactions). Lightweight.
- **RTK Query** handles most fetching, removing the need for most thunks.

> 🔁 **Follow-up questions**
>
> **Q: How would you debounce an action with listener middleware?**
> In the listener, call `listenerApi.cancelActiveListeners()` and then `await listenerApi.delay(300)`. If another matching action arrives, the previous run is cancelled, which is effectively a debounce.
>
> **Q: How do you cancel a createAsyncThunk?**
> The dispatched thunk returns a promise with an `abort()` method, and the thunk receives a `signal` you pass to fetch. Calling abort cancels the request and dispatches a rejected action.

</details>

<details>
<summary>Common Redux performance problems</summary>

> 🎤 **Mock answer**
>
> The most common one is a selector that returns a new reference every time, for example `useSelector` with a `map` or `filter` inside. Because `useSelector` compares results by reference, the component re-renders on every store update, even unrelated ones. The fix is a memoised selector with `createSelector`, or selecting primitive values.
>
> Other problems: selecting far more than the component needs, like the whole cart object when it only needs the item count; storing derived data in the store instead of computing it with selectors, which also creates sync bugs; putting fast-changing UI state, like the text of an input, into Redux, which dispatches on every keystroke; and storing large non-serialisable objects.
>
> To find them, I use the React DevTools Profiler to see which components re-render, and the Redux DevTools to check how often actions fire.

- `useSelector(state => state.cart.items.map(...))` returns a **new array every time**, so the component re-renders on *any* store update. Fix: `createSelector`, or select primitives.
- Selecting too broadly (`state => state`).
- Putting non-serialisable or huge objects in the store.
- Storing derived data instead of computing it.
- Putting rapidly-changing UI state (input text) in Redux; keep that local.

> 🔁 **Follow-up questions**
>
> **Q: How does useSelector decide whether to re-render?**
> It runs the selector after each dispatch and compares the result with the previous one using strict reference equality by default. If it differs, the component re-renders.
>
> **Q: When would you use shallowEqual with useSelector?**
> When selecting several values into a new object, so the component only re-renders if one of them actually changes. Often it's simpler to call useSelector several times for primitives.

</details>

## Server State: TanStack Query & RTK Query

<details>
<summary>What problems does TanStack Query (React Query) solve?</summary>

> 🎤 **Mock answer**
>
> TanStack Query manages server state, meaning data that lives on the server and that the client just caches. That's a very different problem from client state, and handling it manually with useEffect and Redux leads to a lot of repeated code and subtle bugs.
>
> It gives you caching by query key, so two components requesting the same data share one request. It deduplicates requests, does stale-while-revalidate, so cached data shows instantly while it refreshes in the background, and refetches when the window regains focus or the network reconnects. It handles retries, pagination and infinite scrolling, prefetching, cancellation, and SSR hydration.
>
> For writes, mutations can invalidate related queries, for example, after adding to the cart, invalidate the cart query so it refetches, or do optimistic updates with rollback.
>
> A common follow-up is staleTime versus gcTime: `staleTime` is how long data is considered fresh, so no refetch happens, and `gcTime` is how long unused data stays in memory before being garbage collected.

Caching by **query key**, request **deduplication**, **stale-while-revalidate**, background refetch (on focus/reconnect/interval), retries, pagination and infinite queries, **mutations with invalidation**, optimistic updates, prefetching, SSR hydration, cancellation, and DevTools.

```tsx
const { data, isPending, isError } = useQuery({
  queryKey: ['plans', { province, type }],       // key includes all inputs
  queryFn: ({ signal }) => api.getPlans({ province, type }, { signal }),
  staleTime: 5 * 60 * 1000,                       // fresh for 5 min: no refetch
});

const queryClient = useQueryClient();
const addToCart = useMutation({
  mutationFn: api.addToCart,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
});
```

`staleTime` (how long data counts as fresh) vs `gcTime` (how long unused cache stays in memory) is a common question.

> 🔁 **Follow-up questions**
>
> **Q: How do query keys work?**
> A query key is an array that uniquely identifies the data, like the resource name plus parameters. Any change in the key means different cached data. Invalidation can match keys by prefix, like everything starting with "cart".
>
> **Q: How would you prefetch data on hover?**
> Call `queryClient.prefetchQuery` with the same key and function in the `onMouseEnter` of the link, so the data is often already cached when the user clicks.
>
> **Q: How does it work with server-side rendering?**
> Prefetch on the server, dehydrate the cache into the page, and hydrate it on the client, so components get the data instantly without a second fetch.

</details>

<details>
<summary>RTK Query vs TanStack Query: which would you choose?</summary>

> 🎤 **Mock answer**
>
> They solve the same problem, so the choice is mostly about context. If the app already uses Redux, like at Bell, RTK Query is the natural choice: it's built into Redux Toolkit, the cache lives in the store so it shows up in Redux DevTools, and invalidation uses tags, so a mutation can invalidate all queries tagged "Cart". It can also generate typed hooks directly from an OpenAPI spec, which is great when the backend publishes Swagger.
>
> If the app doesn't use Redux, I'd pick TanStack Query. It's lighter to adopt, framework-agnostic, has a larger ecosystem, and its infinite query and fine-grained cache controls are excellent.
>
> So my answer would be: I don't think either is wrong. I'd look at the existing stack and the team's familiarity, and avoid having both in the same app.

- **RTK Query**: if you **already use Redux** (like Bell). Integrated with the store/DevTools, tag-based invalidation (`providesTags`/`invalidatesTags`), and OpenAPI codegen to generate hooks from Swagger.
- **TanStack Query**: if you don't need Redux. Larger ecosystem, more flexible, framework-agnostic, excellent infinite queries.

Both solve the same problem. Pick based on the existing stack and team familiarity, and say so.

> 🔁 **Follow-up questions**
>
> **Q: How does tag invalidation work in RTK Query?**
> Queries declare which tags they provide, like "Cart", and mutations declare which tags they invalidate. After a mutation succeeds, every query providing those tags refetches automatically.
>
> **Q: Could you use both in one app?**
> Technically yes, but I'd avoid it. Two caches with different invalidation models confuse the team and duplicate data. Pick one per app.

</details>

<details>
<summary>Optimistic updates: how, and how do you roll back?</summary>

> 🎤 **Mock answer**
>
> An optimistic update means changing the UI immediately, as if the server request succeeded, and then reconciling with the real response. It makes the app feel instant, for example when changing the quantity of an item in the cart.
>
> With TanStack Query, in `onMutate` I first cancel any in-flight fetches for that data, so an old response can't overwrite my optimistic value. I save a snapshot of the current cache, then update the cache with the new value, and return the snapshot. If the mutation fails, `onError` restores the snapshot and I show an error message. In `onSettled`, I invalidate the query so the final state comes from the server. React 19 also has `useOptimistic` for this.
>
> The judgment part is knowing when not to do it. I wouldn't be optimistic for placing an order or a payment, or anything with a high failure rate or irreversible consequences. Those should show a clear pending state and wait for confirmation.

Update the UI immediately and assume success; if the server fails, **roll back** and notify.

```ts
useMutation({
  mutationFn: updateQty,
  onMutate: async (vars) => {
    await queryClient.cancelQueries({ queryKey: ['cart'] });   // avoid an old fetch overwriting us
    const previous = queryClient.getQueryData(['cart']);
    queryClient.setQueryData(['cart'], old => applyQty(old, vars));
    return { previous };
  },
  onError: (_err, _vars, ctx) => queryClient.setQueryData(['cart'], ctx.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
});
```

React 19 alternative: `useOptimistic`. **When NOT to be optimistic:** payments, order placement, and anything with a high failure rate or irreversible effects.

> 🔁 **Follow-up questions**
>
> **Q: What if two optimistic updates overlap?**
> That's why you cancel in-flight queries first and invalidate after every mutation settles. The final refetch reconciles with the server's truth even if the intermediate rollbacks were imperfect.
>
> **Q: How does useOptimistic differ?**
> `useOptimistic` holds an optimistic value only while an async action or transition is in progress, and automatically switches back to the real state when it finishes, so you don't write manual rollback code.

</details>

<details>
<summary>How do you handle race conditions in data fetching?</summary>

> 🎤 **Mock answer**
>
> A race condition happens when several requests are in flight and their responses arrive in a different order from the requests. The classic case is a search or filter, where the old response arrives last and overwrites the correct results.
>
> On the client I handle it in a few ways. I cancel the previous request with an AbortController when the input changes or the component unmounts. If cancellation isn't possible, I use an ignore flag in the effect cleanup, so an outdated response is discarded. Data libraries key the cache by the request parameters, so each response goes into the right cache entry. And I debounce inputs so fewer requests are made in the first place.
>
> For mutations like a checkout submission, the race is double submission, so I disable the submit button while pending and use an idempotency key, so the server can recognise and ignore a duplicate. At Bell we saw the filter version of this problem, and cancellation plus keyed caching fixed it.

- **AbortController** to cancel previous requests on input change/unmount.
- An **ignore flag** in the effect cleanup (`let ignore = false; return () => { ignore = true }`).
- Query libraries key by input, so stale responses go to the right cache entry.
- On the server, use **idempotency keys** so a retried checkout doesn't double-charge.
- Disable submit while pending.

> 🔁 **Follow-up questions**
>
> **Q: Can you give an example of a race condition outside of search?**
> Switching tabs quickly between product categories, where an earlier category's response arrives last, or two quantity updates for the same cart item where the older response overwrites the newer one.
>
> **Q: How do idempotency keys work?**
> The client generates a unique key for an operation, like an order submission, and sends it in a header. If the server sees the same key again, it returns the original result instead of performing the operation again.

</details>

## Lightweight alternatives

<details>
<summary>Zustand, Jotai, Context: when do you reach for each?</summary>

> 🎤 **Mock answer**
>
> My first step is always to ask what kind of state it is. Most state should be local, in `useState`, or in the URL, or is actually server data, which belongs in a query library. What's left is genuinely global client state, and that's usually a small amount.
>
> For values that rarely change, like the theme, locale or the current user, React Context is enough, and it doesn't add a dependency.
>
> For shared client state that changes more often, I like Zustand. It's a tiny store with hooks and selector-based subscriptions, so components only re-render when their slice changes, and it needs no provider. Something like a cart drawer or a multi-step product configurator works well with it.
>
> Jotai uses an atom model, which is good for very interactive UIs with lots of independent pieces of state, like an editor.
>
> And Redux Toolkit is still a great fit for large teams and complex state, where its strict patterns, middleware and DevTools are worth the structure, as in Bell's cart and checkout.

- **Context + useReducer**: low-frequency global values (theme, locale, auth). No extra dependency.
- **Zustand**: tiny store with hooks and **selector subscriptions** (no provider needed); great for client state like a cart drawer or a configurator. `const qty = useCart(s => s.qty)`.
- **Jotai / Recoil-style atoms**: fine-grained, bottom-up state. Good for highly interactive editors.
- **Redux Toolkit**: large teams, strict patterns, complex cross-cutting client state, DevTools/time-travel, existing investment.
- **Signals** (Preact signals, the TC39 proposal): fine-grained reactivity; know they exist.

Senior answer: "Start with local state and the URL, use a query library for server state, and add a global store only for truly global client state. Most apps need far less global state than they have."

> 🔁 **Follow-up questions**
>
> **Q: How do Zustand selectors avoid re-renders?**
> A component subscribes with a selector, and only re-renders when the selected value changes, compared by reference, or with a shallow comparison for objects.
>
> **Q: How do you persist a Zustand store?**
> With the `persist` middleware, which saves to localStorage or another storage and rehydrates on load. With SSR, you need to handle hydration timing to avoid mismatches.

</details>

<details>
<summary>Why put filters in the URL?</summary>

> 🎤 **Mock answer**
>
> Because the URL is state that users can share, bookmark and navigate. If filters live only in component state, refreshing the page loses them, the back button doesn't undo a filter change, and a customer can't send a link to "Samsung phones under $800 with 256 GB".
>
> Putting filters, sorting and pagination in the query string fixes all of that. It also helps SEO for category pages, makes analytics easier because you can see which filter combinations people use, and with server rendering, the server can render the right results on the first request.
>
> A couple of implementation details: I debounce text inputs before updating the URL, and I use replace instead of push for rapid changes so the history doesn't fill up with every keystroke. In Next.js or React Router I read them with `useSearchParams`, and there are libraries like nuqs that make URL state typed. At Bell, we synced product filters to the URL for exactly these reasons.

Shareable links ("send me that phone filter"), survives refresh, back/forward work, SEO for category pages, analytics, and SSR can render the right results immediately. Use `useSearchParams` (React Router / Next.js), or nuqs for typed URL state. Debounce text inputs before pushing to the URL, and use `replace` instead of `push` to avoid polluting history.

> 🔁 **Follow-up questions**
>
> **Q: What about sensitive or very large state?**
> Neither belongs in the URL. URLs end up in logs, history and analytics, and have length limits. Use server-side state or storage for those.
>
> **Q: How do you keep URL state typed?**
> Parse and validate the search params with a schema, with defaults, or use a library like nuqs or TanStack Router, which provide typed search params.

</details>

## APIs: REST, GraphQL, real-time

<details>
<summary>REST vs GraphQL vs tRPC from a front-end point of view</summary>

> 🎤 **Mock answer**
>
> REST is resource-based, simple and widely understood, and it works very well with HTTP caching at the browser and CDN level. The downside on the front end is over-fetching, under-fetching, and needing several round trips for one screen.
>
> GraphQL lets the client ask for exactly the fields it needs in one request, with a strongly typed schema. Components can declare their own data needs with fragments. The trade-offs are that HTTP caching is harder, so you rely on a client-side normalised cache like Apollo, and the server has to deal with N+1 queries and protect itself against overly expensive queries.
>
> tRPC gives end-to-end type safety between a TypeScript backend and front end without a schema language, which is great for full-stack TypeScript teams in a monorepo, but it couples the two tightly.
>
> In an enterprise setup like Bell's, with many microservices, a common pattern is REST with OpenAPI contracts and a Backend-for-Frontend layer that aggregates services into exactly what each page needs. That gives most of GraphQL's benefits while keeping REST's simplicity and caching.

- **REST**: simple, HTTP caching (CDN/ETags) works naturally, but over/under-fetching and multiple round trips. A **BFF** (Backend for Frontend) fixes it by aggregating services into exactly what a page needs.
- **GraphQL**: the client asks for exactly the fields it needs, a typed schema, one endpoint, fragments colocated with components (Relay). Costs: caching is harder (normalised client cache: Apollo/urql), N+1 on the server, query complexity limits, and file uploads are awkward.
- **tRPC**: end-to-end TypeScript types without a schema, for full-stack TS monorepos.

At Bell-scale: microservices behind a **BFF/API gateway**, with an **OpenAPI** contract and generated TS types on the front end.

> 🔁 **Follow-up questions**
>
> **Q: How do you cache GraphQL responses?**
> Mostly on the client, with a normalised cache like Apollo or urql that stores entities by ID. HTTP caching is harder since queries are usually POSTs; persisted queries sent as GETs can help with CDN caching.
>
> **Q: What's the N+1 problem?**
> When resolving a list makes one extra query per item, for example fetching the author for each of 50 posts separately. DataLoader batches those into one request.

</details>

<details>
<summary>Polling vs long polling vs SSE vs WebSockets</summary>

> 🎤 **Mock answer**
>
> These are options for getting updates from the server, and I pick based on how real-time and how bidirectional the communication needs to be.
>
> Regular polling just requests data every few seconds. It's simple and works everywhere, and it's fine for something like checking an order status every 30 seconds, but it wastes requests. Long polling keeps the request open until the server has something, which reduces waste but is a bit of a hack.
>
> Server-Sent Events are a one-way stream from server to client over plain HTTP, with automatic reconnection built in. They're great for notifications, live dashboards, and streaming AI responses token by token.
>
> WebSockets give a full two-way, low-latency connection, which you need for chat, collaboration or multiplayer features. The cost is more complexity: reconnection logic, heartbeats, authentication, and scaling, since connections are stateful on the server.
>
> My default is the simplest one that meets the requirement: polling for slow updates, SSE for server push, and WebSockets only when the client also needs to send frequent messages.

- **Polling**: simple, wasteful; fine for "order status every 30 s".
- **Long polling**: the server holds the request until there's data.
- **Server-Sent Events (SSE)**: server → client stream over HTTP, auto-reconnect, text only. Great for notifications and **LLM token streaming**.
- **WebSockets**: full duplex, low latency. Chat, live collaboration, trading. Needs reconnection, heartbeat and scaling considerations (sticky sessions / pub-sub).

> 🔁 **Follow-up questions**
>
> **Q: How do you handle WebSocket reconnection?**
> Reconnect with exponential backoff and jitter, use heartbeats to detect dead connections, resubscribe after reconnecting, and fetch missed data, ideally by sending the last received event ID.
>
> **Q: Why is SSE good for AI responses?**
> The data flows one way, from server to client, it works over regular HTTP through proxies and CDNs, and it handles reconnection automatically, so it's a simple fit for token streaming.

</details>
