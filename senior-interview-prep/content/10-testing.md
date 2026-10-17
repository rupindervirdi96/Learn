# Testing Strategy

> Your story: **Jest + Cypress with QA reduced production bugs by ~30%**. Seniors are asked about *strategy* (what to test, where, and why) more than syntax.

<details>
<summary>Testing pyramid vs testing trophy: what's your strategy?</summary>

> 🎤 **Mock answer**
>
> The classic testing pyramid says to write many unit tests, fewer integration tests and very few end-to-end tests. For front end, I find the testing trophy more useful. Its base is static analysis, then a small layer of unit tests, the biggest layer is integration tests, and there are a few end-to-end tests at the top. The idea is that tests give more confidence the more they resemble how users actually use the software.
>
> My strategy is: TypeScript in strict mode and ESLint catch entire classes of bugs for free. Unit tests cover pure logic, like price calculations, reducers and validators. Most of the effort goes into integration tests with React Testing Library: render a feature, like the cart, with its real children and store, mock the network with MSW, then interact like a user and check what's on screen. And end-to-end tests with Cypress or Playwright cover only the critical journeys: browse, add to cart, checkout and login.
>
> At Bell, working with QA on exactly this mix, especially automating the checkout path, reduced production bugs by about 30 percent.

- **Pyramid**: many unit tests, fewer integration tests, few E2E.
- **Testing Trophy** (Kent C. Dodds), common in front end: **static** (TypeScript, ESLint) → **unit** (pure logic) → **integration** (the biggest layer: components with their children, hooks and mocked network) → **E2E** (a few critical user journeys).

"The more your tests resemble the way your software is used, the more confidence they give you."

My strategy:
- **Static:** TS strict + ESLint (incl. hooks and a11y plugins) catch whole bug classes for free.
- **Unit:** pure functions such as price calculations, reducers/slices, validators, formatters.
- **Integration:** React Testing Library for features (render `<Cart/>` with a store + **MSW** mocking the API, then click "remove" and expect the total to update).
- **E2E:** Cypress/Playwright for revenue-critical flows (browse → add to cart → checkout, login, EN/FR switch), run on PR (smoke) and nightly (full).
- Plus **visual regression** for the design system, **a11y checks** (axe) and **contract tests** with the backend.

> 🔁 **Follow-up questions**
>
> **Q: Why mostly integration tests?**
> They test components together the way users experience them, so they catch real bugs in how pieces interact, while still running fast without a browser or real backend. Unit tests of tiny components often pass while the feature is broken.
>
> **Q: What's your view on code coverage targets?**
> Useful as a signal to find untested areas, harmful as a strict target, because people write meaningless tests to hit numbers. I'd rather require tests for critical logic and new features.

</details>

<details>
<summary>React Testing Library principles. Show a good test.</summary>

> 🎤 **Mock answer**
>
> The core principle of React Testing Library is to test behaviour, not implementation. I interact with the component the way a user would, and check what the user would see, instead of inspecting state or calling internal methods. That makes tests resilient: I can refactor from useState to Redux and the tests still pass, as long as the behaviour is the same.
>
> In practice, I query by role and accessible name first, like a button named "Apply", then by label for form fields, and only use test IDs as a last resort. I use `user-event` rather than `fireEvent`, because it simulates real interactions like typing character by character. And for anything asynchronous, I use the `findBy` queries, which wait for the element to appear.
>
> A typical test from cart work: set up an MSW handler for the promo endpoint, render the cart with a preloaded store, type a promo code into the field found by its label, click the Apply button, and assert that the new total and a success message appear. A nice side effect of querying by role is that it also checks accessibility: if the test can't find the button by its name, a screen reader user can't either.

Test **behaviour, not implementation**: query like a user (by role, label, text), interact with `user-event`, and assert on what the user sees. Don't test state variables, internal methods, or snapshot whole trees.

Query priority: `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue` > `getByAltText` > `getByTitle` > `getByTestId`.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

