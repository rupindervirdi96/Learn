# Your Story — Background, Pitch & STAR Stories

> ⚠️ **Read this first.** This chapter is built from your actual résumé: LGS (an IBM company) consultant at **Bell**, *Front End Developer Jan 2022 – Mar 2025*, *Senior Full Stack Developer Apr 2025 – present*, working on Bell's e-commerce site. Wherever you see **[brackets]**, replace them with your real details. Senior interviewers drill 3–4 levels deep on every claim ("how did you measure that 20%?"). **Only say what you actually did.** If a detail below doesn't match your real project, change it or drop it.

## Your profile in one view

| | |
|---|---|
| **Current role** | Senior Full Stack Developer, LGS (an IBM company), consultant on Bell's digital/e-commerce team (Apr 2025 – present) |
| **Previous role** | Front End Developer, same engagement (Jan 2022 – Mar 2025) |
| **Bell tenure** | ~4.5+ years on the same product, a strong signal of depth and trust |
| **Earlier** | Front End Developer, Enrage Tech, India (2015 – 2018), multiple client projects |
| **Total front-end experience** | ~7–8 years |
| **Education** | AEC IT Programmer Analyst, Collège LaSalle (Montréal); Bachelor's in Computer Science, Guru Nanak Dev University |
| **Core stack** | React, Next.js, TypeScript, JavaScript, Redux Toolkit, Tailwind CSS, Node.js, NestJS, Express, PostgreSQL, MongoDB |
| **Quality** | Jest, React Testing Library, Cypress |
| **Wins (résumé)** | ~20% faster load times; ~30% fewer production bugs; Redux Toolkit refactor; REST integration for filtering, cart and checkout; Core Web Vitals improvements |
| **Bonus** | AI integration: OpenAI API, embeddings, vector DB (Supabase/pgvector), RAG |

## The Bell context (what you can talk about)

The Bell e-commerce platform is a strong senior story because telecom e-commerce is **harder than a normal store**:

- **Complex products:** phones plus rate plans plus add-ons; internet/TV bundles; promotions that depend on region, customer type and existing services.
- **Serviceability checks:** "Is Fibe internet available at this address?" means async address lookup, debouncing and error states.
- **Checkout with real-world constraints:** identity and credit checks, existing-customer login, porting a number, delivery or store pickup, appointment booking for installation.
- **Bilingual (EN/FR):** Canadian requirements and Quebec French-language law, so i18n is core, not an afterthought. French strings are often ~20–30% longer, which affects layouts.
- **Accessibility:** telecom is federally regulated, so the *Accessible Canada Act* applies, plus *AODA* in Ontario. Target **WCAG 2.1 AA** or better.
- **Scale and traffic spikes:** device launch days and Black Friday / Boxing Day. Performance and caching matter.
- **Many teams, one site:** shared design system, shared header/footer, multiple squads, release trains and QA cycles. This is perfect material for system-design and leadership questions.
- **SEO:** product and plan pages must rank, so SSR/SSG and Core Web Vitals matter for revenue.

> 🔧 **[Fill in]** Which parts did *you* own? e.g. [product listing + filters], [cart], [checkout steps], [plan selector], [serviceability check], [shared component library]. How many devs were on your squad? [ ] What was the release cadence? [ ] Which backend did you call: REST microservices, a BFF, or a commerce platform? [ ]

### A simple architecture you can draw (adapt it to reality)

```
 Browser (React SPA / Next.js pages, EN/FR)
    │  HTTPS
    ▼
 CDN (static assets, cached HTML for marketing pages)
    │
    ▼
 Web/BFF layer (Node)  ── auth/session ──► Identity (login, SSO)
    │  REST/JSON
    ├──► Catalog service (devices, plans, prices, promos)
    ├──► Serviceability service (address → available products)
    ├──► Cart service
    ├──► Checkout / Order service ──► Credit check, payment, fulfilment
    └──► Content (CMS) for marketing copy, banners, legal text

 Front end: React + Redux Toolkit (cart/checkout state), Tailwind, shared components
 Quality: Jest + RTL (unit/integration), Cypress (E2E critical paths), CI pipeline
 Observability: [Analytics tag manager / Adobe / GA], [error monitoring], Lighthouse/CWV
```

> 🔧 Replace any box that doesn't exist in your project. Interviewers love it when you can **draw your current system from memory** and point to the part you changed.

## Handling "LGS / IBM / Bell": how to explain it

> "I'm employed by LGS, which is an IBM company, and I've been embedded full-time on Bell's digital e-commerce team for about four and a half years. Day-to-day I work like any Bell team member: same squad, same standups, same codebase and release process. In April 2025 I was promoted to Senior Full Stack Developer on the same engagement."

Why it's good: it removes the "just a contractor" doubt and shows that **long tenure plus a promotion means the client trusted you**.

## Handling the 2018–2022 gap

