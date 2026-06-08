# 02-calendar-wizard

**State:** Implemented
**Date:** 2026-06-07
**Dependencies:** 01-fwc2026-calendar-page

**Objective:** Replace the two hero cards with a unified inline multi-step wizard
that guides the user through match scope → team selection → timezone → calendar
platform buttons.

---

## Scope

### In
- Remove both hero cards ("All 104 Matches" and "My Teams") and replace with one
  inline wizard
- Step 1: match scope picker — three options:
  - "All 104 matches"
  - "Solo mis selecciones" (group stage only for selected teams)
  - "Mis selecciones + eliminatorias" (group stage for selected teams + all 32
    knockout slots)
- Step 2: team chip picker — appears only when a team-filtered option is chosen
- Step 3: timezone selector — appears on all paths after step 1 or 2
- Step 4: platform buttons — appears after timezone is set:
  - iPhone / iPad / Mac → .ics download
  - Google Calendar → .ics download + opens Google Calendar import page
  - Android → .ics download
  - Outlook → .ics download
- Choosing a different Step 1 option resets steps 2–4 inline without a page reload
- Reuse existing `generateICS`, `downloadICS`, `googleCalLink`, and
  `formatMatchTime` functions — no changes to ICS logic

### Not in
- Modal or overlay UI (inline steps only)
- Webcal subscription URL
- Multiple Google Calendar events in one URL (Google has no bulk URL API; .ics import is the bulk path)
- Changes to the match browser section below the wizard
- Backend, server, or API of any kind
- Explicit "Back" button — user re-selects Step 1 to restart

---

## Data Model

### New runtime state (additions to existing JS variables)
```js
let wizardStep = 1;       // 1 | 2 | 3 | 4 — current visible step
let matchScope = null;    // "all" | "selections" | "selections_plus_knockouts"
```

### New filter function
```js
getMatchesForScope(scope, teams)
```
- `"all"` → returns all 104 matches (MATCHES array unchanged)
- `"selections"` → group stage matches where `home` or `away` is in `teams`
- `"selections_plus_knockouts"` → group stage matches for `teams` + all 32
  knockout slots (phase !== "Group Stage")

### ICS filenames per scope
- All 104: `FWC2026-All-Matches.ics`
- Solo mis selecciones: `FWC2026-My-Teams.ics`
- Mis selecciones + eliminatorias: `FWC2026-My-Teams-Plus-Knockouts.ics`

### Unchanged
- `selectedTZ`, `selectedTeams`, `currentPhase`, `currentGroup` — same as spec 01
- `MATCHES`, `TZ_OPTIONS` — no changes
- `generateICS`, `downloadICS`, `googleCalLink`, `getMatchesForTeams` — reused
  as-is (getMatchesForTeams is superseded by getMatchesForScope but kept for
  any existing references)

---

## Implementation Plan

1. **Remove hero cards.** Delete the "All 104 Matches" and "My Teams" card HTML
   from `index.html`. Keep all existing JS functions intact.

2. **Add Step 1 UI.** Three option cards in a row (stacked on mobile). Each card
   has a title, one-line description, and a select button. Clicking one sets
   `matchScope` and advances `wizardStep`:
   - "All 104 matches" → wizardStep = 3 (skip team picker)
   - "Solo mis selecciones" → wizardStep = 2
   - "Mis selecciones + eliminatorias" → wizardStep = 2
   Selecting a new option resets wizardStep to the correct next step and clears
   selectedTeams.

3. **Add Step 2 UI (team picker).** Reuse the existing 48-country chip grid.
   Show a counter "Selected: N teams · X matches". A "Continue →" button appears
   when ≥1 team is selected; clicking it sets wizardStep = 3.

4. **Add Step 3 UI (timezone).** Reuse the existing timezone dropdown and
   quick-pick pill row. A "Continue →" button advances wizardStep = 4.

5. **Add Step 4 UI (platform buttons).** Four buttons in a 2×2 grid (2-column
   on desktop, 1-column on mobile):
   - 📱 iPhone / iPad / Mac → `downloadICS(generateICS(...), filename)`
   - 📅 Google Calendar → `downloadICS(generateICS(...), filename)` + opens
     `calendar.google.com/calendar/r/settings/import`
   - 🤖 Android → `downloadICS(generateICS(...), filename)`
   - 📧 Outlook → `downloadICS(generateICS(...), filename)`
   All four buttons call `getMatchesForScope(matchScope, selectedTeams)` to build
   the event list. The Google Calendar button also opens the import settings page
   and shows a tooltip with the match count and import instructions.

6. **Implement `getMatchesForScope`.** Pure function, no side effects:
   - `"all"` → `MATCHES`
   - `"selections"` → `MATCHES.filter(m => m.phase === "Group Stage" &&
     (teams.has(m.home) || teams.has(m.away)))`
   - `"selections_plus_knockouts"` → group stage filter above +
     `MATCHES.filter(m => m.phase !== "Group Stage")`

7. **Wire step visibility.** Each step section has a CSS class `wizard-step`.
   A `renderWizard()` function shows/hides steps based on `wizardStep`. Steps
   already completed remain visible above the current step (inline accordion
   feel — user can see their choices without scrolling).

