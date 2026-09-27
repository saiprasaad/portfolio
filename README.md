# saiprasaad.com

Saiprasaad Kalyanaraman's portfolio, built as a small operating system called SaiOS:

- **Desktop** (wide screens): a macOS-style desktop with a menu bar, Dock, widgets and windows.
  Files holds the portfolio (icon, list and gallery views, project previews, tags), plus Terminal,
  Folio (an AI assistant that answers questions about the portfolio), Mail, Resume and Timeline.
- **Phone**: an iOS-style home screen whose apps show the same content.
- **Simple page**: everything on one fast, printable page (View → Simple Page, or `#simple`).
  It is also prerendered into `index.html`, so crawlers, link previews and visitors without
  JavaScript get the full content.

No framework and no build step: plain HTML, CSS and ES modules served by GitHub Pages.

## Editing the content

Everything the site says lives in [`js/content.js`](js/content.js): profile, experience,
education, skills, projects, awards and certifications. The desktop, phone layout, Search,
Terminal, Folio and the simple page all read from it, so a change there shows up everywhere.

- Add a project to `projects`. Each one has:
  - `tagline`: one line, shown on cards and in search.
  - `summary`: the overview paragraph.
  - `flow`: the steps of how it works, in order.
  - `features`: `{ title, text }` pairs.
  - `facts` (optional): a few `{ value, label }` numbers, like `{ value: '5', label: 'repositories tracked' }`.
  - `status` (optional): for example `Live · updated April 2026`.
  - `cover.type`: picks an illustration from `js/lib/covers.js`.
  - `media` (optional): real images. Put the PNG in `images/projects/src/`, run
    `npm run assets -- projects`, and add `{ src, alt, width, height, caption }` pointing at the `.webp`.
    Give app screenshots `type: 'screenshot'` so the section is titled Screenshots (other images show as
    Output). A `type: 'video'` item with a `poster` and a `title` leads the page instead.
- To show a company logo in Experience, put the image in `images/logos/src/` (for example `ey.jpg`),
  run `npm run assets -- logos`, and set that role's `logo` to `images/logos/ey.webp`. Roles without a
  logo show their initials.
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
| `npm run assets` | Regenerates the resized photos, project images, company logos and favicons from their sources. Pass `photos`, `projects`, `logos` or `favicons` (for example `npm run assets -- logos`) to regenerate one group. |

## Deploying

Pushing to `main` runs the smoke test and, if it passes, deploys to GitHub Pages
(`.github/workflows/static.yml`). Pull requests run the test only.

## Folio

Folio sends `{ message, context }` to the backend at `site.folioEndpoint` and expects
`{ reply }`. `context` is the portfolio as text plus the recent conversation, so follow-up
questions work. If the service can't be reached, Folio answers from `content.js` and says so.
