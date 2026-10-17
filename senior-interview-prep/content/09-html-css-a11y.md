# HTML, CSS, Accessibility & i18n

> Seniors are expected to **own quality**: semantic HTML, accessible components, and responsive, maintainable CSS. Bell is a federally regulated, bilingual company, so **a11y and EN/FR i18n are great talking points** for you.

## Accessibility (a11y)

<details>
<summary>What standards and laws apply? (Canada-specific is a bonus)</summary>

> 🎤 **Mock answer**
>
> The practical standard is WCAG, the Web Content Accessibility Guidelines, at level AA. Most organisations target 2.1 AA, and 2.2 is increasingly expected. It added criteria like a minimum target size for buttons, focused elements not being hidden behind sticky headers, and accessible authentication. WCAG is organised around four principles: content must be perceivable, operable, understandable and robust.
>
> In Canada, the Accessible Canada Act applies to federally regulated sectors, which includes telecom companies like Bell, and AODA applies to organisations in Ontario. In the US it's the ADA and Section 508, and in Europe the European Accessibility Act has been enforced since 2025.
>
> Beyond the legal side, I'd say accessibility is just good engineering: keyboard support, clear labels and good contrast help everyone, including people on mobile in bright sunlight or people with a temporary injury. And for a company with millions of customers, a significant share of them rely on assistive technology.

- **WCAG 2.1 / 2.2 level AA** is the practical target. WCAG 2.2 (2023) adds focus-not-obscured, target size (24×24 px minimum), dragging alternatives, accessible authentication and consistent help.
- Principles **POUR**: Perceivable, Operable, Understandable, Robust.
- **Canada:** *Accessible Canada Act* (federally regulated sectors such as telecom and banking), **AODA** (Ontario), and Quebec standards. **US:** ADA / Section 508. **EU:** European Accessibility Act (enforced from June 2025).

> 🔁 **Follow-up questions**
>
> **Q: What are the WCAG contrast requirements?**
> For level AA: 4.5 to 1 for normal text, 3 to 1 for large text, and 3 to 1 for user interface components and meaningful graphics, like input borders and icons.
>
> **Q: What's the difference between A, AA and AAA?**
> They're conformance levels. A is the minimum, AA is the standard target in most laws and policies, and AAA is the strictest, usually not required for whole sites because some criteria can't be met for all content.

</details>

<details>
<summary>The first rule of ARIA, and semantic HTML</summary>

> 🎤 **Mock answer**
>
> The first rule of ARIA is: if a native HTML element already has the semantics and behaviour you need, use it instead of adding ARIA to a generic element. ARIA only changes what assistive technology announces. It doesn't add any behaviour, so it's easy to make things worse. That's why people say no ARIA is better than bad ARIA.
>
> The classic example is a `div` with an onClick acting as a button. It isn't focusable with the keyboard, doesn't respond to Enter or Space, isn't announced as a button, and can't be disabled properly. A real `button` element gives you all of that for free.
>
> So I start with semantic HTML: buttons for actions, links for navigation, labels for inputs, landmarks like `nav`, `main` and `header`, a logical heading hierarchy, real tables for tabular data, and native elements like `dialog` and `details`. I only reach for ARIA for custom widgets that HTML doesn't provide, like a combobox or tabs, and then I follow the official patterns exactly.

**"No ARIA is better than bad ARIA."** Use native elements first: `<button>` (not `<div onClick>`), `<a href>` for navigation, `<label>` for inputs, `<nav>`, `<main>`, `<header>`, `<footer>`, `<dialog>`, `<details>`, `<table>` for tabular data, and a heading hierarchy (`h1` → `h2`...).

A `<div onClick>` lacks: focusability, Enter/Space activation, a role announced to screen readers, and disabled semantics. You'd need `role="button" tabIndex={0}` + key handlers, and you'd still miss things.

> 🔁 **Follow-up questions**
>
> **Q: When is ARIA actually necessary?**
> For widgets HTML doesn't provide natively, like tabs, comboboxes, tree views, and for dynamic announcements with live regions, or for labelling things that have no visible text, like an icon-only button.
>
> **Q: What's the difference between aria-label and aria-labelledby?**
> `aria-label` provides the name as a string. `aria-labelledby` points to another element whose text becomes the name, which is better when visible text already exists, and it's translated with the rest of the page.

