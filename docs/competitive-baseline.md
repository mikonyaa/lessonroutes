# Bounded technical baseline — 2026-10-12

LessonRoutes does not claim to invent branching, hotspots, local authoring or
standalone exports. Its hypothesis is a shorter authoring path for a small exercise
directly from screenshots: ordered batch import, explicit action/destination links,
and an independent player. This release establishes technical feasibility; no
teacher study or speed advantage has been measured.

## Primary sources checked

| Source | Observed baseline | Scope of this check |
| --- | --- | --- |
| [H5P Branching Scenario](https://h5p.org/branching-scenario) | Choices determine subsequent content, with multiple endings and feedback; image and Image Hotspots content types are supported. | Official feature page; no H5P hosting/account or full authoring pilot. |
| [Lumi](https://github.com/Lumieducation/Lumi) and [official product page](https://lumi.education/en/) | Desktop H5P editing and HTML/SCORM/H5P export are existing capabilities. | Repository commit 236912f8e3c07a6b5c7ece4930b98fec2b6d3f6a and published export description; desktop application not installed or benchmarked. |
| [Walkthrough-Creator](https://github.com/shangle/Walkthrough-Creator) | Screenshot upload, a hotspot per step, captions, preview and single HTML export. | Actual app.html at commit 874cd038f65baf3991dde979dae3a297f7ba65f9 exercised in isolated Chromium. |
| [Scormly](https://github.com/dmmat/Scormly) | Local browser course authoring includes images, branching dialogue and quizzes with feedback; SCORM/cmi5 packaging is documented. | README at commit da60742b99428ed0276b22f21857eb0e9c5051b9; no comparable screenshot exercise authored. |
| [Folge SCORM authoring](https://folge.me/scorm-authoring-tool) | Screenshot-based guides, offline desktop authoring and self-contained SCORM export are described. | Official page only; no installed product or paid-plan access. No claim is made about untested limitations. |

## Same requested scenario, closest executable baseline

Task: use the first three original workspace screenshots; place a private-access
correct choice and an incorrect public-access choice with explanatory feedback and
retry on the first screen; continue through invitations and notifications to finish.
The source images and intended choices were identical in the two attempts.

Walkthrough-Creator (Chromium 156.0.8078.4):

1. Opened the unmodified downloaded app.html in a fresh isolated context.
2. Selected screenshot 1 through its file input, placed its hotspot, and typed a caption.
3. Repeated file selection, hotspot placement and caption entry for screenshots 2 and 3.
4. Inspected the authored step records: id, image, caption, hotspot x/y. The file
   input had no multiple attribute; each upload added one screen.
5. Attempted to represent the first-screen incorrect branch. The exposed model
   offered a single hotspot and linear continuation, with no authored destination
   or per-choice feedback controls. That requested part could not be completed.
6. Exported the achievable three-step linear subset using the actual Export button.
   Opening that file with HTTP/HTTPS blocked attempted two external resource requests.
   This observation is not a broad assessment of every version or export capability.

LessonRoutes:

1. Selected the three screenshots as one batch, preserving order.
2. Named/instructed/described each screen; created the two first-screen rectangles
   and labeled each choice; set the public choice's explanation and self-target retry.
3. Connected the private choice to invitations, invitations to notifications, and
   notifications to a finish; added completion text.
4. Validated and used Preview; downloaded an editable project and standalone HTML.
5. Closed the author context and completed the exported file by mouse and keyboard
   at desktop/mobile sizes, with storage and HTTP/HTTPS disabled. No requests occurred.

The baseline could not express the entire assigned branching scenario in this
snapshot. Therefore there is **no valid identical-task completion-time ratio**.
The author is also the implementation maintainer, not an independent teacher
participant. No subjective usability conclusion or testimonial follows from this
attempt. Future research should use an equally expressive baseline, independent
teachers and recorded completion criteria.

Competitor code was only read/run in an ignored research directory; none is copied
into LessonRoutes, its package, demo or examples. Raw local evidence is summarized
in [baseline-results.json](evidence/baseline-results.json).
