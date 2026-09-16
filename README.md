# PIE UPC

A small community website for **Paris International Exchange**, an international student community in Paris.

The homepage keeps the original Paris hero, adds a **Find your PIE** preview and a scroll guide to three parallel gateways: Members, Events and Experiences. Each opens a separate page. The extension prioritizes desktop, with a stacked layout on smaller screens.

## Content and interaction

- Members: twenty-six profiles, including four supplied real team profiles: Sparlay Khan, Zixuan Gui, Tamara Matijević and Alessio SATURNINO. All four retain their supplied clickable email contacts. Tamara's profile lists Serbia, English/French/Serbian, neuroscience and molecular biology. Alessio's profile lists Italy, Italian/English/French/Spanish, molecular biology, cancer epigenetics and his supplied sports, nature, poetry and music interests. Tamara and Alessio use the general Community member label and Active status. Twenty-two fictional profiles are marked Demo, with AI-generated portraits and Active/Alumni example status. Several countries recur at different frequencies, with varied interests and roles within each group; this is an illustrative community, not PIE demographic data. Example emails use `example.com` and are display-only placeholders.
- Events: twelve fictional activities from September through November 2026. The original six are retained, followed by study time, a photo walk, a second language café, a park run or walk, a small-item swap and a community check-in. Familiar recurring activities sit alongside occasional outings. Each has its own image, date, time, setting and practical participation details. The date sits in a small frosted-glass badge over each photo; phones place the media above the text.
- Experiences: twelve fictional first-person stories, with the original six retained. Additional topics include photography, finding a place in multilingual conversations, studying together, quiet weekends, volunteer handovers and making affordable plans. Each author has a corresponding fictional member profile. Wide article rows pair photos with titles, bylines and summaries, plus native expand/collapse controls. Phones show the photo as the top of the same story card.
- Each activity and story has its own image; no image is shared between the Events and Experiences pages.
- All invented content is visibly labeled as demo content. The four supplied real profiles have working email links; demo addresses remain display-only, and no example event has a real registration action.
- The three homepage gateways reveal on scroll. Content stays visible without JavaScript, and reduced-motion preferences disable the decorative movement.
- Find your PIE (preview): one box under the homepage hero. Visitors describe their background and goals in a single sentence and receive one member, event and story suggestion from the demo directory. Interests and languages are inferred from the sentence itself; interim matching runs in the browser with keyword overlap (Chinese input is mapped to matching terms), and entries keep their Demo/Example labels and link to page anchors. An AI-backed match is planned. Nothing is sent anywhere and no input is stored.

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
| `main.js` | Progressive scroll reveal for the homepage gateways and the Find your PIE preview matching |
| `assets/paris-editorial.webp` | Paris hero artwork |
| `assets/member-*.webp` | Twenty-two fictional member portraits |
| `assets/member-*.jpeg` | Supplied photographs for real member profiles |
| `assets/event-*.webp`, `assets/story-*.webp` | Supporting scenes for activities and stories |
| `docs/member-image-prompts.md`, `docs/scene-image-prompts.md` | Image prompts, saved paths and generation provenance |
| `docs/expanded-*-image-prompts.md` | Prompts and provenance for the expanded demo content |
| `docs/doubled-*-image-prompts.md` | Prompts and provenance for the second content expansion |
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
- Tamara Matijević's photograph (`image4 (6).jpeg`), Serbian nationality, English/French/Serbian languages, email contact and interests in neuroscience and molecular biology were supplied by the project team. No employer, professional qualification or joined year is inferred from earlier unverified research.
- Alessio SATURNINO's photograph (`image3 (7).jpeg`), Italian nationality, Italian/English/French/Spanish languages, molecular biologist description, email contact and interests in cancer epigenetics, running/Strava, nature, poetry, gym, basketball, volleyball and party music were supplied by the project team. His institutional affiliation and joined year have not been supplied and are not inferred. Both new portraits are unchanged copies of the supplied JPEGs; Tamara's visible avatar is positioned with CSS to keep her face in frame.
- The twenty-two Demo portraits and subpage scene images are AI-generated examples, as labeled on each page. They do not depict actual PIE members or events. Original generation records are in [member image prompts](docs/member-image-prompts.md) and [scene image prompts](docs/scene-image-prompts.md); the first additions are documented in [expanded member images](docs/expanded-member-image-prompts.md), [expanded event images](docs/expanded-event-image-prompts.md) and [expanded story images](docs/expanded-story-image-prompts.md). The second expansion is recorded in [additional member images](docs/doubled-member-image-prompts.md), [additional event images](docs/doubled-event-image-prompts.md) and [additional story images](docs/doubled-story-image-prompts.md).

This repository is the working source for the website.