test('applies a promo code and updates the total', async () => {
  server.use(
    http.post('/api/cart/promo', () => HttpResponse.json({ total: 90, discount: 10 }))
  );
  const user = userEvent.setup();
  renderWithProviders(<Cart />, { preloadedState: { cart: cartWith100Dollars } });

  await user.type(screen.getByLabelText(/promo code/i), 'SAVE10');
  await user.click(screen.getByRole('button', { name: /apply/i }));

  expect(await screen.findByText(/total: \$90\.00/i)).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/promo applied/i);
});
```

`getBy` throws if missing, `queryBy` returns null (use it for asserting absence), and `findBy` is async (waits). Avoid `act()` warnings by awaiting `findBy`/`waitFor`.

> 🔁 **Follow-up questions**
>
> **Q: When is getByTestId acceptable?**
> When there's no accessible way to query the element, like a container with no role or text, or dynamic content where text is unstable. It should be the exception.
>
> **Q: What's the difference between fireEvent and userEvent?**
> `fireEvent` dispatches a single DOM event. `userEvent` simulates the full interaction, like focus, key down, key press, input and key up, so it catches more realistic bugs.
>
> **Q: How do you fix "not wrapped in act" warnings?**
> They usually mean a state update happened after the test stopped waiting. Use `findBy` or `waitFor` to wait for the final UI state, rather than wrapping things in act manually.

</details>

<details>
<summary>Why MSW (Mock Service Worker) instead of mocking fetch/axios?</summary>

> 🎤 **Mock answer**
>
> MSW intercepts requests at the network level instead of replacing your HTTP client with a mock. That means the code under test runs for real: my fetch calls, my API layer, error handling, and the data-fetching library's caching and retries. If I mocked axios directly, I'd be skipping exactly the code most likely to have bugs, and the tests would break whenever I changed the HTTP library.
>
> The other big advantage is reuse. The same request handlers work in unit and integration tests in Node, in the browser during development, and in Storybook. That was really useful on the API integration work at Bell: we agreed the contract with the backend team, wrote MSW handlers that matched it, and could build and test the front end before the backend was ready. When the real API arrived, we just turned the mocks off.
>
> It also makes it easy to test edge cases, like a 500 error, a slow response or an empty list, by overriding a handler in a single test.

MSW intercepts at the **network level**, so your real fetch code, API layer, query library and error handling all run. The **same handlers** work in tests (Node), the browser during development (build UI before the backend exists, as in your API-integration story), and Storybook. It's less brittle than `jest.mock('axios')` and doesn't care which HTTP client you use.

> 🔁 **Follow-up questions**
>
> **Q: How do you test an error state with MSW?**
> Override the handler in that specific test with `server.use`, returning a 500 or a network error, then assert that the error message appears. Handlers reset after each test.
>
> **Q: How do you make sure no test hits a real API?**
> Configure MSW to error on unhandled requests, so any unexpected call fails the test.

</details>

<details>
<summary>Jest vs Vitest</summary>

> 🎤 **Mock answer**
>
> They're very similar from a developer's point of view. Vitest deliberately kept a Jest-compatible API, so `describe`, `it`, `expect` and mocking work almost the same way.
>
> The differences are under the hood. Vitest is built on Vite, so it reuses the same configuration and transforms as the app, has native ES module and TypeScript support without extra setup, and is generally faster, especially in watch mode. Jest is very mature, with a huge ecosystem, and it's still what most existing enterprise codebases use, including Bell's.
>
> For a new Vite-based project, I'd choose Vitest. For an existing Jest codebase, I'd only migrate if speed or ESM configuration problems were a real pain point, and the migration is usually straightforward. I'd also mention Vitest's browser mode, which runs component tests in a real browser instead of a simulated DOM.

Vitest has a Jest-compatible API, is Vite-native (shares config/transforms), is fast with ESM support, and is the default for Vite projects. Jest is mature and still everywhere (Bell). Migration is usually easy. Use Vitest **browser mode** for real-browser component tests.

> 🔁 **Follow-up questions**
>
> **Q: What's the hardest part of migrating Jest to Vitest?**
> Module mocking differences and Jest-specific config like transforms or module name mappers. Most test code works unchanged, especially with globals enabled.
>
> **Q: Why might you run component tests in a real browser?**
> jsdom doesn't implement layout, CSS or many browser APIs, so things like visibility, scrolling, IntersectionObserver or focus behaviour are better tested in a real browser.

</details>

<details>
<summary>Cypress vs Playwright</summary>

> 🎤 **Mock answer**
>
> I've used Cypress at Bell for our end-to-end tests. Its strength is the developer experience: the interactive runner shows the app as tests run, with time-travel snapshots of each step, which makes writing and debugging tests pleasant. Its limitations are that it runs inside the browser, so multiple tabs and cross-origin flows have historically been harder, and parallel runs are mainly a paid cloud feature.
>
> Playwright controls the browser from outside. It supports Chromium, Firefox and WebKit, which is the closest you get to testing Safari, and it handles multiple tabs, origins and browser contexts easily. It has free built-in parallelisation and sharding, and its trace viewer is excellent for debugging CI failures.
>
> Many teams are moving to Playwright for speed, cross-browser coverage and cost. The good news is that the concepts transfer directly: stable selectors, waiting on conditions instead of timeouts, and focusing on critical user journeys. So I'd be comfortable with either, and I'd pick based on the team's existing investment.

| Cypress (you used it) | Playwright |
|---|---|
| Runs inside the browser, great interactive runner / time-travel debugging | Controls browsers externally via CDP-like protocols |
| Chromium, Firefox, WebKit (experimental) | Chromium, Firefox, **WebKit** (Safari engine) first-class |
| Single tab, same-origin limits (improved with `cy.origin`) | Multi-tab, multi-origin, multiple contexts |
| Parallelisation via paid Cloud | Free built-in parallelism + sharding, trace viewer |
| Component testing | Component testing (experimental), API testing |

Trend: many teams are moving to **Playwright** for speed, cross-browser coverage and free parallelism. Your Cypress experience transfers directly, so say so.

> 🔁 **Follow-up questions**
>
> **Q: How would you migrate a Cypress suite to Playwright?**
> Incrementally: write new tests in Playwright, port the most valuable or flakiest Cypress tests first, run both in CI during the transition, and retire Cypress when coverage matches.
>
> **Q: How do you handle login in E2E tests efficiently?**
> Log in once through the API rather than the UI, save the session state, and reuse it across tests, like Playwright's storage state or Cypress's `cy.session`. Keep one dedicated test for the real login UI.

</details>

<details>
<summary>How do you deal with flaky tests?</summary>

> 🎤 **Mock answer**
>
> First, I treat a flaky test as a real bug, not something to retry until it passes, because flaky tests destroy trust in the whole suite and people start ignoring failures.
>
> To fix them, I look at the usual causes. Timing is the most common: tests with fixed waits, like waiting one second, instead of waiting for a condition, so I replace them with assertions that retry or `findBy` queries. Then shared state between tests: each test should set up its own data and not depend on another test's order. Real network calls to third-party services should be mocked or stubbed. Non-deterministic data like dates, random values and sort order needs to be controlled, for example with fake timers. Animations can be disabled in the test environment. And fragile selectors based on CSS classes or text that changes should be replaced with roles or test IDs.
>
> As a process, I'd quarantine a flaky test with a ticket and an owner, so it doesn't block everyone, fix it quickly, and track the flake rate in CI so we can see if it's getting worse.

Causes: timing (fixed `wait(1000)`), test interdependence/shared state, real network/3rd-party calls, animations, non-deterministic data (dates, random, ordering), and selector fragility.

Fixes: wait on **conditions** (auto-retrying assertions, `findBy`), not time; isolate state (reset DB/store, seed data via API); **mock the network** for non-E2E tests; stable selectors (`role`, `data-testid`); freeze time (fake timers / `cy.clock`); disable animations in test env; quarantine-and-fix policy (a flaky test is a bug with an owner); track flake rate in CI.

> 🔁 **Follow-up questions**
>
> **Q: Is automatic retry in CI a good solution?**
> Only as a temporary safety net. It hides real race conditions, and some flaky tests point to actual production bugs. I'd track retried tests and fix them.
>
> **Q: How would you find out whether a test is flaky?**
> Run it many times in a loop or in CI with repeat options, and track failure rates per test over time. Some CI tools and test runners report flakiness directly.

</details>

<details>
<summary>What do you NOT test?</summary>

> 🎤 **Mock answer**
>
> I avoid testing implementation details, such as a component's internal state variables, private functions, or which hooks it uses, because those tests break during refactoring even when nothing is actually broken. I don't test third-party libraries; I trust React and the router to work. I don't write tests for trivial code with no logic.
>
> I'm also careful with large snapshot tests. They tend to get updated without anyone reading them, so they don't really catch bugs. For visual changes, proper visual regression testing works better.
>
> And I don't chase 100 percent coverage. Coverage is a useful signal for finding untested areas, but not a goal. I focus effort on business-critical logic, like pricing, eligibility rules and checkout validation, and on the most important user flows. That's where a bug costs real money.

Third-party library internals, implementation details (state shape, private functions), trivial getters, styling via snapshots (use visual regression instead), and 100%-coverage vanity. Focus coverage on **business-critical logic** (pricing, eligibility, checkout validation) and **user flows**. Coverage is a signal, not a goal.

> 🔁 **Follow-up questions**
>
> **Q: Are snapshot tests useless?**
> Not useless. Small, focused snapshots, like a serialised config or the output of a formatter, work well. Large component snapshots become noise that people update without reading.
>
> **Q: Do you test CSS?**
> Not with unit tests. I use visual regression tests for important components and pages, and test behaviour that depends on CSS, like visibility, in real-browser tests.

</details>

<details>
<summary>Testing custom hooks, timers and async code</summary>

> 🎤 **Mock answer**
>
> For custom hooks, I prefer testing them through a component that uses them, but for reusable hooks I use `renderHook` from React Testing Library. It renders the hook and gives me `result.current` to check its return value, plus `rerender` to pass new arguments.
>
> For timers, I use fake timers. For example, to test a debounce hook: render it with an initial value, re-render with a new value, check that the result is still the old value, then advance the timers by the debounce delay inside `act`, and check that it updated. That makes the test instant and deterministic, with no real waiting. I always restore real timers afterwards.
>
> For async code, I use the `findBy` queries or `waitFor` to wait for the expected outcome, and MSW to control the network responses, including errors and slow responses. If I see an `act` warning, it usually means a state update happened after the test finished, so I make the test wait for that final state rather than suppressing the warning.

```ts
import { renderHook, act } from '@testing-library/react';

