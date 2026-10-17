# Performance & Core Web Vitals

> This is **your strongest area** (the ~20% load-time win at Bell). Be ready to go very deep: metrics, tools, techniques, and how you prevented regressions.

## Core Web Vitals (2024+)

| Metric | Measures | Good | Poor | Main causes |
|---|---|---|---|---|
| **LCP**: Largest Contentful Paint | loading: when the main content appears | ≤ 2.5 s | > 4 s | slow TTFB, render-blocking CSS/JS, unoptimised hero image, client-side rendering |
| **INP**: Interaction to Next Paint | responsiveness: worst-ish latency of clicks/taps/keys over the page's life | ≤ 200 ms | > 500 ms | long JS tasks, heavy re-renders, third-party scripts, big DOM |
| **CLS**: Cumulative Layout Shift | visual stability | ≤ 0.1 | > 0.25 | images without dimensions, late banners/ads, web fonts, injected content |

**INP replaced FID in March 2024.** FID only measured the *delay* of the *first* input; INP covers **all** interactions, including processing and rendering time. Thresholds are judged at the **75th percentile** of real users (mobile and desktop separately).

Supporting metrics: **TTFB** (server/CDN), **FCP**, **TBT** (lab proxy for INP), Speed Index.

<details>
<summary>Lab data vs field data: what's the difference and which matters?</summary>

> 🎤 **Mock answer**
>
> Lab data comes from tools like Lighthouse, WebPageTest or the Chrome Performance panel. You run the page in a controlled environment with a simulated device and network. It's reproducible, which makes it great for debugging and for automated checks in CI, but it isn't what real users experience.
>
> Field data, or real-user monitoring, comes from actual visitors on their own devices and networks. Sources include Google's Chrome UX Report, the `web-vitals` library sending metrics to your analytics, or tools like Datadog, New Relic or Vercel Speed Insights. That's what Google uses for Core Web Vitals in search ranking, judged at the 75th percentile.
>
> So I use them together. Field data tells me whether there's a problem and where: which pages, which devices, which countries. Lab tools help me find out why and verify a fix before it ships. Then I protect the improvement with a budget in CI. They often disagree. A page can score 95 in Lighthouse on a fast laptop but have poor INP for real users on mid-range Android phones.

- **Lab** (Lighthouse, WebPageTest, DevTools): a synthetic, controlled environment. Reproducible, good for debugging and CI gates, but **not real users**.
- **Field / RUM** (CrUX, the `web-vitals` JS library sending to analytics, Datadog/New Relic RUM, Vercel Speed Insights): real devices and networks. **This is what Google ranks on and what users feel.**

Senior answer: "I use field data to know *whether* we have a problem and *where* (which pages, devices). I use lab tools to find *why* and to verify fixes. Then I gate regressions in CI with Lighthouse CI or bundle-size budgets."

```js
import { onLCP, onINP, onCLS } from 'web-vitals';
[onLCP, onINP, onCLS].forEach(fn => fn(metric => navigator.sendBeacon('/rum', JSON.stringify(metric))));
```

> 🔁 **Follow-up questions**
>
> **Q: Why does Lighthouse show a different score each run?**
> Network and CPU variability, background processes, server response time and third-party scripts vary. That's why I use the median of several runs and rely on field data for decisions.
>
> **Q: What percentile does Google use, and why?**
> The 75th percentile, so a page passes only if most real visits are good, not just the average or the fastest users.

</details>

<details>
<summary>How do you improve LCP? (list 8+ techniques)</summary>

> 🎤 **Mock answer**
>
> LCP measures when the largest piece of content, usually the hero image or main heading, appears, and the target is 2.5 seconds or less. I think about it as a chain: getting the HTML, discovering the LCP resource, downloading it, and rendering it. You optimise each link.
>
> For the HTML: a fast server response with CDN caching, static generation or edge rendering, and no client-side redirects. For discovery: render the hero in the server HTML, rather than waiting for JavaScript, and preload the image or use `fetchpriority="high"`, and never lazy-load the LCP image, which is a very common mistake. For download: compress images, use AVIF or WebP at the right size with `srcset`, and preconnect to the image CDN. For rendering: remove render-blocking resources by inlining critical CSS and deferring scripts, optimise web fonts with `font-display` and preloading, and reduce the JavaScript needed before the page renders.
>
> At Bell, lazy-loading below-the-fold content, code splitting and image optimisation together contributed to the roughly 20 percent improvement in load times.

