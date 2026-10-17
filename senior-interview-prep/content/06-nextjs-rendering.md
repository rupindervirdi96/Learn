# Next.js & Rendering Strategies

> Next.js is on your résumé. Expect "CSR vs SSR vs SSG vs ISR", "App Router vs Pages Router" and "how does caching work". Versions: **Next 15** (Oct 2024: React 19, async request APIs, caching off by default for fetch), **Next 16** (Oct 2025: **Turbopack default**, **Cache Components / `"use cache"`**, `middleware.ts` → `proxy.ts`). Confirm the latest before the interview.

## Rendering strategies

| Strategy | When HTML is made | Pros | Cons | Use for (Bell examples) |
|---|---|---|---|---|
| **CSR** (SPA) | in the browser | simple hosting (static), rich interactivity | slow first paint, SEO risk, big JS | logged-in dashboards, My Account |
| **SSR** | per request on the server | fresh + SEO + fast FCP | server cost, TTFB, hydration cost | personalised pages, cart |
| **SSG** | at build time | fastest, CDN-cacheable, cheap | stale until rebuild | marketing, help articles |
| **ISR** | at build + regenerated after N s / on demand | static speed + freshness | eventual consistency | product/plan pages, promos |
| **Streaming SSR** | server sends HTML in chunks | fast first byte, progressive | complexity | product page with slow reviews/recommendations |
| **RSC** | server components rendered on server | zero JS for static parts | new mental model | most of a content/product page |
| **Partial Prerendering (PPR)** | static shell at build + dynamic holes streamed | best of both | newer | product page shell static, price/stock/cart dynamic |
| **Islands** (Astro) | static HTML + isolated interactive islands | minimal JS | less app-like | content sites |

<details>
<summary>Explain CSR vs SSR vs SSG vs ISR in one minute</summary>

> 🎤 **Mock answer**
>
> With client-side rendering, the server sends an almost empty HTML page and JavaScript builds the UI in the browser. It's simple to host and great for app-like experiences behind a login, but the first paint is slower and SEO is weaker.
>
> Server-side rendering generates the HTML on each request, so users and search engines get real content immediately, and the data is always fresh. The cost is server work per request and a higher time to first byte.
>
> Static site generation renders pages at build time and serves them from a CDN, which is the fastest and cheapest option, but the content is only as fresh as the last build.
>
> Incremental static regeneration is the middle ground: pages are static, but they regenerate in the background after a set time, or on demand, for example when a price changes in the CMS.
>
> In practice you mix them per route. For a site like Bell's, I'd use static or ISR for marketing and product pages, SSR or streaming for personalised content like the cart, and client rendering for the logged-in account area.

"With **CSR** the server sends an empty shell and JS builds the page, which is great for app-like experiences behind login but slower first paint and weaker SEO. **SSR** renders HTML per request, giving fresh, SEO-friendly content but costing server time per request. **SSG** renders at build time and serves from a CDN, the fastest option, but content can go stale. **ISR** is SSG that regenerates pages in the background after a revalidate period or on demand, for example when a price changes in the CMS. In practice you **mix them per route**: SSG/ISR for marketing and product pages, SSR/streaming for personalised content, CSR for highly interactive authenticated tools."

> 🔁 **Follow-up questions**
>
> **Q: Which would you choose for a product details page with frequently changing prices?**
> ISR or a static shell with the product content cached, plus price and stock rendered dynamically or fetched on the client, which is what partial prerendering does. Prices must also be revalidated on demand when they change, and always confirmed server-side at checkout.
>
> **Q: What's the downside of SSR for every page?**
> Every request hits the server, which costs money, increases TTFB under load, and makes traffic spikes, like launch days, harder to handle. Caching wherever possible is better.

</details>

<details>
<summary>App Router vs Pages Router</summary>

> 🎤 **Mock answer**
>
> The Pages Router is the original Next.js model. Each file in `pages` is a route, data is loaded with functions like `getServerSideProps` or `getStaticProps`, and every component ends up as a client component that gets hydrated.
>
> The App Router is built on React Server Components. Components are server components by default, so they can be async and fetch data directly, and you opt into interactivity with `'use client'`. Layouts are nested and persist across navigation, so a sidebar doesn't re-render or lose state. There are special files for loading states and error boundaries, which use Suspense and error boundaries under the hood, plus streaming, Server Actions for mutations, and more advanced routing like parallel and intercepting routes.
>
> The main benefit is shipping less JavaScript and fetching data closer to where it's used. The trade-off is a new mental model and caching behaviour that the team needs to learn. Both routers can coexist, so migration can be done page by page.

