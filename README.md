# PIE UPC

A small community website for **Paris International Exchange**, an international student community in Paris.

The homepage keeps the original Paris hero and adds a scroll guide to three parallel gateways: Members, Events and Experiences. Each opens a separate page. The extension prioritizes desktop, with a stacked layout on smaller screens.

## Content and interaction

- Members: twelve profiles, including Sparlay Khan and Zixuan Gui with supplied photographs and clickable email contacts. Sparlay is shown as Manager · Pakistan, Active, with joined year 2025 and interests in environmental studies, exploring nature, and travelling. Zixuan is shown as Volunteer · China, Active: a sports enthusiast and ski instructor with a computer science background and Chinese/English, Ski, and Coding tags. Ten additional fictional profiles are marked Demo, with AI-generated portraits and Active/Alumni example status. Example emails use `example.com` and are display-only placeholders.
- Events: six fictional activities in September and October 2026, covering coffee, a riverside walk, language exchange, board games, a sketch walk and a shared student dinner. Each has its own image, date, time, setting and practical participation details. The date sits in a small frosted-glass badge over each photo; phones place the media above the text.
- Experiences: six fictional first-person stories about settling in, daily routines, volunteering, shared kitchens, joining a game and staying connected after leaving Paris. Each author has a corresponding fictional member profile. Wide article rows pair photos with titles, bylines and summaries, plus native expand/collapse controls. Phones show the photo as the top of the same story card.
- Each activity and story has its own image; no image is shared between the Events and Experiences pages.
- All invented content is visibly labeled as demo content. Only the two supplied real profiles have working email links; demo addresses remain display-only, and no example event has a real registration action.
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
| `assets/member-*.webp` | Ten fictional member portraits |
| `assets/member-*.jpeg` | Supplied photographs for real member profiles |
| `assets/event-*.webp`, `assets/story-*.webp` | Supporting scenes for activities and stories |
| `docs/member-image-prompts.md`, `docs/scene-image-prompts.md` | Image prompts, saved paths and generation provenance |
| `docs/expanded-*-image-prompts.md` | Prompts and provenance for the expanded demo content |
| `docs/demo-content-guidelines.md` | Plausibility and consistency rules for demo profiles, events and stories |
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
- Sparlay Khan's photograph, profile information and email contact were supplied by the project team. Her Manager role and Active status use the wording requested by the project team. Her languages have not been supplied and are not inferred.
- Zixuan Gui's photograph, Volunteer role, Active status, nationality, interests, languages, computer science background and email contact were supplied by him. No joined year has been added for his profile.
- The ten Demo portraits and subpage scene images are AI-generated examples, as labeled on each page. They do not depict actual PIE members or events. Original generation records are in [member image prompts](docs/member-image-prompts.md) and [scene image prompts](docs/scene-image-prompts.md); additions are documented in [expanded member images](docs/expanded-member-image-prompts.md), [expanded event images](docs/expanded-event-image-prompts.md) and [expanded story images](docs/expanded-story-image-prompts.md).

This repository is the working source for the website.
