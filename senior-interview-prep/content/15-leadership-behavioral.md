# Leadership & Behavioral (Senior Expectations)

> Seniors are hired for **judgment and influence**, not only code. Every answer should show: ownership, collaboration, trade-off thinking, and making others better. Use your STAR stories from *Your Story*. Most questions below map to one of them.

## What interviewers are scoring

| Signal | What they want to hear |
|---|---|
| **Ownership** | You see problems beyond your ticket and fix them end-to-end, including after release. |
| **Technical judgment** | You choose pragmatic solutions, can explain trade-offs, and know when *not* to build. |
| **Communication** | Clear with engineers *and* non-technical stakeholders; writes things down. |
| **Influence without authority** | You convince with data, prototypes and RFCs, not hierarchy. |
| **Mentoring / multiplying** | Others get better because of you: reviews, pairing, docs, tooling. |
| **Delivery** | You ship incrementally, manage risk and hit important dates. |
| **Growth mindset** | You own mistakes and change your process. |

## Common questions → which story to use

<details>
<summary>Tell me about a time you disagreed with a technical decision.</summary>

> 🎤 **Mock answer**
>
> At Bell, [design proposed a custom dropdown for the plan selector, with an animation and a fully custom look]. I liked the visual direction, but I was concerned about two things: a custom dropdown built from divs wasn't going to be accessible, and Bell has to meet accessibility requirements as a federally regulated company, and the animation library would add weight to a page we'd just worked hard to make faster.
>
> Instead of just saying no, I first asked the designer what the goal was. It turned out it was mainly brand consistency and making the options easier to compare. So I built a quick prototype of two options: their version, and an accessible headless component styled to match the design. I showed both with a keyboard-only demo and a screen reader, and the bundle size difference.
>
> Seeing the screen reader experience side by side changed the conversation more than any argument would have. We went with the accessible version, kept most of the visual design, and [it later became the standard pattern in our component library].
>
> What I took from it is to disagree with data and prototypes rather than opinions, and to focus on the shared goal. And if the decision had gone the other way, I would have committed to it and raised the risks in writing.

→ **Story 6** (design/product disagreement) or the **RTK proposal** (Story 2). Key beats: understand their reasoning first, bring data/prototype, propose options, **disagree and commit** if the decision goes the other way, and follow up on the outcome. Never make the other person look stupid.

> 🔁 **Follow-up questions**
>
> **Q: What would you have done if the designer insisted on their version?**
> If the decision-maker chose it knowing the trade-offs, I'd commit to it and make it as good as possible, including adding the accessibility attributes we could. If it created a real compliance risk, I'd escalate it calmly in writing to the right people.
>
> **Q: Tell me about a time you were the one who was wrong.**
> [Real example.] Show that you listened, changed your mind based on evidence, and what you learned. Interviewers value that more than always being right.

</details>

<details>
<summary>Tell me about a project you led end-to-end.</summary>