| Pages Router (`pages/`) | App Router (`app/`) |
|---|---|
| `getServerSideProps`, `getStaticProps`, `getStaticPaths` | `async` Server Components fetch directly; `generateStaticParams` |
| All components are client components (hydrated) | **Server Components by default**; `'use client'` opt-in |
| `_app`, `_document` | nested `layout.tsx`, `template.tsx` |
| Custom loading UI | `loading.tsx` (Suspense), `error.tsx` (error boundary), `not-found.tsx` |
| API routes `pages/api` | Route Handlers `app/api/x/route.ts` + **Server Actions** |
| | Streaming, nested layouts that persist state, parallel & intercepting routes |

Migration is incremental: both routers can coexist.

> 🔁 **Follow-up questions**
>
> **Q: What happens to layouts on navigation?**
> Shared layouts don't re-render or lose state when you navigate between pages under them; only the changed segment renders.
>
> **Q: How would you migrate a large Pages Router app?**
> Incrementally. Both routers work side by side, so I'd move routes one at a time, starting with simple or high-value pages, and shared components would need client boundaries where they use hooks.

</details>

<details>
<summary>How does caching work in the Next.js App Router?</summary>

> 🎤 **Mock answer**
>
> I'd describe it in layers, and mention that the defaults have changed between versions. First, request memoization: identical fetch calls during one render are deduplicated. Second, the data cache, which persists fetch results across requests. In Next 15, fetch isn't cached by default anymore, so you opt in with `force-cache` or a `revalidate` time and tags. Third, the full route cache, which stores the rendered HTML and payload for static routes. And fourth, the client-side router cache, which keeps visited pages in memory for fast back and forward navigation.
>
> For invalidation, you can revalidate on a timer, or on demand with `revalidateTag` or `revalidatePath`, for example from a CMS webhook when a promotion changes.
>
> In Next 16, the direction is explicit caching with the `"use cache"` directive and cache lifetime and tag helpers, where dynamic is the default and you choose what to cache. I think that's the right direction. My general principle is that caching should be explicit, and every cache needs a clear invalidation story, otherwise you get stale prices on an e-commerce site, which is a real business problem.

Layers (it changed between versions, so explain concepts and state the version):
1. **Request memoization**: the same `fetch` in one render pass is deduped.
2. **Data cache**: persisted fetch results across requests. In **Next 15**, `fetch` is **not cached by default**; opt in with `cache: 'force-cache'` or `next: { revalidate: 60, tags: ['plans'] }`.
3. **Full route cache**: static routes' HTML + RSC payload at build time.
4. **Router cache (client)**: RSC payloads of visited routes held in the browser for instant back/forward.

Invalidation: time-based `revalidate`, on-demand `revalidateTag('plans')` / `revalidatePath('/plans')` from a webhook or Server Action.

**Next 16 / Cache Components:** an explicit `"use cache"` directive on functions/components plus `cacheLife` / `cacheTag`. Dynamic is the default and caching is opt-in. Senior point: **explicit caching beats magic caching**, and you need a clear invalidation story (e.g. a CMS webhook calls `revalidateTag`).

> 🔁 **Follow-up questions**
>
> **Q: How do you invalidate a cached product page when its price changes in the CMS?**
> Tag the data fetches with something like the product ID, and have the CMS call a webhook route that calls `revalidateTag` for that product. The next request gets fresh data.
>
> **Q: Why did Next.js 15 change the fetch default?**
> Developers were surprised by aggressive caching that showed stale data. Making it uncached by default and caching explicitly is more predictable.

</details>

<details>
<summary>What is middleware (proxy in Next 16) used for?</summary>

> 🎤 **Mock answer**
>
> Middleware, renamed proxy in Next 16, is code that runs before a request reaches a page or route, often at the edge, close to the user. It can redirect, rewrite, or modify request and response headers.
>
> Typical uses: authentication checks that redirect to login, A/B test bucketing, adding security headers, bot protection, geolocation-based logic, and locale detection. For a bilingual site like Bell's, a good example is reading the `Accept-Language` header or a language cookie and sending the user to the English or French version of the page. Province-based pricing could also be routed this way.
>
> The important constraint is that it runs on every matching request, so it has to be fast. I avoid heavy database calls there, limit it to the routes that need it with a matcher, and keep the logic simple.

Code that runs **before** a request is handled, often at the **edge**: auth redirects, **locale detection** (`/en` vs `/fr` from `Accept-Language` or a cookie, very relevant to Bell), A/B test bucketing, geolocation (province-based pricing), bot protection, and rewrites. Keep it fast: no heavy DB calls.

