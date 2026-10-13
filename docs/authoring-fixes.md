# Local authoring fixes — 2026-10-14

This work uses an independent clone and local branch `fix/authoring-session-data`.
The initial public default branch was main, at audited commit
`49963d4e38c7828d50a4955457c8aa4e2b22f73d`, with no subsequent commits/diff.
The existing v0.1.0 annotated tag resolves to
`9e32fabecdec94fc4841a53bf6530d0dc132cd38`. No submodules or applicable AGENTS.md
files were found. The original checkout was initially clean and was only read;
this clone does not share its Git state. Dependencies, stylesheet, example assets,
published tags/assets, upstream branches and other sessions were not modified.
All new results are local; they are separate from the earlier publication/CI evidence.

Toolchain actually used: Node 24.21.0, npm 11.19.0, Playwright 1.64.0;
Chromium 156.0.8078.4, Firefox 157.0, Playwright WebKit 27.2;
macOS 26.7.1 (25G241), arm64, 16 GiB RAM. The system default Node was 26.9.0,
so commands used the separately copied, ignored `.toolchain/node-v24.21.0-darwin-arm64`.
Browser profiles/contexts and loopback ports were created for this task only.

## Reproduction and policy

Baseline commands passed typecheck, lint, build, 46 unit tests and 39 browser tests.
Three new Chromium regressions then failed on the audited runtime:

| Finding | Native observed failure | Fix |
| --- | --- | --- |
| LR-1/P1 | UI B/Saved, durable current title A pending after late A open delivery | A revocable save owner; replacement retires it synchronously, checks after open and before writes, aborts uncommitted transactions |
| LR-2/P2 | typed before restore became Recovered project | Read-only startup: disabled title/choosers/Undo/Redo, inert workspace, guarded mutation/file/drop/keyboard handlers; bounded open and read failures enable memory work |
| LR-3/P2 | delete public changed private/shared into shared/private | A model-level logical order policy for remove/reorder and all action displays/payload/player |

See the actual [baseline failures](evidence/authoring-fixes/baseline-regressions.log)
and [baseline browser run](evidence/authoring-fixes/baseline-e2e.log).
Fixtures generate their own deterministic static PNG and independent branching
lesson. Interleaving gates hold native IDB success/complete delivery; they retain
native transactions and database serialization. A transaction-phase gate keeps
it active through native requests, rather than replacing IndexedDB or React.

`SaveOwner` is one small revocable object per authoring session. New/Open/Save a
new copy retire the previous owner before React updates. A save waiting for DB
open checks ownership again; an active transaction subscribes to revocation and
aborts project/assets/current together. Already committed old data is retained,
and the new session's later commit selects its own current project. Revision
conflicts still compare inside the same write transaction. Each session owns its
revision, snapshot and status. Same-session edits queue behind in-flight saves.
Undo back to an earlier saved snapshot stays pending while a different snapshot
is in flight and until the displayed snapshot is committed again.

Startup waits for recovery/new-memory-session decision. Both native open and read
have bounded failures. Late callbacks after timeout cannot restore over memory
work. Invalid imported projects do not partially merge. Saved means a confirmed
commit of the displayed session snapshot; browser recovery is still per origin
and is not a portable backup. Replacing uncommitted edits requires keeping a
downloaded editable project. Save a new copy uses a new project ID.

Action order is defined by `order`, not JSON array position. Valid shuffled arrays
remain accepted. Remove/reorder sort, edit and renumber; IDs, targets, feedback,
geometry and original asset references are retained. Inspector, transition list,
canvas DOM/numbering, payload and player use the same helper. Undo restores the
original snapshot/meaning; redo repeats the corrected operation.

The native WebKit fixture showed default buttons skipped by Tab but explicit
`tabindex=0` buttons included. Ordered action controls and player buttons now have
zero tabindex; no positive tabindex or system preference changes were made. The
modal closes before restoring its previously focused element. Keyboard opening
and Escape return focus to the actual trigger in all tested engines.

## Verified local gates