> "In 2018 I moved to Canada. I completed the IT Programmer Analyst program at Collège LaSalle in Montréal to get Canadian credentials and modernise my stack (React, Node, MongoDB), and then joined LGS/IBM on the Bell account in January 2022."

> 🔧 Adjust it to what actually happened. Keep it short, positive and forward-looking.

## "Tell me about yourself": 60-second version

> "I'm a front-end-focused full-stack developer with about eight years of experience, the last four and a half on Bell's e-commerce platform through LGS, an IBM company.
>
> At Bell I build the customer-facing shopping experience in React: product listing and filtering, cart and checkout. I've done a lot of work on performance and code quality. I led a refactor of our legacy state management to Redux Toolkit, and I improved Core Web Vitals with code splitting, lazy loading and CSS optimisation, which cut load times by roughly 20%. I also worked closely with QA to build out Jest and Cypress automation, which reduced production bugs by around 30%.
>
> In 2025 I was promoted to Senior Full Stack Developer, so now I also work on the Node/Nest side and mentor other developers. Recently I've been integrating AI features using the OpenAI API and RAG.
>
> I'm looking for a senior front-end role where I can own architecture and performance for a product at scale, which is why this role caught my attention."

## "Tell me about yourself": 2-minute version (add these beats)

1. **Origin** (10 s): started in 2015 at Enrage Tech building responsive sites and React components for multiple clients. *Learned to ship for real clients fast.*
2. **Bell, Front-End years** (40 s): owned [features]. Biggest technical wins: RTK refactor, API integration for filter/cart/checkout, performance.
3. **Bell, Senior years** (30 s): full-stack ownership, [Nest/Node BFF endpoints], code reviews, mentoring [N] developers, [setting standards: lint rules, testing patterns, PR template].
4. **Current interest** (20 s): AI features, plus [performance/design systems/DX].
5. **Why them** (20 s): one specific thing about their product or tech.

## STAR stories (prepare at least 8)

Structure: **S**ituation (1–2 sentences) → **T**ask (your responsibility) → **A**ction (60% of the time; say *I*, not *we*) → **R**esult (number + learning).

### Story 1: Performance, ~20% faster load times ⭐ (your flagship)

- **S:** Bell's [product listing / device pages] were slow on mobile. The Lighthouse performance score was [~X] and LCP was [~X s]. That hurts conversion and SEO, and most traffic is mobile.
- **T:** I was asked to [improve page performance / own the perf initiative] for [the shop pages].
- **A:**
  - **Measured first:** Lighthouse plus Chrome DevTools Performance panel, [real-user data from analytics/CrUX], and a bundle analyzer (webpack-bundle-analyzer / `source-map-explorer`).
  - Found [one huge JS bundle; heavy libraries (e.g. full lodash / moment); unoptimised hero images; large CSS].
  - **Route-level code splitting** with `React.lazy` + `Suspense`; lazy-loaded below-the-fold components (reviews, recommendations) and modals.
  - **Images:** lazy-loaded off-screen images, responsive `srcset`, modern formats (WebP/AVIF), explicit width/height to stop CLS. Hero image *not* lazy, with `fetchpriority="high"`.
  - **Tailwind:** made sure purge/content config was correct so unused classes were stripped; removed duplicated legacy CSS.
  - Replaced/trimmed heavy dependencies; tree-shaking-friendly imports.
  - Added [a performance budget / Lighthouse CI check] so it wouldn't regress.
- **R:** load times down ~**20%**, [LCP from X to Y], [CLS under 0.1], better Core Web Vitals and SEO. **Learning:** measure before and after, and protect the gains with automated budgets.

**Expect follow-ups:** "How did you measure 20%?", "What's LCP/INP/CLS?", "What did NOT work?", "How did you prevent regressions?" → see the Performance chapter.

### Story 2: Legacy state → Redux Toolkit refactor

- **S:** Cart/checkout state was spread across [classic Redux with lots of boilerplate / prop drilling / duplicated local state]. Bugs came from out-of-sync data (e.g. cart count wrong after promo applied).
- **T:** Simplify state management without stopping feature delivery.
- **A:**
  - Proposed it to the team with a short write-up: problems, options (keep, RTK, Context, Zustand, React Query), and why RTK fit (team already knew Redux, DevTools, Immer, standard patterns).
  - **Incremental migration:** one slice at a time (`createSlice`), with new and old code coexisting. Started with the [cart] slice.
  - `createAsyncThunk` [or RTK Query] for API calls with standard loading/error states; normalised entities with `createEntityAdapter`.
  - Memoised selectors (`createSelector`) to cut re-renders.
  - Wrote tests per slice; paired with teammates on the first migrations; documented the pattern.
- **R:** [~X% less state code], fewer sync bugs, faster onboarding. **Learning:** big refactors succeed when they're incremental, documented and shipped alongside features.

