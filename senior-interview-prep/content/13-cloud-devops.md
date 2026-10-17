# Cloud, DevOps & Deployment for Front-End Engineers

> Senior front-end engineers are expected to **own the path to production**: how the app is built, hosted, cached, deployed, monitored and rolled back. You don't need to be a cloud architect, but you must speak confidently about **AWS** (most asked), with **Azure/GCP equivalents**, CI/CD, containers and observability.
>
> 🔧 **Be honest about your hands-on level.** Say "At Bell, deployments went through [the platform team's pipeline / Jenkins / GitLab CI / OpenShift]. I owned [X]. On my own projects I've deployed with [Vercel / Render / AWS S3+CloudFront / Supabase]." You have real projects in your folder (e.g. a Render full-stack test, a GitHub Pages portfolio, and Supabase on your résumé), so use them.

## The reference architecture: static SPA on AWS (draw it from memory)

```
            Route 53 (DNS: shop.example.com)
                    │
                    ▼
     AWS WAF ──► CloudFront (CDN, TLS via ACM cert, HTTP/2–3, Brotli, edge caching)
                    │  Origin Access Control (bucket is NOT public)
          ┌─────────┴──────────────┐
          ▼                        ▼  /api/*  (path-based behaviour)
   S3 bucket (static build:   API Gateway / ALB ──► Lambda / ECS / EKS services
   index.html + hashed JS/CSS)          │
                                        └──► DynamoDB / RDS / external services
   CloudFront Functions / Lambda@Edge: redirects, security headers, locale routing, auth checks
   Cognito (or Okta/Entra): user login (OIDC + PKCE)
   CloudWatch / X-Ray / RUM: logs, metrics, traces, real-user monitoring
```

**Deploy flow:** CI builds → uploads **hashed assets first** (`Cache-Control: max-age=31536000, immutable`) → uploads `index.html` (`no-cache`) → **CloudFront invalidation** of `/index.html` only → smoke test. Rollback means re-pointing to the previous build (keep the old assets; use versioned prefixes).

SPA routing gotcha: deep links like `/plans/5g` return 404 from S3, so configure CloudFront to serve `index.html` for 403/404 (or use a CloudFront Function rewrite).

## AWS services a front-end dev should know

| Service | What it is | Front-end use |
|---|---|---|
| **S3** | object storage | host static builds, user uploads (via **pre-signed URLs**) |
| **CloudFront** | CDN | cache assets/pages at the edge, TLS, custom headers, path routing |
| **Route 53** | DNS | domains, health-check failover |
| **ACM** | certificates | free TLS certs for CloudFront (must be in us-east-1) |
| **Lambda** | serverless functions | APIs, BFF, image resizing, SSR (Next via OpenNext) |
| **Lambda@Edge / CloudFront Functions** | code at the edge | redirects, headers (CSP/HSTS), A/B bucketing, auth checks |
| **API Gateway** | managed API front door | REST/HTTP/WebSocket APIs, throttling, auth |
| **Cognito** | user auth | sign-up/sign-in, OIDC, social login, JWTs |
| **Amplify Hosting** | managed front-end hosting + CI | quick deploys of React/Next with preview branches |
| **ECS/Fargate, EKS** | containers | run SSR Node servers (Next.js standalone) |
| **DynamoDB / RDS** | databases | |
| **SQS / SNS / EventBridge** | messaging | async workflows (order events) |
| **CloudWatch, X-Ray, CloudWatch RUM** | observability | logs, metrics, alarms, traces, Core Web Vitals |
| **WAF / Shield** | security | block bots, SQL injection, rate limiting, DDoS |
| **Secrets Manager / SSM Parameter Store** | secrets/config | API keys for the BFF (never in the front-end bundle) |
| **IAM** | permissions | least privilege for CI deploy roles (OIDC from GitHub Actions, no long-lived keys) |
| **Bedrock** | managed LLMs | AI features (ties to your AI experience) |

## Azure & GCP equivalents (in case the company isn't on AWS)