| Command | Actual outcome |
| --- | --- |
| npm ci | Success, pinned packages, zero reported vulnerabilities |
| npm run typecheck | Success |
| npm run lint | Success, zero warnings |
| npm run test:unit | 69 passed, 3 files |
| npm run build | Success |
| npx playwright install chromium firefox webkit | Success, all three available |
| npm run test:e2e | 108 passed: 36 per engine; zero unexpected, skipped or flaky cases |

The [unit log](evidence/authoring-fixes/unit.log),
[browser log](evidence/authoring-fixes/e2e.log) and
[structured browser results](evidence/authoring-fixes/e2e-results.json) come from
the executed commands. The final matrix ran sequentially without runtime edits.
An earlier overlapping pair of our own Vite test runners rewrote the generated
runtime and caused HMR during a restore gate; that interrupted diagnostic run was
replaced by the final sequential run. Preview assertions now wait for the actual
actions to exist. No incorrect product assertions were relaxed or tests skipped.

Coverage includes A→B, A→B→C with both release orders; New/Open project/Open example;
Save a new copy; delays at native DB open, started transaction and committed result;
latest same-session edits and undo during a save; stale failures/results; native
multi-tab conflicts, quota/abort/stalled notifications and working backup. Startup
tests cover title, keyboard undo/redo, disabled chooser plus programmatic delivery,
drop, open/read timeouts and ignored late restore. Model tests cover all six physical
permutations and first/middle/last deletion, other fields, assets, no-ops, reorder,
undo/redo and JSON/payload round trips. Browser tests verify canvas/player Tab order,
inspector, backup/reimport and preview/export after deletion.

The existing graph, geometry, pruning, original byte/EXIF fidelity, batch order,
atomic invalid imports, malformed/broken/animated inputs, retry/finish, safe DOM/CSP,
hostile strings, zero unexpected learner requests and desktop/mobile/axe tests
also passed again. Additional native byte-limit tests reject 80 MiB + 1 JSON,
10 MiB + 1 image and aggregate 54 MiB before decode without changing the sentinel
project. Long Arabic text with locale ar, mobile panels and dialog focus remain
within the document width at 1440 and 390 px.

Own native evidence: [B Saved](evidence/authoring-fixes/B-saved.png),
[reload B](evidence/authoring-fixes/reload-B.png),
[page errors and requests](evidence/authoring-fixes/B-browser-log.json).
These two screenshots use the browser test's 1280 px viewport. The fresh consumer
will also capture 1440/390 screenshots. Earlier authors' media/CI were not used as
evidence of this execution.

## Package and performance follow-up

The implementation commit and clean local ZIP provenance are recorded in the
archive's BUILD.json. The next steps execute `npm run package:web`,
`npm run test:production`, and an explicit `--zip /absolute/path/...` pass on that
same fresh archive. The strengthened consumer requires exact committed edits
after hard refresh, preserving original assets through backup/reimport, root and
arbitrary subpath delivery, traversal/occupied-port checks, and an isolated file
player with network/storage disabled at 390 px. Final hashes/results and measured
performance are appended after execution, without claiming CI or publication.

Deterministic inputs from `node scripts/generate-stress.mjs`: representative
8 images / 16 nodes / 4 actions per screen, 4,739,335 bytes JSON and 3,543,640 image
bytes; near-limit 50 images / 200 nodes / 30 actions per screen, 75,978,586 bytes JSON,
52,030,316 image bytes and a 10,383,893-byte largest PNG. The near-limit fixture is
49.62 MiB total images, 9.90 MiB/image and 72.46 MiB JSON. Feedback reaches 4,000
characters and labels 200. The measured script uses three fresh browser launches
per fixture against the shipped editor, records latencies/keyboard samples and
200 ms samples of owned-browser RSS and JS heap. Sum RSS includes shared pages
and is an observed sampled peak, not an exact allocation maximum or total machine
memory. No speedup claim is made. Active import/export have no Cancel control in
v1; Escape is checked where the export dialog offers closing before preparation.

## External limits

This is local verification on one macOS workstation. Playwright WebKit is not
Safari. Full platform coverage (including Windows/Linux, Safari/iOS/Android),
physical touch, manual screen-reader review and independent consented author→learner
handoffs remain unverified. No user pilot or universal accessibility/10/10 claim
is made. There were no push, issue/PR, deployment, release, tag/asset replacement,
or external messages.
