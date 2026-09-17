# Real photo sources

Reviewed 2026-09-16 with an image-capable model. This page records which demo images use real photos, why the others were kept or reverted after a visual check, and where every source file lives.

## In use on the site

| Page image | Source photo | Source page | Notes |
| --- | --- | --- | --- |
| Experiences — Finding my first familiar faces (`assets/story-familiar-faces.webp`) | `images.jpeg`, 739 × 415, supplied by the team | team-supplied file | Students walking and talking on a campus path; matches the story line about recognising familiar faces on campus. |
| Experiences — Paris, one small routine at a time (`assets/story-paris-routine.webp`) | Burst photo `paris-streets`, 1600 × 2400 | [burst.shopify.com](https://burst.shopify.com/photos/paris-streets) | A quiet Paris street with small shops and people walking — the everyday route the story describes. |
| Experiences — A study session, one small question (`assets/story-study-question.webp`) | Burst photo `student-team-meeting-at-table`, 1600 × 1067 | [burst.shopify.com](https://burst.shopify.com/photos/student-team-meeting-at-table) | Students working through textbooks and notes together around one table. |
| Experiences — Making room for a quiet weekend (`assets/story-quiet-weekend.webp`) | Burst photo `person-reads-a-book-sitting-in-a-window-alcove`, 1600 × 1067 | [burst.shopify.com](https://burst.shopify.com/photos/person-reads-a-book-sitting-in-a-window-alcove) | Someone reading quietly by a window, matching the story's unhurried weekend. |
| Experiences — Making a plan people could actually join (`assets/story-making-a-plan.webp`) | Burst photo `hands-hold-and-write-in-a-yellow-notebook`, 1600 × 2222 | [burst.shopify.com](https://burst.shopify.com/photos/hands-hold-and-write-in-a-yellow-notebook) | Hands, notebooks and a pen while comparing possible plans. |

All were converted to 800 × 533 RGB WebP (crop to 3:2 with a per-image framing offset, Lanczos, quality 86–88, method 6), matching the site's image pipeline. The four Burst photos are used under the [Burst free stock photo licence](https://burst.shopify.com/licences) (free for commercial and non-commercial use, no attribution required). Originals are kept in `/tmp/stock-dl/` for this session; re-download any file from its Burst page if needed.

## Evaluated and reverted

Three earlier replacements were reverted to their AI-generated originals after the visual review, because the real photos did not match the content well:

- **Coffee & first hellos** — the team photo was a large outdoor celebration group shot, while the event describes a small café gathering for first introductions. The AI original (four students talking over coffee in a Paris café) matches far better.
- **A quiet hour, with a tea break** — the only real tea photos available were product shots and a luxury high-tea advertising scene with a gloved waiter; the event is a quiet study hour with a simple tea break. The AI original (students working around a table with mugs) matches far better.
- **Joining a game without knowing the rules** — the real candidate showed game components with no people, while the story is about joining a group and learning the rules. The AI original (hands and a player pointing at the board) carries the story better.

## Sources that could not be used

An attempt to source further photos from large free stock libraries was limited by automated blocking from this machine: Unsplash (bot protection on both its site and internal JSON API), Pexels (Cloudflare 403, though its image CDN answers direct requests), Pixabay and Kaboompics (403), StockSnap (site 403; its CDN works only with a referer header). Openverse works without a key but its CC0 stock sources (StockSnap, Rawpixel) have thin coverage, and Wikimedia Commons' modern Paris photos are CC BY-SA, which would require visible attribution.

Remaining AI images on the two pages were kept because the candidates found were either lower quality or a weaker content match than the existing illustration. A future pass with a free Unsplash or Pexels API key would allow a much larger, better-matched set.

## Collected, not yet used

Kept in `~/AIRE_Study/tmp/real-photos/` (outside the repository) with `_sources.json` manifests listing every original URL:

- `1-game-night-gaminglib/` — further board-game article images and in-store event photos (lower resolution).
- `2-karaoke-karafunbar/` — 56 real photos of a Paris karaoke bar, collected for a possible "karaoke night" event that has no page yet.
- `3-tea-tielka/` — tea product photography and the high-tea scene; no modest "cup of tea" scene exists in the set.
- `4-apple-pie-lecoupdegrace/` — apple pie and other recipe photos, collected for a possible apple pie tasting event that has no page yet.
- `International-student-2025.jpg` (team-supplied, 2048 × 1365) — a large joyful group photo of international students. No current event or story page matches it: the two closest slots (Coffee & first hellos, A November catch-up) already have AI images that fit their scenes more precisely. Recommended for a future community or events page header.

## Rights note

The gaminglib photo is a third-party editorial/marketing image. If the site keeps using it long-term, permission should be obtained from the source or the image replaced with the community's own photography. The Burst photos carry a free-use licence with no attribution requirement.

## Event announcement photos (2026-09-17)

The twelve demo events were replaced by three real announcements from the team. Their images come from [Burst](https://burst.shopify.com) (free for commercial and non-commercial use, no attribution required) and were converted to 800 × 533 WebP (centre crop to 3:2, Lanczos, quality 86, method 6):

| Page image | Burst photo |
| --- | --- |
| Events — Monthly meeting (`assets/event-monthly-meeting.webp`) | `thoughtful-students-talk` |
| Events — Karaoke night (`assets/event-karaoke-night.webp`) | `handheld-microphone` |
| Events — PIE Degustation (`assets/event-pie-degustation.webp`) | `plated-and-sliced-apple-pie` |

`assets/event-board-games.webp` (the gaminglib photo) is no longer used on any page; it is kept as a spare in case a game-night event is added later.