1. **Fast TTFB**: CDN, caching HTML (SSG/ISR), edge rendering, fewer server hops.
2. **Server-render** the LCP element (no "JS must load before the hero shows").
3. **Prioritise the LCP image**: `fetchpriority="high"`, `<link rel="preload">`, **never lazy-load it**.
4. Optimise images: AVIF/WebP, correct dimensions, `srcset`/`sizes`, compression, an image CDN.
5. Remove render-blocking resources: inline **critical CSS**, `defer` scripts, load non-critical CSS async.
6. `preconnect` to critical third-party origins (image CDN, API).
7. Fonts: `font-display: swap` / `optional`, preload the main font, subset, self-host.
8. Reduce JS needed before render: code-split, remove unused deps, ship modern JS.
9. Avoid client-side redirects; use HTTP/2–3 and Brotli compression.

> 🔁 **Follow-up questions**
>
> **Q: What are the sub-parts of LCP?**
> Time to first byte, resource load delay, which is how late the LCP resource is discovered, resource load duration, and element render delay. DevTools shows this breakdown, so you know which part to fix.
>
> **Q: What if the LCP element is text, not an image?**
> Then fonts and render-blocking CSS and JavaScript matter most: inline critical CSS, use `font-display: swap` or a preloaded font, and make sure the text is in the server HTML.
>
> **Q: Why is client-side rendering bad for LCP?**
> The browser must download, parse and run JavaScript, and often fetch data, before the main content exists. Server rendering puts it directly in the HTML.

</details>

<details>
<summary>How do you improve INP?</summary>

> 🎤 **Mock answer**
>
> INP, Interaction to Next Paint, replaced FID in 2024. It measures how quickly the page responds visually to clicks, taps and key presses throughout the entire visit, and the target is under 200 milliseconds. The main cause of poor INP is the main thread being busy with JavaScript.
>
> So the fixes are about reducing and breaking up that work. Long tasks over 50 milliseconds should be split up by yielding to the main thread, with `scheduler.yield` or `setTimeout`. In React, I reduce rendering work per interaction: keep state close to where it's used, avoid re-rendering big trees, virtualise long lists, and use `useTransition` so the urgent update, like the button's pressed state, paints first while heavy work happens after. Heavy computation can move to a Web Worker.
>
> On large enterprise sites, third-party scripts are often the biggest problem: tag managers, analytics, chat widgets and A/B testing tools. Auditing them, deferring them, or removing unused ones can make a bigger difference than any code change.
>
> To debug, I use the Performance panel's interactions track and the Long Animation Frames API in real-user monitoring to find which scripts are responsible.

1. **Break up long tasks** (> 50 ms): yield to the main thread (`scheduler.yield()`, `setTimeout`), chunk work.
2. **Reduce rendering work per interaction**: avoid re-rendering huge trees (state colocation, memoization, selectors), **virtualise long lists**, reduce DOM size.
3. `useTransition` / `useDeferredValue` so urgent updates paint first.
4. Give **immediate visual feedback** (pressed state, spinner), then do the heavy work.
5. Move heavy computation to **Web Workers**.
6. **Audit third-party scripts** (tag managers, chat, A/B tools, analytics): delay them, load them `async`, or remove them. This is often the #1 issue on big corporate sites.
7. Debounce/throttle input handlers; avoid layout thrashing.
8. Hydration cost: less client JS (RSC), progressive/selective hydration.

Debug with: DevTools Performance panel → interactions track → long tasks; the Web Vitals extension; the **LoAF (Long Animation Frames) API** for attribution in RUM.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between INP and TBT?**
> INP is a field metric based on real user interactions. Total Blocking Time is a lab metric measuring how much the main thread was blocked during load, so it's a useful proxy, but not the same thing.
>
> **Q: How do you find which interaction is slow?**
> In the field, the `web-vitals` library's attribution build reports the element, interaction type and the long scripts involved. In the lab, the Performance panel's interactions track shows input delay, processing time and presentation delay.
>
> **Q: What is scheduler.yield?**
> An API that pauses a long task and lets the browser handle pending input and rendering, then continues your task with high priority, which is better than a plain setTimeout that goes to the back of the queue.

