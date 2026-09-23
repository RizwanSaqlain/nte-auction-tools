# NTE Auction Tools

Free, unofficial collectible valuation calculators for **Neverness to Everness**, focused on the Going, Going, Gone auction activity.

**Live website:** https://nteauctiontools.com/

![NTE Auction Tools logo](public/nte-auction-tools-logo.svg)

## Tools

- **Nine-slot Average Valuation Device:** match a gadget average against 6,434 unordered bundles of 1–7 items from eight nine-slot collectibles. Repeated items are allowed. Default tolerance compares rounded averages within ±2.
- **Gold-rarity Valuation Device:** find combinations from a catalog of 50 gold items that match an exact total. Apply per-item, total-count, slot, and required-item constraints. Items are listed by ascending price with constrained quantity controls; results include images, required-item highlights, and average counts/slots across returned bundles.
- Switch tools and catalogs within the homepage workspace. Share calculator state through the URL.
- Supporting pages explain bidding strategy, algorithms, limitations, and frequently asked questions.

Results are possibilities, not probabilities. These tools value the relevant collectibles, not the whole box. Slot totals do not verify geometric packing. Overlapping clues must not be double-counted.

## Quick start

Requires Node.js 22 or newer and npm. No provider API keys or LLM services are required to run the website.

```sh
npm ci
npm test
npm run build:cloudflare
npm run dev
```

Open http://127.0.0.1:4173. This lightweight preview serves `dist` without a rebuild watcher or API. Document pages use `.html` in this preview (for example `/about-us.html`); production uses extensionless URLs. Rebuild after editing source.

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run calculator, constraint, and Worker tests |
| `npm run build` | Generate static pages and assets in `dist` |
| `npm run build:cloudflare` | Build with production Cloudflare metadata/disclosures |
| `npm run dev` | Serve the generated static files locally |
| `npm run deploy:cloudflare` | Build and deploy through Wrangler |

## Source map

| Files | Responsibility |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | Main interface and nine-slot interactions |
| `src/engine.js` | Nine-slot matching and valuation logic |
| `public/gold.js`, `gold.css` | Gold calculator interface |
| `public/gold-worker.js` | Gold search running off the UI thread |
| `public/gold-limits.js`, `gold-data.js` | Quantity bounds and gold catalog |
| `tools.config.mjs`, `link-gold.mjs`, `public/workspace-switch.js` | Tool registry and workspace integration |
| `build.mjs`, `seo-pages.mjs`, `site.config.json` | Static generation, canonical metadata, sitemap, robots and structured data |
| `about-content.html`, `gold-content.html`, `strategy-faq.html` | Page content templates |
| `cloudflare/worker.js`, `api/contact.js` | Production routing and contact delivery |
| `public/items/`, `public/gold-items/` | Included collectible images |
| `public/*device.png`, logo and favicon files | Included device artwork and branding |
| `nte-auction-tools-logo/`, logo ZIP | Original branding exports |
| `gold-rarity-bundle-finder.html` | Preserved standalone source used during integration |

## How the gold search works

The Worker uses depth-first backtracking with branch-and-bound pruning. It chooses quantities in a fixed item order, so permutations are not repeated. It tracks remaining value, item count, and slots, enforcing known minimum quantities. Suffix bounds, including a dynamic-programming upper bound on achievable value, prune branches that cannot reach the target.

Defaults are 5 copies per item, 25 total items, 140 slots, and 300 results. The slot ceiling is 250. A result cap or time limit can stop the search early; the UI labels partial results. Displayed averages describe returned results only. Cancelling terminates the Worker.

## Catalog maintenance and images

All assets required by the deployed site are included under `public`; the build does not depend on the original image folder on the author's computer.

- Gold: update `public/gold-data.js` and matching files in `public/gold-items/`. Preserve existing IDs because saved URLs refer to them. Prices and slot sizes must be positive integers.
- Nine-slot: update `src/engine.js`, `public/combinations.json`, `public/combinations.csv`, and `public/items/` together. The tests validate bundle prices and averages.
- `prepare-gold.mjs` is an optional import utility for the preserved standalone catalog. Run `node prepare-gold.mjs /path/to/GoldItems` only when intentionally regenerating gold data.
- To add another tool, start with `tools.config.mjs`, then extend workspace switching and build integration. The registry alone does not implement a new calculator.

Collectible and device artwork was supplied from the game. These assets remain subject to their respective rights holders; inclusion here does not grant a redistribution license. This project is not affiliated with the game's developers or publishers.

## Deployment and secrets

Production uses Cloudflare Workers with static assets. See [deployment instructions](docs/DEPLOYMENT.md).

Local `.env*`, `.dev.vars*`, `.wrangler`, `.vercel`, dependencies and generated `dist` are excluded from Git. Never commit provider keys, dashboard credentials, contact recipient secrets, or local account bindings. The public analytics measurement ID is not a secret; forks should replace or remove it in `seo-pages.mjs`.

FreeLLMAPI is an optional development aid installed separately. It is not part of the website runtime or this repository.
