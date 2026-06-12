/** Shared SEO / IndexNow configuration. */
export const INDEXNOW_KEY = "a7f3c2e1-8b4d-4f6a-9e2c-1d5b8a3f7c6e";

export const SITE_TITLE =
  "FIFA World Cup 2026 Calendar — Add All 104 Matches to Google Calendar, Outlook & Apple";

export const SITE_DESCRIPTION =
  "Free FIFA World Cup 2026 calendar for USA, Mexico, and Canada. Download all 104 matches as .ics or add them to Google Calendar, Apple Calendar, or Outlook — no signup required.";

export const OG_DESCRIPTION =
  "Add all 104 World Cup 2026 matches to Google Calendar, Outlook, or Apple Calendar in one click. Free .ics download.";

export function resolveSiteUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "fwc2026-calendar-page.vercel.app";
  return `https://${host.replace(/^https?:\/\//, "")}`;
}
