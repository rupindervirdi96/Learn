# Game Plan — How to Use This Guide

> **Goal:** walk into a Senior Front-End (React / JavaScript) interview ready to (1) tell a credible senior story about your Bell work, (2) answer deep technical questions, (3) code live, (4) design a front-end system on a whiteboard, and (5) talk confidently about cloud, CI/CD and production.

## What a senior interview loop usually looks like

| Round | Length | What they're really testing | Where to study |
|---|---|---|---|
| Recruiter screen | 20–30 min | Communication, salary range, notice period, "why you" | Your Story |
| Tech screen | 45–60 min | JS/React fundamentals, one small coding task | JavaScript, React |
| Live coding | 60 min | Build a component or utility, talk while coding, test it | Coding Challenges |
| Front-end system design | 60 min | Architecture, trade-offs, performance, scaling to many teams | System Design, Performance, Cloud |
| Behavioral / leadership | 45–60 min | Ownership, conflict, mentoring, influence, failure | Your Story, Leadership |
| Hiring manager | 30–45 min | Do they want you on the team? Your motivation and ambition | Your Story, Cheat Sheet |

## What separates "senior" from "intermediate" answers

- **Trade-offs, not facts.** Don't stop at "useMemo caches a value". Add "...but it has a cost. I only use it when profiling shows a slow computation or when I need a stable reference for a memoized child."
- **Scope beyond the ticket.** Talk about the team, the codebase, the users and the business: "this reduced checkout drop-off", "this unblocked 3 other teams".
- **Production thinking.** Monitoring, rollbacks, feature flags, accessibility, i18n, security and performance budgets.
- **Influence.** "I wrote an RFC", "I set up the lint rule so the whole team got it for free", "I mentored two juniors through..."
- **Say "it depends", then say what it depends on.** Follow it with a recommendation every time.

## A 14-day study plan

| Day | Focus | Output |
|---|---|---|
| 1 | Your Story: write and rehearse the 60s and 2-min pitch out loud, then fill in the real numbers in the STAR stories | Record yourself once |
| 2 | JavaScript core (closures, `this`, prototypes, event loop, promises) | Flashcards: JavaScript |
| 3 | Coding: debounce, throttle, Promise.all, deep clone, memoize, EventEmitter | Write each from scratch in < 10 min |
| 4 | React internals: rendering, reconciliation, hooks, effects, memoization | Flashcards: React |
| 5 | React 19 + concurrent features + Server Components + Next.js | Explain RSC to a rubber duck |
| 6 | React coding: autocomplete, infinite scroll, modal, data table, form | Build 2 of them timed (45 min) |
| 7 | TypeScript + state management (RTK, RTK Query, TanStack Query, Zustand) | |
| 8 | Performance + Core Web Vitals, plus your Bell perf story | Be able to name 10 techniques |
| 9 | Accessibility, CSS, HTML, i18n | |
| 10 | Testing + security | |
| 11 | System design: practise 2 designs out loud with the RADIO framework | Draw on paper |
| 12 | Cloud & DevOps: AWS front-end hosting, CI/CD, Docker, monitoring | Draw the S3+CloudFront diagram from memory |
| 13 | Leadership / behavioral: rehearse 8 STAR stories, then a mock interview | |
| 14 | Cheat Sheet only. Rest. Prepare questions to ask. | |

## How to answer any technical question (the 4-step pattern)

1. **Define it** in one sentence.
2. **Explain how it works** (the mechanism, not just the definition).
3. **Give an example**, ideally from Bell: "On the Bell checkout we..."
4. **Trade-offs / when NOT to use it.** This step is what makes the answer senior.

## How to approach live coding

1. Restate the problem and ask clarifying questions about inputs, edge cases and the expected API.
2. Say your approach out loud **before** typing.
3. Start with a working simple version, then improve it.
4. Narrate as you go: "I'm using a ref here so the timer survives re-renders."
5. Test with edge cases: empty input, rapid clicks, unmount mid-request, keyboard users.
6. Finish with "If I had more time I'd add... (a11y, tests, error states, cancellation)".

## Day-of checklist

- [ ] Camera, mic and IDE ready; a CodeSandbox/StackBlitz React template open
- [ ] Water, notepad for system-design sketches
- [ ] Your 60-second pitch rehearsed out loud
- [ ] 3 numbers you will mention: **~20% faster page loads**, **~30% fewer production bugs**, **promoted to Senior Full Stack (Apr 2025)**
- [ ] 3–5 questions for them (see Cheat Sheet)
- [ ] The job description re-read: map each requirement to one of your stories
