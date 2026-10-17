# Last-Night Cheat Sheet

> Read this the night before and the morning of. Don't learn anything new now.

## Your pitch (key beats)

1. ~8 years front-end; **~4.5 years on Bell e-commerce** via LGS (an IBM company).
2. React, TypeScript, Next.js, Redux Toolkit, Tailwind; Node/Nest on the back end.
3. **~20% faster load times** (code splitting, lazy loading, Tailwind/CSS optimisation, Core Web Vitals).
4. **Redux Toolkit refactor** of legacy state; REST integration for **filtering, cart and checkout**.
5. **~30% fewer production bugs** (Jest + Cypress with QA).
6. **Promoted to Senior Full Stack (Apr 2025)**; mentoring; AI features (OpenAI, RAG).
7. Why them: [one specific reason].

## 30 one-liners

| Topic | One-liner |
|---|---|
| Closure | Function + the variables of the scope where it was created; the basis of hooks and stale-closure bugs. |
| Event loop | Run a task → drain **all microtasks** (promises) → maybe render → next macrotask (timers). |
| `this` | Decided by the call site: new > explicit (call/bind) > implicit (obj.fn) > default; arrows are lexical. |
| Prototype | Property lookup walks the `[[Prototype]]` chain; classes are sugar over it. |
| `==` | Coerces types; use `===`, except `x == null`. |
| Debounce vs throttle | After activity stops vs at most once per interval. |
| Render | Calling components to compute UI; commit applies the minimal DOM changes. |
| Keys | Identity across renders; index keys break reordering and state; change the key to reset state. |
| useEffect | Sync with external systems; derived data belongs in render, user actions in handlers. |
| useMemo/useCallback | Only for expensive work or referential stability for memo'd children/deps; the React Compiler automates this. |
| Context | Dependency injection, not a store; every consumer re-renders when the value changes; split it. |
| useTransition | Marks updates non-urgent so typing stays responsive (INP). |
| Suspense | Declarative loading for lazy code/data; enables streaming SSR. |
| RSC | Server-only components with zero client JS; `'use client'` marks the interactive boundary; RSC ≠ SSR. |
| React 19 | Actions, useActionState, useOptimistic, useFormStatus, `use()`, ref as prop, metadata; 19.2: Activity, useEffectEvent. |
| Hydration | Attaching React to server HTML; the first client render must match (dates, locale, random). |
| Server state | Belongs in TanStack Query / RTK Query (cache, dedupe, revalidate), not hand-rolled Redux. |
| RTK | createSlice + Immer, createAsyncThunk, createEntityAdapter, createSelector, RTK Query. |
| URL state | Filters/sort/page in the query string: shareable, back button, SSR, SEO. |
| CSR/SSR/SSG/ISR | Browser / per request / at build / at build + background regeneration. Mix them per route. |
| LCP | ≤ 2.5 s: TTFB, preload + `fetchpriority` hero, no lazy hero, critical CSS. |
| INP | ≤ 200 ms (replaced FID in 2024): break long tasks, fewer re-renders, third-party scripts, workers. |
| CLS | ≤ 0.1: image dimensions, reserved space, font metrics. |
| Caching | Hashed assets get 1 year immutable; HTML gets no-cache; user data is private/no-store. |
| XSS | React escapes JSX; dangers are `dangerouslySetInnerHTML`, `javascript:` URLs and third-party scripts. Add a CSP. |
| Tokens | HttpOnly Secure SameSite cookies via a BFF; not localStorage. |
| CORS | The server opts in to cross-origin reads; a browser protection; fix it on the server. |
| OAuth for SPA | Authorization Code + PKCE; OIDC adds the ID token. |
| Testing | Trophy: static → unit → **integration (RTL + MSW)** → few E2E (Cypress/Playwright). |
| AWS SPA | S3 (private) + CloudFront (OAC, ACM, headers) + Route 53, CI via OIDC role, invalidate index.html. |

## System design: RADIO

**R**equirements (functional + non-functional) → **A**rchitecture (rendering strategy, BFF, CDN) → **D**ata model (server/client/URL state) → **I**nterface (API, pagination, errors) → **O**ptimisations (perf, a11y, i18n, security, observability, testing, rollout).

## Questions to ask them (pick 3–5)

1. What does success look like for this role in the first 6 months?
2. What's the biggest technical challenge the front-end team is facing right now?
3. How is the front end architected (rendering strategy, state, design system), and what would you change if you could?
4. How do you deploy, and how often? How do you handle feature flags, monitoring and rollbacks?
5. How do you measure front-end performance and quality? Do you track Core Web Vitals?
6. How are technical decisions made? Is there an RFC/ADR process? How much influence do seniors have?
7. How do product, design and engineering collaborate here?
8. What does the path from senior to staff look like here?
9. What do you personally enjoy most about working here?

## Red flags to avoid saying

- ❌ "We" for everything. Say **"I"** for your actions.
- ❌ Criticising Bell, LGS, IBM or past teammates.
- ❌ "I always use useMemo everywhere." / "Redux for everything."
- ❌ Claiming deep cloud/K8s ops experience you don't have. Say what you did, plus what you understand conceptually.
- ❌ Jumping into code or a design without clarifying requirements.
- ❌ Silence while coding. Think out loud.

## If you get stuck

- "Let me think about this for a moment." (Silence is OK.)
- "I haven't used X directly, but here's how I'd reason about it: it's similar to Y, which I used at Bell."
- "My first instinct is A. Let me check an edge case..."
- Ask for a hint gracefully; showing collaboration is a positive signal.