8. **Mobile pass.** Step 1 cards stack vertically below 600px. Platform buttons
   go 1-column. Chip grid and quick-pick TZ row already wrap — no changes needed.

9. **Smoke test.** Verify all three scope paths produce correct match counts:
   all=104, selections=varies by team, selections_plus_knockouts=32+group
   matches. Verify all four platform buttons produce valid output. Verify
   re-selecting Step 1 resets state correctly.

---

## Acceptance Criteria

- [ ] Step 1 shows three option cards; selecting one highlights it and shows the
      next step below without a page reload
- [ ] Choosing "All 104 matches" skips to Step 3 (timezone), Step 2 never appears
- [ ] Choosing a team-filtered option shows Step 2 (team chip picker)
- [ ] "Continue →" in Step 2 is disabled until ≥1 team is selected
- [ ] Step 3 (timezone) appears on all paths after step 1 or 2
- [ ] Step 4 (platform buttons) appears only after timezone step is confirmed
- [ ] Re-selecting a Step 1 option resets selectedTeams and collapses steps below
      the new selection point
- [ ] `getMatchesForScope("all", _)` returns exactly 104 matches
- [ ] `getMatchesForScope("selections", teams)` returns only group stage matches
      where home or away is in teams — zero knockout slots
- [ ] `getMatchesForScope("selections_plus_knockouts", teams)` returns group stage
      matches for teams plus all 32 knockout slots
- [ ] "iPhone / iPad / Mac" button downloads a valid .ics file named
      `FWC2026-All-Matches.ics` / `FWC2026-My-Teams.ics` /
      `FWC2026-My-Teams-Plus-Knockouts.ics` depending on scope
- [ ] "Android" button downloads the same .ics content as iPhone/Mac for the
      same scope
- [ ] "Outlook" button downloads the same .ics content as iPhone/Mac for the
      same scope
- [ ] "Google Calendar" button downloads the same .ics content as iPhone/Mac for
      the same scope
- [ ] "Google Calendar" button opens the Google Calendar import settings page
- [ ] Google Calendar button shows a tooltip with match count and import
      instructions
- [ ] Step 4 shows the number of matches ready to export before the user clicks
      a platform button
- [ ] Previously completed steps remain visible above the current step
- [ ] Page is usable on a 375px-wide viewport with the wizard active

---

## Decisions Taken and Discarded

**Unified wizard over two separate cards**
Chosen over keeping the existing two-card layout and adding platform buttons to
each. Reason: three match scope options don't map cleanly to two cards; a single
flow avoids duplicating the timezone and platform button UI twice.

**Inline steps over modal**
Chosen over a dialog/overlay. Reason: simpler markup, no focus-trap logic, works
identically on mobile without viewport height issues. Tradeoff: the page grows
vertically as steps are completed — acceptable for a single-purpose tool.

**No explicit Back button**
Chosen over wizard-style Back navigation. Reason: completed steps stay visible,
so the user can click any earlier option to restart from that point. An explicit
Back button would add state complexity for no UX gain in a 4-step linear flow.

**Android = .ics download**
Chosen over Android calendar intent (`content://com.android.calendar/`). Reason:
calendar intents cannot be triggered from a web page — they require a native app
context. .ics download works in Chrome/Firefox on Android and is openable by
Google Calendar and other calendar apps.

**Outlook = .ics download**
Chosen over `ms-outlook://` deep-link. Reason: deep-links only work if Outlook
is installed and the scheme is registered; .ics import is universally supported
across all Outlook versions (desktop, web, mobile).

**Google Calendar = .ics download + import page**
Changed from spec 01's first-match deep-link. Google Calendar has no bulk URL
API, so the wizard now downloads the full .ics file (same as other platforms)
and opens the import settings page. A tooltip guides the user to select the
downloaded file.

**getMatchesForScope supersedes getMatchesForTeams**
The new function covers all three scopes cleanly. `getMatchesForTeams` is kept
in the file to avoid breaking any references but is no longer called by the
wizard.

---

## Identified Risks

**Team name mismatch in selections filter**
`getMatchesForScope("selections", teams)` compares `teams.has(m.home)` against
the exact string in MATCHES. If a chip label and the match data string differ by
even one character (e.g. "USA" vs "United States"), the filter returns 0 matches
silently. Mitigation: the chip labels must be kept in sync with the team name
strings in the MATCHES array — enforce this by sourcing both from the same
constant.

**Step 2 pushes subsequent steps far below the fold on mobile**
The 48-chip team grid is tall. On a 375px screen, Step 3 and Step 4 appear
well below the visible area after Step 2 is completed. Users may not notice more
steps are available. Mitigation: auto-scroll to the newly revealed step when it
appears (`element.scrollIntoView({ behavior: "smooth" })`).

**Accidental scope re-selection clears team picks**
Clicking a different Step 1 option resets selectedTeams. A user who spent time
picking 10 teams and then mis-clicks a Step 1 card loses their selection with no
undo. Mitigation: only reset selectedTeams when the new scope is different from
the current one and Step 2 was already completed.
