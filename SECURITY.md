# Security

Version 0.1.x is experimental. Use the latest patch release when available.

Report vulnerabilities through this repository's GitHub Security tab if private
vulnerability reporting is available. Otherwise open a minimal public issue with
the affected version and a non-sensitive description; coordinate sensitive details
with the maintainer before posting an exploit. No private email address or response
SLA is promised.

Use a synthetic reproducer. Never attach tokens, private screenshots, browser
profiles or a real student project. For a reproducible import/player vulnerability,
include the browser/version, expected behavior and a minimal artificial file.

User content is text only. Input is bounded and strictly validated; images are
limited to static PNG/JPEG/WebP and export includes only reachable content. The
player uses safe DOM methods and a restrictive CSP; it is independent of storage
and the network. CSP does not replace input and DOM safety. Original screenshot
bytes may include personal data or metadata: the author is responsible for review
and redaction before sharing. Browser autosave is not a backup.
