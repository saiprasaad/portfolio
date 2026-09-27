# saiprasaad.com

Saiprasaad Kalyanaraman's portfolio, built as a small operating system called SaiOS:

- **Desktop** (wide screens): a macOS-style desktop with a menu bar, Dock, widgets and windows.
  Finder holds the portfolio (icon, list and gallery views, Quick Look, tags), plus Terminal,
  Folio (an AI assistant with a job-description Fit Check), Mail, Resume and Time Machine.
- **Phone**: an iOS-style home screen whose apps show the same content.
- **Simple page**: everything on one fast, printable page (View → Simple Page, or `#simple`).
  It is also prerendered into `index.html`, so crawlers, link previews and visitors without
  JavaScript get the full content.

No framework and no build step: plain HTML, CSS and ES modules served by GitHub Pages.

## Editing the content

Everything the site says lives in [`js/content.js`](js/content.js): profile, experience,
education, skills, projects, awards and certifications. The desktop, phone layout, Spotlight,
Terminal, Folio and the simple page all read from it, so a change there shows up everywhere.

- Add a project to `projects`. `cover.type` picks an illustration from `js/lib/covers.js`;
  put real screenshots in `media`.
- Add a `url` to a certification to show a Verify link.
- Years of experience are computed from the role dates, so the About text stays current.

## Running locally

```sh
npm install          # Playwright, for tests and asset scripts
npm start            # http://localhost:8080
npm test             # end-to-end smoke test in headless Chromium
```

`npx playwright install chromium` downloads the browser the tests use.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run prerender` | Writes the simple page and JSON-LD profile into `index.html`. CI runs it before every deploy. |
| `npm run assets` | Regenerates the resized photos, project images, ASCII portrait and favicons from their sources. |

## Deploying

Pushing to `main` runs the smoke test and, if it passes, deploys to GitHub Pages
(`.github/workflows/static.yml`). Pull requests run the test only.

## Folio

Folio sends `{ message, context }` to the backend at `site.folioEndpoint` and expects
`{ reply }`. `context` is the portfolio as text plus the recent conversation, so follow-up
questions work. If the service can't be reached, Folio answers from `content.js` and says so.
The Fit Check's matching runs entirely in the browser.
