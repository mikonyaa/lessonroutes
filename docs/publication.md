# v0.1.0 publication verification

Verified on 2026-10-12, including actual public downloads and browser interaction.

- [Public repository](https://github.com/mikonyaa/lessonroutes)
- [Release v0.1.0](https://github.com/mikonyaa/lessonroutes/releases/tag/v0.1.0)
- [Complete Pages editor](https://mikonyaa.github.io/lessonroutes/)
- [Real 21.84-second demo](https://mikonyaa.github.io/lessonroutes/examples/demo.mp4)
- [Editable example](https://github.com/mikonyaa/lessonroutes/releases/download/v0.1.0/workspace.lessonroutes.project.json)
- [Independent learner HTML](https://github.com/mikonyaa/lessonroutes/releases/download/v0.1.0/lesson.html)

Release source commit S is `9e32fabecdec94fc4841a53bf6530d0dc132cd38`.
The annotated tag `v0.1.0` resolves to this exact commit locally and on GitHub;
its tag object is `b1a72b5e2ed7e117b78e1f801b3de1c9cca29526`.
Later main commits add published links and verification evidence. They do not
replace the tag, Release assets or deployed application tree.

## Gate A and Gate B

Gate A passed before creating the public repository: P0/P1 local authoring,
standalone file player, 46 unit tests, 39 real-browser tests, final production ZIP,
fresh consumer extraction, original demo, visual review, documentation and licenses.
The staged set contained only product sources, synthetic fixtures and original
materials; no credentials, private paths, profiles, node_modules, other projects
or competitor code. Development dependency licenses were inventoried; React's
runtime notices are included.

[Verify LessonRoutes run 38175915561](https://github.com/mikonyaa/lessonroutes/actions/runs/38175915561)
passed for event **push**, branch **main**, head SHA **S**. Its mandatory job
actually executed clean install, explicit browser/OS prerequisite installation,
typecheck/lint, unit tests, production build, Chromium/Firefox/Playwright WebKit
E2E and file-URL tests, packaging, consumer verification of the final ZIP and
allowlisted artifact upload. All steps succeeded; 39 browser cases passed with
zero skipped, unexpected or flaky cases.

The Release ZIP is the unchanged `verified-web` artifact downloaded from that
specific run. It was not rebuilt after download. The exact bytes were consumer
tested again on macOS. CI tool versions: Node v24.21.0, npm 11.19.0 and Playwright
1.64.0. [Build origin](evidence/ci-build.json), [mandatory job steps](evidence/ci-gate.json)
and [CI results](evidence/ci-checks.json) are recorded.

ZIP: `lessonroutes-0.1.0-web.zip`, 3,622,310 bytes.
SHA-256: `1aa7d0b49190d82047bb2a8df707aeb9d1ab4d45c400aea736e7ad3881969d5b`.
Release attachments also include lesson.html, the editable example, combined
licenses, release-manifest.json and SHA256SUMS. The checksum file does not hash
itself; the manifest records provenance and is not a cryptographic attestation.

## Pages and public delivery

[Pages run 38176203882](https://github.com/mikonyaa/lessonroutes/actions/runs/38176203882)
verified the selected CI run/SHA and ZIP hash, then deployed only its `app/` tree.
Both prepare and deploy succeeded. The actual environment page_url was
`https://mikonyaa.github.io/lessonroutes/`. Only this repository's Pages site was
configured; no account-root site, CNAME or DNS was changed.

Unauthenticated HTTP checks verified the public repository, README, LICENSE,
source, demo, CI run, Release and every attachment. All six assets were downloaded
without auth headers and checked against their recorded bytes/checksums. The ZIP
signature was verified, then the downloaded ZIP was extracted outside source and
its supplied server performed authoring, backup/import, root/subpath navigation,
export and independent offline completion without consumer node_modules.

Every publicly served app file, including JavaScript, CSS, index and demo/example
files, matched the corresponding CI ZIP entry byte for byte. Fresh Chromium
156.0.8078.4 contexts exercised actual Pages at 1440 and 390 pixels: example,
editing, manual backup/import, reload with browser cache disabled, Preview and
HTML export. Preview and exported-file transition logs matched. Screenshots were
visually reviewed; neither layout had horizontal document overflow.

The publicly downloaded lesson.html completed by mouse and keyboard at 1440/390
in separate file-URL contexts with HTTP/HTTPS blocked, offline mode enabled and
persistent storage access forced to throw. It issued zero outgoing requests.
The record is [public-results.json](evidence/public-results.json).

No independent hosting blocker remains. The experimental product limits and
untested claims remain those documented in [verification.md](verification.md):
no Safari qualification, external teacher pilot, measured time advantage or
screen-reader learning-equivalence claim. Original screenshots can retain private
content/EXIF; authors must review them. Browser autosave does not replace backups.