| Need | AWS | Azure | GCP |
|---|---|---|---|
| Static hosting | S3 + CloudFront / Amplify | **Static Web Apps**, Blob Storage + Front Door | Cloud Storage + Cloud CDN, **Firebase Hosting** |
| CDN / edge | CloudFront | Azure Front Door / CDN | Cloud CDN |
| Serverless | Lambda | Azure Functions | Cloud Functions / **Cloud Run** |
| Containers | ECS / EKS | Container Apps / AKS | Cloud Run / GKE |
| Auth | Cognito | **Entra ID** (formerly Azure AD), Entra External ID | Firebase Auth / Identity Platform |
| CI/CD | CodePipeline | **Azure DevOps Pipelines**, GitHub Actions | Cloud Build |
| Monitoring | CloudWatch | **Application Insights** / Azure Monitor | Cloud Monitoring / Logging |
| Secrets | Secrets Manager | Key Vault | Secret Manager |

Also know the **front-end platforms**: **Vercel** (Next.js creators: preview deployments per PR, edge functions, ISR), **Netlify**, **Cloudflare Pages/Workers**, **Render**, and **Supabase** (Postgres + auth + storage + pgvector). Enterprise (IBM/Bell world): **Red Hat OpenShift** (Kubernetes) and IBM Cloud are common, which is worth mentioning if that matches your experience.

## Interview questions

<details>
<summary>How would you deploy a React SPA to AWS? Walk me through it.</summary>

> 🎤 **Mock answer**
>
> For a single-page app, I'd host the static build in a private S3 bucket with CloudFront in front of it as the CDN. The bucket isn't public; CloudFront accesses it through Origin Access Control. I'd attach an SSL certificate from ACM, and point the domain at the distribution with a Route 53 alias record.
>
> Caching is the important detail. The hashed JavaScript and CSS files get a one-year immutable cache, and `index.html` gets no-cache, so users always get the latest version, which references the new hashed files. Because it's a single-page app, I'd configure CloudFront to return `index.html` for unknown paths, so deep links work. Security headers like CSP and HSTS can be added with a CloudFront response headers policy, and WAF can sit in front for bot protection and rate limiting.
>
> For deployment, the CI pipeline builds the app, assumes an AWS role through OIDC, so no long-lived access keys are stored, syncs the files to S3, and invalidates just `index.html` in CloudFront. I'd define all of this with infrastructure as code, like CDK or Terraform, so dev, staging and production are identical.
>
> If it's Next.js with server rendering, the options are Vercel, AWS Amplify, OpenNext on Lambda, or a Docker container on ECS or Fargate with CloudFront in front.

1. Build in CI (`npm ci && npm run build`) → hashed assets in `dist/`.
2. A private S3 bucket + CloudFront with **Origin Access Control**; HTTPS via ACM; Route 53 alias record.
3. Cache policy: hashed assets get a 1 year `immutable` cache; `index.html` gets `no-cache`.
4. SPA fallback: serve `index.html` for unknown paths.
5. Security headers via a CloudFront **response headers policy** (CSP, HSTS, X-Content-Type-Options, frame-ancestors).
6. CI deploys with an IAM role assumed via **OIDC** (no stored AWS keys) → `aws s3 sync` → `aws cloudfront create-invalidation --paths /index.html`.
7. Infrastructure as code (CDK/Terraform), environments for dev/staging/prod, WAF in front, and alarms on 5xx/4xx rates.

For Next.js with SSR: Vercel, **AWS Amplify**, **OpenNext/SST** (Lambda + CloudFront), or a **Docker container** on ECS/Fargate / Cloud Run / Kubernetes with the CDN in front.

