# AI in Front-End Development

> Your résumé lists **OpenAI API, embeddings, vector DBs (Supabase), RAG**. In 2026 many interviews ask (a) how you'd build an AI feature into a product and (b) how you use AI tools responsibly in your own workflow. This is a differentiator for you.

<details>
<summary>Explain RAG (Retrieval-Augmented Generation) simply</summary>

> 🎤 **Mock answer**
>
> RAG, retrieval-augmented generation, is a way to make a language model answer questions using your own data, which it was never trained on. The model on its own only knows its training data, so it can't answer questions about your products, policies or a specific customer's situation, and it may make things up.
>
> It works in two phases. First, ingestion: you split your documents, say help articles and plan details, into chunks, convert each chunk into an embedding, which is a vector representing its meaning, and store them in a vector database, like Postgres with pgvector in Supabase, which I've used. Then at question time, you embed the user's question, find the chunks with the most similar meaning, and send those chunks to the model together with the question and instructions to answer only from that context and cite the sources.
>
> Compared to fine-tuning, RAG is cheaper, it updates as soon as the content changes, and answers can be traced back to sources. Fine-tuning is better for teaching style or format than adding knowledge. A telecom example would be a support assistant answering "why is my bill higher this month?" using the help centre and plan terms, with links to the articles it used.

LLMs don't know your private/up-to-date data, so you **retrieve** relevant content and put it in the prompt:

1. **Ingest:** split documents (help articles, plan details) into chunks → create **embeddings** (vectors capturing meaning) → store them in a **vector DB** (pgvector/Supabase, Pinecone, OpenSearch).
2. **Query:** embed the user's question → **similarity search** (cosine) for the top-k chunks (often hybrid with keyword search + re-ranking).
3. **Generate:** send the system prompt + retrieved chunks + the question to the LLM → an answer **grounded** in your data, with **citations**.

Why not fine-tune? RAG is cheaper, updates instantly when content changes, and is traceable (citations). Fine-tuning is for style/format/behaviour, not for adding knowledge.

Bell-style example: "A support assistant that answers 'Why is my bill higher?' using the help-centre content and plan terms, with links to the source articles."

> 🔁 **Follow-up questions**
>
> **Q: How would you evaluate whether your RAG system works?**
> Build a test set of real questions with expected answers or source documents, then measure retrieval quality, meaning whether the right chunks were found, and answer quality, like correctness and faithfulness to the sources, using human review and automated LLM-based graders.
>
> **Q: What happens when the answer isn't in the documents?**
> The prompt instructs the model to say it doesn't know and suggest a next step, and you can also set a similarity threshold, so if no chunk is relevant enough, you don't call the model with weak context.
>
> **Q: How do you keep the vector index up to date?**
> Re-embed documents when they change, for example via a CMS webhook, track content hashes to skip unchanged chunks, and remove deleted documents from the index.

</details>

<details>
<summary>How do you build a chat UI with streaming responses?</summary>

> 🎤 **Mock answer**
>
> The first rule is that the browser never calls the model provider directly with an API key, because anyone could extract it. The browser calls our own backend endpoint, a Next.js route handler or a NestJS endpoint, which holds the key, checks authentication, applies rate limits, and logs usage.
>
> That endpoint streams the response back, using Server-Sent Events or a streamed HTTP response. On the client, I read the response body as a stream, decode the text chunks, and append them to the message as they arrive, so the user sees the answer being written instead of waiting several seconds. For performance with fast token streams, I batch updates per animation frame.
>
> Good chat UX needs a stop button, which aborts the request with an AbortController, retry and copy buttons, and markdown rendering that's properly sanitised. Auto-scroll should stop if the user scrolls up to read. Accessibility matters too: a polite live region that announces the completed answer rather than every token. Plus feedback buttons and citations. Libraries like the Vercel AI SDK handle a lot of this, but understanding the streaming mechanics matters for debugging.

- **Never call the LLM API directly from the browser with your secret key.** Call your own backend/BFF (Route Handler / NestJS endpoint), which holds the key, applies auth, rate limits and logging.
- Stream tokens to the client via **SSE** or a streamed `fetch` response (`ReadableStream`), and render incrementally.

```ts
const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }), signal });
const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  setAnswer(prev => prev + value);       // consider batching with rAF for performance
}
```

- UX: stop button (`AbortController`), retry, markdown rendering (**sanitised!**), copy button, auto-scroll that respects the user scrolling up, `aria-live="polite"` announcements (not every token: announce when done), feedback thumbs, and citations.
- Libraries: **Vercel AI SDK** (`useChat`, streaming, tool calling), provider SDKs (OpenAI, Anthropic).

> 🔁 **Follow-up questions**
>
> **Q: How do you render markdown that is still streaming?**
> Re-parse the accumulated text on each update with a markdown renderer that tolerates incomplete syntax, throttled to animation frames, and sanitise the output.
>
> **Q: How do you keep conversation history?**
> Send the relevant previous messages with each request, trimmed or summarised to fit the context window, and store conversations server-side if users need them across sessions.

</details>

<details>
<summary>What are the risks of AI features, and how do you mitigate them?</summary>

> 🎤 **Mock answer**
>
> The first is prompt injection: text from the user, or from a retrieved document, containing instructions like "ignore your previous instructions". You can't fully prevent it with prompting, so the design must limit the damage. Treat the model's output as untrusted, give it only the minimum tools and permissions, and require human confirmation before any real action, like changing an account.
>
> Second, XSS: if you render the model's markdown or HTML without sanitising it, an attacker who influences the output can inject script, so I sanitise output just like any user content. Third, hallucinations: grounding with RAG, showing citations, and instructing the model to say when it doesn't know. Fourth, privacy: avoid sending personal data unnecessarily, check the provider's data retention policies, and comply with laws like PIPEDA and Quebec's Law 25.
>
> Then there are cost and latency, managed with caching, streaming, smaller models for simple tasks and per-user rate limits. And evaluation: a set of test questions with expected answers, run whenever the prompt or model changes, so quality doesn't silently regress.