test('useDebounce delays the value', () => {
  vi.useFakeTimers();                                // or jest.useFakeTimers()
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: 'a' } });
  rerender({ v: 'ab' });
  expect(result.current).toBe('a');
  act(() => { vi.advanceTimersByTime(300); });
  expect(result.current).toBe('ab');
  vi.useRealTimers();
});
```

> 🔁 **Follow-up questions**
>
> **Q: What's the pitfall with fake timers and promises?**
> Promises resolve in microtasks, which fake timers don't control. After advancing timers you may need to flush promises, for example with the async versions like `advanceTimersByTimeAsync`.
>
> **Q: Should you test hooks directly or through components?**
> Through components when the hook is specific to one component. Directly with `renderHook` when it's a reusable hook with its own API.

</details>

<details>
<summary>Contract testing and visual regression: what and why?</summary>

> 🎤 **Mock answer**
>
> Contract testing verifies that the front end and the backend agree on the API shape without running the full system end to end. Tools like Pact record what the consumer expects and verify it against the provider, or you can validate responses against the OpenAPI schema. In a microservices setup like Bell's, it catches the classic problem where a backend team renames a field and the front end breaks in production, and it catches it in the backend's pipeline before deployment.
>
> Visual regression testing takes screenshots of components or pages and compares them with approved baselines on each pull request, using tools like Chromatic, Percy, or Playwright's screenshot assertions. It catches unintended visual changes that functional tests miss, like a CSS change in a shared component breaking the layout on a page nobody checked. It's essential for a design system used by many teams.
>
> Both fill gaps that unit and end-to-end tests don't cover well, at a much lower cost than full end-to-end environments.

- **Contract testing** (Pact, or schema validation against OpenAPI): verifies that the front end's expectations of an API match what the backend provides, *without* full E2E environments. It catches "backend renamed a field" before production.
- **Visual regression** (Chromatic, Percy, Playwright `toHaveScreenshot`): pixel/DOM snapshots of components/pages compared per PR. Essential for a shared **design system** used by many teams.

> 🔁 **Follow-up questions**
>
> **Q: What causes false positives in visual testing?**
> Fonts and anti-aliasing differences between machines, animations, dates and random data. You fix it by running in a consistent Docker environment, disabling animations, and fixing data.
>
> **Q: Who owns the contract tests?**
> The consumer, meaning the front end, defines its expectations, and the provider's pipeline verifies them before deploying. Ownership is shared, which is why it encourages communication.

</details>

<details>
<summary>How do tests fit into CI/CD?</summary>

> 🎤 **Mock answer**
>
> On every pull request, the pipeline runs the fast checks in parallel: linting, type-checking, unit and integration tests, and a production build with a bundle size check. Then it deploys a preview environment and runs a small end-to-end smoke suite against it, plus accessibility and Lighthouse checks if possible. All of these are required checks before merging, along with code review.
>
> After merging to main, we build the artifact once, deploy it to staging, run the full end-to-end suite, and then promote that same artifact to production, ideally with a canary release or behind feature flags, followed by smoke tests and monitoring. A nightly job can run the slower cross-browser tests.
>
> The key is keeping the pull request pipeline fast, ideally under 10 minutes, with caching, parallel jobs and only testing affected projects in a monorepo. If the pipeline is slow, people find ways to bypass it, and then it stops protecting anything.

On every PR: lint + type-check + unit/integration tests (fast, parallel) + build + bundle-size check + a small E2E smoke suite against a **preview deployment**. On merge: full E2E, deploy to staging, smoke tests, then production (canary/feature flags). Nightly: full cross-browser E2E + a11y + Lighthouse. Required checks block the merge. Keep the PR pipeline under ~10 minutes, or people will bypass it.

> 🔁 **Follow-up questions**
>
> **Q: How do you keep the pipeline fast as the test suite grows?**
> Parallelise and shard tests, cache dependencies and builds, run only affected tests in a monorepo, keep the PR suite focused, and move slow cross-browser runs to nightly jobs.
>
> **Q: What do you do when a test fails on main?**
> Treat it as a priority: either fix it quickly or revert the change that broke it, because a red main branch blocks everyone and hides new failures.

</details>
