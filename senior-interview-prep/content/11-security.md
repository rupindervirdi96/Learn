# Front-End Security

> E-commerce + payments + customer accounts (Bell) means security questions are fair game. Know the **OWASP** basics from a front-end angle.

<details>
<summary>What is XSS? How does React protect you, and where doesn't it?</summary>

> 🎤 **Mock answer**
>
> Cross-site scripting is when an attacker manages to run their own JavaScript in other users' browsers on your site. That script can steal session data, act as the user, or skim payment details from a form. It can be stored, for example in a product review saved in the database; reflected, from a URL parameter; or DOM-based, where client-side code writes untrusted data into the page.
>
> React protects you by default because it escapes any value rendered in JSX, so user input appears as text, not HTML. But there are gaps. `dangerouslySetInnerHTML` bypasses it, so any HTML from a CMS or a user must be sanitised with DOMPurify first. `href` attributes can contain `javascript:` URLs, so I validate that user-provided links use http or https. Direct DOM APIs like `innerHTML` or `eval` bypass React entirely. Serialising state into a script tag during SSR needs proper escaping. And third-party scripts run with full access to the page.
>
> So I rely on defence in depth: sanitising, a Content Security Policy, HttpOnly cookies so session tokens can't be read by scripts, and server-side validation.

**Cross-Site Scripting** is an attacker getting their JavaScript to run in your users' browsers (steal sessions, act as the user, skim payment forms).
- **Stored** (saved in the DB, e.g. a product review), **Reflected** (in the URL/response), **DOM-based** (client JS writes untrusted data into the DOM).

**React escapes** values rendered in JSX (`{userInput}` becomes text). It does **not** protect:
- `dangerouslySetInnerHTML` → sanitise with **DOMPurify** first (CMS content, rich text).
- `href={userUrl}` → `javascript:alert(1)` URLs. Validate the protocol (`http:`/`https:` only).
- Direct DOM APIs: `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `setTimeout(string)`.
- SSR: serialising state into `<script>` tags without escaping (`</script>` injection). Use safe serialisers.
- Third-party scripts (they run with full page privileges).

Defence in depth: **Content Security Policy**, **HttpOnly cookies** (JS can't read the session), **Trusted Types**, input validation on the server, and output encoding.

> 🔁 **Follow-up questions**
>
> **Q: How would you safely render HTML from a CMS?**
> Sanitise it with DOMPurify using a strict allow-list of tags and attributes, preferably on the server or at build time, and then render it. Ideally the CMS provides structured content instead of raw HTML.
>
> **Q: What are Trusted Types?**
> A browser feature, enforced through CSP, that makes dangerous DOM sinks like innerHTML only accept special typed values created by approved policies, so a stray string can't be injected.
>
> **Q: Is user input in a URL query parameter safe in React?**
> Rendering it as text is safe. Using it in an `href`, in `dangerouslySetInnerHTML` or passing it to eval-like functions is not.

</details>

<details>
<summary>What is Content Security Policy (CSP)?</summary>

> 🎤 **Mock answer**
>
> CSP is an HTTP response header that tells the browser which sources are allowed to load scripts, styles, images, fonts, frames and network connections. If an attacker injects a script tag pointing to their own domain, or an inline script, the browser refuses to run it. That makes it one of the strongest defences against XSS.
>
> A good modern policy uses nonces or hashes for scripts instead of allowing all inline scripts, with `strict-dynamic` so trusted scripts can load their dependencies. It restricts `connect-src` to your own APIs, blocks plugins with `object-src 'none'`, and uses `frame-ancestors` to prevent clickjacking.
>
> The way to roll it out safely is to start with the report-only header, collect violation reports for a while to see what would break, fix or allow-list those, and then enforce it.
>
> The real-world challenge on large corporate sites is third-party marketing scripts and tag managers, which load scripts from many domains. So CSP is partly a governance conversation: which third parties do we actually need?

An HTTP response header that whitelists where scripts, styles, images, frames and connections can load from, which blocks most injected scripts.

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m' 'strict-dynamic';
  img-src 'self' https://images.cdn.example; connect-src 'self' https://api.example;
  frame-ancestors 'none'; object-src 'none'; base-uri 'self'
```

Use **nonces/hashes** instead of `'unsafe-inline'`, and roll out with `Content-Security-Policy-Report-Only` first to collect violations. Challenge on big corporate sites: **tag managers and marketing scripts**. A senior would push to govern third-party scripts.

