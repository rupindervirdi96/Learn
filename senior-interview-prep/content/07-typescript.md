# TypeScript for Senior React Developers

> Most senior roles now expect **TypeScript fluency**. You won't be asked to write type gymnastics, but you will be asked to type components, hooks and API responses well, and to explain *why* `any` is dangerous.

<details>
<summary>type vs interface</summary>

> 🎤 **Mock answer**
>
> Both can describe the shape of an object, and in most everyday cases they're interchangeable. The differences: interfaces support declaration merging, so you can extend an existing interface by declaring it again, which is useful for augmenting library types like adding a property to `Window`. Interfaces use `extends`, and sometimes give clearer error messages.
>
> Type aliases are more flexible. They can describe unions, intersections, tuples, primitives, and mapped and conditional types, which interfaces can't.
>
> In practice, what matters most is consistency within the team. A common convention is to use `type` by default, because unions are so common in React props and state, and use `interface` for public APIs that others might extend. I wouldn't spend time debating it in a code review.

Both describe object shapes. Differences:
- `interface` supports **declaration merging** (augmenting library types, e.g. `Window`) and `extends`. Error messages are sometimes clearer.
- `type` can express **unions, intersections, tuples, mapped and conditional types**, and primitives.

Rule of thumb: pick one convention for the team (many use `type` for everything, `interface` for public/extendable APIs). Don't argue about it in the interview; show you know the difference.

> 🔁 **Follow-up questions**
>
> **Q: How do you extend a type alias?**
> With an intersection, like `type Admin = User & { permissions: string[] }`. Interfaces use `extends`, and an interface can also extend a type alias that describes an object.
>
> **Q: What is declaration merging useful for?**
> Augmenting third-party types, like adding a custom property to `Window`, or extending a library's theme interface with your own tokens.

</details>

<details>
<summary>any vs unknown vs never</summary>

> 🎤 **Mock answer**
>
> `any` turns off type checking for that value. Anything is allowed, and worse, it spreads: whatever you derive from it is also unchecked. So I avoid it and have a lint rule against explicit `any`.
>
> `unknown` is the safe counterpart. The value could be anything, but TypeScript won't let you use it until you narrow it, with a type check, a type guard or schema validation. I use it for API responses, `JSON.parse` results, and caught errors.
>
> `never` represents something that can't happen, like a function that always throws, or a branch that should be unreachable. My favourite use is exhaustive checking: in the default case of a switch over a union, I pass the value to a function that takes `never`. If someone later adds a new case to the union and forgets to handle it, the build fails, which catches the bug at compile time.

- `any`: turns the type checker **off** and spreads silently. Avoid it (lint `no-explicit-any`).
- `unknown`: "could be anything, but you must **narrow** before using it". Use it for API responses, `catch (e)` and `JSON.parse`.
- `never`: a value that can't exist. Use it for exhaustive checks and functions that throw.

```ts
function assertNever(x: never): never { throw new Error('Unexpected: ' + x); }
```

> 🔁 **Follow-up questions**
>
> **Q: How do you type a caught error?**
> As `unknown`, which is the default with strict settings, then narrow it: check `instanceof Error` before reading `message`, and otherwise convert it to a string.
>
> **Q: Why does unknown matter for JSON.parse?**
> Its result is really untyped data from outside. Treating it as `unknown` forces you to validate it before use, instead of trusting it blindly as `any`.

</details>

<details>
<summary>Discriminated unions: model loading state properly</summary>

