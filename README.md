# EasyShop AI

A small e-commerce app — Next.js + Postgres — with an AI copilot on top,
inspired by [EasyShop](https://github.com/LondheShubham153/tws-e-commerce-app).
Same core shopping flow, a lighter stack, and four Claude-backed AI features.

```
browser  →  Next.js app (UI + API routes)  →  Postgres
                    │
                    └──▶  Claude (Anthropic API)
```

## Why this is "lightweight" compared to the original

The original EasyShop is a solid app wrapped in a full production pipeline:
Terraform (AWS EC2 + EKS + VPC), Jenkins (build → Trivy scan → push → GitOps
manifest update), ArgoCD, Nginx ingress, and cert-manager. This project keeps
the app's spirit but drops all of that for local/dev use:

- **MongoDB → Postgres**, raw SQL (`pg`), no ORM.
- **No Terraform/EKS/Jenkins/ArgoCD/nginx-ingress/cert-manager** — just
  `docker compose up`.
- **No Redux** — cart state is a small React Context + `useReducer`.
- **No persisted cart table** — the cart lives in `localStorage` and only
  becomes a real database row (an order) at checkout.
- **v1-minimal feature set** — see [What's next](#whats-next) for what's
  deliberately deferred.

## AI features

All AI calls happen **only** in Next.js API routes (`src/app/api/ai/*`) via
the official `@anthropic-ai/sdk` — your `ANTHROPIC_API_KEY` never reaches
the browser.

| Feature | Where | What it does |
| --- | --- | --- |
| **AI product search** | Search bar on `/products` | Type a plain-English query ("cheap waterproof bags under $30") → Claude derives a structured filter → runs as SQL. Falls back to literal title/description search if AI isn't configured. |
| **AI shopping assistant** | Floating chat widget, site-wide | Answers questions and recommends products, grounded in the real catalog only — the entire (small) product list is given to Claude as context, so it can't invent products, prices, or availability. |
| **AI product descriptions** | "Generate with AI" on `/products/add` | Suggests a description from title/category/price/keywords — always a suggestion you edit before saving, never auto-persisted. |
| **AI recommendations** | Product detail & cart pages | "You might also like" — Claude picks from a real candidate set fetched from the DB; every suggested id is verified against that set before being shown (title/price always come from the DB, never from the model). |

## What you need

- **Docker** (with Docker Compose).
- An **Anthropic API key** if you want the AI features live — get one at
  [console.anthropic.com](https://console.anthropic.com). Without one, the
  app still runs fully — AI endpoints return a clear `503` instead of
  crashing, and the UI degrades gracefully (search falls back to literal
  matching, the chat widget explains it's unavailable, etc).

## Quickstart

```bash
make up
```

That's `make setup` (copies `.env.example` → `.env` and generates a real
`JWT_SECRET`) followed by `docker compose up --build`. Then open
**http://localhost:3000**.

Add your Anthropic key any time by editing `.env` and re-running `make up`.

```bash
make           # list all commands
make up        # build and start everything
make down      # stop everything
make logs      # watch the logs
make reset     # wipe the database and start fresh
make smoke     # quick check that everything (including AI wiring) works
```

## The API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | health check (`ai_enabled` tells you if AI is configured) |
| GET | `/api/products` | list products, literal `?q=&category=&minPrice=&maxPrice=` filters |
| POST | `/api/products` | create a product (any logged-in user in v1 — see below) |
| GET | `/api/products/:id` | get one product |
| POST | `/api/auth/{register,login,logout}` , GET `/api/auth/me` | auth |
| GET | `/api/orders` | your order history |
| POST | `/api/orders` | checkout — creates an order from `{items: [{productId, quantity}]}` |
| POST | `/api/ai/search` | `{query}` → `{results, filter}` |
| POST | `/api/ai/assistant` | `{message, history}` → `{reply}` |
| POST | `/api/ai/describe-product` | `{title, category, price?, keywords?}` → `{description}` |
| POST | `/api/ai/recommendations` | `{productId}` or `{cartProductIds}` → `{recommendations}` |

Every `/api/ai/*` route returns `503 {"error":"ai_unavailable"}` if
`ANTHROPIC_API_KEY` isn't set — none of that affects plain browsing, cart,
checkout, or orders.

## Manual AI verification (needs a real API key)

```bash
curl -s -X POST localhost:3000/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query":"cheap waterproof bags under $30"}'

curl -s -X POST localhost:3000/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{"message":"what electronics do you have under $50?","history":[]}'

curl -s -X POST localhost:3000/api/ai/describe-product \
  -H "Content-Type: application/json" \
  -d '{"title":"Insulated Water Bottle","category":"home","price":19.99}'

curl -s -X POST localhost:3000/api/ai/recommendations \
  -H "Content-Type: application/json" -d '{"productId":1}'
```

Then click through the UI: search on `/products`, open the chat widget,
generate a description on `/products/add`, and check the "You might also
like" rail on a product page.

## Development (without Docker)

```bash
npm install
DATABASE_URL=postgres://easyshop:easyshop@localhost:5432/easyshop \
  JWT_SECRET=dev-secret \
  ANTHROPIC_API_KEY=sk-ant-... \
  npm run dev        # http://localhost:3000
```

You'll need a local Postgres with the schema loaded (`init/postgres/*.sql`)
— or just run `docker compose up postgres` and point `DATABASE_URL` at
`localhost:5432`.

```bash
npm run lint
npm test    # AI route tests stub api.anthropic.com — no key needed
npm run build
```

## Folder layout

```
.
├── docker-compose.yml   starts the app + postgres together
├── Dockerfile             lean 3-stage build (Next standalone output)
├── Makefile               short commands (make up, make down, ...)
├── .env.example            template for settings (copy to .env)
├── init/postgres/          schema + seed catalog, loaded on first start
└── src/
    ├── app/                 pages + API routes (App Router)
    ├── components/          UI, including the 4 AI-feature components
    ├── hooks/               useCart, useAuth
    └── lib/
        ├── db.ts             pg.Pool singleton, raw SQL, no ORM
        ├── auth/              JWT session (bcryptjs + jose)
        ├── ai/                the only code that talks to Claude
        └── cart/              client-side cart Context
```

## What's next

v1 is intentionally minimal. Deferred to a v2:

- **Wishlists, profile/change-password pages, an "offers" page** — not
  built in v1.
- **Admin/seller roles** — `/products/add` is open to any logged-in user
  right now; real role-based gating is a v2 concern.
- **A retrieval step for the shopping assistant** — right now the whole
  catalog is embedded in every assistant call, which is simple and fully
  hallucination-proof at this catalog size (~20 products). Once the catalog
  grows past roughly 100-200 items, pre-filter candidates before the Claude
  call instead of sending everything.
- **Server-persisted cart** — if multi-device cart sync becomes a
  requirement, move the cart from `localStorage` to a `carts` table.
- **Kubernetes / Terraform / Jenkins / ArgoCD** — the original EasyShop's
  manifests and pipeline are directly adaptable later if this needs a real
  production deployment; not needed for local/dev use.
