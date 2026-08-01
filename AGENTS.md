# AGENTS.md

## Cursor Cloud specific instructions

This repository is **documentation-only**. It contains career-migration/job guides
(`docs/*.md`) and an application-template pack (`docs/templates/boku-wmee-application/`,
including printable `.html` CV/cover templates). There is **no application code, package
manager, build system, automated tests, or lint config**, so there is nothing to install,
build, lint, or unit-test.

### Previewing the content (the closest thing to a "dev server")

- Serve the repo statically from the root and open files in a browser:
  `python3 -m http.server 8080` (run from `/workspace`).
- Rendered HTML template example:
  `http://localhost:8080/docs/templates/boku-wmee-application/06-one-page-cv-for-email.html`
- Markdown guides are served as raw text over `http.server` (no Markdown rendering); use an
  editor's Markdown preview if rendered output is needed.

### Producing a PDF from an HTML template (core user workflow)

- The intended workflow is: open an `.html` template in a browser → Print → Save as PDF.
- Headless rendering that works in this environment (Chrome's *old* `--headless` hangs here;
  use `--headless=new` with a `timeout`, since Chrome may not self-exit after writing):
  `timeout 120 google-chrome --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --user-data-dir=/tmp/chrome-prof --no-pdf-header-footer --print-to-pdf=/tmp/out.pdf "http://localhost:8080/docs/templates/boku-wmee-application/06-one-page-cv-for-email.html"`
- The `Failed to connect to the bus` / DBus errors from Chrome are harmless in this VM.

### Editing conventions

- Templates use bracketed placeholders (e.g. `[YOUR FULL NAME]`, `[YOUR EMAIL]`) that a user
  fills in before use.
- `.gitignore` excludes `docs/boku-application-private/` for filled-in private documents —
  do not commit personal/identifying application materials.
