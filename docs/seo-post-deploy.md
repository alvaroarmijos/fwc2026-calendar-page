# SEO post-deploy checklist

After deploying to Vercel production, complete these steps to maximize visibility in Google and Bing.

## 1. Verify generated assets

- Open production URL and **View Source**
- Confirm `#seo-schedule` lists all 104 matches
- Confirm `<script type="application/ld+json">` is present in `<head>`
- Visit `/robots.txt` and `/sitemap.xml`
- Visit `/{INDEXNOW_KEY}.txt` (see `scripts/seo-config.mjs`)

## 2. Validate structured data and social previews

- [Google Rich Results Test](https://search.google.com/test/rich-results) — paste production URL
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — confirm absolute `og:image` URL

## 3. Google Search Console

1. Add property at [search.google.com/search-console](https://search.google.com/search-console)
2. Verify ownership (HTML tag or DNS — Vercel domain verification works)
3. Submit sitemap: `https://YOUR-DOMAIN/sitemap.xml`
4. Request indexing for the homepage

## 4. Bing Webmaster Tools

1. Add site at [bing.com/webmasters](https://www.bing.com/webmasters)
2. Verify ownership
3. Submit the same sitemap URL
4. IndexNow runs automatically on each production deploy via `scripts/ping-indexnow.mjs`

## 5. Local build

```bash
npm run build
```

Generates `robots.txt`, `sitemap.xml`, and injects SEO into `index.html`. Default URL fallback: `https://fwc2026-calendar-page.vercel.app`. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` is used automatically.
