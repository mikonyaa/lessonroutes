# Changelog

## Unreleased — local authoring fixes

- Retire autosaves when New/Open/Save a new copy replaces the authoring session.
  A retired save cannot start a write or take the recovery pointer; an uncommitted
  transaction is aborted atomically. Late results cannot change the new status.
- Tie Saved and the revision to the current session's committed snapshot,
  including edits or undo while another snapshot is being saved.
- Keep editing, undo/redo, file inputs and drop handlers unavailable until startup
  recovery finishes. Bounded storage failures enable memory work and backup.
- Preserve logical action order when deleting or reordering a valid shuffled
  project. Canvas keyboard order, transitions, inspector and player agree.
- Close the native modal before restoring the trigger's keyboard focus.
- Give ordered action buttons an explicit zero tabindex so native WebKit on macOS
  includes them in Tab traversal without changing system keyboard preferences.
- Add native IndexedDB interleaving regressions, permutation model tests, strict
  saved-refresh consumer assertions, local ZIP provenance and stress measurements.

## 0.1.0 — 2026-10-12

Experimental first release. Local screenshot authoring with batch import,
normalized rectangular actions, labeled text equivalents, distinct error feedback,
retry branches and completion. Strict editable v1 JSON, atomic import, bounded
undo/redo, transactional IndexedDB autosave and revision conflict handling.

Shared preview/export runtime and a real single-file HTML player tested offline
through file URLs. Graph validation, overlap detection, CSP and safe text output.
Responsive editor, original five-screen example, real demo recording, offline
editor ZIP with loopback server, browser/consumer tests and pinned CI workflows.

No external teacher pilot, authoring-time benchmark, Safari claim, PWA, scoring,
SCORM, analytics or cloud features are included.
