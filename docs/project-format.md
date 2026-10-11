# Editable project v1

The editable file has kind `lessonroutes-project`, schemaVersion `1`, projectId,
revision, metadata, startNodeId, orderedNodeIds, assets and nodes. Arrays contain
assets and nodes; orderedNodeIds includes each node ID exactly once. Metadata has
title, description, locale and optional credits. All IDs are stable ASCII identifiers.
There are no generated local paths, machine names or user account names.

Assets have id, displayName, actual MIME, oriented pixelWidth/pixelHeight, SHA-256
of original bytes and canonical base64. Asset names are labels, never keys. Hashes
deduplicate identical bytes during screenshot import. Original static raster bytes
are kept, including any EXIF/ancillary metadata. Browser decoding verifies the
bounded header reader's dimensions. EXIF orientations 5–8 swap dimensions.

Screens contain id, kind `screen`, assetId, title, instruction, imageDescription
and actions. Actions have stable id, label, rect `{x,y,width,height}`, nullable
targetNodeId, outcome `correct|incorrect|neutral`, feedback and contiguous integer
order. Coordinates are finite normalized image values; x/y ≥ 0, sizes > 0 and
x+width/y+height ≤ 1. Finish nodes have id, kind `finish`, title and completionText,
and cannot carry outgoing actions.

Structural validation and graph readiness are separate. startNodeId and action
targets can be null in a draft. A syntactically valid missing target/start remains
editable with a graph issue; an absent image reference is invalid input. The importer
checks the whole structure, field allowlists, versions, ID uniqueness, string/image
limits, base64, MIME, dimensions, animation, hashes and sequential browser decoding
before opening it atomically. Unsupported versions and unknown fields are explicit
errors. Import never partly merges into the current project.

Save preserves the graph, IDs, strings, image bytes and geometry. Revision is a
nonnegative safe integer. Browser commits increment it within the same readwrite
transaction as assets and the current project pointer, comparing the stored revision
to the expected one. Browser asset keys are scoped to projectId, so opening another
project with the same asset ID cannot mutate an existing project's bytes. Completed
transactions are the commit boundary, not individual request success. Manual JSON
backups remain necessary.

The student payload has kind `lessonroutes-lesson` and schemaVersion `1`. Export
contains only reachable nodes, required assets (id, MIME, dimensions, base64),
author-supplied metadata and the project's own runtime. It omits projectId, revision,
filenames, SHA fields, drafts, undo history, storage data and source artwork HTML.
It renders all strings using textContent. Embedded JSON escapes `<` and Unicode
separators. Titles are HTML escaped. Image data comes from revalidated bytes.

The CSP permits only the exact hashed inline IIFE, inline styles needed for geometry,
and data images. Connections, external scripts/fonts, objects, frames, base URLs
and forms are prohibited. The runtime does not use eval, Function, dynamic imports,
fetch or persistent storage. It runs a pure transition machine with showingNode,
showingFeedback and finished states and an in-memory log capped at 2,000 transitions
for local verification (CustomEvent + DOM dataset, never transmitted).
