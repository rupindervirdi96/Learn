# Front-End System Design

> This round decides "senior or not". You're judged on **structure, trade-offs, and communication**, not on one right answer. Drive the conversation, think out loud, and check in with the interviewer.

## The RADIO framework (use it every time)

| Step | Time (of ~45 min) | What to cover |
|---|---|---|
| **R**equirements | 5–8 min | Functional (core features, users, devices), **non-functional** (performance, scale, SEO, a11y, i18n, offline, security), out of scope. Write them down. |
| **A**rchitecture | 8–10 min | Boxes: rendering strategy (CSR/SSR/RSC), client app layers, BFF/API, CDN, auth, third parties. Component tree at a high level. |
| **D**ata model | 5 min | Entities, client state vs server cache vs URL state, normalisation, cache keys. |
| **I**nterface (API) | 5–8 min | Endpoints/queries between client and server (pagination, filtering, errors), component props/APIs. |
| **O**ptimisations | 10–15 min | Performance, a11y, i18n, security, offline/error handling, observability, testing, deployment, scaling the *team*. **This is where you go deep in your strongest areas.** |

**Phrases that score points:** "Let me clarify the scope first", "The trade-off here is...", "For v1 I'd do X; at scale I'd move to Y", "How we'd measure success is...", "Let me check: do you want me to go deeper on rendering or on data?"

## Worked example 1: E-commerce product listing + cart (Bell-style) ⭐

Practise this one first, because you can answer from real experience.

**Requirements**
- Browse phones/plans with **filters** (brand, price, storage, 5G), sort, pagination; product detail page; add to cart; mini-cart; bilingual EN/FR; province-specific pricing.
- Non-functional: SEO (product pages must rank), **LCP < 2.5 s on 4G mobile**, launch-day traffic spikes (10–50×), WCAG AA, analytics, A/B testing.

**Architecture**
```
User ──► CDN (static assets, cached HTML for PLP/PDP, edge: locale + province)
           │
           ▼
      Next.js app (RSC/SSR + ISR) ──► BFF / API gateway ──► catalog, pricing, inventory,
           │                                               cart, promo, serviceability
           └─ Client components: filters, add-to-cart, mini-cart, plan selector
      Search: dedicated service (Algolia/Elasticsearch/OpenSearch) for facets
      CMS (headless) for marketing content; webhook → revalidateTag()
```
- **PLP/PDP**: ISR or Partial Prerendering: a static shell + streamed dynamic price/stock (prices change, promos expire).
- **Cart / checkout**: dynamic SSR or CSR, never cached at the CDN (`private`).
- Interactive islands only where needed (filters, add-to-cart) to keep JS small.

**Data model**
- `Product { id, slug, name, brand, images[], variants[] }`, `Variant { sku, colour, storage, price, stock }`, `Plan { id, data, price, province[] }`, `Cart { id, lines[{ sku, qty, planId }], promo, totals }`.
- **URL state:** `/en/phones?brand=apple&storage=256&sort=price-asc&page=2`.
- **Server cache:** query keys `['products', filters]`, `['cart']`. Client state: mini-cart open.

**API**
- `GET /products?brand=&sort=&cursor=&limit=24` → `{ items, facets: { brand: [{ value, count }] }, nextCursor }`.
- `POST /cart/lines { sku, qty }` with an idempotency key → updated cart (return the whole cart so totals stay authoritative).
- Error format: `{ code, message, field? }`. Prices come **from the server** (never trust client totals).

**Optimisations**
- **Performance:** image CDN + `srcset`, hero `fetchpriority=high`, skeletons sized to prevent CLS, prefetch the PDP on hover, virtualise only if there are > 100 tiles, code-split heavy PDP widgets (360° viewer, reviews), defer third-party tags.
- **Filters:** debounce, update URL with `replace`, abort stale requests, keep previous results visible while loading (`keepPreviousData` / transitions), facet counts from the search service.
- **Cart:** optimistic add (with rollback) + toast with `aria-live`; sync across tabs (BroadcastChannel / storage event); merge guest cart on login.
- **Scale/spikes:** CDN-cached pages absorb traffic; a queue/waiting room for launch days; graceful degradation (hide recommendations if their service is down: **error boundaries per widget**).
- **SEO:** SSR content, JSON-LD Product/Offer, canonical + `hreflang` EN/FR, sitemap.
- **a11y/i18n:** filters as `fieldset`/checkbox groups, results count announced, ICU plurals, `Intl.NumberFormat('fr-CA')`.
- **Observability:** RUM (Core Web Vitals per page type), Sentry errors with release tags, funnel analytics (PLP → PDP → cart → checkout conversion), feature flags and A/B experiments.