> 🎤 **Mock answer**
>
> A discriminated union is a union of object types that share a common literal property, like `status`, which TypeScript uses to narrow the type.
>
> The classic example is request state. Instead of separate `isLoading`, `error` and `data` fields, where you can end up with impossible combinations like loading and error both being true, I model it as a union: idle, loading, success with `data`, and error with an `error` message. When I check `status === 'success'`, TypeScript knows `data` exists, and in other branches it knows it doesn't.
>
> Combined with an exhaustive check using `never`, adding a new status forces every switch statement to handle it. The phrase I like is "make impossible states impossible".
>
> I've found this very useful for multi-step flows like checkout, where each step has different data, and for component props where certain props only make sense together.

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function render(s: RequestState<Plan[]>) {
  switch (s.status) {
    case 'success': return s.data.length;      // `data` exists only here: narrowed
    case 'error':   return s.error;
    case 'idle': case 'loading': return null;
    default: return assertNever(s);            // compile error if a new status is added
  }
}
```

This makes **impossible states impossible** (no `isLoading && error && data` combos). Great for checkout steps too.

> 🔁 **Follow-up questions**
>
> **Q: How would you type component props where some props only make sense together?**
> A union of prop shapes, like a button that's either a link with `href`, or a button with `onClick`, discriminated by a field or by which props are present, so invalid combinations fail to compile.
>
> **Q: How does narrowing work on the discriminant?**
> When you check the literal field, like `status === 'success'`, TypeScript narrows the union to the members where that literal matches, so the other members' properties are excluded.

</details>

<details>
<summary>Generics: explain with a real example</summary>

> 🎤 **Mock answer**
>
> Generics are type parameters. They let you write a function, hook or component that works with many types while keeping the relationship between input and output.
>
> For example, a `getJson<T>` helper returns `Promise<T>`, so the caller gets typed data back. I'd point out that this is an unchecked cast, though: TypeScript trusts you, so at API boundaries I'd validate with Zod. Another example is a `useLocalStorage<T>` hook: the type of the default value determines the type of the stored value and the setter. And generic components, like a `List<T>` that takes items and a `renderItem` function, so `renderItem` knows the exact item type.
>
> Constraints make generics more precise, for example `T extends { id: string }` to guarantee an ID, or `K extends keyof T` to accept only valid property names. The guideline I follow is to use generics when they connect types between inputs and outputs, not just to look clever.

Generics are type parameters that keep relationships between inputs and outputs.

```ts
async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<T>;          // ⚠ unchecked cast: validate at runtime with Zod
}

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;        // tuple, not (T | Dispatch)[]
}

// Generic component
type ListProps<T> = { items: T[]; renderItem: (item: T) => React.ReactNode; getKey: (item: T) => string };
function List<T>({ items, renderItem, getKey }: ListProps<T>) {
  return <ul>{items.map(i => <li key={getKey(i)}>{renderItem(i)}</li>)}</ul>;
}
```

Constraints: `<T extends { id: string }>`, `<K extends keyof T>`.

> 🔁 **Follow-up questions**
>
> **Q: What does "as const" do on the returned tuple?**
> Without it, the return type is an array of a union. `as const` makes it a readonly tuple, so the first element has the value type and the second has the setter type, just like `useState`.
>
> **Q: What's a generic constraint?**
> A requirement on the type parameter, like `T extends { id: string }`, so inside the function you can safely use `item.id`, and callers can't pass types without an ID.

</details>

<details>
<summary>Utility types you should know</summary>

> 🎤 **Mock answer**
>
> The ones I use most: `Partial` makes every property optional, which is handy for update payloads, and `Required` does the opposite. `Pick` and `Omit` create a type with a subset of properties, for example a form type that omits the server-generated ID. `Record` creates an object type with specific keys, like prices by province. `Readonly` prevents mutation.
>
> For unions, `Exclude` and `Extract` filter members, and `NonNullable` removes null and undefined. For functions, `ReturnType` and `Parameters` extract types from existing functions, and `Awaited` unwraps a promise.
>
> In React, `ComponentProps` and `ComponentPropsWithoutRef` are really useful. For a design-system Button, I extend the native button props, so it accepts every standard attribute like `disabled` and `aria-label`, plus my own variant prop. That way I don't redefine HTML attributes by hand.

`Partial<T>`, `Required<T>`, `Readonly<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, `Exclude<U, X>`, `Extract<U, X>`, `NonNullable<T>`, `ReturnType<F>`, `Parameters<F>`, `Awaited<T>`, `ComponentProps<typeof Button>`, `ComponentPropsWithoutRef<'button'>`.

```ts
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & { variant?: 'primary' | 'secondary' };
type PlanUpdate = Partial<Omit<Plan, 'id'>>;
type PriceByProvince = Record<'ON' | 'QC' | 'BC', number>;
```

> 🔁 **Follow-up questions**
>
> **Q: How would you make only some properties optional?**
> Combine utilities: `Omit<T, K> & Partial<Pick<T, K>>`. Many teams define a small `PartialBy` helper for this.
>
> **Q: Difference between Omit and Exclude?**
> `Omit` removes properties from an object type. `Exclude` removes members from a union type.

</details>

<details>
<summary>Typing React: props, children, events, refs, hooks</summary>