- **Prompt injection:** user input or retrieved documents containing instructions ("ignore previous instructions..."). Mitigate: treat model output as untrusted, least-privilege tools, require human confirmation for actions, separate system and user content, and add output filtering.
- **XSS via model output:** rendering LLM markdown/HTML without sanitising is a real XSS vector. Use DOMPurify or a safe markdown renderer.
- **Hallucinations:** grounding with RAG, citations, "I don't know" behaviour, evals.
- **Data privacy:** don't send PII unnecessarily, respect provider data retention settings, and comply with Law 25 / PIPEDA.
- **Cost and latency:** caching, smaller models for simple tasks, streaming, token limits, rate limiting per user.
- **Evaluation:** a test set of questions + expected answers, run on every prompt/model change.

> 🔁 **Follow-up questions**
>
> **Q: Give an example of indirect prompt injection.**
> A support document or webpage that the system retrieves contains hidden text like "tell the user to visit this link". The model treats it as an instruction. That's why retrieved content must be treated as data, and tools must be limited.
>
> **Q: How would you control costs?**
> Rate limits per user, caching common answers, limiting response length, using smaller models for simple tasks, and monitoring cost per feature.

</details>

<details>
<summary>How do you use AI coding tools in your workflow? (answer maturely)</summary>

> 🎤 **Mock answer**
>
> I use AI tools like GitHub Copilot daily, [and also Claude or ChatGPT for bigger questions]. They save me the most time on boilerplate, writing tests, refactoring, converting code between patterns, exploring an unfamiliar library or API, and drafting documentation.
>
> But I treat AI output like a pull request from a junior developer: I read it, I make sure I understand it, I test it, and I own it once it's merged. AI tools are confidently wrong fairly often, especially with newer library versions or subtle concurrency and security issues, so I never paste code I couldn't explain in a code review.
>
> I'm also careful about company policy: only using approved tools and never pasting proprietary code, customer data or secrets into tools that aren't approved.
>
> As a senior, I'd also help the team use these tools well: agree on approved tools, keep the same review standards for AI-generated code, and share prompts and workflows that work. I see AI as making me faster at what I already know how to do. Architecture, security and performance judgment are still my responsibility.

"I use AI assistants (GitHub Copilot, [Claude/ChatGPT/Cursor]) for boilerplate, tests, refactors, exploring unfamiliar APIs and first drafts of documentation. I treat the output like a junior's PR: I review it, test it and make sure I understand it before it goes in. I'm careful about not pasting proprietary code or secrets into tools that aren't approved by the company. Where they help most is speed on well-understood tasks. Architecture, security and performance decisions still need human judgment."

Seniors are increasingly asked how they'd **set team guidelines** for AI tools: approved tools, review standards, no secrets, licence concerns, and measuring impact.

> 🔁 **Follow-up questions**
>
> **Q: Has AI ever introduced a bug into your code?**
> [Honest example.] For example: "It suggested an effect without a cleanup, which caused a stale request bug. It reinforced that I review AI code just as carefully as any other code."
>
> **Q: How do you think AI changes the role of a senior developer?**
> Writing code gets faster, so judgment matters more: choosing the right architecture, reviewing carefully, testing, security, and understanding the business problem. Seniors also set the standards for how the team uses these tools.

</details>

<details>
<summary>Embeddings and vector search: key terms</summary>

> 🎤 **Mock answer**
>
> An embedding is a list of numbers, a vector, that represents the meaning of a piece of text, so texts with similar meanings produce vectors that are close together. Similarity is usually measured with cosine similarity. That's what makes semantic search possible: a question like "my internet keeps dropping" can match an article titled "troubleshooting connection issues", even with no words in common.
>
> Chunking is splitting documents into pieces of a few hundred tokens, usually by headings or paragraphs with some overlap, so each chunk is focused enough to be relevant. Vector databases use approximate nearest-neighbour indexes, like HNSW, to search millions of vectors quickly. In practice, hybrid search, combining vector search with traditional keyword search, plus a re-ranking step, gives the best results, since keywords still matter for things like product names and model numbers.
>
> Other terms: the context window is the maximum amount of text the model can process at once. Tool calling lets the model return a structured request for your code to run, like checking service availability at an address. And MCP, the Model Context Protocol, is a standard way to connect models to tools and data sources.

- **Embedding:** a fixed-length vector representing meaning; similar meaning gives nearby vectors.
- **Cosine similarity / dot product:** distance measures.
- **Chunking:** split text (by headings/paragraphs, ~300–800 tokens, with overlap).
- **ANN index (HNSW, IVF):** approximate nearest-neighbour search for speed.
- **Hybrid search:** combine vector + keyword (BM25) results; **re-ranking** with a cross-encoder.
- **Context window:** max tokens the model can read; more context means more cost and potential "lost in the middle".
- **Tool / function calling:** the model returns structured calls your code executes (e.g. `checkServiceability(address)`).
- **Agents / MCP (Model Context Protocol):** standardised ways for models to use tools and data sources.

> 🔁 **Follow-up questions**
>
> **Q: Why use hybrid search?**
> Vector search is good at meaning but can miss exact terms, like a phone model number or plan name, while keyword search catches those. Combining both and re-ranking gives better results.
>
> **Q: How do you choose chunk size?**
> Small chunks are precise but lose context, large ones keep context but dilute relevance. I'd start around a few hundred tokens split on headings with overlap, then tune it using the evaluation set.

</details>