> 🔁 **Follow-up questions**
>
> **Q: Why not just make the S3 bucket public with static website hosting?**
> It's simpler, but you lose HTTPS on a custom domain without CloudFront, edge caching, security headers and WAF, and anyone can bypass the CDN. A private bucket with Origin Access Control is the recommended setup.
>
> **Q: How do you roll back a bad deployment?**
> Keep previous builds in versioned folders or as versioned artifacts. Rollback means re-deploying the previous `index.html`, or pointing CloudFront's origin path to the previous version, and invalidating the HTML.
>
> **Q: How do you handle multiple environments?**
> Separate buckets and distributions per environment, defined by the same infrastructure code with different parameters, ideally in separate AWS accounts for production isolation.

</details>

<details>
<summary>How do CDNs work, and what are the key caching headers?</summary>

> 🎤 **Mock answer**
>
> A CDN has servers, called edge locations, all over the world. When a user requests a file, it goes to the nearest edge. If that edge has a cached copy, it returns it immediately. If not, it fetches it from the origin server, stores it, and serves it to later users. That reduces latency, protects the origin, and absorbs traffic spikes, like a device launch on Bell's site.
>
> Caching is controlled mainly by the `Cache-Control` header. Hashed static assets get a long `max-age` with `immutable`. For HTML or API responses that can be shared, `s-maxage` sets the CDN cache time separately from the browser's, and `stale-while-revalidate` lets the CDN serve a slightly old version while it fetches a new one in the background. Anything user-specific, like a cart or account page, gets `private` or `no-store`, so it's never cached at the CDN. ETags allow efficient revalidation with a 304 Not Modified response. The `Vary` header creates separate cached versions, for example by language, but too many variations lowers the cache hit rate.
>
> The classic incident is accidentally caching a personalised response and showing one customer's data to another, usually because cookies weren't considered in the cache key. So I'm careful to keep personalised and shared content clearly separated.

A CDN caches responses at **edge locations** near users. On a cache miss it goes to the origin, stores the response per the cache key (URL + chosen headers/cookies/query params), and serves later users from the edge, which lowers latency, absorbs traffic spikes and protects the origin.

Headers:
- `Cache-Control: public, max-age=31536000, immutable` for hashed assets.
- `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` lets the CDN cache HTML/API for 5 min and serve stale while refreshing.
- `Cache-Control: private, no-store` for user-specific data (cart, account): **never CDN-cache it**.
- `ETag` / `If-None-Match` → `304 Not Modified`.
- `Vary: Accept-Language` / `Accept-Encoding` lets the cache store different variants (careful: high cardinality kills the hit ratio).

Invalidation: purge by path/tag (CloudFront invalidation, Fastly/Cloudflare surrogate keys), or avoid needing it via content hashing. Watch out for **caching personalised responses** by accident (cookies in the cache key). That's a classic incident.

> 🔁 **Follow-up questions**
>
> **Q: What's a cache hit ratio and how do you improve it?**
> The percentage of requests served from the edge. Improve it by normalising cache keys, excluding unnecessary cookies, headers and query parameters, using long TTLs for hashed assets, and an origin shield.
>
> **Q: How do you purge content from a CDN?**
> CloudFront invalidations by path, or tag-based purging on CDNs like Fastly or Cloudflare. But the best strategy is designing so you rarely need purges, with hashed file names and short TTLs on HTML.

</details>

<details>
<summary>Describe a CI/CD pipeline you'd set up for a front-end team.</summary>

> 🎤 **Mock answer**
>
> On every pull request, the pipeline installs dependencies with `npm ci` from a cache, then runs linting, type-checking and the unit and integration tests in parallel. It builds the production bundle and checks it against the size budget. Then it deploys a preview environment for that branch and runs a small Playwright or Cypress smoke suite against it, and optionally Lighthouse and accessibility checks. All of these are required to pass, along with a code review.
>
> When the code merges to main, the pipeline builds the artifact once, deploys it to staging and runs the full end-to-end suite. Then it promotes that exact same artifact to production. I avoid rebuilding per environment, so what we tested is exactly what we ship. Production releases use a canary or feature flags, with smoke tests after the deployment, and monitoring that can trigger an automatic rollback if the error rate spikes.
>
> The principles behind it are fast feedback, ideally under 10 minutes for a pull request, which means caching and running only affected projects in a monorepo; build once, deploy many; trunk-based development with short-lived branches; and feature flags rather than long-lived release branches.