> 🎤 **Mock answer**
>
> The one I'd pick is the performance initiative on Bell's e-commerce pages. Mobile performance was hurting both conversion and SEO, and I took ownership of improving it.
>
> I started by establishing a baseline: Lighthouse scores, Core Web Vitals, and a bundle analysis, which showed [one large bundle, unoptimised images and unused CSS]. I wrote a short plan listing the opportunities ranked by impact and effort, agreed priorities with my lead and the product owner, and broke it into small pull requests that could ship alongside feature work rather than as one risky change.
>
> The implementation included route-level code splitting, lazy loading of below-the-fold components, image optimisation with proper dimensions, and fixing our Tailwind purge configuration. I coordinated with QA so each change went through regression testing, especially on checkout.
>
> We improved load times by roughly 20 percent, with better Core Web Vitals. [Then we added a performance check to the pipeline so it wouldn't regress.] What I learned about leading something like this: measure first, ship incrementally, communicate progress with numbers, and leave guardrails behind so the improvement lasts.

→ **Story 1 (performance)**, **Story 2 (RTK refactor)** or **Story 8 (ambiguity)**. Show planning (scope, milestones), coordination (QA, backend, design), risk management (flags, incremental rollout), and measurable results.

> 🔁 **Follow-up questions**
>
> **Q: What was the hardest part of leading it?**
> [Real answer.] Often balancing it with feature work and keeping stakeholders informed: I gave short progress updates with numbers, so the value stayed visible.
>
> **Q: How did you communicate progress?**
> Short regular updates in [standups and a sprint demo], with before and after metrics, and a summary at the end that included what's left and the recommended next steps.

</details>

<details>
<summary>How do you mentor junior developers?</summary>

> 🎤 **Mock answer**
>
> Since moving into the senior role, mentoring has become a real part of my job. [Two newer developers joined our team, for example.]
>
> My approach starts with pairing on their first features, where I let them drive and I mostly ask questions, so they build their own understanding. In code reviews, I explain the why behind a suggestion, and I often phrase things as questions, like "what happens if this request fails?", so they learn to think about edge cases themselves rather than just applying my fix. I also label comments clearly, so they know what's blocking and what's just a suggestion.
>
> I try to increase their scope gradually: a small bug, then a feature, then a feature where they coordinate with the backend team themselves. I also encourage them to present their work in demos, which builds confidence and visibility.
>
> And I try to scale it beyond individuals: written guides for common patterns, a PR checklist covering tests, accessibility and translations, and lint rules so they get feedback automatically. [One of the developers I mentored now owns the ... feature on their own], and that's the result I'm proudest of.

→ **Story 7.** Concrete practices: pairing on their first features; **asking questions in code reviews** instead of dictating ("What happens if this request fails?"); giving context (why), not just fixes; gradually increasing scope; letting them present their work; written guides; celebrating their wins publicly. Mention a specific person's growth (anonymised).

> 🔁 **Follow-up questions**
>
> **Q: How do you give difficult feedback?**
> Privately, promptly and specifically: what I observed, its impact, and a concrete suggestion, framed around their growth. And I ask for their view, because sometimes there's context I didn't know.
>
> **Q: How do you know your mentoring is working?**
> When they need me less: they handle larger tasks independently, their pull requests need fewer review rounds, and they start helping others.

</details>

<details>
<summary>How do you do code reviews? What do you look for?</summary>

> 🎤 **Mock answer**
>
> I review in order of importance. First, correctness: does it do what the ticket asks, and what about edge cases, like empty states, errors, slow networks, or double clicks? Then security, like rendering user content or handling auth. Then the user impact that's easy to miss: accessibility, French translations, loading and error states, and performance, like new dependencies or unnecessary re-renders. Then maintainability: naming, whether the abstraction makes sense, and whether there are meaningful tests.
>
> Style and formatting I leave to Prettier and ESLint, so reviews don't turn into debates about commas.
>
> How I review matters just as much. I try to review within the same day, because waiting blocks people. I label comments, like "nit", "question" or "blocking", so the author knows what's essential. I explain my reasoning, I point out good things too, and if a discussion goes back and forth more than a couple of times, I suggest a quick call and then summarise the outcome in the PR. And I encourage small pull requests, because they get much better reviews than huge ones.

Order of importance: **correctness and edge cases** → security (XSS, auth) → **user impact** (a11y, i18n, error/loading states, performance) → design/maintainability (naming, abstractions, tests) → style (automate it with linters and Prettier; don't argue about it in reviews).

Behaviour: review within a day; small PRs; label comments by severity ("nit:", "blocking:", "question:"); approve with suggestions when it's safe; praise good things; take long discussions to a call and then summarise in the PR.

> 🔁 **Follow-up questions**
>
> **Q: What do you do if someone keeps ignoring your review comments?**
> Talk to them directly, not in more PR comments, to understand why. Maybe the comments weren't clear, or they disagree. If it's a standards issue, agree on team conventions and automate them with lint rules where possible.
>
> **Q: How do you review a very large pull request?**
> First I ask whether it can be split. If not, I review it in passes: overall design first, then logic, then details, and I might ask for a walkthrough call.

</details>

<details>
<summary>How do you handle technical debt?</summary>

> 🎤 **Mock answer**
>
> First, I make it visible. Tech debt that only lives in developers' heads never gets prioritised. So I create tickets that describe the impact in terms the business understands, like "every change to checkout takes two extra days because of this", or "this caused three production incidents this quarter".
>
> Then I handle it at different scales. Small things I fix as I go, leaving code a bit better than I found it, as part of the related ticket. For medium items, I negotiate a regular share of each sprint, something like 15 to 20 percent. For big items, I avoid big-bang rewrites and instead do incremental migrations alongside feature work.
>
> The Redux Toolkit migration at Bell is a good example. Instead of asking for a month to rewrite state management, I migrated one slice at a time, starting with the cart, while still delivering features. Finally, I add guardrails, like lint rules, stricter types and tests, so the same kind of debt doesn't come back.

Make it **visible** (tickets with impact, a debt register), tie it to **business outcomes** ("this slows every checkout feature by ~2 days", "caused 3 incidents"), use the boy-scout rule for small things, negotiate a capacity % per sprint (e.g. 15–20%), do big items as incremental migrations alongside features (as with the RTK migration), and add guardrails (lint rules, types, tests) so the debt doesn't come back.

> 🔁 **Follow-up questions**
>
> **Q: How do you decide which debt to pay first?**
> By impact and frequency: debt in code we change often, that causes incidents, or that slows down planned features comes first. Old debt in code nobody touches can wait.
>
> **Q: Give an example of debt you decided not to fix.**
> [Real example.] For example, a legacy page scheduled for replacement within months. Fixing it wouldn't have paid back the effort.

</details>

<details>
<summary>Tell me about a time you missed a deadline or made a mistake.</summary>

> 🎤 **Mock answer**
>
> [Example: early in the Bell project, I underestimated a feature that involved the cart and a promotions API.] I gave an estimate based on the front-end work, but I didn't account for the uncertainty of an API that was still being built, or the French content and QA time.
>
> About halfway through, I realised we wouldn't make the date. The thing I did right was raising it immediately with my lead and the product owner, rather than hoping to catch up. I explained the cause and proposed options: ship the core flow on time and follow with the edge cases a week later, or move the date. We chose to reduce scope, and the core feature shipped on time.
>
> What I changed afterwards: I now identify unknowns first and do a short spike when an estimate depends on something uncertain, I give estimates as ranges with the main risk stated, and I include translation, accessibility and testing time explicitly. Since then my estimates have been much more reliable, and I flag risks much earlier.

→ **Story 9.** Own it without excuses. Explain what you did immediately (communicate early, mitigate) and what you changed afterwards (estimation buffers, earlier risk flags, a checklist, an automated test). Interviewers distrust people who claim they've never failed.

> 🔁 **Follow-up questions**
>
> **Q: How did your manager react?**
> [Real answer.] Generally, raising it early meant there was time to adjust, so the reaction was focused on the plan rather than the miss.
>
> **Q: How do you prevent it from happening again?**
> Identifying uncertainty earlier, estimating in ranges, including all the work like testing and translations, and checking progress against the estimate midway rather than at the end.

</details>

<details>
<summary>How do you estimate work and handle changing requirements?</summary>

> 🎤 **Mock answer**
>
> For estimation, I first break the work into small pieces, so each piece is something I can reason about. Then I identify the unknowns, for example a new API or an unfamiliar library, and if they're significant, I suggest a short time-boxed spike before committing to an estimate. I give ranges rather than single numbers, like "three to five days, and the main risk is the promotions API", and I include the work people forget: tests, accessibility, French translations, code review and QA. I re-estimate as soon as I learn something that changes the picture.
>
> When requirements change, I start by understanding the reason, because often the real goal can be met in a simpler way. Then I make the trade-off explicit to the product owner: if we add this, something has to move, the date, other scope, or a quality item we'd defer. I'd rather have that conversation openly than silently absorb the change and miss the date. And I try to design in small increments, so changes are cheaper to absorb.

Break work into small pieces, find the unknowns first (time-boxed spikes), give ranges instead of single numbers ("3–5 days, the risk is the promo API"), include testing/a11y/i18n/review time, and re-estimate when you learn more. For changing requirements: ask about the goal behind the change, show the trade-off (scope vs date vs quality), and agree on what moves out.

> 🔁 **Follow-up questions**
>
> **Q: What do you think of story points?**
> They're useful for relative sizing and planning within a team, as long as they're not turned into a productivity metric or compared between teams. The conversation during estimation, which surfaces unknowns, is the most valuable part.
>
> **Q: What do you do when you're asked for an estimate on the spot?**
> Give a rough range with clear assumptions, and say I'll confirm after looking into the unknowns. Better than a precise number that turns out wrong.

</details>

<details>
<summary>How do you work with product managers and designers?</summary>

> 🎤 **Mock answer**
>
> I try to get involved early, ideally while designs are still being explored, not when they arrive as a finished ticket. That's when I can point out things that are easy to change on paper: accessibility issues, how the layout handles longer French text, missing loading, empty and error states, and things that would be expensive to build or hurt performance.
>
> When something is difficult, I bring options instead of a flat no, like "we can do the full version in three weeks, or this version in one week that gets 90 percent of the value". I help turn vague requirements into clear acceptance criteria, and I demo early, even rough work, so we can course-correct before it's polished.
>
> I also try to explain technical constraints in business terms. For example, instead of "the bundle is too big", I'd say "this would slow the product page by about a second on mobile, which affects conversion". At Bell, working closely with design on the product pages and with backend teams on API contracts made features go much more smoothly.

Get involved early (feasibility + a11y + performance input during design, not after), challenge with options instead of "no", turn vague requirements into acceptance criteria, demo early and often, and share technical constraints in business language. → Stories 3 and 6.

> 🔁 **Follow-up questions**
>
> **Q: What do you do if a PM asks for something you think is a bad idea?**
> Ask about the goal and the data behind it, share my concerns with evidence, and propose alternatives. If they still want to proceed, it's their call. I might suggest an experiment behind a feature flag to test it.

</details>

<details>
<summary>How do you keep up with the front-end ecosystem?</summary>

> 🎤 **Mock answer**
>
> I follow a few reliable sources rather than trying to read everything: the official React and Next.js blogs and release notes, web.dev for performance and platform features, and newsletters like This Week in React and JavaScript Weekly. I also watch talks from React Conf and similar conferences.
>
> But I learn best by building, so I work on side projects. [For example, recently I've built projects with Next.js, NestJS, React Native and AI integrations using the OpenAI API and a vector database.] That's where I try new things, like Server Components or new React 19 features, before suggesting them at work.
>
> The other half is evaluating critically. Not every new tool is worth adopting. Before bringing something to the team, I ask what problem it solves for us, what it costs to migrate, how mature it is, and whether the team can support it. I'd rather be a little behind the hype and confident in what we use.

Be specific: [React blog/RFCs, the Next.js changelog, web.dev, TC39 proposals, newsletters (This Week in React, Frontend Focus, JavaScript Weekly), podcasts (Syntax), conferences (React Summit, React Conf talks)], side projects (your folder has React Native, Next and NestJS projects, a chess app, AI integrations, so mention one), and **evaluating new tools critically** before bringing them to the team.

> 🔁 **Follow-up questions**
>
> **Q: What's something new you learned recently?**
> [Real example, e.g. React 19 actions, the React Compiler, Next.js caching changes, or a CSS feature.] Explain it briefly and say whether you'd use it in production and why.
>
> **Q: How do you decide whether to adopt a new library?**
> Check what problem it solves for us, its maturity and maintenance, bundle size, community, how hard it is to remove later, and run a small proof of concept before proposing it.

</details>

<details>
<summary>What would you do in your first 90 days here?</summary>

> 🎤 **Mock answer**
>
> In the first 30 days, my focus would be learning. I'd want to understand the product and the users, the architecture and codebase, how deployments and releases work, and the team's way of working. I'd ship some small fixes early, because that's the fastest way to learn the real development flow, and I'd meet the people I'll work with in product, design, QA and backend. I'd also read recent incident reports, which tell you a lot about where the system is fragile.
>
> From 30 to 60 days, I'd take ownership of a meaningful feature and deliver it end to end. By then I'd also have noticed some improvement opportunities, maybe in performance, testing or developer experience, and I'd gather data on them rather than jumping to conclusions.
>
> From 60 to 90 days, I'd propose and start leading one of those improvements, with a short written proposal and team buy-in. I'd also want to contribute to the team beyond my own work, through code reviews, documentation and onboarding, so that by three months I'm someone people come to for [front-end performance or React architecture].

- **30:** learn the product, users, codebase, architecture, deploy pipeline and team rituals; ship small fixes to learn the flow; meet stakeholders; read incident history.
- **60:** own a meaningful feature; identify 2–3 improvement opportunities (performance, testing, DX) with data.
- **90:** lead an improvement initiative (RFC → execution), contribute to hiring/onboarding docs, and become someone others come to for [performance / React architecture].

> 🔁 **Follow-up questions**
>
> **Q: What if you find major problems in the codebase in your first weeks?**
> Note them, but first understand why things are the way they are, since there's often history. I'd build trust by delivering, then bring proposals with data, rather than criticising early.

</details>

<details>
<summary>Why do you want to be a senior engineer here? / Where do you see yourself in 3–5 years?</summary>

> 🎤 **Mock answer**
>
> Over the last four and a half years at Bell, I've grown from building features to owning larger pieces, like the performance work and the state management migration, and mentoring other developers. What I want next is to have more ownership of front-end architecture and quality for a product, and to be closer to the product itself rather than working through a consulting engagement.
>
> [What attracts me about this company specifically is ... for example, your product's scale, your focus on performance, or the technical challenges in the job description.] That's exactly the kind of problem I've enjoyed most at Bell.
>
> In three to five years, I see myself growing toward a staff or lead front-end role: someone who shapes technical direction across teams, sets standards for things like performance, accessibility and the design system, and helps other developers grow, while still staying hands-on with code, because that's what I enjoy most.

Tie it to impact: "I want to own front-end architecture and performance for a product at scale, and help a team grow. In 3–5 years I see myself as a staff/lead front-end engineer, someone who shapes technical direction across teams, while staying hands-on." Then connect it to something specific about their product or stack.

> 🔁 **Follow-up questions**
>
> **Q: What do you know about our product?**
> [Research the company.] Mention the product, something specific about their tech or engineering blog, and connect it to your experience.
>
> **Q: Why should we hire you over other candidates?**
> Four and a half years of hands-on experience on a large, high-traffic e-commerce platform, with proven results in performance, state management and quality, plus full-stack and AI skills, and a track record of being trusted with more responsibility over time.

</details>

## Senior vs Staff: know the difference

- **Senior:** owns features/systems end-to-end within a team, mentors, influences team-level decisions.
- **Staff:** cross-team technical direction, sets standards (design system, platform, architecture), multiplies many teams.

If they ask "what's the difference?", answering this shows ambition and self-awareness.

## Salary & logistics (Canada)

- Research ranges for your city and level (levels.fyi, Glassdoor, the Robert Half / Hays salary guides). Senior front-end roles in Ottawa/Toronto/Montréal vary widely by company type.
- If asked for expectations early: "Based on my research for senior front-end roles with my experience, I'm targeting the range of [X–Y], but I'm flexible depending on the total package." Give a range whose **bottom** you're happy with.
- Know your notice period, your work authorisation status, and your remote/hybrid preference.