> 🔁 **Follow-up questions**
>
> **Q: Why are nonces better than 'unsafe-inline'?**
> 'unsafe-inline' allows any inline script, including injected ones, which defeats much of CSP. A nonce is a random value per response, and only scripts with that nonce run, which an attacker can't guess.
>
> **Q: How does CSP work with Next.js?**
> Generate a nonce per request in middleware or the proxy, set it in the CSP header, and Next.js applies it to its own scripts. It requires dynamic rendering for those pages, which is a trade-off with static caching.

</details>

<details>
<summary>What is CSRF, and how is it prevented?</summary>

> 🎤 **Mock answer**
>
> Cross-site request forgery is an attack where a malicious website makes the user's browser send a request to your site, and because the browser automatically attaches cookies, the request is authenticated as the user. For example, a hidden form on another site that submits a "change email address" request to your account page.
>
> The main defence today is the `SameSite` cookie attribute. With `Lax`, which is now the browser default, cookies aren't sent on cross-site POST requests, and `Strict` is even tighter for sensitive cookies. On top of that, I'd use CSRF tokens for state-changing requests, either a token from the server embedded in the form or the double-submit cookie pattern, and check the `Origin` header on the server. And state-changing operations should never be GET requests.
>
> It's worth noting the trade-off with tokens: if the API uses a bearer token in a header instead of cookies, CSRF isn't a risk, but then you have to store the token somewhere JavaScript can read it, which makes XSS more dangerous.

**Cross-Site Request Forgery**: a malicious site makes the user's browser send an authenticated request (cookies attached automatically) to your site, e.g. a hidden form that POSTs to `/account/change-email`.

Prevention:
- **`SameSite` cookies** (`Lax` by default in modern browsers; `Strict` for sensitive ones).
- **CSRF tokens** (synchroniser token or double-submit cookie) for state-changing requests.
- Check `Origin` / `Referer` headers.
- Never change state with GET.

Bearer tokens in headers aren't vulnerable to CSRF, but then token storage is an XSS risk. That's the trade-off.

> 🔁 **Follow-up questions**
>
> **Q: Does SameSite=Lax fully protect against CSRF?**
> Mostly, but not completely: Lax still sends cookies on top-level GET navigations, so GET endpoints must never change state, and older browsers or subdomain attacks remain concerns. That's why tokens or origin checks add defence in depth.
>
> **Q: Do JSON APIs need CSRF protection?**
> If they use cookies for auth, yes. Requiring a JSON content type and checking the Origin header helps, because cross-site forms can't send JSON without a preflight, but it shouldn't be the only defence.

</details>

<details>
<summary>Where should you store auth tokens? (classic senior question)</summary>

> 🎤 **Mock answer**
>
> This is a trade-off between XSS and CSRF risk. If you store tokens in localStorage, any script running on the page can read them, so a single XSS vulnerability, including one in a third-party script, means the token gets stolen and used from anywhere. So I avoid localStorage for anything sensitive. Keeping a token in memory is better, but it's lost on refresh, and it's still accessible while the page is running.
>
> My recommended approach is an HttpOnly, Secure, SameSite cookie. JavaScript can't read it at all, it's only sent over HTTPS, and SameSite blocks most CSRF, with a CSRF token added for extra protection. Even better is the Backend-for-Frontend pattern: the BFF handles the OAuth flow and keeps the actual access and refresh tokens on the server, and the browser only has a session cookie. Access tokens are short-lived, and refresh tokens are rotated.
>
> I'd add one honest caveat: HttpOnly cookies stop token theft, but if there's an XSS vulnerability, the attacker can still make requests as the user while they're on the page. So preventing XSS is still essential.

- **`localStorage`**: readable by any JS on the page, so **XSS = token theft**. Avoid it for sensitive tokens.
- **In-memory** (a JS variable): lost on refresh; still readable by XSS while the page is running, but not persisted.
- **`HttpOnly; Secure; SameSite` cookie**: JS can't read it (mitigates token theft via XSS); needs CSRF protection (SameSite + token).

**Recommended:** session or refresh token in an **HttpOnly Secure SameSite cookie**, ideally managed by a **BFF** (Backend-for-Frontend). The browser never sees OAuth tokens; the BFF holds them server-side. Short-lived access tokens, refresh token rotation.

Note: XSS can still *make requests as the user* even with HttpOnly cookies, so preventing XSS remains essential.

