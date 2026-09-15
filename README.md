# PIE UPC

A small community website for **Paris International Exchange**, an international student community in Paris.

The homepage keeps the original Paris hero and adds a scroll guide to three parallel gateways: Members, Events and Experiences. Each opens a separate page. The extension prioritizes desktop, with a stacked layout on smaller screens.

## Content and interaction

- Members: six fictional profiles with roles, languages and interests.
- Events: three fictional activities with dates and locations.
- Experiences: three fictional stories with native expand/collapse controls.
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
| `.github/workflows/pages.yml` | Automatic GitHub Pages deployment |

## Deployment

The GitHub Actions workflow publishes all four pages, the stylesheets, script and artwork to GitHub Pages after each push to `main`. It can also be run manually from the Actions tab.

Use relative URLs for local assets so the site works under the repository's `/PIE_UPC/` path.

## Design and sources

- The association name was checked against [PIE's Instagram profile](https://www.instagram.com/pie_upc/) on 15 September 2026.
- Typography uses Instrument Serif and DM Sans through Google Fonts, with fallback fonts.
- The Paris artwork was generated for this homepage. It is not a documentary photograph of a PIE event.

This repository is the working source for the website.