### Story 3: REST API integration for filtering, cart and checkout

- **S:** New [filtering / cart / checkout] features depended on backend services built in parallel by other teams.
- **T:** Integrate the front end without being blocked, and make it resilient.
- **A:**
  - Agreed on the **API contract** early (OpenAPI/Swagger or a shared JSON example) and built against **mocks** (MSW / mock server) until the backend was ready.
  - Built a typed API layer (one place for base URL, headers, auth, error mapping).
  - Filters synced to the **URL query string** so results are shareable, survive refresh and work with the back button.
  - Debounced rapid filter changes; **cancelled stale requests** with `AbortController` so old responses couldn't overwrite new ones (race condition).
  - Checkout: disabled double submit, idempotency [key/flag], clear error and retry states, preserved user input on failure.
- **R:** [shipped on time], [fewer checkout errors], [better conversion]. **Learning:** contract-first and mocks remove cross-team blocking.

### Story 4: Testing culture, ~30% fewer production bugs

- **S:** Releases kept leaking regressions in critical flows (cart/checkout); QA was mostly manual.
- **T:** Work with QA to automate the critical paths.
- **A:** Jest + React Testing Library for components and slices (testing behaviour, not implementation); Cypress E2E for the happy paths of [browse → add to cart → checkout]; ran them in the CI pipeline on every PR; worked with QA to choose the scenarios; used stable `data-testid`/role selectors to reduce flakiness; added a "test required" item to the PR template.
- **R:** ~**30% fewer production bugs**, faster release cycles, more confidence to refactor. **Learning:** test what users do; E2E only for the critical paths, because the pyramid keeps it fast.

### Story 5: Production incident (use your real one)