## Worked example 2: Autocomplete / Typeahead (component-level design)

- **Requirements:** min 2 chars, results in < 100 ms perceived, keyboard + screen reader, highlight matches, recent searches, works with 10M items.
- **Client:** debounce (~200–300 ms), `AbortController`, **in-memory LRU cache** by query, optionally prefix-cache reuse ("ap" results can be filtered client-side for "app"), ARIA combobox, virtualised list if long, a `ResultItem` render prop for customisation.
- **Server:** a search index (prefix/trie or Elasticsearch `completion` suggester), return the top N with highlights, cache popular prefixes at the CDN (`GET /suggest?q=ap` is cacheable!).
- **Edge cases:** IME composition (Asian languages: `compositionstart/end`), race conditions, offline, empty/error state, rate limiting.
- **Metrics:** latency p95, selection rate, zero-result rate.

## Worked example 3: News feed / social timeline (infinite scroll)

- **Pagination:** **cursor-based** (stable under inserts), not offset.
- **Rendering:** virtualised list with variable heights (measure + cache), placeholders, image lazy loading, **preserve scroll position** on back navigation, a "new posts" pill instead of auto-inserting at the top (avoids CLS).
- **Data:** normalised posts/users store; optimistic likes; real-time via SSE/WebSocket for new posts.
- **Performance:** prefetch the next page at 70% scroll, cap DOM nodes, recycle components, `content-visibility`.
- **a11y:** `role="feed"` + `aria-setsize`/`aria-posinset`, keyboard shortcuts (j/k), a "load more" fallback.

## Worked example 4: Design system / component library for many teams

- **Goals:** consistency, a11y by default, velocity, multi-brand (Bell / Virgin Plus / Lucky style theming).
- **Architecture:** tokens (Style Dictionary/Figma variables) → CSS variables; headless primitives (Radix/React Aria) + brand styles; a monorepo package `@company/ui` with tree-shakable ESM, `sideEffects: false`, per-component entry points.
- **Quality:** Storybook docs, interaction tests, axe, **visual regression**, semver + changesets, codemods for breaking changes, deprecation warnings.
- **Adoption:** office hours, contribution guidelines, usage analytics (which versions/components are used where), a migration guide.
- **Trade-offs:** flexibility vs consistency (slots/`asChild` vs locked props), bundle size, framework lock-in (web components if teams use different frameworks).

## Worked example 5: Real-time dashboard (e.g. network outage / order status)

- Transport: SSE for one-way updates, WebSocket if bi-directional; reconnection with backoff + "last event id" resume; polling fallback.
- Throttle UI updates (batch every 500 ms), use `useSyncExternalStore` for the stream store, Web Worker for aggregation, canvas/WebGL charts for thousands of points.
- Stale data indicators, offline banner, timezones, accessible charts (data tables / summaries).

## Architecture topics they'll probe

<details>
<summary>Micro-frontends: when are they worth it, and how do you implement them?</summary>

> 🎤 **Mock answer**
>
> Micro-frontends split a large front end into separate applications that different teams own, build and deploy independently. For a site like Bell's, that might be shop, support, my account and checkout, each owned by a different team.
>
> There are several ways to implement them. The simplest and most robust is splitting by route: different apps serve different URL paths behind one domain, with a shared header and footer from a package or web component. Module Federation lets one app load components from another at runtime and share libraries like React as a single copy. Web components work when teams use different frameworks. And there's server-side or edge composition of page fragments.
>
> They're worth it when you have many teams, say five or more, who are blocking each other in one codebase and need independent release schedules, or when you're gradually migrating a legacy app with the strangler pattern.
>
> But the costs are real: duplicated dependencies and bigger bundles, version conflicts in shared libraries, an inconsistent user experience, harder shared state and authentication, and much more complex testing and operations. For one or two teams, I'd say they're not worth it. A well-organised monorepo with enforced module boundaries gives you most of the benefits with far less complexity.

