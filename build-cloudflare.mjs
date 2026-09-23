process.env.SITE_URL='https://nteauctiontools.com';
process.env.DEPLOY_TARGET='cloudflare';
await import('./build.mjs');
