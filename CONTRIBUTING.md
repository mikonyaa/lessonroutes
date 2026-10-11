# Contributing

Use Node 24 LTS and follow the README's install and browser setup steps. Work in
an isolated branch. Keep TypeScript strict and the model/state machine independent
of React. Preview and export must use the same runtime and validated payload.

Run typecheck, lint, unit tests, build, E2E, package:web and test:production before
requesting review. Add regression checks that demonstrate a failure or protect an
important graph/import/storage/security contract. Do not create implementation
mirror tests for cosmetic changes. Use only synthetic project content in artifacts.

v1 is a small screenshot practice editor. Please open an issue to discuss changes
to the project format or runtime. New major formats must not silently discard
fields. Cloud services, arbitrary JavaScript, AI/OCR, recording, SCORM, analytics
and a universal course builder are outside v1 scope.

For UI changes, test 1440/1024/390 px, keyboard controls and focus, and inspect real
screenshots. For player changes, test a real downloaded file with HTTP/HTTPS and
storage disabled. Never treat dev preview as proof of standalone export.

Describe the concrete problem, resulting behavior, validation and remaining limits
in pull requests. Keep dependency licenses compatible and actions pinned to SHAs.
Do not include personal screenshots, credentials, traces from unrelated sessions,
node_modules or temporary browser profiles. See SECURITY.md for vulnerabilities.