> 🔁 **Follow-up questions**
>
> **Q: How does the frontend know if the user is logged in with HttpOnly cookies?**
> It calls a session endpoint, like `/api/me`, which returns the user, or the server renders the user state into the page. The frontend never reads the token itself.
>
> **Q: How does token refresh work?**
> The access token is short-lived. When it expires, the BFF or the client calls a refresh endpoint using the refresh token in an HttpOnly cookie, gets a new access token, and rotates the refresh token so a stolen one can only be used once.

</details>

<details>
<summary>Explain OAuth 2.0 / OpenID Connect and PKCE for an SPA</summary>

> 🎤 **Mock answer**
>
> OAuth 2.0 is about authorisation. It lets an app get an access token to call APIs on behalf of the user, without handling their password. OpenID Connect is a layer on top that adds authentication. It provides an ID token that says who the user is. So login is OIDC, and calling APIs is OAuth.
>
> For single-page apps and mobile apps, the recommended flow is Authorization Code with PKCE. The app generates a random secret called the code verifier, and sends a hashed version, the code challenge, when redirecting the user to the login page. After login, the app gets an authorisation code, and exchanges it for tokens by sending the original verifier. If an attacker intercepts the code, it's useless without the verifier. The older implicit flow, which returned tokens directly in the URL, is now deprecated.
>
> In practice, you'd use a provider like Auth0, Okta, AWS Cognito or Microsoft Entra ID with their SDK, or a BFF that does the flow on the server, which keeps tokens out of the browser.

- **OAuth 2.0**: delegated **authorisation** (access tokens to call APIs).
- **OIDC**: an identity layer on top, adding the **ID token** (who the user is) for **authentication / login**.
- For SPAs and mobile apps: **Authorization Code flow + PKCE**. The app creates a random `code_verifier`, sends its hash (`code_challenge`) with the auth request, receives a code, and exchanges code + verifier for tokens. An intercepted code is useless without the verifier.
- The **Implicit flow is deprecated** (tokens in the URL).
- Providers: Auth0/Okta, AWS Cognito, Azure Entra ID, Keycloak, and NextAuth/Auth.js in Next.js.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between the ID token and the access token?**
> The ID token is for the client, describing who the user is. The access token is for the API, granting permission. You should never send the ID token to APIs as an access token.
>
> **Q: Why was the implicit flow deprecated?**
> Tokens were returned in the URL fragment, where they could leak through browser history, logs and referrers, and there was no proof that the client requesting the token was the one receiving it.

</details>

<details>
<summary>CORS: what is it and what is it NOT?</summary>

> 🎤 **Mock answer**
>
> The browser's same-origin policy prevents JavaScript on one origin from reading responses from another origin. CORS is the mechanism that lets a server opt in to allowing that. The server sends headers like `Access-Control-Allow-Origin` to say which origins may read the response, and whether credentials are allowed. For non-simple requests, like a PUT or a JSON content type, the browser first sends a preflight OPTIONS request to ask permission.
>
> What CORS is not: it's not a server-side security control. It doesn't stop anyone calling your API with curl or from another server. It only controls what browsers allow JavaScript to read, to protect users. So it doesn't replace authentication.
>
> When developers hit a CORS error, the fix is on the server, by configuring the allowed origins correctly, or by avoiding cross-origin calls entirely with a dev proxy or a BFF on the same domain. Two gotchas: the wildcard origin can't be used with credentials, and reflecting any origin back is effectively no protection at all.

