# PIE UPC

A small community website for **Paris International Exchange**, an international student community in Paris.

The homepage keeps the original Paris hero and adds a scroll guide to three parallel gateways: Members, Events and Experiences. Each opens a separate page. The extension prioritizes desktop, with a stacked layout on smaller screens.

## Content and interaction

- Members: Sparlay Khan's community member profile uses her supplied photograph, Pakistan, joined year 2025, interests in environmental studies, exploring nature, and travelling, and a clickable email contact. Six additional fictional profiles are marked Demo, with AI-generated portraits and Active/Alumni example status. Example emails use `example.com` and are display-only placeholders.
- Events: three fictional activities with dates, locations and landscape scenes. The date sits in a solid badge over each photo, paired with the activity description; phones place the media above the text.
- Experiences: three fictional stories presented as wide article rows with photos alongside grouped titles, bylines and summaries, plus native expand/collapse controls. Phones show the photo as the top of the same story card.
- Each activity and story has its own image; no image is shared between the Events and Experiences pages.
- All invented content is visibly labeled as demo content; there are no real contact or registration actions.
- The three homepage gateways reveal on scroll. Content stays visible without JavaScript, and reduced-motion preferences disable the decorative movement.

## Development

This is a static website. No dependencies or build step are required.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

| File | Purpose |
| --- | --- |
| `index.html` | Homepage content and metadata |
| `members.html`, `events.html`, `experiences.html` | Community destination pages |
| `style.css` | Original hero typography and responsive layout |
| `community.css` | Community sections, destination pages and interaction styles |
| `main.js` | Progressive scroll reveal for the homepage gateways |
| `assets/paris-editorial.webp` | Paris hero artwork |
| `assets/member-*.webp` | Six fictional member portraits |
| `assets/event-*.webp`, `assets/story-*.webp` | Supporting scenes for activities and stories |
| `docs/member-image-prompts.md`, `docs/scene-image-prompts.md` | Image prompts, saved paths and generation provenance |
| `scripts/version_assets.py` | Adds content-based CSS/JS version URLs to staged pages |
| `.github/workflows/pages.yml` | Automatic GitHub Pages deployment |

## Deployment

The GitHub Actions workflow publishes all four pages, the stylesheets, script and artwork to GitHub Pages after each push to `main`. It can also be run manually from the Actions tab.

Before publishing, `scripts/version_assets.py` adds a content hash to each local stylesheet and script URL (for example, `community.css?v=...`). Updates and rollbacks therefore request the matching assets instead of reusing a browser's cached version. This only changes staged HTML in `_site`; source pages and the website layout stay unchanged.

Use relative URLs for local assets so the site works under the repository's `/PIE_UPC/` path.

## Design and sources

- The association name was checked against [PIE's Instagram profile](https://www.instagram.com/pie_upc/) on 15 September 2026.
- Typography uses Instrument Serif and DM Sans through Google Fonts, with fallback fonts.
- The Paris artwork was generated for this homepage. It is not a documentary photograph of a PIE event.
- Sparlay Khan's photograph, profile information and email contact were supplied by the project team. Her languages and PIE Active/Alumni status have not been supplied and are not inferred.
- The six Demo portraits and subpage scene images are AI-generated examples, as labeled on each page. They do not depict actual PIE members or events. Generation prompts and file details are in [member image prompts](docs/member-image-prompts.md) and [scene image prompts](docs/scene-image-prompts.md).

This repository is the working source for the website.
