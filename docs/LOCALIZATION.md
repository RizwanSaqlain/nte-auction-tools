# Website localization

English URLs remain unchanged. Simplified Chinese pages use `/zh-cn/` and `zh-CN` language annotations. Japanese pages are generated under `/ja/` with
matching document paths (for example `/ja/gold-rarity`). There is no geographic
redirect. The header provides real English, Japanese and Simplified Chinese links; JavaScript carries
calculator query state and unsent calculator values across the language switch.

## Editing translations

- `locales/{ja,zh}-static.json`: exact text nodes and human-readable HTML attributes.
- `locales/{ja,zh}-runtime.json`: exact runtime messages or template fragments. These
  compile into localized assets; do not use bare identifiers as replacement keys.
- `locales/{ja,zh}-items.json`: item display names keyed by the English catalog name.
- `localize.mjs`: build integration, locale assets, metadata and sitemap generation.

Run `npm run build:cloudflare`. Review `.localization/ja-translation-audit.json`
for untranslated fragments, and visually verify both tools. Run `npm test` and
`npm run test:i18n` before publishing. Japanese scripts are generated from shared
English implementations; prices, IDs, limits, algorithms, and image paths remain
identical. Contact topic values stay English to satisfy the existing API contract.

## Translation status

Item names are direct reference translations, **not verified official Japanese
game labels**. Japanese gold catalog entries retain English names and support
searching either language. Existing screenshots contain English text. Downloadable
bundle JSON/CSV also retain English identifiers. A visible Japanese note explains
these limits. Replace reference translations with verified in-game names when
available and record the source here. Japanese terminology for the event
「一撃落札」was checked against https://gamewith.jp/nte/569975 on 2026-10-08.

## Search engine behavior

Each indexable page has a self canonical, reciprocal `en` / `ja` / `zh-CN` alternate links,
and an `x-default` link to the English equivalent. All three languages appear in the
sitemap with matching alternate links. Japanese pages contain translated initial
HTML, metadata and structured data. Error pages stay noindex and return error
status codes. The Worker normalizes `/ja` and `/ja/index.html` to `/ja/`, while
English URLs and existing www/HTTPS redirects stay intact.

English last-modified dates are retained. Japanese pages initially use 2026-10-08;
update that date when Japanese content materially changes. Do not automatically
update sitemap dates for every deployment. No ranking improvement is guaranteed.

Chinese content launched 2026-10-09. Chinese item names are reference translations, not independently verified official labels. All locales share calculations and stable item IDs.