</details>

<details>
<summary>How do you improve CLS?</summary>

> 🎤 **Mock answer**
>
> CLS measures unexpected layout shifts, content jumping around while the page loads, and the target is below 0.1. It's frustrating for users, and on an e-commerce site it can cause a misclick on the wrong button.
>
> The most common cause is images, videos or iframes without dimensions, so the browser doesn't reserve space until they load. I always set `width` and `height` or use CSS `aspect-ratio`. Next is dynamic content: promo banners, cookie consent bars, ads, or personalised content injected after render. I reserve space for them with fixed-size containers or skeletons that match the final size, and I never insert content above existing content unless the user asked for it.
>
> Web fonts can cause shifts when they swap in, so I match the fallback font metrics with `size-adjust` or use `next/font`. For animations I use `transform` instead of changing size or position properties.
>
> One that's easy to miss on corporate sites: A/B testing and personalisation scripts that swap content after the page renders. Evaluating those on the server or at the edge avoids the shift.

- Always set `width`/`height` (or CSS `aspect-ratio`) on images, videos and iframes.
- **Reserve space** for dynamic content: banners, promos, cookie consent, ads, skeletons with the right size.
- Don't insert content above existing content (except in response to user input).
- Fonts: `size-adjust` / `next/font` to match fallback metrics; `font-display: optional`.
- Animate with `transform` instead of `top`/`height`.
- Watch late-loading **personalisation/A/B scripts** that swap content after render.

> 🔁 **Follow-up questions**
>
> **Q: Do layout shifts after user interaction count?**
> Shifts within 500 milliseconds of a user input are excluded, because the user expects the page to change. Unexpected shifts later in the session do count.
>
> **Q: How do you debug which element shifted?**
> The Performance panel highlights layout shifts and the elements that moved, and the web-vitals attribution build reports the largest shifting element in the field.

</details>

<details>
<summary>Bundle size: how do you analyse and reduce it?</summary>

> 🎤 **Mock answer**
>
> To analyse, I use a bundle analyzer: webpack-bundle-analyzer, the Vite visualizer plugin, or source-map-explorer. It shows a map of what's in each chunk and how big it is. I also use the Coverage tab in Chrome DevTools to see how much of the loaded JavaScript and CSS is actually used on a page, and I check bundlephobia before adding a new dependency.
>
> To reduce it: route-level code splitting so each page only loads its own code, and lazy-loading heavy components like modals, charts, maps or reviews until they're needed. Make tree-shaking work, by importing only what you need from a library, using ES module builds, and being careful with barrel files that pull in everything. Replace heavy libraries, for example moment with native `Intl` or date-fns. Remove duplicate versions of the same package, and ship modern JavaScript without unnecessary polyfills. With server components, static parts don't ship JavaScript at all.
>
> And most importantly, I add a bundle size budget in CI, so a pull request that adds 100 KB fails the check and has to be discussed. Without that, bundles grow back within a few months.

**Analyse:** `webpack-bundle-analyzer`, `rollup-plugin-visualizer` (Vite), `source-map-explorer`, Next's `@next/bundle-analyzer`, the DevTools Coverage tab (unused JS/CSS), bundlephobia.com before adding deps.

**Reduce:**
- **Route-level code splitting** (`React.lazy` + `Suspense`, dynamic `import()`); split heavy components (charts, editors, maps, modals) and load them on interaction or visibility.
- Tree-shaking: ESM imports (`import debounce from 'lodash-es/debounce'`, not all of lodash). Avoid barrel files that defeat it.
- Replace heavy libs: moment → `Intl`/date-fns/dayjs; big UI kits → headless + CSS.
- Ship modern JS (fewer polyfills); avoid duplicate package versions (`npm dedupe`).
- **Performance budgets** in CI (size-limit, bundlesize, Lighthouse CI) so PRs fail when bundles grow.
- Server Components keep static parts' JS out of the bundle.