- **S:** [After a release, users in [French / Safari / a region] couldn't [complete checkout / see prices]].
- **T:** [I was on call / I owned the feature.]
- **A:** Confirmed impact (monitoring, logs, analytics); **mitigated first** (rollback / feature flag off); then root cause [e.g. missing translation key crashed a component, or a date/number format, or an API field change]; fixed it, added a test, added an **error boundary** so one widget can't crash the page; wrote a blameless post-mortem.
- **R:** [Restored in X min]; the class of bug was prevented. **Learning:** mitigate before you debug; make failures small.

### Story 6: Disagreement with design / product / backend

- **S:** [Design wanted a custom dropdown / animation / infinite scroll] that [wasn't accessible / hurt performance].
- **T:** Ship something good for users *and* keep the relationship.
- **A:** Asked about the goal behind the request; built a quick prototype of both options; showed data (a11y audit, Lighthouse, screen-reader demo); proposed a compromise [accessible headless component styled to the design].
- **R:** Agreed solution; the pattern was [added to the design system]. **Learning:** disagree with data and prototypes, not opinions.

### Story 7: Mentoring / raising the bar (senior role)

- **S:** After promotion, [N] newer devs joined; PRs were inconsistent and review cycles were slow.
- **A:** Pairing sessions; a PR template and checklist (tests, a11y, i18n keys, screenshots); ESLint/Prettier + TypeScript strictness in CI so machines catch style; "how we do X" docs; constructive reviews that explain *why*.
- **R:** [Review turnaround from X to Y days], [junior now owns feature Z]. **Learning:** scale yourself through tooling and teaching.

### Story 8: Ambiguity / owning something end-to-end (full-stack)

- **S:** [A feature with unclear requirements, e.g. a new plan comparison tool, an internal dashboard, an AI assistant / RAG search].
- **A:** Clarified the problem with stakeholders; wrote a one-page plan; built the [NestJS endpoint + React UI]; shipped an MVP behind a feature flag; iterated on feedback.
- **R:** [adoption / time saved]. **Learning:** ship small, learn fast.

### Story 9: A mistake / failure

Pick something real and small-to-medium: [underestimated a task], [shipped a bug], [over-engineered an abstraction]. Show **ownership → fix → what you changed in your process**. Never blame others.

### Story 10: Tight deadline / trade-off

[Device launch date or promo deadline]. You cut scope with the PM (must-have vs nice-to-have), shipped behind a flag, and logged tech debt with a ticket and a plan to pay it back.

## Behavioral questions: spoken versions of your stories

> Each answer below is a full STAR story written the way you'd **say** it (about 2 minutes). Rehearse them out loud until they feel natural, not memorised. The leadership chapter covers the disagreement, mentoring and mistake stories.

<details>
<summary>Tell me about yourself.</summary>

> 🎤 **Mock answer**
>
> Sure. I'm a front-end-focused full-stack developer with about eight years of experience, and for the last four and a half years I've been working on Bell's e-commerce platform through LGS, which is an IBM company.
>
> At Bell I build the customer-facing shopping experience in React: product listing and filtering, the cart, and checkout. A lot of my work has been about performance and code quality. I led a refactor of our legacy state management to Redux Toolkit, and I improved our Core Web Vitals with code splitting, lazy loading and CSS optimisation, which cut load times by roughly 20 percent. I also worked closely with our QA team to build out automated testing with Jest and Cypress, which reduced production bugs by about 30 percent.
>
> In April 2025 I was promoted to Senior Full Stack Developer, so now I also work on the Node and NestJS side and mentor newer developers on the team. Recently I've also been building AI features with the OpenAI API and retrieval-augmented generation.
>
> I'm now looking for a senior front-end role where I can own architecture and performance for a product at scale, and [one specific thing about this company] is what drew me to this role.

Keep it to 60–90 seconds. End by connecting to *them*, which invites the next question.

> 🔁 **Follow-up questions**
>
> **Q: Why did you stay on the same project for four and a half years?**
> Because it kept giving me bigger problems to solve. I started on features, then took on performance, then the state management migration, and then the senior full-stack role with mentoring. The Bell platform is large and business-critical, so there was always something meaningful to improve, and staying long enough to see the long-term results of my decisions taught me a lot about maintainability.
>
> **Q: What does "through LGS, an IBM company" mean day to day?**
> LGS is my employer, and I'm embedded full-time in Bell's digital team. Day to day I work exactly like a Bell team member: same squad, standups, codebase, release process and on-call expectations. The promotion to senior happened on that same engagement, which reflects the trust the client had in my work.
>
> **Q: You mentioned AI. Was that at Bell or on your own?**
> [Be precise here.] For example: "Mostly on my own projects and [an internal prototype]. I built features using the OpenAI API, embeddings stored in Supabase with pgvector, and a RAG pipeline. I'm happy to walk through how it works." Never inflate this: interviewers will ask about production details.

</details>

<details>
<summary>Tell me about a time you significantly improved performance.</summary>

> 🎤 **Mock answer**
>
> On Bell's e-commerce site, our [device and product listing pages] were slow on mobile. [Lighthouse performance was around X, and LCP was around Y seconds.] Since most of our traffic is mobile, and load time affects both conversion and SEO, I took ownership of improving it.
>
> I started by measuring. I used Lighthouse and the Chrome Performance panel, and ran a bundle analyzer. It showed [we were shipping one large bundle containing code for every page, some heavy dependencies, unoptimised images and a lot of unused CSS].
>
> Then I worked through the fixes by impact. I added route-level code splitting with React.lazy and Suspense, and lazy-loaded components that weren't needed for the first view, like reviews, recommendations and modals. I optimised images with lazy loading below the fold, correct sizes and explicit dimensions to stop layout shifts, while making sure the hero image loaded with high priority. And I fixed our Tailwind configuration so unused classes were properly purged, and removed duplicated legacy CSS. I shipped it as small pull requests alongside feature work, with QA regression testing each one.
>
> Load times improved by roughly 20 percent, and our Core Web Vitals improved, [LCP went from X to Y]. [To keep it from regressing, we added a performance check to the pipeline.] The main lesson for me was to measure first, because some of what we assumed was slow wasn't, and to protect the gains with automation.

> 🔁 **Follow-up questions**
>
> **Q: How exactly did you measure the 20 percent?**
> I compared the same pages before and after using [Lighthouse runs under the same throttling settings, averaged over several runs, plus our real-user data from (analytics / CrUX)]. The main metric was [load time / LCP] on mobile. I used medians of several runs, because single Lighthouse runs vary quite a bit.
>
> **Q: What did you try that didn't work?**
> [Use a real example.] For example: "I initially lazy-loaded too aggressively, including an image above the fold, which actually made LCP worse. Measuring after each change caught it, and I reverted that part. It taught me to lazy-load only what isn't needed for the first view."
>
> **Q: How did you make sure performance didn't regress afterwards?**
> [We added a Lighthouse CI check / bundle size budget to the pipeline], so a pull request that grew the bundle or dropped the score beyond a threshold was flagged. Without automation, performance gains tend to erode within a few months.

</details>

<details>
<summary>Tell me about a significant refactor you led.</summary>

> 🎤 **Mock answer**
>
> When I joined the Bell project, the cart and checkout state was managed with [classic Redux with a lot of boilerplate, plus some duplicated local state]. That caused real bugs. For example, [the cart count and totals could get out of sync after a promotion was applied], and new developers found the code hard to follow.
>
> I wanted to fix it without stopping feature delivery, because the business couldn't pause for a rewrite. So I wrote a short proposal comparing the options: keeping things as they were, Redux Toolkit, Context, or a lighter library like Zustand. I recommended Redux Toolkit because the team already knew Redux, and it would cut boilerplate, prevent accidental mutations with Immer, and keep the DevTools we relied on.
>
> The migration was incremental. First I swapped in configureStore, which was a very low-risk change. Then I converted one slice at a time, starting with the cart, with old and new code running side by side. I replaced hand-written loading actions with createAsyncThunk, normalised entities, and added memoised selectors for things like totals, which also reduced unnecessary re-renders. I wrote tests for each slice, paired with teammates on the first conversions, and documented the pattern so everyone could continue it.
>
> We ended up with [significantly less state code], far fewer sync bugs, and new developers got productive faster because there was one clear pattern. The lesson was that big refactors succeed when they're incremental and shipped alongside features.

> 🔁 **Follow-up questions**
>
> **Q: How did you convince the team and your lead to invest in it?**
> I framed it in terms of cost: how many bugs came from out-of-sync state and how much time it added to cart features. I wrote a short proposal with options and trade-offs, and I showed that the migration could be incremental, so it wouldn't stop feature work. Reducing the risk was what got the approval.
>
> **Q: Why Redux Toolkit and not React Query or Zustand?**
> The team already knew Redux, we relied on the DevTools, and much of the cart state was genuinely client-side logic, like promotions and selections. RTK gave the biggest improvement with the least retraining. If I were doing it again, I'd move pure server data to RTK Query as a second step.
>
> **Q: How did you avoid breaking things during the migration?**
> One slice at a time, with tests written for each slice before switching components over, old and new running side by side, and QA regression testing on the cart and checkout for every step. Each change was small enough to roll back easily.

</details>

<details>
<summary>Tell me about a time you depended on another team. How did you avoid being blocked?</summary>

> 🎤 **Mock answer**
>
> We were building [the new product filtering and cart features] on Bell's site, and the backend services they depended on were being built at the same time by another team. If we had waited for their APIs, we would have lost weeks.
>
> So early on I set up a session with the backend team to agree on the API contract: the endpoints, request parameters, response shapes and error formats, documented [in Swagger]. With that contract in place, I built the front end against mocks using [Mock Service Worker], so we could develop and test the complete UI, including error and loading states, before the real services existed.
>
> I also built a small typed API layer, so the base URL, headers and error handling lived in one place. While building the filters, I synced them to the URL so results were shareable and the back button worked, and I added request cancellation, because rapid filter clicks could cause an older response to overwrite a newer one.
>
> When the real APIs were ready, integration took [days rather than weeks], mostly just switching off the mocks and fixing a couple of small contract differences we caught early. The lesson I took is that agreeing on contracts first and building against mocks is the best way to keep teams from blocking each other.

> 🔁 **Follow-up questions**
>
> **Q: What happened when the real API didn't match the contract?**
> [Real example.] A couple of fields differed in naming or nullability. Because we found it early, it was a quick conversation: we agreed which side would change, updated the contract document, and I added validation so a mismatch would fail clearly instead of silently showing wrong data.
>
> **Q: How do you keep mocks from drifting from the real API?**
> Ideally the mocks are generated from, or validated against, the OpenAPI spec, and contract tests run in the backend pipeline. At minimum, we update the mocks in the same pull request as any contract change, and run integration tests against a real staging environment before release.

</details>

<details>
<summary>Tell me about a time you improved quality or reduced bugs.</summary>

> 🎤 **Mock answer**
>
> At Bell, our releases kept letting regressions through in critical flows like the cart and checkout. Our QA team was mostly testing manually, so every release meant long regression cycles, and bugs still reached production.
>
> I worked with the QA team to automate the most important paths. We sat down together and agreed on which scenarios mattered most for customers and revenue: browsing, adding to cart, applying a promotion, and completing checkout. I wrote Jest and React Testing Library tests for components and Redux slices, focused on behaviour rather than implementation details, and we built Cypress end-to-end tests for those critical journeys. We ran them in the CI pipeline on every pull request. I added stable selectors so the tests weren't brittle, and added a testing item to our pull request template so new features came with tests.
>
> Over the following [months], production bugs dropped by about 30 percent, release cycles got faster because less manual regression testing was needed, and the team became much more confident making changes, which actually made the later refactoring work possible. The lesson for me was to focus automation on what users actually do and on the flows that matter most, instead of chasing coverage numbers.

> 🔁 **Follow-up questions**
>
> **Q: How did you measure the 30 percent reduction?**
> We compared the number of production defects logged [in Jira] for the [cart and checkout area] over [comparable release periods] before and after the automation was in place. It's not a perfect experiment, but the trend was clear, and release regression cycles also got shorter.
>
> **Q: How did you deal with flaky Cypress tests?**
> We replaced fixed waits with assertions on actual conditions, intercepted and stubbed unstable network calls, used stable selectors, and gave every test its own setup data. Any flaky test was quarantined with a ticket and fixed quickly, because flaky tests make people ignore failures.
>
> **Q: How did you decide what to automate versus leave manual?**
> Together with QA, we ranked scenarios by business impact and how often they ran. Repetitive, critical paths like checkout were automated end to end. Exploratory testing and rarely-used edge cases stayed manual.

</details>

<details>
<summary>Tell me about a production incident you handled.</summary>

> 🎤 **Mock answer**
>
> [Adapt to your real incident.] After one release, we started seeing reports that [some customers using the French version of the site couldn't complete checkout].
>
> I was [on the team that owned that feature], so I jumped in. The first thing I did was confirm the scope using [our error monitoring and analytics], and then focus on reducing customer impact first rather than immediately debugging. [We turned the new feature off with a feature flag / rolled back the release], which restored checkout within [X minutes].
>
> Then I found the root cause: [a missing French translation key caused a component to throw during render, and since there was no error boundary around it, it took down the whole checkout step]. I fixed the key, added a test for that case, and added an error boundary so a failure in one part of the page can't break the entire flow. We also added a CI check for missing translation keys.
>
> Afterwards I wrote a blameless post-mortem covering the timeline, the root cause and the actions taken, so the whole team learned from it. The main lessons were to mitigate first and debug second, and to design so that failures stay small.

> 🔁 **Follow-up questions**
>
> **Q: How did you find out about the problem?**
> [Real answer: monitoring alerts, a spike in errors, a drop in conversion on a dashboard, or customer reports.] And if it came from customers, a good addition is what monitoring you added afterwards so you'd detect it first next time.
>
> **Q: Why didn't your tests catch it?**
> [Be honest.] For example: "Our tests ran mostly in English, and the bug only appeared with the French locale. We added French locale coverage to the critical end-to-end tests and a CI check for missing translation keys."
>
> **Q: What was in the post-mortem?**
> The timeline, customer impact, root cause, what went well, what didn't, and action items with owners. It was blameless: the focus was on what in our process allowed the bug through, not who wrote it.

</details>

<details>
<summary>Tell me about a time you dealt with ambiguity or unclear requirements.</summary>

> 🎤 **Mock answer**
>
> [Adapt this to your real project, for example an internal tool, a plan comparison feature, or an AI assistant.] After I moved into the senior full-stack role, I was asked to build [a feature], but the requirements were very loose, basically [one sentence from a stakeholder].
>
> Instead of guessing, I first spoke with the stakeholders to understand the actual problem: who would use it, what they were doing today, and what success would look like. I wrote a one-page plan with the scope, what was explicitly out of scope, and a simple design, and got agreement on it. That alone surfaced a few different expectations between [the product owner and the business team] that we resolved before writing any code.
>
> I then built a minimal version end to end, [a NestJS endpoint and a React interface], and released it behind a feature flag to a small group of users. Their feedback changed [one important part of the design], which we would have built wrong otherwise.
>
> The result was [adoption or time saved]. What I learned is that with ambiguous work, the most valuable step is making the problem clear and written down, and then shipping something small quickly so real feedback replaces assumptions.

> 🔁 **Follow-up questions**
>
> **Q: What would you have done if stakeholders disagreed on the requirements?**
> I'd make the disagreement explicit by writing down both versions and the trade-offs, then ask the person who owns the decision, usually the product owner, to decide. My job is to make the options and consequences clear, not to choose between stakeholders silently.
>
> **Q: How do you decide what goes into an MVP?**
> I ask what the smallest version is that lets us learn whether the idea works for real users. Everything not needed to answer that question goes on a later list. And the MVP still has to be good quality: small scope, not low quality.

</details>

<details>
<summary>Tell me about a time you had to make a trade-off under a tight deadline.</summary>

> 🎤 **Mock answer**
>
> We had a fixed date for [a device launch or a holiday promotion] at Bell. Marketing campaigns were already scheduled, so the date couldn't move, but partway through, it was clear the full scope wasn't going to fit.
>
> I didn't want to quietly cut corners on quality, so I went to the product owner with a clear picture. I split the work into what was essential for launch day and what could follow a week or two later, and explained the risk of each option. We agreed to ship the core flow, [for example the new offer in the product page and cart], on time, and move [the comparison view and some edge cases] to a follow-up release.
>
> To reduce risk, we shipped behind a feature flag, so we could switch it on at launch time and turn it off instantly if something went wrong. I logged the shortcuts we took as tech-debt tickets with a plan, and we addressed them in the following sprint.
>
> The launch went smoothly and [met the business goals], and the follow-up shipped as planned. The lesson for me is that under deadline pressure the scope should flex, not the quality, and that trade-offs should be made openly with the product owner, not silently by developers.

> 🔁 **Follow-up questions**
>
> **Q: What if the product owner had insisted on the full scope?**
> I'd make the risk explicit in writing: what could slip, and the quality risk of rushing. If they still wanted it, I'd propose options like adding people early or reducing testing scope with clear acceptance of the risk. Ultimately it's their call, but it should be an informed one.
>
> **Q: Did the tech debt actually get paid back?**
> [Real answer.] Ideally yes: "We created tickets during the release, with the reason and a proposed fix, and I raised them in the next sprint planning. They were done within [two sprints]." If not, be honest about what you learned about making debt visible.

</details>

## Questions they'll ask about your Bell experience (prepare answers)

<details>
<summary>What was the most technically challenging thing you built at Bell?</summary>

> 🎤 **Mock answer**
>
> The most challenging work was on the cart and checkout flow for Bell's e-commerce site. It's harder than a typical online store, because a single purchase can combine a device, a rate plan and add-ons, with prices that depend on the province, promotions and whether you're an existing customer. The flow spans several steps, calls several backend services, has to be fully bilingual and accessible, and any bug there directly costs revenue.
>
> My part was [building the cart and checkout steps in React and integrating the APIs for the cart, promotions and order submission]. The interesting technical problems were state and asynchrony. Cart data could get out of sync between components after a promotion was applied, which was one of the reasons I led the move to Redux Toolkit with a single source of truth and memoised selectors for totals. We had race conditions where a slow response could overwrite a newer one, which I fixed with request cancellation. And on order submission, I made sure the button couldn't double-submit and that errors kept the user's data, with clear retry options.
>
> The result was [a more reliable checkout with fewer production issues], and combined with the testing work we did with QA, production bugs dropped by about 30 percent. Happy to go deeper into any part of it.

Pick **one**: checkout or performance. Structure: why it was hard (state across many steps, async validations, many services, bilingual, a11y), what you designed, one surprising problem (race condition, hydration, caching), the result. Keep it under 3 minutes and let them dig in.

> 🔁 **Follow-up questions**
>
> **Q: How did you handle state across the checkout steps?**
> The cart and checkout data lived in Redux Toolkit as a single source of truth, so each step read from and wrote to the same store, and going back didn't lose data. Derived values, like totals, were memoised selectors rather than stored state, which removed a whole class of sync bugs.
>
> **Q: How did you prevent duplicate orders?**
> The submit button was disabled while the request was pending, and [the order request carried an idempotency key / the backend de-duplicated on a request ID], so even a retry or double click couldn't create two orders.
>
> **Q: What would you do differently if you rebuilt it today?**
> I'd move server data to a caching layer like RTK Query, render the static parts on the server, use React 19 actions for the form submission states, and share validation schemas with the backend using Zod.

</details>

<details>
<summary>How was the front end architected? What would you change?</summary>

> 🎤 **Mock answer**
>
> The front end is a React application, [describe: built with ... and served through ...], using Redux Toolkit for cart and checkout state, Tailwind for styling, and [a shared component library]. It talks to backend services for the catalogue, pricing, cart and orders through REST APIs, [through a BFF layer]. Quality is covered by Jest and React Testing Library for components and Cypress for critical user journeys, running in the CI pipeline.
>
> If I could change things, I'd focus on three areas. First, I'd move server data out of Redux into a dedicated caching layer, like RTK Query, keeping Redux only for true client state. That removes a lot of manual loading and invalidation code. Second, for SEO-critical product pages, I'd move toward server rendering with streaming or Server Components, to improve LCP and ship less JavaScript. Third, I'd generate TypeScript types from the backend's OpenAPI specs, so API changes are caught at compile time.
>
> Each of these has a real migration cost, so I'd do them incrementally and start where the measured benefit is highest, probably the product pages for performance and SEO.

Describe it honestly (the diagram above). Then give **2 improvements** with reasoning, for example:
- Move server data out of Redux into **RTK Query / TanStack Query** (cache, dedupe, background refetch) and keep Redux for truly client state.
- Adopt **SSR/streaming via Next.js App Router** for SEO-critical product pages.
- Stricter **TypeScript** and generated API types from OpenAPI.
- **Performance budgets** in CI.
- A shared **design system** package with visual regression tests.

A senior always has opinions on what to improve, **with trade-offs** (migration cost, risk, team skills).

> 🔁 **Follow-up questions**
>
> **Q: Why not migrate everything to Next.js?**
> A full migration of a large, revenue-critical app is risky and expensive. I'd start with the pages where server rendering has measurable value, like SEO-critical product pages, prove the benefit with data, and migrate incrementally, possibly route by route behind the same domain.
>
> **Q: How did releases work?**
> [Describe: release cadence, environments, QA sign-off, feature flags, who deploys.] Then add one improvement you'd make, for example more frequent smaller releases with feature flags.

</details>

<details>
<summary>How do you work with QA, designers, product and backend?</summary>

> 🎤 **Mock answer**
>
> With product, I try to get involved early, clarify acceptance criteria before development starts, and when something is expensive, offer options instead of a flat no, so we can find the version that delivers most of the value soonest.
>
> With design, I review designs early for things that are easy to change at that stage: accessibility, responsive behaviour, how layouts handle longer French text, and the loading, empty and error states that designs often leave out.
>
> With backend teams, I prefer to agree on the API contract first, ideally an OpenAPI spec, and then build against mocks with MSW. That way neither team blocks the other, and integration is mostly about switching the mocks off.
>
> With QA, at Bell we decided together which scenarios should be automated and which stay manual. I added stable selectors so their tests weren't brittle, and we automated the critical checkout journeys with Cypress, which helped reduce production bugs by about 30 percent. In general, I treat all of them as partners in the same goal rather than handoffs.

- **Product:** clarify acceptance criteria early, push back with trade-offs, break work into shippable slices.
- **Design:** review designs early for a11y, responsive behaviour, French text length, loading/empty/error states (designs usually forget these).
- **Backend:** contract-first APIs, mocks, shared types.
- **QA:** decide together what's automated vs manual; give them `data-testid`s/stable roles; fix flaky tests fast.

> 🔁 **Follow-up questions**
>
> **Q: Give an example where early involvement with design saved time.**
> [Real example.] For instance: "In a design review I noticed the plan cards had no error or empty state, and the French text would overflow the fixed-width buttons. Fixing that in Figma took an hour; finding it after development would have meant rework and another QA cycle."
>
> **Q: What do you do when a backend team is late?**
> Keep building against the agreed contract with mocks, communicate the dependency clearly to both product owners, and adjust the plan early, for example by shipping the UI behind a flag. Escalating early with facts is much better than being surprised at the end.

</details>

<details>
<summary>Why are you leaving / why now?</summary>

> 🎤 **Mock answer**
>
> I've really valued my time at Bell. Over four and a half years I've grown from a front-end developer to a senior full-stack role, and I've worked on things I'm proud of, like the performance improvements and the state management migration.
>
> At this point, I'm looking for a role where I can take on more ownership of front-end architecture and work directly on a product, rather than through a consulting engagement. I want to be part of the product decisions from the start and help shape technical direction for the long term.
>
> [This role stands out to me because ... for example, the scale of your product, your focus on performance, or the chance to work on your design system.] It feels like a natural next step that builds on what I've been doing at Bell.

Keep it positive: "I've had a great 4.5 years on Bell and grew into a senior role. I'm looking for [a product company / deeper ownership of front-end architecture / a team where front-end performance and DX are first-class]. I want to work directly on a product rather than through a consulting engagement." **Never criticise Bell, LGS or IBM.**

> 🔁 **Follow-up questions**
>
> **Q: Is it about money?**
> Compensation matters, as it does for everyone, but it's not the main reason. I'm looking for more ownership of architecture and to work directly on a product. If the role is the right fit, I'm confident we can agree on the compensation.
>
> **Q: What would make you stay at Bell?**
> Honestly, I've been happy there. But what I'm looking for, direct product ownership and a long-term architectural role, is hard to get through a consulting engagement, and that's why I'm looking at roles like this one.

</details>

<details>
<summary>What's your biggest strength / area of growth?</summary>

> 🎤 **Mock answer**
>
> My biggest strength is taking a complex, high-traffic front end and making it faster and more reliable. At Bell, I led performance work that improved load times by about 20 percent, refactored our legacy state management to Redux Toolkit, and worked with QA on test automation that cut production bugs by around 30 percent. I enjoy finding the root cause of a problem, measuring it, fixing it, and putting guardrails in place so it stays fixed.
>
> An area I'm actively growing in is large-scale architecture across many teams, things like micro-frontends, platform decisions and design systems that serve several products. At Bell I've been involved in team-level architecture decisions, and I've been building that broader skill by studying patterns like module federation, taking part in architecture discussions, and writing proposals for larger changes. It's one of the reasons I'm looking for a senior role with more architectural ownership.

- **Strength:** "Taking a messy, high-traffic front end and making it faster and more reliable: performance, state management, testing." Back it up with the 20% and 30% numbers.
- **Growth:** something real that you're actively working on, e.g. "Large-scale system design across many teams. I've been studying micro-frontends and module federation, and I volunteer for architecture discussions." Or "public speaking: I started running our team's tech talks".

> 🔁 **Follow-up questions**
>
> **Q: Give a concrete example of the area of growth in action.**
> [Real example.] For example: "I recently wrote an architecture proposal for [X] and presented it to the wider team. The feedback showed me I needed to consider other teams' release processes earlier, which I now do from the start."
>
> **Q: What feedback have you received from your lead?**
> [Real feedback.] Positive feedback about reliability and performance work, plus one constructive point and what you did with it. Showing that you act on feedback is the key.

</details>

## Your numbers (memorise these)

- **~4.5+ years** on Bell e-commerce · **~8 years** total front-end
- **~20%** load-time improvement (code splitting, lazy loading, Tailwind optimisation)
- **~30%** fewer production bugs (Jest + Cypress with QA)
- **Promoted** Front End Developer → **Senior Full Stack Developer** (April 2025)
- [Add: team size, # of devs mentored, # of components in the library, traffic, Lighthouse scores]