The **Same-Origin Policy** stops JS on `a.com` from reading responses from `b.com`. **CORS** is how `b.com` *opts in*, via response headers: `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, `-Credentials`.

**Preflight**: for "non-simple" requests (e.g. `PUT`, a JSON `Content-Type`, custom headers) the browser first sends `OPTIONS` to check permission.

What it's NOT: it's not a server-side security mechanism, and it doesn't stop curl or server-to-server calls. It protects **users' browsers**. `Access-Control-Allow-Origin: *` can't be combined with credentials. A "CORS error" is fixed **on the server** (or with a dev proxy / BFF on the same origin), never by disabling security in the browser.

> 🔁 **Follow-up questions**
>
> **Q: Why do I see an OPTIONS request before my POST?**
> It's a CORS preflight. Because the request uses a JSON content type or custom headers, the browser first asks the server whether the actual request is allowed.
>
> **Q: How do you avoid CORS entirely?**
> Serve the API from the same origin as the frontend, through a reverse proxy, CDN path routing or a BFF, so no cross-origin requests happen at all.

</details>

<details>
<summary>Other headers and attacks to know</summary>

> 🎤 **Mock answer**
>
> Clickjacking is when your site is loaded in an invisible iframe on another site to trick users into clicking things. You prevent it with the CSP `frame-ancestors` directive or the `X-Frame-Options` header. HSTS, Strict-Transport-Security, forces browsers to use HTTPS. `X-Content-Type-Options: nosniff` stops the browser guessing content types. `Referrer-Policy` controls what URL information leaks to other sites. And `Permissions-Policy` restricts features like the camera or geolocation.
>
> Subresource Integrity adds a hash to script tags loading from a CDN, so if the file is tampered with, the browser refuses to run it. Open redirects are a common issue in login flows: a `returnUrl` parameter pointing to a malicious site, which I prevent by allow-listing redirect targets.
>
> On the front end specifically: never put secrets in front-end environment variables, because anything prefixed `NEXT_PUBLIC` or `VITE` ends up in the bundle that anyone can read. Don't log personal data to analytics or error monitoring. And for payments, use the payment provider's hosted fields, so card data never touches your code, which also reduces PCI compliance scope.

- **Clickjacking**: your site is embedded in an invisible iframe. Fix: `frame-ancestors 'none'` (CSP) / `X-Frame-Options: DENY`.
- **HSTS**: `Strict-Transport-Security` forces HTTPS.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **Subresource Integrity (SRI)**: `<script src integrity="sha384-...">` makes the browser refuse a CDN file that was tampered with.
- **Open redirects**: `?returnUrl=https://evil.com` after login. Allow-list redirect targets.
- **Sensitive data**: never put secrets in front-end env vars (`NEXT_PUBLIC_*` / `VITE_*` are **public**!). Don't log PII to analytics/Sentry (scrub it).
- **Payment forms**: use the provider's hosted fields/iframes (Stripe/Moneris), which keeps PCI scope off your front end.

> 🔁 **Follow-up questions**
>
> **Q: Why are front-end environment variables not secret?**
> They're inlined into the JavaScript bundle at build time, and anyone can view the bundle in their browser. Only public values belong there.
>
> **Q: How does HSTS preload work?**
> The domain is included in a list built into browsers, so they use HTTPS even on the very first visit, before seeing the header.

</details>

<details>
<summary>Supply-chain security for npm dependencies</summary>

> 🎤 **Mock answer**
>
> A typical front-end project has hundreds or thousands of transitive dependencies, and any of them can be compromised. There have been real incidents in the last couple of years where popular npm packages were hijacked, including through phishing maintainers, and published malicious versions that stole credentials.
>
> The practices I follow: commit the lockfile and use `npm ci` in CI, so installs are reproducible, and review lockfile changes in pull requests. Use automated tools like Dependabot, Renovate or Snyk for vulnerabilities, and act quickly on critical ones. Be selective about adding dependencies, checking maintenance, popularity and size. Reduce exposure to install scripts, which is how many attacks run, by disabling them or allow-listing the packages that need them. And delay adopting brand-new versions with a minimum release age policy, since most malicious versions are caught within days.
>
> At enterprise scale, like Bell, packages often come through a private registry or proxy that can scan and block packages. And on the runtime side, Subresource Integrity and CSP limit the damage if a third-party script is compromised.

Recent real incidents (e.g. 2025 npm worm/phishing compromises of popular packages) make this a hot topic. Practices:
- Lockfiles committed; **`npm ci`** in CI; pin versions; review lockfile diffs.
- `npm audit` / **Dependabot / Renovate / Snyk**; act on critical CVEs quickly.
- Minimise dependencies (check bundlephobia, maintenance, downloads).
- Disable install scripts where possible (`--ignore-scripts`, pnpm `onlyBuiltDependencies`), use **minimum release age** policies (don't auto-install versions published hours ago), and provenance/signatures (npm provenance, Sigstore).
- Private registry/proxy (Artifactory, CodeArtifact) at enterprises like Bell.
- SRI for third-party CDN scripts and CSP to limit the blast radius.

> 🔁 **Follow-up questions**
>
> **Q: What does npm ci do differently from npm install?**
> It installs exactly what's in the lockfile, fails if package.json and the lockfile don't match, and starts from a clean node_modules. That makes builds reproducible.
>
> **Q: What would you do if a dependency was reported compromised?**
> Check whether the affected versions are in our lockfiles and which builds used them, pin to a safe version, rotate any secrets that could have been exposed in CI or developer machines, and review the incident advisory for specific indicators.

</details>