> 🔁 **Follow-up questions**
>
> **Q: What's a good JavaScript budget?**
> It depends on the audience, but for mobile e-commerce I'd aim for well under 200 kilobytes compressed of JavaScript on the critical path, and treat any big increase as needing justification.
>
> **Q: How do you find duplicate dependencies?**
> The bundle analyzer shows the same package in several versions, and `npm ls package-name` explains why. Deduping or aligning versions usually fixes it.

</details>

<details>
<summary>Lazy loading: what can be lazy-loaded and how?</summary>

> 🎤 **Mock answer**
>
> Lazy loading means deferring anything that isn't needed for the first view. For code, that means routes and heavy components through dynamic imports: `React.lazy` with Suspense, or `next/dynamic`. Good candidates are modals, image galleries, charts, rich text editors, and below-the-fold sections like reviews and recommendations. I often trigger the load on hover or when the element becomes visible, so it's ready when the user needs it.
>
> Images and iframes can use the native `loading="lazy"` attribute, with the important exception of the hero image, which should load immediately. Third-party widgets like chat or embedded videos can use a facade: a lightweight placeholder that loads the real widget only when clicked. Data can be lazy-loaded with pagination or infinite scroll.
>
> The trade-off is that too much lazy loading creates spinners everywhere and request waterfalls, so the user waits more. The rule is to lazy-load what's not needed for the initial view, and prefetch what's likely to be needed next. At Bell, lazy loading below-the-fold components and route-level splitting were key parts of the load-time improvement.

- **Components / routes**: `React.lazy(() => import('./Reviews'))` + `<Suspense>`. Prefetch on hover/visibility for snappy navigation.
- **Images / iframes**: `loading="lazy"` (native), but never on the LCP image.
- **Below-the-fold sections**: render when visible (IntersectionObserver) or `content-visibility: auto`.
- **Third-party widgets** (chat, video): a facade/placeholder until clicked.
- **Data**: fetch on demand / pagination.

Trade-off: lazy-loading too much causes spinners and waterfalls. Lazy-load what's **not needed for the first view**.

> 🔁 **Follow-up questions**
>
> **Q: What's a request waterfall caused by lazy loading?**
> When a lazy component loads, then fetches its data, then lazy-loads a child that fetches more. Each step waits for the previous one. Preloading the code and starting data fetches in parallel avoids it.
>
> **Q: How do you handle a chunk that fails to load after a deployment?**
> Catch the chunk load error in an error boundary and reload the page once, and keep old chunks available on the CDN for a while after deploying.

</details>

<details>
<summary>Caching strategy for front-end assets</summary>

> 🎤 **Mock answer**
>
> The strategy is built around content hashing. When the build tool puts a hash of the file's contents in the file name, like `app.3f9a1c.js`, the file name changes whenever the content changes. So these assets can be cached for a year with the `immutable` directive: the browser never needs to check them again.
>
> The HTML file is the opposite. It's the entry point that references those hashed files, so it must always be fresh. I serve it with `no-cache`, which means the browser revalidates it every time, or a short CDN cache with `stale-while-revalidate`.
>
> For APIs, I use ETags for conditional requests, and `private` or `no-store` for anything user-specific, so a CDN never caches one user's cart and serves it to someone else. A Service Worker can add offline support and faster repeat visits.
>
> For deployments, the order matters: upload the new hashed assets first, then the new HTML, and keep the old assets for a while. That way, users with the old page open don't hit missing files.

- Build outputs with **content hashes** (`app.3f9a1c.js`) → `Cache-Control: public, max-age=31536000, immutable`.
- **HTML** → `no-cache` (revalidate every time) or short `s-maxage` at the CDN plus `stale-while-revalidate`.
- APIs: `ETag` / `Last-Modified` for conditional requests; `Cache-Control: private` for user data.
- **Service Worker** (Workbox) for offline and repeat visits.
- On deploy, upload new hashed assets **first**, then the HTML, so users never get HTML pointing at missing files. Invalidate only the HTML at the CDN.

> 🔁 **Follow-up questions**
>
> **Q: What does stale-while-revalidate do?**
> It lets a cache serve a stale response immediately while fetching a fresh one in the background, so users get speed and data updates on the next request.
>
> **Q: What's the difference between no-cache and no-store?**
> `no-cache` lets the response be stored but requires revalidation before each use. `no-store` means never store it at all, which is for sensitive data.

