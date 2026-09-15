# PIE UPC

A minimal homepage for **Paris International Exchange**, an international student community in Paris.

The homepage presents the association name, “Welcome to the PIE WORLD.”, its international student audience and a Paris visual. It is designed for desktop and mobile.

## Development

This is a static website. No dependencies or build step are required.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

| File | Purpose |
| --- | --- |
| `index.html` | Homepage content and metadata |
| `style.css` | Typography, layout and responsive styles |
| `assets/paris-editorial.webp` | Paris hero artwork |
| `.github/workflows/pages.yml` | Automatic GitHub Pages deployment |

## Deployment

The GitHub Actions workflow publishes the homepage to GitHub Pages after each push to `main`. It can also be run manually from the Actions tab. Only the homepage, stylesheet and artwork are included in the deployment artifact.

Use relative URLs for local assets so the site works under the repository's `/PIE_UPC/` path.

## Design and sources

- The association name was checked against [PIE's Instagram profile](https://www.instagram.com/pie_upc/) on 15 September 2026.
- Typography uses Instrument Serif and DM Sans through Google Fonts, with fallback fonts.
- The Paris artwork was generated for this homepage. It is not a documentary photograph of a PIE event.

This repository is the working source for the homepage.