**What:** splitting a front end into independently developed and **deployed** apps owned by different teams (e.g. Bell: Shop, Support, My Account, Checkout).

**Approaches:**
- **Route-based split** (different apps behind one domain via a reverse proxy / CDN path routing): simplest and most robust. Shared header/footer as a package or web component.
- **Module Federation** (webpack/Rspack/Vite plugin): load remote modules at runtime and share React as a singleton.
- **Web Components** for framework-agnostic widgets.
- **Server-side composition** (edge-side includes / fragment composition).
- Single-spa orchestration (older).

**Worth it when:** many teams (5+) step on each other, need independent release cadences, or face legacy migration (strangler pattern, migrating Angular/jQuery to React page by page).

**Costs:** duplicated dependencies (bundle size), version skew of shared libs, inconsistent UX, cross-app state/auth/routing complexity, harder local dev and E2E testing, ops overhead. **Not worth it for one or two teams.** A well-structured **monorepo with module boundaries** gives most of the benefit.

> 🔁 **Follow-up questions**
>
> **Q: How do micro-frontends share state, like the logged-in user or cart count?**
> Minimise sharing. Each app reads what it needs from APIs or cookies, and for live updates they communicate through simple browser events or a tiny shared event bus, not a shared store.
>
> **Q: How do you keep the UX consistent across micro-frontends?**
> A shared design system package with versioning, shared header and footer, common UX guidelines, and visual regression tests, plus a platform team that owns these shared pieces.
>
> **Q: How do you handle React versions across micro-frontends?**
> With Module Federation, share React as a singleton with compatible version ranges. Otherwise, coordinate upgrades through the platform team. Different React versions on one page cause bugs and bloat.

</details>

<details>
<summary>Monorepo vs polyrepo</summary>

> 🎤 **Mock answer**
>
> A monorepo keeps multiple apps and packages in one repository, managed with tools like Nx or Turborepo and pnpm workspaces. The big advantage for front end is atomic changes. If I change a component in the design system, I can update every app that uses it in the same pull request, and CI tells me immediately if anything breaks. There's also shared tooling and configuration, consistent dependency versions, and easier refactoring. The costs are that it needs good tooling: build caching and running only the affected projects, otherwise CI becomes slow, plus clear ownership with CODEOWNERS.
>
> A polyrepo gives each project its own repository. Teams are more independent, and permissions and pipelines are simpler, but shared code has to be published as versioned packages, versions drift apart, and a breaking change in a shared library becomes a coordination exercise across many repos.
>
> For a front-end platform with a shared design system and several apps, I'd generally recommend a monorepo, provided the team invests in the tooling.

**Monorepo** (Nx, Turborepo + pnpm workspaces): atomic changes across app + design system, shared tooling/config, easy refactors, consistent versions. It needs build caching/affected-only CI and ownership (CODEOWNERS). **Polyrepo**: independent, simpler permissions, but dependency drift and versioning overhead. For a front-end platform with a shared design system, a monorepo is usually the better fit.

> 🔁 **Follow-up questions**
>
> **Q: How do you keep CI fast in a monorepo?**
> Run only the affected projects, use remote build caching, parallelise jobs, and keep each project's tests independent, which Nx and Turborepo handle.
>
> **Q: How do you control who changes shared code?**
> CODEOWNERS files requiring review from the owning team, module boundary rules, and clear contribution guidelines.

</details>

<details>
<summary>BFF (Backend for Frontend): why?</summary>

> 🎤 **Mock answer**
>
> A Backend-for-Frontend is a thin server layer built specifically for one front end. In a microservices architecture like Bell's, a single product page might need data from the catalogue, pricing, promotions, inventory and availability services. Without a BFF, the browser makes many requests, gets data shaped for backend needs, and contains a lot of glue logic.
>
> The BFF aggregates those calls server-side, close to the services, and returns exactly the data that page needs, in the shape the UI wants. That means fewer round trips and smaller payloads, which matters on mobile. It's also the right place for security concerns: handling OAuth tokens on the server and giving the browser just an HttpOnly session cookie, plus caching and rate limiting. And it isolates the front end from backend changes.
>
> In Next.js, route handlers, server actions and server components can act as the BFF, and as a full-stack developer I've built endpoints in NestJS for this kind of role. The risk to watch is business logic creeping into the BFF. It should orchestrate and shape data, not own domain rules.