> 🔁 **Follow-up questions**
>
> **Q: Should you do authentication only in middleware?**
> No. Middleware is good for a quick redirect, but authorisation must also happen in the data layer, in server components, route handlers and server actions, because middleware can be misconfigured or bypassed.
>
> **Q: How do you limit which routes run it?**
> With the `matcher` config, excluding static assets and images, so it only runs where it's needed.

</details>

<details>
<summary>Image, font and script optimisation in Next.js</summary>

> 🎤 **Mock answer**
>
> Next.js has three built-in components that address the most common performance problems.
>
> The `Image` component generates responsive image sizes with `srcset`, serves modern formats like WebP and AVIF, lazy loads by default, and requires dimensions, which prevents layout shift. For the hero image, which is usually the LCP element, I mark it as priority so it's preloaded and not lazy loaded.
>
> `next/font` downloads Google or local fonts at build time and serves them from your own domain, so there's no extra request to a third party, and it adjusts fallback font metrics to avoid layout shift when the font loads.
>
> The `Script` component controls when third-party scripts load: after the page becomes interactive, during idle time, or even in a web worker. On large corporate sites, third-party tags like analytics, chat widgets and A/B testing tools are often the biggest cause of poor INP, so controlling their loading strategy makes a measurable difference.

- `next/image`: responsive `srcset`, lazy by default, modern formats, prevents CLS (requires width/height or `fill`), `priority` for the LCP image (`preload` in newer versions).
- `next/font`: self-hosts Google fonts at build time, no layout shift (`size-adjust`), no external request.
- `next/script`: `strategy="afterInteractive" | "lazyOnload" | "worker"` for third-party tags (analytics, chat widgets). **Third-party scripts are a top cause of poor INP on enterprise sites.**

> 🔁 **Follow-up questions**
>
> **Q: What does priority do on next/image?**
> It preloads the image and disables lazy loading. Use it for the LCP image, typically the hero above the fold, and nowhere else.
>
> **Q: How would you load a chat widget without hurting performance?**
> With the Script component's `lazyOnload` strategy, or better, a facade button that only loads the widget when the user clicks it.

</details>

<details>
<summary>Edge runtime vs Node runtime</summary>

> 🎤 **Mock answer**
>
> The edge runtime runs code in lightweight V8 isolates distributed close to users around the world. It starts almost instantly and has low latency, but it only supports a subset of Node APIs, has size limits, and can't use many database drivers. The Node runtime runs in a regular server or serverless function with the full Node ecosystem.
>
> I'd use the edge for fast, lightweight logic: redirects, authentication checks, personalisation, A/B testing and locale routing. I'd use Node for anything heavy or anything that talks to a database or uses Node-specific libraries.
>
> The subtle trade-off worth mentioning: running at the edge doesn't help if the code then makes several calls to a database in a single region. Each of those round trips crosses the distance, and it can end up slower than running in a region next to the data.

**Edge**: V8 isolates close to users, fast cold starts, limited APIs (no full Node, size limits). Good for middleware, personalisation, redirects and light APIs. **Node**: full ecosystem, DB drivers, heavier work. Don't put the edge function far from the database, because every DB round-trip then crosses regions, which is slower overall.

> 🔁 **Follow-up questions**
>
> **Q: Can you use Prisma or a normal Postgres driver at the edge?**
> Traditional TCP-based drivers generally don't work in edge runtimes. You need HTTP-based or edge-compatible drivers, or keep that code on the Node runtime.

</details>

<details>
<summary>SEO for a React app: what matters?</summary>

> 🎤 **Mock answer**
>
> The most important thing is that the content is in the HTML the server sends, through SSR or static generation, so search engines and social media previews see real content without needing to execute JavaScript.
>
> Then the technical basics: a unique title and meta description per page, canonical URLs to avoid duplicate content, `hreflang` tags linking the English and French versions, which matters a lot for a bilingual site like Bell's, a sitemap and robots file, clean URLs, and real anchor links for navigation instead of click handlers.
>
> Structured data with JSON-LD helps too, for example the `Product` and `Offer` schemas, which can show prices and ratings in search results.
>
> And performance is part of SEO, because Core Web Vitals are a ranking signal. So the performance work we did at Bell, improving load times, wasn't just about user experience, it also supported search visibility for product pages.

- **Server-rendered HTML** (SSR/SSG) so crawlers and social previews see the content.
- Unique `<title>`, meta description, **canonical URLs**, `hreflang` for EN/FR alternates.
- Structured data (JSON-LD: `Product`, `Offer`, `BreadcrumbList`).
- `sitemap.xml`, `robots.txt`, clean URLs, real `<a href>` links (not `onClick` navigation).
- **Core Web Vitals** are a ranking signal.
- Semantic HTML with one `h1` and a heading hierarchy.

