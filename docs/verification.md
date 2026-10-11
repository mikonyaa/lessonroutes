# Verification — experimental v0.1.0

Local checks on 2026-10-12: macOS / Apple Silicon, dedicated LessonRoutes workspace,
Node 24.21.0, npm 11.19.0, TypeScript strict, Playwright 1.64.0. Browser contexts,
temporary profiles and loopback servers were created only for this project. Other
projects, active Codex sessions and the installed main browser profile were not
used or changed.

## Real browser matrix

| Browser | Exact local version | Checked |
| --- | --- | --- |
| Chromium | 156.0.8078.4 | Authoring/storage/security E2E, independent file player, mouse/keyboard, geometry and consumer ZIP |
| Firefox | 157.0 | Authoring/storage/security E2E, independent file player, mouse/keyboard and EXIF orientation |
| Playwright WebKit | 27.2 | Authoring/storage/security E2E, independent file player, mouse/keyboard and preview focus |
| Installed Google Chrome | 155.0.8059.39 | Independent file player at 1440/390 and native 125% browser zoom in a fresh temporary profile |

Playwright WebKit is not Safari. The installed safaridriver reports Safari 27.0,
but Safari was not used for a full automated pass and no Safari support claim is
made. No global automation/security setting was enabled.

## Checks and practical limits

- The first vertical pass used three original screens, two first-screen choices,
  incorrect explanation/self-target retry, a correct path and finish. After closing
  the author context, a new context completed the real HTML by image-region clicks
  and keyboard at 1440/390. HTTP/HTTPS was blocked, offline mode enabled and storage
  getters forced to throw. It also worked in a directory with Unicode and spaces.
  All four browser engines/installed Chrome recorded zero outgoing requests.
- The complete five-screen exercise has two distinct incorrect first-screen choices.
  Preview and exported file produce identical node/action/phase transition logs.
  Retry, feedback-before-transition, outside-region hints, double activation guard,
  heading/Continue focus and restart were checked.
- Twenty different original image fixtures, repeated names and Unicode labels,
  varying aspect ratios, order, matching asset references and byte deduplication
  were verified through actual browser import and project download.
- Image-relative region geometry and actual region clicks were tested at
  1440/1024/390, including contain letterboxing. CSS zoom 125% is a separate test.
  Installed Chrome also used **native browser default zoom 125%**, with CSS zoom
  remaining 1; outerWidth 1440, innerWidth/clientWidth/scrollWidth 1152 and DPR 1.25.
  Editor selection and an offline wrong/retry/correct path completed at that zoom.
- Save/close/import retains graph, IDs, text, original bytes and normalized geometry.
  Deleting a linked step resolves retained incoming links explicitly; undo/redo
  restores links and images. Pointer dragging is one history operation.
- Real IndexedDB quota injection, abort after request success, a suppressed commit
  notification (stalled transaction), unavailable storage and two-tab revision
  conflicts stay unsaved/conflicted. Manual project download works in each case.
- Missing targets, finish-less/closed retry graphs, missing assets, overlaps,
  invalid coordinates/base64/MIME/hashes/versions/fields and oversized headers are
  rejected or block ready export at their appropriate structural/graph layer.
  Real animated PNG and WebP fixtures are rejected; static WebP and EXIF orientation
  6 JPEG are accepted with matching editor/player dimensions.
- Malicious script-closing strings, quotes, Unicode separators and HTML entities
  remain text. Imported code does not execute or request the network. A deliberately
  injected unapproved inline script is blocked by the actual file-URL CSP. An
  unreachable draft with separate canary text **and image bytes** is absent in HTML.
- The final web ZIP is extracted into a fresh consumer directory outside source.
  Its supplied server runs without node_modules, serves only app, rejects traversal
  and directory listing, and handles an occupied port without terminating it.
  Real authoring, manual save/import, hard refresh, export and file-player keyboard
  completion were tested at root and an arbitrary nested path containing spaces.
- Automated axe checks report no selected WCAG 2 A/AA and 2.1 AA violations in the
  desktop/mobile long-label editor and preview. This is not a certification or a
  substitute for meaningful descriptions or manual screen-reader evaluation.

## Visual and demo evidence

Actual screenshots were reviewed for desktop/mobile editor, empty state, import
error, long labels, feedback and finish. No visual baseline was generated or
blindly updated. A preview autofocus issue in Firefox/WebKit was corrected and
the affected keyboard/focus tests repeated. Narrow layouts use explicit panels
and have no horizontal document overflow at the checked sizes.

The committed MP4 is a 21.84-second real viewport capture: importing the editable
example, editing a region/destination, incorrect preview choice and retry,
exporting actual HTML, closing the author context, and opening it in a separate
offline learner context. Two real clips were joined with ffmpeg; no interface
states or success results were fabricated. The demo is a partial walkthrough;
full completion is covered by tests.

The bounded comparison with an actual Walkthrough-Creator snapshot is documented
separately. No external teacher pilot, feedback, accessibility learning-equivalence
claim or authoring-time improvement is asserted.

Sanitized results are in [evidence/](evidence/). Local commands were executed, not
merely documented: npm ci, dev on 127.0.0.1, typecheck, lint, test:unit, build,
test:e2e, package:web, test:production and demo:record. Publication evidence will
record the exact CI run, source commit, Release and actual Pages URL after those
independent gates pass.
