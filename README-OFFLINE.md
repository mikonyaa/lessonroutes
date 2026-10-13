# LessonRoutes offline editor

Turn screenshots into small branching practice lessons.

This archive contains the complete editor in `app/`, original examples, licenses,
and a dependency-free loopback server. No `npm install`, source workspace, or
`node_modules` is needed. Install Node.js 24 LTS first; downloading Node requires
a connection, using this extracted editor does not.

From this extracted folder:

```sh
node serve.mjs --port 0
```

Open the printed `http://127.0.0.1:…/` URL. Keep this terminal open while authoring.
Press Ctrl+C in this terminal to stop only this server. The default address is
loopback, not LAN. An occupied explicit port prints an error; it does not kill
the process using that port. Choose `--port 0` to allocate a free port.

Use Open example or add PNG/JPEG/WebP screenshots. Name each step, describe the
image, add actions and choose destinations. Add a finish. Validate and Preview.
Download project saves the editable `.project.json` backup. Export lesson creates
one `lesson.html` for learners.

The learner HTML opens directly through `file://`, without Node, the editor,
storage, or a connection. Keep that file separate from your editable project.
Restart resets its in-memory session. No score or analytics are recorded.

Browser autosave is a convenience, not a backup. It is per browser/origin and can
be evicted or unavailable. A port allocated by `--port 0` may change next time;
download a project backup before stopping. Use a fixed available port if you
want the same storage origin. Save conflicts and quota errors remain visible.

Saved means the current authoring session's displayed snapshot has completed its
atomic browser save. Edits made during a save remain pending until committed.
Replacing a lesson retires its pending saves, so late callbacks cannot select it
as the current recovery project. Replaced sessions' uncommitted edits still need
a downloaded project backup. Existing committed projects are retained.

At startup, editing and imports wait for the recovery decision. A storage open or
read timeout enables work in memory and reports the error. Download project keeps
the current draft even when saving fails. Save a new copy uses a new project ID;
it does not overwrite a conflicting revision.

Action order is defined by each action's order field. Deleting preserves the
relative order of the remaining actions; Undo/Redo preserve that meaning through
the editable backup, preview and exported learner file.

BUILD.json records the local ZIP's source commit, dirty state and Node version.

Limits: 50 images, 10 MiB each, 50 MiB total; 24 megapixels, 12,000 pixels per
side; 200 nodes, 30 actions per screen, 80 MiB project JSON. Static PNG/JPEG/WebP
only. Animated PNG/WebP, GIF, SVG and remote images are rejected.

Keyboard: all controls work with Tab/Enter/Space. Add action creates a rectangle
without dragging. Select a region and use arrows to move, Alt+arrows to resize,
Shift for larger changes, or edit Left/Top/Width/Height percentages. Undo/Redo
buttons and Ctrl/Cmd+Z are available. The player always provides equivalent
text actions below its screenshot.

Every reachable screen needs an instruction, image description, labeled actions
and destinations. Incorrect choices need feedback. Rectangles must have positive
area and must not overlap. Shared right/bottom borders belong to the region
starting at that border. Retry loops are allowed when every reachable node has
some path to a finish. Unreachable drafts are excluded from learner exports.

Screenshots and their original raster metadata may contain private data. Review
and redact them yourself before import/sharing; LessonRoutes does not remove
EXIF or automatically anonymize images. Example screens contain only fictional
data and original artwork.

See LICENSE, THIRD-PARTY-NOTICES.txt, and examples/LICENSE. Development and
verification instructions are in the source repository README.
