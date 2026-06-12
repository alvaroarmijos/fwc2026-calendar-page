import { INDEXNOW_KEY, resolveSiteUrl } from "./seo-config.mjs";

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("IndexNow: skipped (not production)");
    return;
  }

  const siteUrl = resolveSiteUrl();
  const host = new URL(siteUrl).host;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
    urlList: [`${siteUrl}/`, `${siteUrl}/sitemap.xml`],
  };

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (response.ok || response.status === 202) {
    console.log(`IndexNow: submitted ${body.urlList.length} URL(s) for ${host}`);
    return;
  }

  const text = await response.text();
  console.warn(`IndexNow: ${response.status} ${text}`);
}

main().catch((err) => {
  console.warn("IndexNow: ping failed (non-fatal)", err.message);
});