```yaml
# .github/workflows/ci.yml (simplified)
name: ci
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run typecheck
      - run: npm test -- --coverage
      - run: npm run build
      - run: npx size-limit            # bundle budget
      # deploy a preview environment, then:
      - run: npx playwright test --project=smoke
```

Stages: **PR** → lint, type-check, unit/integration, build, bundle budget, preview deploy, E2E smoke, Lighthouse CI, required reviews. **Main** → build once (immutable artifact) → deploy to staging → E2E → **promote the same artifact** to production (canary or blue/green) → post-deploy smoke + monitoring → automatic rollback on error spikes.

Principles: build once, deploy many; fast feedback (< 10 min PR pipeline, caching, parallel jobs, Nx/Turbo affected-only); trunk-based development with short-lived branches; feature flags instead of long-lived branches.

> 🔁 **Follow-up questions**
>
> **Q: How do you store secrets for the pipeline?**
> In the CI platform's secret store or a cloud secret manager, and for cloud access, use OIDC federation, so the pipeline gets short-lived credentials instead of storing access keys.
>
> **Q: What's trunk-based development?**
> Everyone merges small changes into the main branch frequently, at least daily, with short-lived feature branches and feature flags for unfinished work. It avoids painful merges and keeps main always releasable.
>
> **Q: How do preview deployments help?**
> Every pull request gets its own URL, so designers, product owners and QA can review the real change before merging, and E2E tests can run against it.

</details>

<details>
<summary>Blue/green vs canary vs rolling deployments</summary>

> 🎤 **Mock answer**
>
> With blue/green, you have two identical environments. Blue is live, you deploy the new version to green, test it, then switch all traffic to green at once. Rollback is instant, you just switch back, but you need double the infrastructure during the release.
>
> With a canary release, you send a small percentage of traffic, say one percent, to the new version, watch the metrics, like errors, performance and even conversion, and gradually increase to 100 percent. If metrics get worse, you roll back automatically, and only a small group of users was affected. Rolling deployments replace servers or containers gradually, which is the Kubernetes default. Feature flags work at a finer level: the code is deployed, but the feature is released per user or segment.
>
> There's a front-end-specific issue I'd raise: version skew. A user might have the old JavaScript loaded in their browser while the server is already on the new version. To handle that, keep old asset files available after deployment, make API changes backward compatible, and catch chunk load errors so the app reloads once instead of breaking.

- **Blue/green**: two identical environments; switch traffic all at once; instant rollback by switching back. Costs double the infrastructure during release.
- **Canary**: send 1% → 10% → 50% → 100% of traffic to the new version while watching metrics (errors, Web Vitals, conversion). Auto-rollback on regression.
- **Rolling**: replace instances gradually (the Kubernetes default).
- **Feature flags**: release the *feature* separately from the *deploy*, at user-level granularity.

Front-end-specific gotcha: **version skew**. A user has old JS loaded while the API or chunks changed. Keep old chunks available after deploy, make APIs backward compatible, and handle `ChunkLoadError` by reloading the page once.

> 🔁 **Follow-up questions**
>
> **Q: What metrics would trigger an automatic canary rollback?**
> Increased JavaScript error rate or 5xx rate compared with the baseline, worse latency or Core Web Vitals, and for critical flows, a drop in conversion steps like add-to-cart success.
>
> **Q: How do database migrations fit with blue/green?**
> Migrations must be backward-compatible, using the expand and contract pattern: add new columns first, deploy code that handles both, then remove old structures later, so both versions can run at once.

</details>

<details>
<summary>Docker for a front-end app: write a Dockerfile</summary>