A thin server layer per front end (web, mobile) that aggregates microservices, shapes responses for the UI (fewer round trips, smaller payloads), handles auth/session (token handling server-side, an HttpOnly cookie to the browser), caching and rate limiting, and isolates the front end from backend changes. In Next.js, Route Handlers/Server Actions/RSC can act as the BFF. Risk: business logic creeping into the BFF; keep it a thin orchestration layer.

> 🔁 **Follow-up questions**
>
> **Q: How is a BFF different from an API gateway?**
> An API gateway is a generic entry point for routing, auth, and rate limiting. A BFF is specific to one client and shapes data for its screens. They're often used together.
>
> **Q: What problems can a BFF create?**
> Another service to run and monitor, duplicated logic across BFFs for web and mobile, and business rules leaking into it if you're not careful.

</details>

<details>
<summary>How do you handle errors and resilience in a large front end?</summary>

> 🎤 **Mock answer**
>
> I think about resilience in layers. In the UI, I use error boundaries at the route level and around independent widgets, so if the recommendations or reviews section fails, it shows a fallback or disappears instead of crashing the whole page. Every data-driven component has explicit loading, empty and error states, and a retry option.
>
> In the API layer, I have one place that handles errors consistently: typed error objects, timeouts so requests don't hang forever, and retries with backoff only for idempotent requests.
>
> The key principle is graceful degradation. Critical paths, like adding to cart and checkout, must keep working even if non-critical services, such as recommendations, chat or analytics, are down. Forms preserve the user's input on failure, submissions are idempotent, and I detect offline status to show a helpful message.
>
> And then visibility: error monitoring with source maps and release tags, alerts when the error rate spikes after a deployment, and session replay with privacy masking to reproduce issues. Resilience isn't just preventing errors, it's detecting and recovering from them quickly.

- **Error boundaries** at route and widget level, with fallbacks + retry.
- API layer: typed errors, retries with backoff for idempotent calls, timeouts (`AbortSignal.timeout`), circuit-breaker-ish behaviour (hide a non-critical widget).
- **Graceful degradation:** checkout must work even if recommendations/chat/analytics fail.
- Offline detection, form state preservation, idempotent submits.
- **Monitoring:** Sentry/Datadog with source maps, release tagging, user/session context (scrubbed of PII), alerting on error-rate spikes after deploy, session replay for repro (with privacy masking).

> 🔁 **Follow-up questions**
>
> **Q: How do you decide what's critical versus non-critical on a page?**
> Ask what the user came to do. On a product page, the product info, price and add-to-cart are critical. Recommendations, reviews and chat aren't. Critical parts get stronger fallbacks and monitoring; non-critical ones can just disappear on failure.
>
> **Q: How do you surface errors to users without frightening them?**
> Clear, specific, human messages with a next step, like retry or contact support, preserving their input, and never showing technical details or stack traces.

</details>

<details>
<summary>Feature flags and experimentation</summary>

> 🎤 **Mock answer**
>
> Feature flags let you separate deploying code from releasing a feature. You merge and deploy code that's turned off, then enable it for internal users, a percentage of customers, or a specific region or segment. If something goes wrong, you turn it off instantly without a rollback or a new deployment. That's especially valuable for risky changes, like a checkout change before a big device launch.
>
> The same mechanism supports A/B testing: different users see different variants, and you measure the impact on conversion. Tools include LaunchDarkly, Optimizely, Unleash and GrowthBook.
>
> There are a few things to get right. Evaluate flags on the server or at the edge when possible, so users don't see a flicker of the old version, which also causes layout shift. Keep user bucketing consistent between server and client. Test the important flag combinations. And clean up: every flag should have an owner and an expiry date, because old flags turn into hidden technical debt and confusing code paths.

