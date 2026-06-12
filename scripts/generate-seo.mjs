import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  INDEXNOW_KEY,
  OG_DESCRIPTION,
  SITE_DESCRIPTION,
  SITE_TITLE,
  resolveSiteUrl,
} from "./seo-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const indexPath = path.join(root, "index.html");

const PHASE_ORDER = [
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "3rd Place",
  "Final",
];

function extractMatches(html) {
  const start = html.indexOf("const MATCHES = [");
  if (start === -1) throw new Error("MATCHES array not found in index.html");
  const arrayStart = html.indexOf("[", start);
  let depth = 0;
  for (let i = arrayStart; i < html.length; i++) {
    if (html[i] === "[") depth++;
    if (html[i] === "]") {
      depth--;
      if (depth === 0) {
        const arraySource = html.slice(arrayStart, i + 1);
        return Function(`"use strict"; return (${arraySource});`)();
      }
    }
  }
  throw new Error("Could not parse MATCHES array");
}

function toIsoDate(dateUTC, timeUTC) {
  const y = dateUTC.slice(0, 4);
  const mo = dateUTC.slice(4, 6);
  const d = dateUTC.slice(6, 8);
  const h = timeUTC.slice(0, 2);
  const mi = timeUTC.slice(2, 4);
  const s = timeUTC.slice(4, 6);
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

function formatDisplayDate(dateUTC, timeUTC) {
  const iso = toIsoDate(dateUTC, timeUTC);
  const dt = new Date(iso);
  return dt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function matchName(match) {
  if (match.home && match.away) return `${match.home} vs ${match.away}`;
  return match.matchLabel || match.phase;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateMetaTags(siteUrl) {
  const imageUrl = `${siteUrl}/og-image.jpg`;
  return `  <title>${escapeHtml(SITE_TITLE)}</title>
  <meta name="description" content="${escapeHtml(SITE_DESCRIPTION)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#08080f">
  <link rel="canonical" href="${siteUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/">
  <meta property="og:title" content="${escapeHtml(SITE_TITLE)}">
  <meta property="og:description" content="${escapeHtml(OG_DESCRIPTION)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(SITE_TITLE)}">
  <meta name="twitter:description" content="${escapeHtml(OG_DESCRIPTION)}">
  <meta name="twitter:image" content="${imageUrl}">`;
}

function uniqueVenues(matches) {
  return [...new Set(matches.map((m) => m.venue))];
}

function generateJsonLd(matches, siteUrl) {
  const venues = uniqueVenues(matches);
  const graph = [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "FIFA World Cup 2026 Calendar",
      url: `${siteUrl}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "SportsEvent",
      "@id": `${siteUrl}/#tournament`,
      name: "FIFA World Cup 2026",
      startDate: "2026-06-11",
      endDate: "2026-07-19",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: venues.map((venue) => ({
        "@type": "Place",
        name: venue.split(",")[0],
        address: venue,
      })),
      organizer: {
        "@type": "Organization",
        name: "FIFA",
        url: "https://www.fifa.com",
      },
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#schedule`,
      name: "FIFA World Cup 2026 Match Schedule",
      numberOfItems: matches.length,
      itemListElement: matches.map((match, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SportsEvent",
          name: matchName(match),
          startDate: toIsoDate(match.dateUTC, match.timeUTC),
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: match.venue.split(",")[0],
            address: match.venue,
          },
          ...(match.home && match.away
            ? {
                competitor: [
                  { "@type": "SportsTeam", name: match.home },
                  { "@type": "SportsTeam", name: match.away },
                ],
              }
            : {}),
        },
      })),
    },
  ];

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  return `  <script type="application/ld+json">${json}</script>`;
}

function generateScheduleHtml(matches) {
  const byPhase = new Map();
  for (const phase of PHASE_ORDER) byPhase.set(phase, []);
  for (const match of matches) {
    if (!byPhase.has(match.phase)) byPhase.set(match.phase, []);
    byPhase.get(match.phase).push(match);
  }

  const sections = [];
  for (const phase of PHASE_ORDER) {
    const phaseMatches = byPhase.get(phase) || [];
    if (!phaseMatches.length) continue;

    const items = phaseMatches
      .map((match) => {
        const name = matchName(match);
        const date = formatDisplayDate(match.dateUTC, match.timeUTC);
        const group = match.group ? ` · Group ${match.group}` : "";
        return `        <li><time datetime="${toIsoDate(match.dateUTC, match.timeUTC)}">${escapeHtml(date)}</time> — ${escapeHtml(name)}${escapeHtml(group)} — ${escapeHtml(match.venue)}</li>`;
      })
      .join("\n");

    sections.push(`    <div class="seo-schedule__phase">
      <h3 class="seo-schedule__phase-title">${escapeHtml(phase)}</h3>
      <ul class="seo-schedule__list">
${items}
      </ul>
    </div>`);
  }

  return `<section id="seo-schedule" aria-label="Complete World Cup 2026 schedule">
  <h2 class="seo-schedule__title">Complete FIFA World Cup 2026 Match Schedule</h2>
  <p class="seo-schedule__intro">All ${matches.length} matches across the United States, Mexico, and Canada. Use the calendar wizard above to add every match — or only your teams — to Google Calendar, Apple Calendar, or Outlook.</p>
${sections.join("\n")}
</section>`;
}

function generateRobotsTxt(siteUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function generateSitemap(siteUrl) {
  const lastmod = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

function replaceBlock(html, beginMarker, endMarker, content) {
  const pattern = new RegExp(
    `${beginMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  if (!pattern.test(html)) {
    throw new Error(`Markers not found: ${beginMarker} ... ${endMarker}`);
  }
  return html.replace(pattern, `${beginMarker}\n${content}\n  ${endMarker}`);
}

function main() {
  const siteUrl = resolveSiteUrl();
  let html = fs.readFileSync(indexPath, "utf8");
  const matches = extractMatches(html);

  if (matches.length !== 104) {
    console.warn(`Warning: expected 104 matches, found ${matches.length}`);
  }

  const metaTags = generateMetaTags(siteUrl);
  const jsonLd = generateJsonLd(matches, siteUrl);
  const scheduleHtml = generateScheduleHtml(matches);

  html = replaceBlock(html, "<!-- SEO:BEGIN -->", "<!-- SEO:END -->", metaTags);
  html = replaceBlock(html, "<!-- SEO_JSONLD:BEGIN -->", "<!-- SEO_JSONLD:END -->", jsonLd);
  html = replaceBlock(
    html,
    "<!-- SEO_SCHEDULE:BEGIN -->",
    "<!-- SEO_SCHEDULE:END -->",
    scheduleHtml,
  );

  fs.writeFileSync(indexPath, html);
  fs.writeFileSync(path.join(root, "robots.txt"), generateRobotsTxt(siteUrl));
  fs.writeFileSync(path.join(root, "sitemap.xml"), generateSitemap(siteUrl));

  const indexNowPath = path.join(root, `${INDEXNOW_KEY}.txt`);
  fs.writeFileSync(indexNowPath, INDEXNOW_KEY);

  console.log(`SEO generated for ${siteUrl} (${matches.length} matches)`);
}

main();