> 🎤 **Mock answer**
>
> For props I define a type and annotate the function parameter directly. I don't use `React.FC` much anymore, and I only include `children` when the component actually accepts children, typed as `React.ReactNode`. Callback props get explicit function types.
>
> For events, I use React's event types, like `React.ChangeEvent<HTMLInputElement>` for inputs and `React.FormEvent<HTMLFormElement>` for forms, so `event.target.value` is correctly typed. For refs, `useRef<HTMLInputElement>(null)`. For state that starts empty, I give `useState` an explicit union, like `User | null`.
>
> For context, a pattern I always use is creating the context with `null` as the default, and a custom hook that reads it and throws a clear error if it's used outside the provider. Then consumers get a non-null type and a helpful message.
>
> Generic components are useful for things like lists and tables, and for wrapping native elements I extend `ComponentPropsWithoutRef`.

```tsx
type CardProps = {
  title: string;
  children: React.ReactNode;           // anything renderable
  onSelect?: (id: string) => void;
};

const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value);
const onSubmit = (e: React.FormEvent<HTMLFormElement>) => e.preventDefault();

const inputRef = useRef<HTMLInputElement>(null);
const [user, setUser] = useState<User | null>(null);

// Context with a safe hook
const CartContext = createContext<CartApi | null>(null);
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
```

Avoid `React.FC` debates: just type props directly. Don't type `children` unless you accept them.

> 🔁 **Follow-up questions**
>
> **Q: Why do people avoid React.FC?**
> It used to add implicit `children`, and it complicates generics and default props. Typing the props parameter directly is simpler and more flexible. It's mostly a style choice now.
>
> **Q: How do you type a component that renders as different elements?**
> With a polymorphic `as` prop and generics over the element type, using `ComponentPropsWithoutRef<E>`. It gets complex, so many design systems use an `asChild` pattern instead.

</details>

<details>
<summary>Type narrowing techniques</summary>

> 🎤 **Mock answer**
>
> Narrowing is how TypeScript refines a broad type to a more specific one inside a block of code. The common techniques are `typeof` checks for primitives, `instanceof` for classes like `Date` or `Error`, the `in` operator to check whether a property exists, equality checks, especially on a discriminant property in a union, truthiness checks to rule out null and undefined, and `Array.isArray`.
>
> When the built-in checks aren't enough, I write a user-defined type guard: a function whose return type is `value is Plan`. Inside, I do the runtime checks, and after calling it TypeScript treats the value as a `Plan`. There are also assertion functions, which throw if the condition fails and narrow the type afterwards.
>
> The important caveat is that a custom type guard is only as correct as its implementation, since TypeScript trusts it. For complex external data, a schema library is safer than hand-written guards.

`typeof`, `instanceof`, `in` (`'data' in res`), equality / discriminant checks, truthiness, `Array.isArray`, and **user-defined type guards**:

```ts
function isPlan(x: unknown): x is Plan {
  return typeof x === 'object' && x !== null && 'id' in x && 'price' in x;
}
```

Assertion functions: `function assert(cond: unknown, msg: string): asserts cond`.

> 🔁 **Follow-up questions**
>
> **Q: What's the danger of a custom type guard?**
> TypeScript trusts it completely. If the runtime check is incomplete, TypeScript narrows incorrectly, and you get runtime errors in code the compiler said was safe.
>
> **Q: What does the "in" operator narrow?**
> It checks whether a property exists, and narrows a union to the members that have that property.

</details>

<details>
<summary>Runtime validation: why TypeScript isn't enough at API boundaries</summary>

> 🎤 **Mock answer**
>
> TypeScript types are erased when the code compiles, so they provide no protection at runtime. If an API returns a different shape than expected, or a field is renamed, the types still claim everything is fine, and the app crashes somewhere far from the real cause, or worse, shows wrong data.
>
> So at the boundaries, meaning API responses, local storage, URL parameters and form input, I validate with a schema library like Zod. The nice part is that I define the schema once and infer the TypeScript type from it, so the runtime check and the static type can never drift apart. If the data doesn't match, I get a clear error at the boundary.
>
> Another approach I like in a microservices setup like Bell's is generating the TypeScript types from the backend's OpenAPI specification, so the front-end types always match the API contract. Combining generated types with validation of critical responses gives strong safety.

Types are erased at runtime. An API can return anything. Validate external data with **Zod / Valibot** and infer the type from the schema, so there's a single source of truth:

```ts
const Plan = z.object({ id: z.string(), name: z.string(), price: z.number().nonnegative() });
type Plan = z.infer<typeof Plan>;
const plans = z.array(Plan).parse(await res.json());   // throws early, with a clear error
```

Alternatively, **generate types from OpenAPI** (openapi-typescript, Orval, RTK Query codegen) so front end and back end can't drift.

