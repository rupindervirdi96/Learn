# Senior Front-End Interview Prep

Open **`index.html`** in your browser. It's one self-contained file and works offline.

- **📖 Study:** 17 chapters, 202 questions. Every answer starts with a **🎤 Mock answer**, a complete spoken answer you can say in the interview, followed by detailed notes, and ends with **🔁 Follow-up questions** (451 in total): the questions an interviewer is likely to ask next, each with a collapsible answer so you can try first. Use **🎤 Mock answers only** to hide the notes, and **🔊 Listen** to hear an answer read aloud. Click **Mark mastered** once you can say it out loud without looking.
- **🃏 Cards:** random flashcards (all chapters or one), with a timer. Choose to reveal the mock answer only, or the mock answer plus notes. `Space` reveals, `G` marks it as got-it, `→` skips.
- **📊 Progress:** mastery per chapter. Progress is saved in your browser's localStorage.
- **Search:** press `/` anywhere.

## Chapters (`content/`)

| # | File | What's in it |
|---|---|---|
| 00 | game-plan | Interview loop, 14-day plan, how to answer |
| 01 | your-story | **Your Bell background**, pitch, 10 STAR stories ← fill in the `[brackets]` |
| 02 | javascript | Closures, `this`, event loop, promises, memory |
| 03 | coding-challenges | 25 problems with solutions (utilities and React components) |
| 04 | react | Rendering, hooks, concurrent features, React 19, RSC |
| 05 | state-and-data | Redux Toolkit, RTK Query, TanStack Query, Zustand |
| 06 | nextjs-rendering | CSR/SSR/SSG/ISR, App Router, caching, bundlers |
| 07 | typescript | Generics, unions, typing React, Zod |
| 08 | performance | Core Web Vitals (LCP/INP/CLS), bundles, caching |
| 09 | html-css-a11y | WCAG, ARIA, EN/FR i18n, modern CSS, design systems |
| 10 | testing | Strategy, RTL, MSW, Cypress vs Playwright |
| 11 | security | XSS, CSP, CSRF, tokens, OAuth+PKCE, supply chain |
| 12 | system-design | RADIO framework + 5 worked designs, micro-frontends |
| 13 | cloud-devops | AWS (S3/CloudFront/Lambda…), Azure/GCP, CI/CD, Docker, K8s |
| 14 | ai-frontend | RAG, streaming chat UI, AI risks |
| 15 | leadership-behavioral | Senior signals, mentoring, code review, 90-day plan |
| 16 | cheat-sheet | Last-night review + questions to ask them |

## Editing

The Markdown files in `content/` are the source; they also read well in VS Code (`Ctrl+Shift+V`). After editing, rebuild:

```
node build.js
```

Q&A format inside the Markdown:

```
<details>
<summary>The question</summary>

> 🎤 **Mock answer**
>
> The spoken answer, first person.

The detailed notes (any markdown).

> 🔁 **Follow-up questions**
>
> **Q: A likely follow-up?**
> The answer.

</details>
```