</details>

<details>
<summary>How do you make a custom component accessible? (e.g. dropdown/combobox)</summary>

> 🎤 **Mock answer**
>
> I start from the WAI-ARIA Authoring Practices, which define the expected roles, states and keyboard behaviour for widgets like comboboxes, tabs, menus and dialogs. Screen reader users have learned those conventions, so following them matters more than inventing something.
>
> For a combobox, that means the input has `role="combobox"` with `aria-expanded`, `aria-controls` pointing to the list, and `aria-activedescendant` for the highlighted option, and each option has `role="option"` and `aria-selected`. Then the keyboard support: arrows to move, Enter to select, Escape to close, and Tab to leave. Focus management matters too: a visible focus indicator, a logical order, and returning focus sensibly when something closes. Every control needs an accessible name. Dynamic changes, like the number of results, are announced with a live region.
>
> Then I test with the keyboard only and with a real screen reader, NVDA on Windows and VoiceOver on Mac or iPhone, because automated tools can't confirm the experience actually works.
>
> Honestly, for production I'd often use a headless library like Radix or React Aria that has already solved these details, and put our design-system styles on top.

1. Follow the **WAI-ARIA Authoring Practices (APG)** pattern for that widget.
2. Correct **roles / states / properties**: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-selected`.
3. **Keyboard support**: Tab in/out, arrows, Enter, Esc, Home/End, type-ahead.
4. **Focus management**: visible focus ring (`:focus-visible`), logical order, return focus after closing.
5. **Name, role, value** exposed: labels via `<label>`, `aria-label` or `aria-labelledby`.
6. Announce dynamic changes: `aria-live="polite"` (e.g. "12 results", "Item added to cart").
7. Test with a **screen reader** (NVDA/JAWS on Windows, VoiceOver on Mac/iOS, TalkBack on Android) and keyboard only.

Or use a **headless accessible library** (Radix, React Aria, Headless UI) and style it.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between aria-activedescendant and roving tabindex?**
> With `aria-activedescendant`, focus stays on a container or input, and you point to the visually active child, which is good for comboboxes. With roving tabindex, actual focus moves between children, and only one has tabIndex 0, which suits toolbars and tabs.
>
> **Q: Which screen readers do you test with?**
> NVDA with Chrome or Firefox on Windows, and VoiceOver with Safari on Mac and iOS, plus TalkBack on Android for mobile-heavy pages. They behave differently, so testing at least two matters.

</details>

<details>
<summary>Focus management in SPAs</summary>

> 🎤 **Mock answer**
>
> In a traditional website, every navigation loads a new page and the browser resets focus to the top, and screen readers announce the new page. In a single-page app, the content changes but focus stays where it was, often on a link that no longer exists, so a screen reader user may not know anything happened.
>
> So on route changes, I move focus to the new page's main heading or main region, or announce the page title in a live region. For modals, focus moves into the dialog, is trapped there while it's open, Escape closes it, and focus returns to the button that opened it. The native `dialog` element handles most of that.
>
> Other practices: a "skip to main content" link as the first focusable element, moving focus to the first invalid field or an error summary when a form fails validation, never removing the focus outline without providing a `:focus-visible` style, and using the `inert` attribute to make background content unreachable while an overlay is open.

- On **route change**, move focus to the new page's `h1` or main region (or announce it); otherwise screen-reader users don't know the page changed.
- **Modals**: trap focus, `Esc` closes, return focus to the trigger (native `<dialog>` does most of this).
- **Skip link**: "Skip to main content" as the first focusable element.
- Errors on submit: focus the first invalid field, or an error summary.
- Never `outline: none` without a `:focus-visible` replacement.
- The `inert` attribute makes background content unfocusable.

> 🔁 **Follow-up questions**
>
> **Q: How do you announce a route change?**
> Move focus to the new page's h1 with tabIndex -1, or update a visually hidden live region with the new page title. Some frameworks, like Next.js, include a route announcer.
>
> **Q: What's the difference between :focus and :focus-visible?**
> `:focus` applies whenever an element has focus, including mouse clicks. `:focus-visible` applies when the browser decides a focus indicator is helpful, mainly keyboard navigation, so you can show strong focus rings without them appearing on every click.

</details>

<details>
<summary>Accessible forms checklist</summary>

> 🎤 **Mock answer**
>
> Every input needs a visible label properly connected with `for` and `id`, not just a placeholder, because placeholders disappear and often have poor contrast. Related controls, like a group of radio buttons for choosing a plan, go in a `fieldset` with a `legend`, so the group's question is announced.
>
> For errors, each message is connected to its field with `aria-describedby`, and the field gets `aria-invalid`. On submit, focus moves to the first error or an error summary. Errors shouldn't be indicated by colour alone, and instructions about format, like a postal code, should appear before the user makes a mistake.
>
> I also use the correct input types and `autocomplete` attributes, like email, tel, postal-code and cc-number. That gives mobile users the right keyboard and lets the browser autofill, which helps everyone, especially people with motor or cognitive disabilities. Required fields are marked both visually and programmatically. On a checkout like Bell's, these details directly affect completion rates.

Every input has a visible `<label>`; group related inputs with `<fieldset>` + `<legend>` (e.g. "Choose your plan" radio group); errors are linked with `aria-describedby` and `aria-invalid`; don't rely on colour alone; mark required fields (`required`/`aria-required`); use the right `type` and `autocomplete` (`email`, `tel`, `postal-code`, `cc-number`) for mobile keyboards and autofill; announce error summaries; give clear instructions on format (postal code `A1A 1A1`).

> 🔁 **Follow-up questions**
>
> **Q: Should you validate on blur, on change, or on submit?**
> Generally validate on submit first, then on change or blur for fields that already showed an error, so users aren't interrupted while still typing, but get immediate feedback when fixing a mistake.
>
> **Q: Is a placeholder an acceptable label?**
> No. It disappears when typing, often has low contrast, and isn't consistently announced. Use a visible label, and placeholder only for an example format.

</details>

<details>
<summary>How do you test accessibility and make it stick in a team?</summary>

> 🎤 **Mock answer**
>
> I use three layers. First, automated tools: eslint-plugin-jsx-a11y in the editor, axe-core in unit tests with jest-axe and in end-to-end tests with Cypress or Playwright, plus Lighthouse. These catch maybe 30 to 40 percent of issues, like missing labels and contrast problems, and they run on every pull request.
>
> Second, manual testing: a keyboard-only pass, testing with a screen reader, zooming to 200 and 400 percent, checking reduced motion and contrast. Using React Testing Library's `getByRole` queries also helps, because if you can't find an element by its role and name, a screen reader user probably can't either.
>
> Third, and most important for making it stick, process. Accessibility goes into the definition of done and the pull request checklist. Accessible patterns are built into the design system, so every team gets them by default and a fix happens in one place. Designers annotate focus order and labels. And periodic audits, ideally with real users of assistive technology, catch what the tools miss.

- **Automated** (catches ~30–40%): axe-core (`@axe-core/react`, `jest-axe`, `cypress-axe` / `@axe-core/playwright`), eslint-plugin-jsx-a11y, Lighthouse a11y.
- **Manual**: keyboard-only pass, screen reader, 200% / 400% zoom and reflow, `prefers-reduced-motion`, contrast (4.5:1 text, 3:1 large text and UI components).
- **Process**: a11y criteria in the Definition of Done, accessible components in the **design system** (fix once, fixed everywhere), designers annotate focus order and labels, periodic audits with users of assistive tech.
- RTL tests using `getByRole` double as a11y checks.

> 🔁 **Follow-up questions**
>
> **Q: What does automated testing miss?**
> Whether alt text is actually meaningful, whether the focus order makes sense, whether keyboard interactions work as expected, and whether the screen reader experience is understandable. Those need manual testing.
>
> **Q: How do you convince a product owner to prioritise accessibility?**
> Legal requirements, like the Accessible Canada Act for a telecom, the size of the affected audience, better usability for everyone, and SEO benefits. And it's far cheaper to build it in than to retrofit after an audit.

</details>

## Internationalisation (EN/FR)

<details>
<summary>How do you build a bilingual (EN/FR) React app?</summary>

> 🎤 **Mock answer**
>
> I use an i18n library like react-intl, i18next or next-intl, and no user-visible strings are hard-coded. Everything goes through message keys. Messages use ICU format, which handles plurals and variables properly, and French plural rules differ from English, so string concatenation isn't safe.
>
> For formatting, I use the native `Intl` APIs with the locale. A price in English Canada is "$1,234.56", but in French Canada it's "1 234,56 $", with a different separator and the symbol after. Same for dates.
>
> For routing and SEO, the locale goes in the URL, like `/en` and `/fr`, with `hreflang` tags, and I set the `lang` attribute on the HTML element so screen readers use the right pronunciation.
>
> Design-wise, French text is typically 20 to 30 percent longer, so layouts can't rely on fixed widths, and we test with real French strings, not just English. Locale messages are loaded per language, missing keys are checked in CI, and there's a workflow with the translation team. And with server rendering, the server and client must use the same locale, otherwise you get hydration mismatches. All of this was part of daily work on Bell's site, since everything had to be bilingual.

- A library such as **react-intl (FormatJS)**, **i18next / react-i18next**, or **next-intl**, with message keys instead of hard-coded strings.
- **ICU message format** for plurals and variables: `{count, plural, one {# article} other {# articles}}`.
- **`Intl` APIs** for formatting: prices `new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })` gives `1 234,56 $` vs `$1,234.56` in `en-CA`; dates; relative time.
- Locale in the **URL** (`/en/...`, `/fr/...`) for SEO with `hreflang`; set `<html lang="fr">` (screen readers switch pronunciation).
- **Layout**: French is ~20–30% longer, so avoid fixed widths and test truncation. Use CSS logical properties (`margin-inline-start`) if RTL may come.
- Lazy-load locale bundles; translation workflow with the content team / a TMS; CI checks for missing keys.
- Hydration: the server and client must use the same locale/timezone, or formatted numbers mismatch.

> 🔁 **Follow-up questions**
>
> **Q: Why can't you concatenate translated strings?**
> Word order, gender and plural rules differ between languages, so "You have " plus count plus " items" breaks in French. You use full messages with placeholders and ICU plural rules, so translators control the whole sentence.
>
> **Q: How do you handle missing translations?**
> A CI check comparing keys between locale files, a fallback to the default language with a logged warning in development, and never shipping with missing keys for production locales.
>
> **Q: How do you avoid hydration mismatches with locale formatting?**
> Determine the locale on the server from the URL, pass it explicitly to the client, and always format with an explicit locale and timezone instead of relying on the environment's defaults.

</details>

## CSS

<details>
<summary>Specificity and the cascade (including @layer)</summary>

> 🎤 **Mock answer**
>
> When several rules target the same element, the cascade decides which one wins. In order: first origin and importance, so `!important` declarations and browser versus author styles; then cascade layers; then specificity; and finally source order, where the later rule wins.
>
> Specificity is calculated as a score: inline styles are highest, then IDs, then classes, attributes and pseudo-classes, then element selectors. Cascade layers, with `@layer`, are a newer tool that lets you define the priority of whole groups of styles, like reset, base, components and utilities, so specificity battles between them stop mattering. Styles outside any layer beat layered ones.
>
> Useful details: `:where()` has zero specificity, which is great for library styles that users should be able to override easily, while `:is()` and `:not()` take the specificity of their most specific argument.
>
> In practice, I keep specificity low and flat: classes rather than IDs, and avoiding `!important`. Tailwind helps with that, since everything is a single utility class.

The cascade resolves conflicts by: origin & importance (`!important`) → **cascade layers** (`@layer`, later layers win, unlayered styles beat layered) → **specificity** (inline > IDs > classes/attributes/pseudo-classes > elements) → source order.

`:where()` has zero specificity (great for resettable library styles); `:is()` / `:not()` take their most specific argument. Avoid `!important` and ID selectors in component CSS.

> 🔁 **Follow-up questions**
>
> **Q: How would you override a third-party component's styles cleanly?**
> Put the library's styles in a lower cascade layer, so your component styles win without needing high specificity or `!important`.
>
> **Q: What's the specificity of :where(.a .b)?**
> Zero. `:where` always contributes zero specificity, which makes it ideal for defaults that should be easy to override.

</details>

<details>
<summary>Flexbox vs Grid</summary>

> 🎤 **Mock answer**
>
> Flexbox is one-dimensional: it lays items out along a single row or column, and sizing is driven by the content. I use it for navigation bars, toolbars, button groups, aligning an icon with text, and centring things.
>
> Grid is two-dimensional: it controls rows and columns at the same time, and the layout defines where content goes. I use it for page layouts, card grids, and complex forms. A pattern I use a lot is `repeat(auto-fill, minmax(240px, 1fr))`, which creates a responsive card grid without any media queries.
>
> Subgrid is worth mentioning, because it lets nested elements align to the parent grid. For example, in a row of plan cards with different description lengths, subgrid keeps the prices and buttons aligned across all the cards. That's a very common e-commerce design request that used to need JavaScript or fixed heights.
>
> They work well together: Grid for the overall layout, Flexbox inside the components.

- **Flexbox**: one-dimensional (row *or* column), content-driven sizing. Navbars, toolbars, centring, button groups.
- **Grid**: two-dimensional (rows *and* columns), layout-driven. Page layouts, card grids (`repeat(auto-fill, minmax(240px, 1fr))`), complex forms. **Subgrid** aligns nested items with the parent grid (e.g. equal-height plan cards with aligned prices).

> 🔁 **Follow-up questions**
>
> **Q: How do you center an element both ways?**
> On the parent, `display: grid` with `place-items: center`, or flexbox with `justify-content` and `align-items` set to center.
>
> **Q: What's the difference between auto-fill and auto-fit?**
> Both create as many columns as fit. With `auto-fill`, empty tracks are kept, so items don't stretch. With `auto-fit`, empty tracks collapse, so the existing items stretch to fill the row.

</details>

<details>
<summary>Modern CSS features worth mentioning</summary>

> 🎤 **Mock answer**
>
> A few have changed how I build components. Container queries let a component adapt to the size of its container rather than the viewport. That's ideal for a design system, where the same product card might appear in a narrow sidebar or a wide grid. The `:has()` selector is finally a parent selector, so I can style a form group that contains an invalid input, without JavaScript.
>
> Native CSS nesting and cascade layers make plain CSS much more maintainable. `clamp()` gives fluid typography and spacing. Logical properties, like `margin-inline-start`, make layouts work in right-to-left languages. The new viewport units, like `dvh`, fix the mobile browser address bar problem.
>
> On the interactive side: the View Transitions API for smooth page and state transitions, scroll-driven animations, and the Popover API with anchor positioning, which can replace JavaScript positioning libraries for tooltips and menus. And I always respect `prefers-reduced-motion` and `prefers-color-scheme`.

- **Container queries** (`@container`): components respond to their *container* size, not the viewport. Perfect for design-system cards reused in sidebars and main content.
- **`:has()`**: the parent selector (`form:has(:invalid)`, `.card:has(img)`).
- **Native nesting**, **cascade layers**, `clamp()` for fluid type (`font-size: clamp(1rem, 2.5vw, 1.5rem)`).
- Logical properties, `aspect-ratio`, `gap` for flexbox, `dvh`/`svh` viewport units (mobile browser bars).
- **View Transitions API** (page/state transitions), **scroll-driven animations**, **anchor positioning** + **Popover API** (tooltips/menus without JS positioning libraries), `@starting-style`.
- `prefers-reduced-motion`, `prefers-color-scheme`, `color-mix()`, `oklch()` colours.

> 🔁 **Follow-up questions**
>
> **Q: How do container queries work?**
> You mark a parent as a container with `container-type: inline-size`, and then use `@container` rules in its children based on that container's width instead of the viewport.
>
> **Q: What can :has() replace?**
> JavaScript that toggled parent classes based on children, like styling a field group when it contains an invalid input, or a card differently when it contains an image.

</details>

<details>
<summary>Tailwind vs CSS Modules vs CSS-in-JS: trade-offs</summary>

> 🎤 **Mock answer**
>
> I've used Tailwind extensively at Bell. Its strengths are speed and consistency: you style directly in the markup using the design tokens from the config, you never have to name things, and the production CSS only includes the classes you actually use. The downsides are long class strings, and you need good component abstractions so you're not repeating the same class lists everywhere.
>
> CSS Modules are plain CSS with locally scoped class names, no runtime cost, and a familiar syntax. They work really well with CSS variables for design tokens.
>
> Runtime CSS-in-JS, like styled-components or Emotion, made dynamic styling and theming easy, but it has a runtime cost and doesn't fit well with Server Components and streaming, and styled-components is now in maintenance mode. Zero-runtime options like vanilla-extract or Panda extract the CSS at build time.
>
> So for a new project today, I'd choose Tailwind or CSS Modules with CSS variables. One practical Tailwind lesson from our performance work: make sure the content paths are correct so purging works, and don't build class names dynamically, like concatenating a colour into a class name, because Tailwind can't detect them.

| | Pros | Cons |
|---|---|---|
| **Tailwind** (you used it at Bell) | fast, consistent design tokens, tiny CSS (only used classes), no naming, colocated | long class strings, learning curve, needs component abstractions to avoid repetition |
| **CSS Modules** | scoped, plain CSS, zero runtime | naming, tokens via CSS variables |
| **Runtime CSS-in-JS** (styled-components, Emotion) | dynamic styles, colocated, theming | **runtime cost**, problematic with RSC/streaming; styled-components in maintenance mode |
| **Zero-runtime CSS-in-JS** (vanilla-extract, Panda, StyleX) | type-safe, extracted at build | build setup |

Trend: **Tailwind (v4, CSS-first config) or CSS Modules + CSS variables for design tokens**, moving away from runtime CSS-in-JS because of Server Components and performance.

Tailwind performance at Bell: make sure the `content` paths are correct so unused classes are purged; avoid dynamic class strings that can't be detected (`bg-${color}-500`), using full class names in a map instead.

> 🔁 **Follow-up questions**
>
> **Q: Why don't dynamic Tailwind classes work?**
> Tailwind scans the source code for complete class names at build time. A class built at runtime, like concatenating a colour variable, never appears in full in the source, so it isn't generated. Map values to full class names instead.
>
> **Q: How do you avoid repeating long Tailwind class lists?**
> Extract components, use a variants helper like class-variance-authority, and use `@apply` sparingly for the rare shared CSS case.

</details>

<details>
<summary>Responsive design approach</summary>

> 🎤 **Mock answer**
>
> I work mobile-first: the base styles are for small screens, and I add complexity with `min-width` media queries as space allows. For a site like Bell's, where most traffic is mobile, that's also where the business value is.
>
> I prefer fluid layouts over many fixed breakpoints: Grid and Flexbox with flexible units, `clamp()` for typography and spacing, and container queries so components adapt to the space they're given. Images are responsive with `srcset`, touch targets are large enough, at least 24 pixels and ideally 44, and I make sure nothing depends on hover alone.
>
> Testing matters too: I use DevTools device mode while building, but I also test on real devices, especially a mid-range Android phone, because performance and touch behaviour on real hardware can be very different from a desktop simulation.

Mobile-first (`min-width` media queries), fluid layouts (grid/flex, `%`, `clamp()`), container queries for components, responsive images, touch targets ≥ 24–44 px, test on real devices, and consider **performance on low-end Android** (most of your users' real devices).

> 🔁 **Follow-up questions**
>
> **Q: Mobile-first versus desktop-first: why mobile-first?**
> Base styles stay simple, small screens don't download and override desktop styles, and it forces you to prioritise content. It also matches where most e-commerce traffic is.
>
> **Q: How do you handle images for different screen sizes?**
> `srcset` and `sizes` for different resolutions, and the `picture` element when the crop itself should change between mobile and desktop.

</details>

<details>
<summary>Box model, positioning, stacking contexts (quick hits)</summary>

> 🎤 **Mock answer**
>
> Every element is a box made of content, padding, border and margin. I always set `box-sizing: border-box` globally, so the width includes padding and border, which makes sizing predictable.
>
> For positioning: relative offsets an element and becomes the reference for absolutely positioned children. Absolute takes the element out of the flow. Fixed is relative to the viewport. Sticky behaves like relative until a scroll threshold, then sticks.
>
> Stacking contexts explain most z-index bugs. A new stacking context is created by things like a positioned element with a z-index, opacity less than one, a transform, a filter, or `isolation: isolate`. A child can never appear above something outside its parent's stacking context, no matter how high its z-index. That's why a modal with z-index 9999 can still appear behind a header. The fixes are rendering into a portal at the top of the document, or using the top layer with `dialog` or the Popover API.
>
> And a quick one: vertical margins between block elements collapse, but not inside flex or grid containers.

- `box-sizing: border-box` means width includes padding and border.
- `position`: `static`, `relative` (offset, creates a containing block for absolute children), `absolute`, `fixed`, `sticky`.
- **Stacking context** is created by `position` + `z-index`, `opacity < 1`, `transform`, `filter`, `isolation: isolate`... A child can never escape its parent's stacking context. That's why `z-index: 9999` "doesn't work", and it's a reason to use portals or the top layer (`<dialog>`, popover).
- Margin collapsing happens for vertical margins of block elements (not in flex/grid).
- BFC (block formatting context): `display: flow-root` contains floats.

> 🔁 **Follow-up questions**
>
> **Q: Why doesn't z-index work on my element?**
> Either the element isn't positioned, or it's inside a parent that creates a stacking context with a lower order. Its z-index only competes within that parent's context.
>
> **Q: What is position: sticky relative to?**
> The nearest scrolling ancestor. It also breaks if any ancestor has `overflow: hidden`, which is a common gotcha.

</details>

<details>
<summary>Design systems: how would you build or maintain one?</summary>

> 🎤 **Mock answer**
>
> I'd start with design tokens: colours, spacing, typography, radii and shadows defined once as the single source of truth, ideally synced from Figma, and exported as CSS variables or a Tailwind theme. That makes theming possible. Bell, for example, has several brands, and tokens are what let one component library serve all of them.
>
> Components are built on headless, accessible primitives, with our styling, and composable APIs. Each one is documented in Storybook with usage guidelines, do's and don'ts, and accessibility notes. Quality comes from unit and interaction tests, automated accessibility checks, and visual regression tests on every pull request, because a CSS change in a shared button affects every team.
>
> It's published as a versioned package with semantic versioning, changesets and a changelog, and breaking changes come with codemods and a deprecation period.
>
> But I'd say the hardest part isn't technical, it's adoption and governance: a clear contribution process, design and engineering reviewing together, office hours, tracking which teams use which components, and making the design system the easiest path, so teams want to use it.

- **Tokens** (colour, spacing, typography, radii) as the source of truth → CSS variables / Tailwind theme (Style Dictionary / Figma variables).
- **Components**: accessible, headless-based, composable, documented in **Storybook** with usage guidelines and a11y notes.
- Versioned package (semver, changesets), a changelog, codemods for breaking changes.
- Tests: unit + interaction tests in Storybook + **visual regression** (Chromatic / Playwright screenshots).
- Governance: contribution model, design + dev review, adoption metrics, deprecation policy.
- Theming: brand variants (Bell has several sub-brands, so tokens enable multi-brand theming).

> 🔁 **Follow-up questions**
>
> **Q: How do you handle breaking changes?**
> Deprecate first with warnings and documentation, provide codemods where possible, release the change in a major version, and support the previous major for a period while teams migrate.
>
> **Q: How do you decide whether a component belongs in the design system?**
> If it's used, or clearly will be used, across several products, and its behaviour is stable. One-off feature components stay in the product until a real need for reuse appears.
>
> **Q: How do you measure design system success?**
> Adoption across products, how many custom alternatives remain, the time to build new features, accessibility issues found, and feedback from consuming teams.

</details>