> 🔁 **Follow-up questions**
>
> **Q: Does Google execute JavaScript?**
> Yes, but rendering is deferred and can be delayed, and other crawlers and social previews often don't execute JavaScript at all. Server-rendered HTML is the reliable approach.
>
> **Q: How do hreflang tags work?**
> Each language version of a page lists all versions with their language and region, like en-CA and fr-CA, including itself, so search engines show the right language to the right users.

</details>

<details>
<summary>When would you NOT use Next.js?</summary>

> 🎤 **Mock answer**
>
> Next.js is great when you need SEO, server rendering, or a mix of rendering strategies. But it's not always the right choice.
>
> For an internal admin tool or a dashboard behind login, with no SEO needs, a single-page app with Vite and React Router is simpler. It's just static files, so it can be hosted anywhere cheaply, with no server to run. The same goes for an embeddable widget that's dropped into other sites.
>
> I'd also think about the team. Next.js, especially the App Router and server components, adds concepts and operational complexity like running Node servers and handling caching. If the team can't support that, a simpler setup may be better. Some companies also worry about being tied to Vercel's hosting, though Next.js can be self-hosted with Docker or adapters for AWS.
>
> Good alternatives depending on the case: React Router v7, which is what Remix became, TanStack Start, or Astro for content-heavy sites that need very little JavaScript.

An internal admin tool or SPA behind login with no SEO needs (Vite + React Router is simpler, static hosting, no server). Embedded widgets. A team without capacity to operate server infrastructure. Heavy vendor lock-in concerns (though Next can self-host via Docker/Node, or use OpenNext adapters on AWS). Alternatives: **React Router v7 (Remix)**, **TanStack Start**, **Astro** (content sites).

> 🔁 **Follow-up questions**
>
> **Q: What would you choose for an internal dashboard?**
> Vite with React and React Router or TanStack Router, a query library for data, and static hosting. Simple, fast to build, nothing to operate.

</details>

<details>
<summary>Build tooling: Vite vs webpack vs Turbopack; what does a bundler do?</summary>

> 🎤 **Mock answer**
>
> A bundler takes your source code and turns it into optimised files for the browser. It follows imports to build a dependency graph, transforms TypeScript and JSX, removes unused code with tree-shaking, splits the code into chunks so pages load only what they need, minifies, and adds content hashes to file names so they can be cached long-term.
>
> Vite has become the default for new single-page apps. In development it serves native ES modules without bundling, so the server starts instantly and hot reload is fast. For production, it bundles with Rollup, which is being replaced by Rolldown, written in Rust.
>
> Webpack is the mature, highly configurable option that most older enterprise apps use, and it has Module Federation for micro-frontends, but it's slower. Rspack is a Rust rewrite with a webpack-compatible API, which makes it an easy way to speed up big webpack projects. And Turbopack is the Rust bundler from Vercel, which is the default in Next.js 16.
>
> The trend is clear: tooling is moving to Rust for speed, and I'd choose based on the framework and how much existing configuration there is to migrate.

A bundler resolves the module graph, transforms code (TS/JSX via esbuild/SWC/Babel), **tree-shakes**, **code-splits** into chunks, minifies, adds content **hashes** to file names for caching, and generates source maps.

- **Vite**: native ESM dev server (no bundling in dev, so instant start + fast HMR); production builds with Rollup (moving to **Rolldown**, Rust). The default for new SPAs.
- **webpack**: mature, hugely configurable, **Module Federation** (micro-frontends). Slower.
- **Turbopack**: Rust, Next.js default since v16.
- **Rspack**: Rust, webpack-compatible API, an easy migration path for big webpack apps.

> 🔁 **Follow-up questions**
>
> **Q: Why is Vite fast in development?**
> It doesn't bundle your app in development. It serves source files as native ES modules and transforms them on demand with esbuild, so startup doesn't depend on app size, and hot module replacement only updates the changed module.
>
> **Q: What is tree-shaking and what breaks it?**
> Removing unused exports from the bundle based on static ES module imports. It breaks with CommonJS modules, modules with side effects, and dynamic access patterns like importing everything as a namespace and using it dynamically.
>
> **Q: What's Module Federation?**
> A webpack feature, also available for Rspack and Vite, that lets separately built apps load code from each other at runtime and share dependencies. It's the main technical foundation for runtime micro-frontends.

</details>
