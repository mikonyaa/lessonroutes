# Technical reference checks

Checked the current primary documentation before implementing these browser
features. Actual installed-browser checks are recorded separately in verification.md.

- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage):
  file-URL storage behavior is not a reliable portability contract. The player uses
  memory only and passes with storage access forced to throw.
- [MDN IndexedDB usage](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB):
  requests and transaction completion are different. Project revisions, assets and
  the current pointer are committed together; UI saved waits for oncomplete.
- [MDN image decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode):
  browser decoding is checked after bounded raster headers and size limits, with
  object URLs released after each image.
- [MDN SHA digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest):
  original byte hashes use SHA-256 in secure localhost/HTTPS editor contexts.
- [PNG specification](https://www.w3.org/TR/png-3/) and
  [WebP container specification](https://developers.google.com/speed/webp/docs/riff_container):
  the bounded reader recognizes PNG animation control/frame chunks and WebP
  animation flags/frame chunks. Real two-frame fixtures are rejected.
- [Vite static deployment](https://vite.dev/guide/static-deploy.html):
  relative build assets and hash navigation are used. The consumer ZIP is tested
  under an arbitrary subpath with spaces; Pages deploys the same verified app tree.
- [Node releases](https://nodejs.org/en/about/previous-releases): Node 24 is an LTS
  line at the verification date. Local checks use 24.21.0, independently downloaded
  for this workspace and checked against the official SHA-256 file.
- [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages):
  only the prepared app artifact is uploaded, with a dedicated environment and
  Pages/OIDC permissions in the deployment job.

Full action tag SHAs were checked using GitHub's git reference API. Version comments
record the associated major tags; setup-node v7 resolved to
949feb2413d6458794dcd2491c4babbbce0c15c1 when checked. Workflow installation and
browser binaries are verified again in clean CI; an action pin is not a substitute
for an actual successful push/main workflow at the release source commit.