> 🎤 **Mock answer**
>
> I'd use a multi-stage Dockerfile. For a single-page app, the first stage uses a Node image: it copies `package.json` and the lockfile first and runs `npm ci`, so the dependency layer is cached and only rebuilds when dependencies change. Then it copies the source and runs the build. The second stage is a small nginx image that copies only the built files, with an nginx config that serves `index.html` for unknown routes and sets the cache headers. The final image has no Node or source code, just static files, so it's small and has a minimal attack surface.
>
> For Next.js, I'd enable the standalone output, which creates a minimal server with only the needed dependencies. The final stage copies the standalone folder and static assets into a slim Node image and runs `node server.js` as a non-root user.
>
> Other good practices: a `.dockerignore` to exclude `node_modules` and `.git`, small base images, running as non-root, health checks, and thinking about which configuration is baked in at build time versus provided at runtime.

Multi-stage build: dependencies and build in a Node image; serve static files from a tiny nginx image (SPA), or run the Next.js standalone server.

```dockerfile
# SPA: build with Node, serve with nginx
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf   # try_files $uri /index.html; cache headers
EXPOSE 80
```

```dockerfile
# Next.js (output: 'standalone' in next.config)
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Talking points: layer caching (copy `package*.json` first), small images (alpine/distroless), run as non-root, `.dockerignore` (node_modules, .git), health checks, and env vars at **runtime** vs **build time**.

> 🔁 **Follow-up questions**
>
> **Q: Why copy package.json before the rest of the source?**
> Docker caches each layer. If only the source changes, the dependency install layer is reused, which makes rebuilds much faster.
>
> **Q: How do you keep the image small?**
> Multi-stage builds, alpine or distroless base images, production dependencies only, Next.js standalone output, and a proper `.dockerignore`.

</details>

<details>
<summary>Build-time vs runtime configuration (environment variables) in front-end apps</summary>

> 🎤 **Mock answer**
>
> This is a common trap with front-end environment variables. Variables like `VITE_API_URL` or `NEXT_PUBLIC_` values are inlined into the JavaScript at build time. That has two consequences. First, you need a separate build for each environment, which breaks the "build once, deploy everywhere" principle, since you're not shipping exactly what you tested. Second, those values are visible to anyone who opens the bundle, so they must never contain secrets.
>
> To get runtime configuration, there are a few options. Serve a `config.json` file that the app fetches on startup, with different content per environment. Inject a small configuration object into `index.html` when the container starts. Have the server or BFF read environment variables at request time. Or use relative API paths like `/api`, and let the CDN or ingress route them to the right backend per environment, which is the simplest of all.
>
> And real secrets, like third-party API keys, stay on the server, in something like AWS Secrets Manager or Azure Key Vault, and the browser goes through the BFF.

Front-end env vars like `VITE_API_URL` and `NEXT_PUBLIC_*` are **inlined at build time**. That means a separate build per environment (which breaks "build once, deploy many"), and **everything is public**: never put secrets there.

Options for runtime config: serve a `/config.json` (or inject `window.__CONFIG__` into `index.html` at container start), have the server/BFF read env vars at request time, or use same-origin relative API paths (`/api`) routed by the CDN/ingress per environment. Secrets live only server-side (Secrets Manager / Key Vault).

> 🔁 **Follow-up questions**
>
> **Q: How would you implement runtime config for a static SPA in a container?**
> At container start, a small entrypoint script writes a `config.js` from environment variables, which `index.html` loads before the app, setting values like the API URL on the window object. The same image then runs in every environment.

</details>

<details>
<summary>Kubernetes basics a front-end senior should know</summary>

> 🎤 **Mock answer**
>
> I'm not a Kubernetes administrator, but I understand the main concepts well enough to work with platform teams. A Pod is the smallest unit and runs one or more containers. A Deployment declares how many replicas of a pod should run and handles rolling updates. A Service gives those pods a stable network address, and an Ingress routes external HTTP traffic and handles TLS. ConfigMaps and Secrets provide configuration. And the Horizontal Pod Autoscaler scales the number of pods based on CPU or traffic.
>
> For a front-end team running a Next.js server, a few details matter. Readiness probes make sure traffic only goes to pods that are fully started, and liveness probes restart stuck pods. Resource requests and limits need to match Node's memory settings, otherwise containers get killed for running out of memory.
>
> In the IBM and telecom world, OpenShift, Red Hat's enterprise Kubernetes platform, is common. [At Bell, our deployments ran through ... and my involvement was ...]

- **Pod** (one or more containers), **Deployment** (desired replicas, rolling updates), **Service** (stable network endpoint), **Ingress** (HTTP routing/TLS from outside), **ConfigMap/Secret** (config), **HPA** (autoscaling on CPU/requests).
- Liveness vs readiness probes (readiness = "ready for traffic": don't send requests to a Next.js pod still warming up).
- Resource requests/limits; Node.js memory (`--max-old-space-size`) vs the container limit.
- **OpenShift** = Red Hat's enterprise Kubernetes (common in IBM/telecom environments).

You won't be asked to write YAML from memory, but knowing these terms shows you can work with platform teams.

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between liveness and readiness probes?**
> Readiness decides whether the pod receives traffic; if it fails, traffic stops but the pod keeps running. Liveness decides whether the pod is healthy; if it fails, Kubernetes restarts it.
>
> **Q: Why would a Node container get OOMKilled?**
> The container exceeded its memory limit. Node's heap size may not match the limit, so you configure `--max-old-space-size` below the container limit, and look for memory leaks.

</details>

<details>
<summary>Serverless vs containers vs edge for SSR</summary>

> 🎤 **Mock answer**
>
> Serverless functions, like AWS Lambda, scale automatically, including to zero, and you only pay per request, with no servers to manage. The trade-offs are cold starts, execution time and size limits, and database connection issues at high concurrency, which need something like RDS Proxy. They're great for spiky or low-to-medium traffic.
>
> Containers, on ECS, Cloud Run or Kubernetes, give predictable performance, support long-lived connections like WebSockets, and give full control over the runtime. But you pay for idle capacity and you manage scaling and operations. They're better for steady high traffic.
>
> Edge functions run in lightweight runtimes close to the user, with almost no cold start. They're ideal for redirects, personalisation, authentication checks and A/B testing, but they have limited APIs and are far from your database.
>
> My rule of thumb: make as much as possible static and cached at the CDN, use the edge for lightweight request-time logic, and choose serverless or containers for server rendering and APIs based on traffic patterns and the team's operational experience.

- **Serverless (Lambda/Cloud Functions):** scales to zero, pay per request, no servers to manage; cold starts, execution limits, connection pooling issues with databases (use RDS Proxy / HTTP-based DBs).
- **Containers (ECS/Cloud Run/K8s):** predictable performance, long-lived connections, full control; you pay for idle and manage scaling.
- **Edge (CloudFront Functions, Cloudflare Workers, Vercel Edge):** lowest latency, tiny cold starts; limited runtime APIs, and data is far away unless replicated.

Rule of thumb: **static + CDN** wherever possible; edge for personalisation/redirects; serverless or containers for SSR/APIs depending on traffic shape and team ops maturity.

> 🔁 **Follow-up questions**
>
> **Q: How do you reduce cold starts?**
> Smaller bundles and fewer dependencies, avoiding heavy work at initialisation, choosing a faster runtime, provisioned concurrency for critical functions, and keeping functions close to their data.
>
> **Q: When does serverless get expensive?**
> With high, steady traffic, where you're always running anyway, and long-running requests. Then containers with reserved capacity are usually cheaper.

</details>

<details>
<summary>Observability: what do you monitor for a front end?</summary>

> 🎤 **Mock answer**
>
> I'd monitor four areas. First, errors: a tool like Sentry or Datadog captures JavaScript errors, with source maps uploaded privately during CI so stack traces are readable, tagged with the release version, so I can see immediately if a deployment introduced new errors, and alert on spikes.
>
> Second, real-user performance: Core Web Vitals broken down by page type, device and region, plus API latency as experienced by the browser. Third, business metrics, like the conversion funnel from product page to cart to checkout completion. Often a performance or JavaScript problem shows up as a drop in conversion before anyone reports it. Fourth, synthetic monitoring: scripted user journeys that run every few minutes from different regions, so we know checkout is broken before customers tell us.
>
> For debugging across systems, I'd propagate a trace ID from the browser request through the BFF to the microservices with OpenTelemetry, so one failing request can be followed end to end. And I'd define dashboards and SLOs. Privacy matters too: scrub personal data and respect consent, given laws like Quebec's Law 25.

- **Errors:** Sentry / Datadog / New Relic browser agent with **source maps uploaded in CI** (not public), release tags, grouping, alert on spikes after deploy.
- **Performance (RUM):** Core Web Vitals per route/device/country, long tasks, API latency from the client side.
- **Business funnels:** add-to-cart rate, checkout completion, drop-off per step. A perf regression often shows up here first.
- **Logs and traces:** propagate a **trace ID** (W3C `traceparent`) from the front-end request through the BFF to microservices for end-to-end debugging (OpenTelemetry).
- **Synthetic monitoring:** scripted journeys every few minutes from several regions (Checkly, Datadog Synthetics, CloudWatch Synthetics).
- **Dashboards + SLOs:** e.g. "99.9% of checkout page loads without JS error", "p75 LCP < 2.5 s".
- Privacy: scrub PII, respect consent (Quebec **Law 25**, PIPEDA).

> 🔁 **Follow-up questions**
>
> **Q: Why upload source maps privately?**
> Public source maps expose your original source code. Uploading them only to the monitoring tool gives readable stack traces without publishing your code.
>
> **Q: How do you avoid alert fatigue?**
> Alert on symptoms users feel, like error rates and SLO breaches, not every single error, use thresholds relative to baseline, and route alerts to the owning team.

</details>

<details>
<summary>Infrastructure as Code: what tools and why?</summary>

> 🎤 **Mock answer**
>
> Infrastructure as code means defining cloud resources, like buckets, CDN distributions, DNS records and permissions, in version-controlled code instead of clicking around in the console. Changes go through code review, environments are reproducible and identical, there's a history of every change, and you avoid the drift where production was manually tweaked and nobody remembers how.
>
> The main tools: Terraform, or its open-source fork OpenTofu, which works across clouds with its own configuration language. AWS CDK, which lets you write infrastructure in TypeScript, so it's very approachable for front-end developers. Pulumi, which supports general-purpose languages across clouds. SST, built for serverless and Next.js on AWS. And the native options, CloudFormation on AWS and Bicep on Azure.
>
> As a front-end engineer, I'd use CDK for something like defining the S3 bucket, CloudFront distribution, security headers policy and DNS for our app, so a new environment for a feature branch or region can be created with one command.

IaC means infrastructure defined in version-controlled code: reviewable, repeatable environments, no click-ops drift. **Terraform/OpenTofu** (multi-cloud, HCL), **AWS CDK** (TypeScript! very approachable for front-end devs), **Pulumi** (TS/Python), **SST** (CDK-based, great for Next.js/serverless on AWS), CloudFormation, Bicep (Azure). Mention: "I'd define the S3 bucket, CloudFront distribution and headers policy in CDK so every environment is identical."

> 🔁 **Follow-up questions**
>
> **Q: What's Terraform state, and why is it important?**
> The record of what Terraform has created, mapping config to real resources. It must be stored remotely, locked during changes, and protected, since it can contain sensitive values.
>
> **Q: CDK or Terraform for a front-end team?**
> CDK if the company is fully on AWS and the team prefers TypeScript. Terraform if the company is multi-cloud or already standardised on it. Following the company's existing standard matters most.

</details>

<details>
<summary>How do you handle file uploads securely from the browser?</summary>

> 🎤 **Mock answer**
>
> I'd avoid sending large files through the API server, because it ties up server resources and adds latency. Instead, I'd use pre-signed URLs. The client first asks our backend for an upload URL. The backend checks that the user is authenticated and allowed to upload, then generates a pre-signed S3 URL that's only valid for a few minutes and is restricted to a specific file type and maximum size. The browser then uploads directly to S3 with that URL. I'd use XHR for progress events, or multipart upload for large files.
>
> After the upload, an S3 event triggers a Lambda function that scans the file for viruses and creates resized versions for images, and the backend records the metadata.
>
> Security-wise, I always validate the file type and size on the server side too, since client-side checks can be bypassed. I'd generate random file names rather than trusting user-provided ones, keep the bucket private, and serve sensitive files through CloudFront signed URLs or short-lived pre-signed download URLs.

Don't stream big files through your API server. Instead: 1) the client asks the backend for a **pre-signed S3 URL** (authenticated, short expiry, content-type and size restrictions); 2) the browser `PUT`s directly to S3 (with progress via XHR or chunked multipart upload for large files); 3) S3 triggers a Lambda to virus-scan/resize; 4) the backend records metadata. Validate type and size on the server too, and keep the bucket private, serving files via CloudFront signed URLs if they're sensitive.

> 🔁 **Follow-up questions**
>
> **Q: How do you show upload progress?**
> Use XMLHttpRequest's upload progress events, since fetch doesn't expose upload progress in most browsers, or track completed parts in a multipart upload.
>
> **Q: How do you prevent users from uploading malicious files?**
> Restrict the content type and size in the pre-signed URL, validate on the server after upload, scan for malware, never serve user files from your main domain, and set `Content-Disposition` correctly so files download instead of executing.

</details>

<details>
<summary>Quick-fire cloud terms (be able to define each in one line)</summary>

> 🎤 **Mock answer**
>
> I'll go through them quickly. A region is a geographic area with several availability zones, which are isolated data centres for redundancy, and edge locations are the CDN's points of presence close to users. Auto-scaling adds or removes capacity based on load. A load balancer distributes traffic across instances and does health checks. A VPC is a private network in the cloud.
>
> IAM is identity and access management, and least privilege means each role has only the permissions it needs, for example the CI deploy role can only write to one bucket. A cold start is the extra latency when a serverless function starts a new instance. An origin shield is an extra caching layer between the CDN edges and the origin.
>
> RTO is how quickly you must recover after an outage, and RPO is how much data you can afford to lose. SLA is the promise to customers, SLO is the internal target, and SLI is the actual measurement, like the percentage of successful requests. The twelve-factor app is a set of principles for cloud-native apps, like config in the environment and stateless processes. Shift-left means testing and security earlier in the process. And GitOps means deployments are driven by the state of a Git repository, with tools like Argo CD.

- **Region / Availability Zone / Edge location**: geographic area / isolated datacentre(s) within it / CDN point of presence.
- **Auto-scaling**: add or remove capacity based on load.
- **Load balancer (ALB)**: distributes HTTP traffic, health checks, path routing.
- **VPC**: a private network in the cloud.
- **IAM role / least privilege**: give only the permissions needed.
- **Cold start**: latency when a serverless function boots a new instance.
- **Origin shield**: an extra CDN cache layer that reduces origin load.
- **RTO/RPO**: how fast you recover / how much data you can lose.
- **12-factor app**: config in env, stateless processes, logs as streams, dev/prod parity.
- **SLA / SLO / SLI**: promise to customers / internal target / the measured indicator.
- **Shift-left**: test/security earlier in the pipeline.
- **GitOps**: deployments driven by Git state (Argo CD, Flux).

> 🔁 **Follow-up questions**
>
> **Q: What's the difference between scaling up and scaling out?**
> Scaling up means bigger machines; scaling out means more machines. Cloud-native apps prefer scaling out because it's more resilient and elastic.
>
> **Q: What's an SLO you'd set for a front end?**
> For example, 99.9 percent of page loads without an unhandled JavaScript error, or 75th percentile LCP under 2.5 seconds on product pages.

</details>