> 🔁 **Follow-up questions**
>
> **Q: Isn't validating every API response slow?**
> Usually it's negligible compared with network time. For very large responses, I validate critical fields or sample in production, and validate fully in development and tests.
>
> **Q: What happens in the UI when validation fails?**
> Treat it like an API error: show a friendly error state, report the details to monitoring with the endpoint and schema error, and don't render partially wrong data.

</details>

<details>
<summary>Advanced: keyof, typeof, indexed access, mapped, conditional, template literal types, satisfies</summary>

> 🎤 **Mock answer**
>
> I use these mostly to derive types from values so there's a single source of truth. For example, with a routes object declared `as const`, `keyof typeof ROUTES` gives a union of route names, and indexed access gives a union of the paths. If someone adds a route, the types update automatically.
>
> Mapped types transform every property of a type, for example making every property nullable. Conditional types choose a type based on a condition, and with `infer` you can extract part of a type, like the element type of an array. Template literal types build string types, like translation keys combining a locale and a key name, which is great for type-safe i18n keys.
>
> And `satisfies`, which I use a lot for configuration objects: it checks that a value matches a type, but keeps the narrower inferred type, instead of widening it like an annotation would. So I get validation and precise autocomplete.
>
> I'd add that I use advanced types mostly in shared libraries. In application code, readability matters more than cleverness.

```ts
const ROUTES = { home: '/', plans: '/plans', cart: '/cart' } as const;
type RouteName = keyof typeof ROUTES;            // 'home' | 'plans' | 'cart'
type RoutePath = (typeof ROUTES)[RouteName];     // '/' | '/plans' | '/cart'

type Nullable<T> = { [K in keyof T]: T[K] | null };          // mapped
type ElementOf<T> = T extends (infer U)[] ? U : never;        // conditional + infer
type Locale = 'en' | 'fr';
type I18nKey = `${Locale}.${'title' | 'cta'}`;                // template literal

const config = { theme: 'dark', retries: 3 } satisfies Record<string, string | number>;
// `satisfies` checks against the type but KEEPS the narrow inferred type
```

> 🔁 **Follow-up questions**
>
> **Q: Give an example of a mapped type you've used.**
> Generating form error types from a form values type, where each field maps to an optional string, so errors always match the actual fields.
>
> **Q: What does infer do?**
> Inside a conditional type it captures part of a type into a new type variable, like extracting the element type of an array or the resolved type of a promise.

</details>

<details>
<summary>tsconfig settings a senior should care about</summary>

> 🎤 **Mock answer**
>
> The non-negotiable one is `strict: true`, which turns on strict null checks and no implicit any, among others. Beyond that, I like `noUncheckedIndexedAccess`, which makes array and object index access return possibly undefined. It catches a lot of real bugs. `exactOptionalPropertyTypes` is useful in stricter codebases too.
>
> For modern bundlers I use `moduleResolution: "bundler"`, `isolatedModules`, which is required when tools like esbuild or SWC compile files one at a time, and `verbatimModuleSyntax` so type-only imports are explicit. Path aliases keep imports readable.
>
> For migrating a JavaScript codebase, I enable `allowJs`, convert files gradually starting from the leaves like utilities, use `ts-expect-error` with a ticket where necessary, and tighten strictness over time.
>
> And I'd mention that TypeScript 7, the native port written in Go, makes type-checking around ten times faster, which really helps large codebases and CI times.

`"strict": true` (non-negotiable for new code), `noUncheckedIndexedAccess` (array/record access may be `undefined`), `exactOptionalPropertyTypes`, `noImplicitOverride`, `moduleResolution: "bundler"`, `verbatimModuleSyntax`, `isolatedModules` (needed by esbuild/SWC), `skipLibCheck`, path aliases.

Migration strategy for JS → TS: `allowJs`, convert leaf files first, `// @ts-expect-error` with tickets, and increase strictness gradually (per folder with project references or a strict-plugin).

TS news: **TypeScript 7 (native Go port, "tsgo")** brings roughly 10× faster type-checking. Worth mentioning that you're following it.

> 🔁 **Follow-up questions**
>
> **Q: What does noUncheckedIndexedAccess catch?**
> Accessing `arr[0]` or `record[key]` returns a possibly undefined type, so you must handle the missing case. It catches real bugs with empty arrays and missing keys.
>
> **Q: How do you migrate a large codebase to strict mode?**
> Enable strict options one at a time, or per folder, fix errors incrementally, and use a baseline of allowed errors that can only shrink in CI, so new code is strict from day one.

</details>
