# 01-fwc2026-calendar-page

**State:** Implemented
**Date:** 2026-06-07
**Dependencies:** none

**Objective:** Build a single `index.html` page (zero dependencies) where users can add all 104 FIFA World Cup 2026 matches — or only their selected countries' matches — to any calendar app via client-side .ics generation and Google Calendar deep-links.

---

## Scope

### In
- Single `index.html` file — HTML, CSS, JS all inline, zero build step, zero dependencies
- All 104 matches hardcoded: 72 group stage + 32 knockout (R32, R16, QF, SF, 3rd place, Final)
- Two user paths: add all 104 matches, or pick teams and add only their matches
- Client-side .ics generation (RFC 5545) — no backend, no API keys
- Google Calendar deep-link (single event) with tooltip for bulk limitation
- Dynamic timezone display — auto-detects browser TZ, re-renders times on change
- Match browser: phase tabs + group tabs (Group Stage only), informational cards
- 48-country chip picker with match count badge
- Responsive: desktop side-by-side cards, mobile stacked + wrapping chips

### Not in
- Live score updates or real-time data
- Persistent user preferences (no localStorage, no cookies)
- Backend, server, or database of any kind
- Actual team assignment for knockout slots (all TBD until group stage ends)
- Notifications or push alerts
- Multiple languages (English only)
- Social sharing buttons

---

## Data Model

### Match object
```js
{
  id: "GS_A1",           // string — unique per match, e.g. "R32_01", "FINAL"
  phase: "Group Stage",  // "Group Stage" | "Round of 32" | "Round of 16" |
                         // "Quarter-final" | "Semi-final" | "3rd Place" | "Final"
  group: "A",            // string A–L for group stage; null for knockout
  home: "Mexico",        // team name string; null for knockout TBD slots
  away: "Ecuador",
  homeFlag: "🇲🇽",       // Unicode flag emoji; "⚽" for TBD knockout slots
  awayFlag: "🇪🇨",
  venue: "Estadio Azteca, Mexico City",
  dateUTC: "20260611",   // YYYYMMDD
  timeUTC: "230000",     // HHMMSS UTC
  matchLabel: null,      // knockout only: "Winner Group A vs Runner-up Group B"
}
```

### Runtime state (JS variables, not persisted)
```js
let selectedTZ = Intl.DateTimeFormat().resolvedOptions().timeZone; // current timezone
let selectedTeams = new Set();   // team name strings chosen in chip picker
let currentPhase = "Group Stage";
let currentGroup = "A";
```

### Constants
```js
const MATCHES = [...];   // 104 match objects, hardcoded

const TZ_OPTIONS = [     // 15 entries, value = IANA timezone string
  { label: "New York / Miami (ET)", value: "America/New_York" },
  // ... 14 more
];
```

### ICS event fields (per match)
- `DTSTART` — `dateUTC + T + timeUTC + Z`
- `DURATION` — `PT2H30M` group stage, `PT3H30M` knockout
- `SUMMARY` — `🇲🇽 Mexico vs Ecuador 🇪🇨 · FWC2026` (group) or `⚽ FWC2026 Round of 32 — matchLabel` (knockout)
- `LOCATION` — venue string
- `DESCRIPTION` — formatted local time string
- `VALARM` trigger at `-PT30M`

---

## Implementation Plan

1. **Scaffold HTML shell** — `<!DOCTYPE html>` with inline `<style>` and `<script>` blocks, sticky header, meta viewport tag. Page renders with correct background color and gold heading.

2. **Hardcode MATCHES array** — all 104 match objects in correct order: 72 group stage (groups A–L, 6 matches each), then R32 (16), R16 (8), QF (4), SF (2), 3rd place (1), Final (1). Knockout slots use `homeFlag: "⚽"`, `awayFlag: "⚽"`, `home: null`, `away: null`.

3. **Implement core utilities**
   - `formatMatchTime(match, tz)` — UTC → local time string
   - `foldLine(str)` — RFC 5545 75-octet line folding
   - `generateICS(matches, calName)` — returns full VCALENDAR string
   - `downloadICS(content, filename)` — Blob → `<a>.click()`
   - `googleCalLink(match)` — single-event Google Calendar URL
   - `getMatchesForTeams(teams)` — filter MATCHES; always includes all knockout slots

4. **Build hero section** — two option cards side by side. "All 104 Matches" card: Download .ics + Google Calendar buttons wired. "My Teams" card: single "Choose My Teams →" button that expands the picker panel below.

5. **Build My Teams panel** — 48 country chips (flag + name, togglable). Counter label "Selected: N teams · X matches found". Download .ics and Google Calendar buttons appear only when ≥1 team selected. Google Cal button opens first-match link + shows tooltip about bulk limitation.

6. **Build timezone selector** — dropdown from `TZ_OPTIONS`, auto-selects browser TZ on load. Quick-pick pill row above dropdown for ET / CT / MT / PT / Mexico City / GMT / CET / BRT / ART / JST. `setTimezone(tz)` re-renders all visible match times without page reload.

