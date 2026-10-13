# Local authoring fixes — 2026-10-14

This record describes the completed local-only phase. The user subsequently
authorized GitHub publication; the new source/tag, CI-built ZIP, Pages deployment
and anonymous downloaded-consumer checks are in
[the v0.1.1 publication record](publication-v0.1.1.md). The original local measurements
and their provenance below remain separate from those publication results.

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
also captured 1440/390 screenshots. Earlier authors' media/CI were not used as
evidence of this execution.

## Fresh ZIP and clean consumer

The ZIP was packaged once from clean implementation commit
`4818a5c854054e661ba676fefbccc04538717472`. BUILD.json records sourceDirty false,
origin local build, Node v24.21.0 and actual build time 2026-10-13T20:10:25.268Z.
Later evidence-only commits do not change runtime, tests, scripts or dependencies.

File: `artifacts/lessonroutes-0.1.0-web.zip`, 3,623,592 bytes.
SHA-256: `aaa2d2cd3497633aa5c1def6888edcb369cbc49429c5591aedb2c30d6459a12e`.
This is an unreleased local rebuild with the existing version filename; it does
not replace the published v0.1.0 archive/tag.

Both `npm run test:production` and the following explicit command passed on that
same final ZIP, each using its own new extraction outside the checkout:

```sh
node scripts/test-production.mjs --zip /Users/bahytzanmeiram/lessonroutes-data-fixes-20261014/artifacts/lessonroutes-0.1.0-web.zip
```

The shipped dependency-free server ran without node_modules. Root and
`courses/lessonroutes arbitrary/` each passed opening/import, editing, committed
Saved, backup/reimport and exact saved hard refresh. The consumer checks both the
edited title and action/feedback after refresh; it no longer reimports to conceal
an older recovery result. Backup assets equal the original example assets. Export
then completes wrong feedback/retry, correct path, finish and restart in a new
390 px file-URL context, offline with localStorage/IndexedDB getters disabled.
Both editor and learner record zero page errors; learner HTTP(S) requests are zero.
Traversal, directory listing, out-of-app files and occupied port safety passed.
The returned consumer directory and all request/error logs are in the actual
[consumer results](evidence/authoring-fixes/production-results.json).

Own screenshots from the final ZIP were visually inspected:
[editor 1440](evidence/authoring-fixes/consumer-1440.png),
[editor 390](evidence/authoring-fixes/consumer-390.png),
[learner finish 390](evidence/authoring-fixes/consumer-finish-390.png).
`artifacts/consumer-lesson.html` and `artifacts/consumer.lessonroutes.project.json`
are copied from that verified consumer for local review.

## Measured performance and limits

Commands executed on the same macOS/toolchain and shipped editor:

```sh
node scripts/generate-stress.mjs
node scripts/measure-authoring.mjs
node scripts/check-large-learner.mjs
```

Each fixture used three fresh browser launches (Chromium 156.0.8078.4). Inputs
are independent, deterministic static RGB PNGs with valid CRCs and unique bytes.
The project physically reverses actions but has a valid order permutation.
Every node remains reachable; export checks node count and exact original image
bytes. Backup checks nodes/assets; reload checks the same committed project.

| Input | Representative | Near-limit |
| --- | --- | --- |
| Images / nodes / actions per screen | 8 / 16 / 4 | 50 / 200 / 30 |
| Original image bytes | 3,543,640 (3.38 MiB) | 52,030,316 (49.62 MiB) |
| Largest PNG | 442,955 bytes | 10,383,893 (9.90 MiB) |
| Compact project JSON | 4,739,335 (4.52 MiB) | 75,978,586 (72.46 MiB) |
| Project SHA-256 | 4dcdb8b091a5529ed5055b5e6201c1cc8f2d13b14881feaab5d9fb3f3920fae9 | 027a690a0613a5b7d3e07531654117c91f9d9054d00460fcd11882d3b2900b85 |

Near-limit feedback reaches 4,000 characters and labels 200. Limits were not
changed. Timing values below are median [min–max] of three runs, in milliseconds:

| Operation / observation | Representative | Near-limit |
| --- | --- | --- |
| Batch image import | 420 [397–558] | 3,470 [3,146–3,655] |
| Autosave after image import | 785 [785–819] | 799 [794–799] |
| Editable project import | 680 [437–1,029] | 6,171 [5,813–6,918] |
| Autosave after project import | 782 [781–798] | 798 [784–855] |
| Editable backup download | 264 [248–429] | 2,734 [2,702–2,817] |
| Learner HTML export | 684 [415–757] | 6,458 [6,136–6,558] |
| Restore/reload | 406 [324–490] | 4,071 [3,791–4,276] |
| Sampled peak browser-tree RSS, MiB | 516.6 [490.2–558.9] | 1,376.6 [1,257.0–1,518.6] |
| Sampled peak JS heap, MiB | 59.5 [47.2–67.9] | 516.1 [466.6–540.6] |

Autosave timings start after the imported snapshot is visible and include debounce
and browser-driver polling. Import/export timings include native file delivery,
UI operation, one keyboard probe and download where relevant. Keyboard Tab probes
ran while Working locally was visible: representative 16–142 ms, near-limit 1.7–60
ms. They are sampled interaction checks, not a worst-case jank guarantee. Escape
closes the export dialog before preparation. Active image/project import and HTML
preparation have no Cancel control in v1; no cancellation claim is made for them.

Memory is sampled every 200 ms using RSS summed for the owned browser process tree
and CDP JSHeapUsedSize. RSS includes shared pages, excludes Node/server, and is an
observed sampled peak rather than an exact allocation maximum or machine memory.
These are current-build performance baselines, not evidence of a speedup. The
near-limit input uses substantial desktop memory; physical mobile behavior remains
an external gate. Full input sizes, per-run latencies, keyboard probes and all
memory samples are in [raw results](evidence/authoring-fixes/performance-results.json)
and [input metadata](evidence/authoring-fixes/performance-inputs.json).

The separate [large learner run](evidence/authoring-fixes/large-learner-results.json)
opened the 200-node/50-image HTML through file in a clean 390 px context, with
network/storage disabled. Load to the first 30 actions was 449 ms. It verified
Tab order, an incorrect retry, all 50 screen transitions by keyboard, finish and
restart, without horizontal overflow, page errors or HTTP(S) requests. Its
[finish screenshot](evidence/authoring-fixes/large-finish-390.png) is from that run.

## External limits

This is local verification on one macOS workstation. Playwright WebKit is not
Safari. Full platform coverage (including Windows/Linux, Safari/iOS/Android),
physical touch, manual screen-reader review and independent consented author→learner
handoffs remain unverified. No user pilot or universal accessibility/10/10 claim
is made. There were no push, issue/PR, deployment, release, tag/asset replacement,
or external messages.