Decouple **deploy** from **release**: ship code dark, enable by % / segment / province, kill-switch on incidents, A/B test variants. Tools: LaunchDarkly, Unleash, Optimizely, AWS AppConfig, Flagsmith, GrowthBook. Concerns: flicker (evaluate flags server-side/at the edge to avoid CLS), flag debt (clean up after rollout, with an owner and expiry), testing combinations, and consistent bucketing across server and client.

> 🔁 **Follow-up questions**
>
> **Q: How do you avoid flicker with client-side A/B tests?**
> Evaluate the flag on the server or at the edge, and render the right variant in the HTML. If you must evaluate on the client, do it before first paint with a cached decision, but server-side is much better.
>
> **Q: How do you clean up flags?**
> Every flag gets an owner and an expiry date when it's created. After full rollout, removing it becomes a ticket, and some tools alert on stale flags.

</details>

<details>
<summary>How do you make architecture decisions as a senior? (process)</summary>

> 🎤 **Mock answer**
>
> I follow a lightweight, written process, because the reasoning matters as much as the choice. First, I clearly define the problem and the constraints, including non-functional requirements like performance, team skills and timeline. Then I write a short RFC or Architecture Decision Record: the context, two or three realistic options with their trade-offs, my recommendation, and the consequences, including what we're giving up.
>
> For risky unknowns, I do a time-boxed spike or prototype to get real data instead of opinions. I share the document with the teams affected and invite feedback, especially from people likely to disagree, since they find the weaknesses. I define how we'll measure success, and plan an incremental rollout with a way to roll back.
>
> The Redux Toolkit migration at Bell followed this pattern: I wrote up the problems with our state management, compared options, proposed RTK with an incremental migration plan, and got buy-in before starting. Once a decision is made, it's documented, so a year later people understand why, not just what.

Write an **RFC / ADR** (Architecture Decision Record): context, problem, options with trade-offs, decision, consequences. Prototype risky parts (spike). Get feedback from affected teams. Define success metrics. Plan an incremental migration (strangler fig) with rollback. Document and socialise. This answer often matters more than the technology choice itself.

> 🔁 **Follow-up questions**
>
> **Q: What if your proposal gets rejected?**
> I make sure I understand why, and if the decision is made by the right people with the trade-offs understood, I commit to it fully. If my concerns are significant, I document them, so we can revisit with data later.
>
> **Q: How do you handle a decision that needs to be made quickly without a full RFC?**
> Make a reversible decision quickly, document it briefly as a lightweight ADR, and note what would make us revisit it. The weight of the process should match how hard the decision is to undo.

</details>

<details>
<summary>Offline support / PWA</summary>

> 🎤 **Mock answer**
>
> Offline support is built on a Service Worker, a script that sits between the app and the network and can serve responses from a cache. I'd use Workbox rather than writing it by hand, with a different strategy per type of resource. Cache-first for hashed static assets, since they never change. Network-first, falling back to cache, for HTML and API data that should be fresh. Stale-while-revalidate for data that can be a little old, like a product catalogue.
>
> For data, IndexedDB stores structured information locally, and background sync can queue actions taken offline and send them when the connection returns. A web app manifest makes the app installable.
>
> The risk I always mention is that a buggy Service Worker can keep serving a broken version of your app from cache, even after you deploy a fix. So I'd include a clear update flow, like showing "a new version is available, reload", and a kill switch to unregister the worker if needed. And I'd question whether full offline support is really needed. For many e-commerce flows, caching assets for faster repeat visits plus a good offline message is enough.

Service Worker (Workbox) caching strategies: **cache-first** for hashed static assets, **network-first** for HTML/API (fall back to cache), **stale-while-revalidate** for semi-static data. A web app manifest for installability, background sync for queued mutations, IndexedDB for data, and an "update available" flow when a new SW is waiting. Be careful: a buggy SW can cache a broken app, so always have a kill switch.

> 🔁 **Follow-up questions**
>
> **Q: How do you update a Service Worker safely?**
> Use versioned caches, clean up old ones on activation, and show the user a prompt to reload when a new version is waiting, instead of forcing a reload in the middle of their work.
>
> **Q: What's background sync?**
> It lets a Service Worker retry queued requests, like a form submission made offline, when connectivity returns, even if the user has closed the tab. Browser support is limited, so you need a fallback.

</details>