7. **Build match browser** — phase tabs (Group Stage → Final). Group sub-tabs A–L visible only in Group Stage. Match cards: flag emojis, formatted time, venue. Knockout cards show ⚽ + matchLabel. Banner above knockout sections: "Teams TBD after group stage. Dates and venues are confirmed — add them now."

8. **Apply design tokens** — background `#08080f`, cards `#111119` / `1px solid #1c1c2e` / `border-radius: 14px`, gold `#c9a227` accents, primary buttons gold fill dark text, secondary buttons gold border transparent fill, sticky header `backdrop-filter: blur(12px)`.

9. **Mobile pass** — stack hero cards vertically, chips wrap freely, match grid 1-column, quick-pick TZ row scrolls horizontally.

10. **Manual smoke test** — download .ics and verify it imports into macOS Calendar; verify Google Cal link opens correctly; verify timezone switcher re-renders times; verify My Teams filters correctly.

---

## Acceptance Criteria

- [ ] Page loads with zero network requests (no CDN, no fonts, no external scripts)
- [ ] MATCHES array contains exactly 104 entries (verifiable via `MATCHES.length === 104` in console)
- [ ] Group stage: 72 matches across groups A–L, 6 per group
- [ ] Knockout: 32 entries — 16 R32, 8 R16, 4 QF, 2 SF, 1 3rd place, 1 Final
- [ ] "Download .ics — All Matches" produces a valid .ics file that imports into macOS Calendar with 104 events
- [ ] Each ICS event has a 30-minute VALARM reminder
- [ ] Group stage ICS event titles contain both team names and flag emojis
- [ ] Knockout ICS event titles contain the matchLabel string
- [ ] "Google Calendar" button opens a valid calendar.google.com URL with correct event data
- [ ] Selecting 0 teams hides My Teams download buttons
- [ ] Selecting ≥1 team shows buttons and correct match count (group matches for selected teams + all 32 knockout slots)
- [ ] Timezone selector auto-detects browser timezone on load
- [ ] Switching timezone re-renders all visible match times without page reload
- [ ] ICS DTSTART values always use UTC Z suffix regardless of selected timezone
- [ ] Knockout match cards display ⚽ vs ⚽ and the matchLabel subtitle
- [ ] Banner "Teams TBD after group stage..." appears above knockout sections
- [ ] Page is usable on a 375px-wide viewport (iPhone SE)

---

## Decisions Taken and Discarded

**Single .html file, zero dependencies**
Chosen over a build-based setup (Vite, React, etc.). Reason: deployable via Netlify Drop in 10 seconds, shareable as a raw file, no Node required. Tradeoff: no tree-shaking, no component isolation — acceptable for a ~2k LOC single-purpose page.

**Client-side ICS generation**
Chosen over a backend endpoint that returns .ics. Reason: no server cost, no API keys, works offline after first load. Tradeoff: ICS string lives in memory — fine for 104 events.

**Google Calendar bulk = first-event link + tooltip**
Google Calendar has no native multi-event URL import. Chosen over: (a) generating a webcal:// subscription URL (requires hosting), (b) opening N tabs. The .ics download is the real bulk path; the Google Cal button is a convenience for single-event or first-event discovery.

**All knockout slots included in My Teams filter**
Chosen over filtering knockouts to "only if team is confirmed." Reason: team assignment is TBD — the user's team may be in any slot. Including all slots lets users block their calendar now. Documented in UI with the TBD banner.

**No localStorage persistence**
Chosen over saving selected teams between sessions. Reason: page is a one-shot sharing tool, not a recurring app. Keeping it stateless reduces complexity with zero user cost.

**UTC-only ICS, dynamic display TZ**
ICS always stores UTC with Z suffix. Display times re-render via Intl API. Chosen over storing pre-formatted strings per timezone. Reason: correct across DST transitions, zero duplication in the data array.

---

## Identified Risks

**Match data accuracy**
All 72 group stage matchups, venues, and times are hardcoded from the December 2024 draw. If FIFA reschedules any match before the tournament starts, the file must be manually updated. Mitigation: note in the HTML source which official source was used for the data.

**iOS .ics download behavior**
Safari on iOS may open the .ics inline instead of triggering the Calendar import dialog, depending on iOS version. Mitigation: none beyond the Blob download approach — this is a Safari limitation. The page documents the expected flow ("Download in Safari → opens in Calendar").

**Google Calendar URL length**
googleCalLink() encodes event data into a URL. Long venue or matchLabel strings may hit browser URL limits in older browsers. Mitigation: keep venue strings concise; knockout matchLabels are short by design.

**Timezone auto-detection mismatch**
`Intl.DateTimeFormat().resolvedOptions().timeZone` returns an IANA string (e.g. "America/New_York"). If the browser returns a zone not in TZ_OPTIONS, the selector falls back to showing the raw IANA string as a custom option. Mitigation: TZ_OPTIONS covers the 15 most common zones for the tournament's audience; edge cases degrade gracefully.

**RFC 5545 line folding**
foldLine() must fold at 75 octets, not 75 characters — flag emojis are multi-byte. A naive character-count fold breaks ICS parsers. Mitigation: implement folding on byte length using TextEncoder.