</details>

<details>
<summary>Resource hints: preload, prefetch, preconnect, dns-prefetch, modulepreload</summary>

> 🎤 **Mock answer**
>
> Resource hints tell the browser about resources it will need before it would discover them itself. `preconnect` sets up the DNS lookup, TCP connection and TLS handshake early, for a critical third-party origin like an image CDN or API. `dns-prefetch` does just the DNS lookup, which is cheaper and is a good fallback.
>
> `preload` fetches a specific resource needed for the current page with high priority, like the hero image or the main web font. `modulepreload` does the same for JavaScript modules. `prefetch` downloads, at low priority, resources likely to be needed for the next navigation. And the newer Speculation Rules API can prerender a likely next page entirely.
>
> The caution is to use them sparingly. If you preload ten things, they compete for bandwidth with the truly critical resources and can make things slower. I usually preload one to three critical resources and verify the effect in the network waterfall.

- `preconnect`: early DNS+TCP+TLS to a critical origin.
- `dns-prefetch`: DNS only (cheap fallback).
- `preload`: fetch a resource needed **for the current page** soon (LCP image, critical font) with high priority.
- `prefetch`: low-priority fetch for the **next navigation**.
- `modulepreload`: preload ES modules plus their parsing.
- **Speculation Rules API**: prerender likely next pages (Chrome).

Overusing preload competes with critical resources, so preload only 1–3 things.

> 🔁 **Follow-up questions**
>
> **Q: How would you verify a preload helped?**
> Compare the network waterfall and LCP before and after. The resource should start downloading earlier. Also check the console for "preloaded but not used" warnings.
>
> **Q: What's fetchpriority?**
> An attribute that adjusts the priority of a single resource, like `high` for the hero image or `low` for a below-the-fold carousel image, without forcing an extra preload.

</details>

<details>
<summary>Rendering huge lists: what do you do?</summary>

> 🎤 **Mock answer**
>
> If I need to show thousands of rows, rendering them all creates a huge DOM, which makes the initial render slow, uses a lot of memory and makes every interaction slower. The standard solution is virtualisation, also called windowing: only render the rows visible in the viewport plus a small buffer, and reuse them as the user scrolls. Libraries like TanStack Virtual or react-window handle this.
>
> The challenges are variable row heights, which need measuring, keeping the scroll position when navigating back, and accessibility. Screen readers only see the rendered rows, so I add attributes like `aria-rowcount` and `aria-setsize`. The browser's find-in-page also won't find rows that aren't rendered.
>
> Before virtualising, I'd question whether the user really needs thousands of rows at once. Pagination, a "load more" button, or better filtering and search might be the better UX. And there's a lighter CSS option, `content-visibility: auto`, which lets the browser skip rendering work for off-screen content.

**Virtualisation / windowing**: render only visible rows plus a buffer (TanStack Virtual, react-window). That means constant DOM size and smooth scrolling. Considerations: variable row heights, keeping scroll position, a11y (screen readers only see rendered rows, so provide `aria-rowcount`/`aria-setsize`), and in-page search (Ctrl+F) doesn't find hidden rows. Alternatives: pagination, "load more", or CSS `content-visibility: auto`.

> 🔁 **Follow-up questions**
>
> **Q: How does virtualisation handle variable row heights?**
> It estimates heights first, measures rows after they render, caches the measurements, and adjusts the scroll positions. TanStack Virtual supports dynamic measurement.
>
> **Q: What does content-visibility: auto do?**
> It lets the browser skip layout and paint for off-screen content until it's near the viewport. Combine it with `contain-intrinsic-size` so the scrollbar doesn't jump.

</details>

<details>
<summary>Images: the complete checklist</summary>

