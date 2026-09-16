# Real photo sources

Reviewed 2026-09-16 with an image-capable model. This page records which demo images use real photos, why the others were kept or reverted after a visual check, and where every source file lives.

## In use on the site

| Page image | Source photo | Source page | Notes |
| --- | --- | --- | --- |
| Events — A board-game evening (`assets/event-board-games.webp`) | "How to host a game night" article hero, 1600 × 1200 | [gaminglib.com](https://www.gaminglib.com/blogs/news/how-to-host-game-night) | Four friends laughing over a card game in a game shop. Verified as a genuine match for the event. |
| Experiences — Finding my first familiar faces (`assets/story-familiar-faces.webp`) | `images.jpeg`, 739 × 415, supplied by the team | team-supplied file | Students walking and talking on a campus path; matches the story line about recognising familiar faces on campus. |

Both were converted to 800 × 533 RGB WebP (center-crop to 3:2, Lanczos, quality 86–88, method 6), matching the site's image pipeline. No other edits were applied.

## Evaluated and reverted

Three earlier replacements were reverted to their AI-generated originals after the visual review, because the real photos did not match the content well:

- **Coffee & first hellos** — the team photo was a large outdoor celebration group shot, while the event describes a small café gathering for first introductions. The AI original (four students talking over coffee in a Paris café) matches far better.
- **A quiet hour, with a tea break** — the only real tea photos available were product shots and a luxury high-tea advertising scene with a gloved waiter; the event is a quiet study hour with a simple tea break. The AI original (students working around a table with mugs) matches far better.
- **Joining a game without knowing the rules** — the real candidate showed game components with no people, while the story is about joining a group and learning the rules. The AI original (hands and a player pointing at the board) carries the story better.

## Collected, not yet used

Kept in `~/AIRE_Study/tmp/real-photos/` (outside the repository) with `_sources.json` manifests listing every original URL:

- `1-game-night-gaminglib/` — further board-game article images and in-store event photos (lower resolution).
- `2-karaoke-karafunbar/` — 56 real photos of a Paris karaoke bar, collected for a possible "karaoke night" event that has no page yet.
- `3-tea-tielka/` — tea product photography and the high-tea scene; no modest "cup of tea" scene exists in the set.
- `4-apple-pie-lecoupdegrace/` — apple pie and other recipe photos, collected for a possible apple pie tasting event that has no page yet.
- `International-student-2025.jpg` (team-supplied, 2048 × 1365) — a large joyful group photo of international students. No current event or story page matches it: the two closest slots (Coffee & first hellos, A November catch-up) already have AI images that fit their scenes more precisely. Recommended for a future community or events page header.

## Rights note

The gaminglib photo is a third-party editorial/marketing image. If the site keeps using it long-term, permission should be obtained from the source or the image replaced with the community's own photography.
