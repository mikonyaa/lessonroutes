# v0.1.1 publication verification

Verified on 2026-10-14 after explicit authorization to publish the completed local
fixes. Work stayed in the independent clone; the original checkout, other sessions,
existing tags and release assets were preserved. Main was updated by ordinary
fast-forward pushes.

- [Repository](https://github.com/mikonyaa/lessonroutes), ID `1414780852`
- [Release v0.1.1](https://github.com/mikonyaa/lessonroutes/releases/tag/v0.1.1), ID `412173924`
- [Pages editor](https://mikonyaa.github.io/lessonroutes/)
- [Web ZIP](https://github.com/mikonyaa/lessonroutes/releases/download/v0.1.1/lessonroutes-0.1.1-web.zip)
- [Offline learner example](https://github.com/mikonyaa/lessonroutes/releases/download/v0.1.1/lesson.html)
- [Editable project](https://github.com/mikonyaa/lessonroutes/releases/download/v0.1.1/workspace.lessonroutes.project.json)

The release source is `020c20cc81152130cbaaa274e922bdbd687ec9a0`. The annotated
tag `v0.1.1`, object `bc8c971809ff982831d09fb7e2aedf51a0d5fa74`, resolves to that
exact commit. Subsequent documentation/evidence commits do not replace its ZIP
or deployed app. Review the [diff from the audited source](https://github.com/mikonyaa/lessonroutes/compare/49963d4e38c7828d50a4955457c8aa4e2b22f73d...v0.1.1).

## Changes and CI

Retired autosaves cannot take the current recovery pointer after a session switch.
Saved belongs to the displayed session's committed snapshot, including edits or
undo during an in-flight save. Startup editing waits for recovery; bounded storage
failures leave memory work and backup available. Action remove/reorder preserves
logical order across valid physical permutations, undo/redo, backup and player.
See [the policies, baseline failures and local measurements](authoring-fixes.md).
The dependencies, project format and original image bytes were retained.

[Verify LessonRoutes run 38479208321](https://github.com/mikonyaa/lessonroutes/actions/runs/38479208321)
verified this repository, workflow `.github/workflows/ci.yml`, event **push**, branch
**main** and the exact release SHA. All required job steps completed successfully:
clean install, real browser/OS prerequisites, typecheck/lint, unit tests, build,
browser/file-URL tests, ZIP packaging, extracted consumer tests and build provenance.
There were **69 unit tests and 108 browser tests: 36 per engine, zero unexpected,
skipped or flaky cases**. CI used `--retries=0`.

Actual CI tools: Node 24.21.0, npm 11.19.0, Playwright 1.64.0; Ubuntu 24.04 runner
image `20261004.327`. The installed binaries were Chromium 156.0.8078.4, Firefox
157.0 and Playwright WebKit 27.2. The [CI gate](evidence/v0.1.1-publication/ci-gate.json),
[raw log](evidence/v0.1.1-publication/ci.log) and
[browser report](evidence/v0.1.1-publication/ci-e2e-results.json) record the executions.

The first candidate's CI had one WebKit retry: the native transaction test gate
queued a keepalive callback after the product correctly aborted its retired
transaction. That artifact was withheld. The test gate now stops synchronously
on native abort, retaining native requests and all assertions. The affected
scenario passed 10 consecutive macOS WebKit runs without retries, then the full
CI matrix passed on its first attempt. The
[initial retry](evidence/v0.1.1-publication/initial-ci-retry.json) and
[10-run log](evidence/v0.1.1-publication/webkit-native-abort-repeat.log) remain evidence.

## Exact released artifact and Pages

ZIP: `lessonroutes-0.1.1-web.zip`, **3,623,650 bytes**.
SHA-256: `40d6e3bffb382c9708c2074c6e68f5405ef52106ef2ab069f4980ae59fe8934c`.
The ZIP is the unchanged `verified-web` artifact downloaded from run 38479208321.
Its `BUILD.json` records that SHA's clean source, GitHub Actions origin and actual
run ID. It was consumer-tested again on macOS before upload, without rebuilding.
The standalone example HTML was regenerated through the real browser exporter;
its editable project and original raster bytes were retained.

The six release attachments are the ZIP, lesson.html, editable project, combined
licenses, release-manifest.json and SHA256SUMS. The manifest records provenance;
it is not a cryptographic attestation. SHA256SUMS hashes the other five files.
[Manifest](evidence/v0.1.1-publication/release-manifest.json),
[checksums](evidence/v0.1.1-publication/SHA256SUMS) and
[download records](evidence/v0.1.1-publication/public-results.json) contain the bytes.

[Pages run 38480427253](https://github.com/mikonyaa/lessonroutes/actions/runs/38480427253)
verified the selected CI source/run and ZIP checksum, extracted that ZIP and
deployed its app tree. Both prepare and deploy completed successfully. All eight
publicly served app files matched their ZIP entries byte for byte; no second build
was substituted. [Deployment gate](evidence/v0.1.1-publication/pages-gate.json).

## Anonymous public consumer and native Saved/reload

`node scripts/public-qa.mjs --repo mikonyaa/lessonroutes --pages https://mikonyaa.github.io/lessonroutes/`
passed with no authentication headers. It verifies CI job/step provenance, the
peeled tag, public repository pages and every release attachment/checksum.

The anonymously downloaded final ZIP was unpacked outside the source checkout.
Its supplied server ran without consumer node_modules. Root and an arbitrary
subpath exercised import, editing, exact durable save/hard refresh, backup,
reimport and export. Traversal, directory and out-of-app requests were rejected;
an occupied port exited without interrupting the existing server. Separate
file-URL contexts completed and restarted the exported lesson by keyboard at
390 px with offline mode, blocked HTTP(S) and persistent storage getters disabled.
See [Linux consumer](evidence/v0.1.1-publication/ci-production-results.json),
[macOS CI-ZIP consumer](evidence/v0.1.1-publication/macos-ci-consumer-results.json)
and [anonymous ZIP consumer](evidence/v0.1.1-publication/public-production-results.json).

Fresh Chromium 156.0.8078.4 contexts exercised the actual Pages editor at 1440 and
390 px with browser cache disabled: example, edits, Saved, backup/import, hard
refresh, preview and export. Preview/file transition logs matched. In each context
a native IndexedDB open-success callback for A was held, B was saved, then A was
released. Durable current remained B, and reload opened B/Saved. Page errors were
empty, requests stayed on the Pages origin, and neither layout overflowed.

The six actual screenshots were visually inspected:
[editor 1440](evidence/v0.1.1-publication/public-pages-1440.png),
[editor 390](evidence/v0.1.1-publication/public-pages-390.png),
[B Saved 1440](evidence/v0.1.1-publication/public-B-saved-1440.png),
[reload B 1440](evidence/v0.1.1-publication/public-reload-B-1440.png),
[B Saved 390](evidence/v0.1.1-publication/public-B-saved-390.png),
[reload B 390](evidence/v0.1.1-publication/public-reload-B-390.png).
The publicly downloaded lesson.html finished by mouse and keyboard at both
1440/390 in isolated offline contexts, with zero outgoing requests.

The previous v0.1.0 release ID, body, tag object and all six asset IDs, sizes and
digests remained unchanged. [Preservation record](evidence/v0.1.1-publication/previous-release-preserved.json).
The original demo and v0.1.0 evidence are historical materials, not new captures.

Physical touch, manual screen-reader qualification, independent author-to-learner
handoffs and other browser/OS combinations remain unperformed. Playwright WebKit
is not Safari qualification. The near-limit synthetic measurements in the local
record are not user-pilot results or an authoring-time improvement claim. Browser
recovery remains origin-local and does not replace a portable project backup.