> 🎤 **Mock answer**
>
> Images are usually the largest part of a page's weight, so I treat them as a checklist. First the right format: AVIF or WebP for photos, with fallbacks, and SVG for icons and logos. Then the right size: responsive images with `srcset` and `sizes`, so a phone doesn't download a desktop-sized image, plus good compression.
>
> To prevent layout shift, always set width and height, or an aspect ratio. Lazy-load images below the fold, but give the hero image `fetchpriority="high"` and never lazy-load it, since it's usually the LCP element. `decoding="async"` helps avoid blocking the main thread.
>
> For a large catalogue like Bell's device listings, an image CDN that resizes and converts images on the fly is the way to go, so content editors can upload one high-quality image and every device gets an optimised version. And `picture` lets you serve a different crop for mobile and desktop.

Right format (AVIF > WebP > JPEG; SVG for icons), right size (`srcset` + `sizes`), compression, `width`/`height`, lazy below the fold, `fetchpriority="high"` for the hero, `decoding="async"`, an image CDN (Cloudinary, imgix, CloudFront + Lambda@Edge / Next image optimiser), and responsive art direction with `<picture>`.

> 🔁 **Follow-up questions**
>
> **Q: What does the sizes attribute do?**
> It tells the browser how wide the image will be displayed at different viewport widths, so it can choose the right file from `srcset` before CSS loads.
>
> **Q: Why is lazy-loading the hero image bad?**
> Lazy images start loading late, after layout, which delays the largest contentful paint, often by hundreds of milliseconds.

</details>

<details>
<summary>Walk me through your Bell performance work (deep dive)</summary>

> 🎤 **Mock answer**
>
> Sure. The product pages on Bell's e-commerce site were slow on mobile, which matters because most of the traffic is mobile, and load time affects both conversion and SEO. [Our Lighthouse performance score was around X, and LCP was around Y seconds on mobile.]
>
> I started by measuring rather than guessing. I used Lighthouse and the Chrome Performance panel, and ran a bundle analyzer, which showed that [we were shipping one large JavaScript bundle with code for every page, including some heavy libraries]. Images weren't optimised, and there was unused CSS.
>
> Then I prioritised by impact versus effort. I added route-level code splitting with `React.lazy` and Suspense, and lazy-loaded components below the fold and in modals, so the initial bundle only contained what the first view needed. I optimised images: lazy loading for off-screen images, correct sizes, and explicit dimensions to prevent layout shift, while making sure the hero image wasn't lazy. I fixed our Tailwind configuration so unused classes were purged properly, and removed duplicated legacy CSS. [I also replaced or trimmed some heavy dependencies.]
>
> The result was roughly a 20 percent improvement in load times, plus better Core Web Vitals. [LCP went from X to Y.] To stop it regressing, [we added a Lighthouse or bundle-size check to the pipeline]. If I continued, the next steps would be server rendering for product pages and deeper INP work on third-party scripts.

Use **Story 1** from *Your Story*. Structure:

1. **Baseline**: which pages, which metrics (Lighthouse score, LCP, bundle size, [CrUX/RUM]).
2. **Diagnosis**: bundle analyzer showed [X]; the Performance panel showed [long tasks from Y]; images were [Z].
3. **Fixes, prioritised by impact/effort**: code splitting + lazy loading, image optimisation, Tailwind content purge / removing dead CSS, removing heavy deps, [deferring third-party tags].
4. **Result**: ~20% faster loads, [LCP X→Y], better Core Web Vitals and SEO.
5. **Guardrails**: [Lighthouse CI / bundle budget / dashboard], so it didn't regress.
6. **What you'd do next**: SSR/RSC for product pages, INP work on third-party scripts, image CDN.

Expect: "How did you know it was the bundle and not the API?" → the waterfall in the Network panel, TTFB vs download vs scripting time in the Performance panel.

> 🔁 **Follow-up questions**
>
> **Q: Which single change had the biggest impact?**
> [Real answer.] For example: "Route-level code splitting, because the initial bundle had code for every page. Splitting it cut the JavaScript on the product page by [X percent]."
>
> **Q: How did you prioritise what to fix?**
> By estimated impact on the metrics against effort and risk. Quick, low-risk wins like image fixes went first, and larger changes like code splitting went through more testing.
>
> **Q: Did it affect business metrics?**
> [Only if you know.] If you have data: "[conversion / bounce rate] improved by X." If not, be honest: "I didn't have direct access to conversion data, but faster pages are well documented to improve conversion, and our SEO-relevant metrics improved."

</details>
