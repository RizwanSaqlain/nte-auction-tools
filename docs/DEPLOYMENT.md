# Deployment

## Cloudflare (production)

1. Run `npm ci` and `npm test`.
2. Authenticate with `npx wrangler login`.
3. Review `wrangler.jsonc`: the Worker name, custom domains, and date belong to this deployment. Forks must replace or remove custom domain routes.
4. Set the contact recipient with `npx wrangler secret put CONTACT_EMAIL`. Enter it in the interactive prompt, never source code.
5. Run `npm run deploy:cloudflare`.

Wrangler runs `build-cloudflare.mjs`, uploads `dist`, and binds static assets as `ASSETS`. Production redirects HTTP and www to the HTTPS apex domain. Missing pages return 404; explicit error pages have noindex headers. The workers.dev address is disabled.

For another domain, update `site.config.json`, the origin in `build-cloudflare.mjs`, the canonical redirect hosts in `cloudflare/worker.js`, and `wrangler.jsonc`. Check generated canonical links, robots.txt, and sitemap.xml before deployment. Keep sitemap modification dates accurate for actual content changes.

## Contact form

`/api/contact` validates requests and forwards them to FormSubmit using the private `CONTACT_EMAIL` recipient. FormSubmit requires recipient activation and can rate-limit delivery. Test actual inbox receipt before promising successful delivery; a healthy website does not prove email delivery. Calculator features work without this secret.

## Vercel (legacy configuration)

The legacy Vercel deployment redirects all requests permanently to `https://nteauctiontools.com`, preserving paths and queries. `vercel.json` intentionally places this redirect before legacy routes to consolidate the old hostname. Production rendering and contact delivery run on Cloudflare.

## Verification

After deployment, check the homepage and document pages return 200, canonical URLs match the intended domain, robots.txt allows search crawlers, sitemap entries load directly, and unknown pages return 404. Exercise both calculators and confirm item images load. Submit the canonical sitemap through Search Console; Google controls indexing and ranking.
