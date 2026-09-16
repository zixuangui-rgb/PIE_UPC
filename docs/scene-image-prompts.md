# Subpage scene image prompts

Prepared on 2026-09-16 for the Events and Experiences pages.

These are **AI-generated photographic illustrations**. People and scenes are fictional. They do not document actual PIE events, students, or volunteer work. The site should retain its example-content and AI-image disclosure.

## Generation and preparation

- Mode: built-in `image_gen.imagegen`; new-image generation, three independent calls with no reference images. No CLI fallback or external image API.
- All three new sources were generated at 1499 × 1049 pixels, copied into the workspace with full-frame proportional resizing, and encoded as 800 × 560 WebP (quality 82, method 6).
- Pillow performed only resizing and format encoding, with no semantic image editing or cropping. Source PNG files remain at the original paths.
- Three earlier generated WebP files were restored byte-for-byte from commit `f336934`; no image edits were made to these reused files.
- All six final files were visually inspected for scene fit, framing, obvious anatomy artifacts, and unwanted text or branding.

## Final assets

Paths are relative to the repository root `/Users/hell/AIRE_Study/PIE_UPC`.

| Asset | Dimensions | Bytes | Intended use |
|---|---|---:|---|
| `assets/event-coffee.webp` | 1000 × 750 | 88,568 | Coffee event only |
| `assets/event-seine-walk.webp` | 800 × 560 | 65,964 | Seine walk event |
| `assets/event-language-cafe.webp` | 800 × 560 | 45,714 | Language café event |
| `assets/story-familiar-faces.webp` | 1000 × 750 | 92,500 | First-familiar-faces story only |
| `assets/story-paris-routine.webp` | 1000 × 750 | 53,346 | Paris routine story |
| `assets/story-volunteering.webp` | 800 × 560 | 48,856 | Volunteering story |

## New images: exact prompts and sources

### event-seine-walk

- Source PNG: `/Users/hell/.codex/generated_images/01a0a93a-38b7-7b62-8347-9b98bc6dea67/exec-b879dabb-2b7d-47ee-ab6a-5f2ff7efc5bb.png`
- Final file: `assets/event-seine-walk.webp`

```text
Use case: photorealistic-natural
Asset type: small landscape photograph beside a fictional student community event on a website.
Primary request: A candid small group of four adult international students walking together along the Seine riverside in Paris, seen from the side and slightly behind. Comfortable casual clothes, relaxed conversation; broad riverside path, pale stone embankment, river and understated recognizable Paris bridges and facades.
Style: natural editorial photograph, believable anatomy and proportions, authentic unposed moment, subtle natural detail.
Composition: landscape 10:7 framing, medium wide view, visually readable as a small thumbnail, group and Paris river setting balanced, keep subjects away from extreme edges.
Lighting: soft daylight under light cloud.
Color palette: muted cream, slate blue, soft sage, warm stone; restrained contrast.
Constraints: all people visibly adults, no posing or looking at camera, no oversized landmark, no text, no logos, no watermarks, no oversaturation. The result is an AI illustrative scene, not a representation of a real PIE event.
```

### event-language-cafe

- Source PNG: `/Users/hell/.codex/generated_images/01a0a93a-38b7-7b62-8347-9b98bc6dea67/exec-d7cc434e-f39c-44c9-96e4-1b04412eb7cb.png`
- Final file: `assets/event-language-cafe.webp`

```text
Use case: photorealistic-natural
Asset type: small landscape photograph beside a fictional student language-exchange event on a website.
Primary request: Three adult international students at an informal shared table in a bright modest Paris community café, having a language conversation. One person listening with a gentle smile while another makes a small natural gesture; a few plain blank note cards and a ceramic cup on a light wooden table. A clean sage wall and tall window in the background.
Style: candid natural editorial photograph, believable hands and anatomy, not polished commercial stock photography.
Composition: landscape 10:7 framing, medium view across the table from a slight angle; uncluttered, strong readable subjects at thumbnail size; distinct from a group coffee portrait, with the shared blank cards as a quiet focus.
Lighting: soft window daylight.
Color palette: muted cream, slate blue, sage, warm wood.
Constraints: all people visibly adults; nobody posing together or looking into camera; no writing or lettering on note cards, no readable signs, no logos, no watermarks, no oversaturation. Fictional illustrative scene, not a real PIE event.
```

### story-volunteering

- Source PNG: `/Users/hell/.codex/generated_images/01a0a93a-38b7-7b62-8347-9b98bc6dea67/exec-46fcb51d-f0a7-4927-8fbf-10e7d5d86a35.png`
- Final file: `assets/story-volunteering.webp`

```text
Use case: photorealistic-natural
Asset type: small landscape photograph beside a fictional international student's story about volunteering.
Primary request: Two adult student volunteers preparing a simple community gathering in Paris. One carefully places plain ceramic cups on a shared light wooden table while the other adjusts a chair beside it. Quiet warm interaction, relaxed candid scene, modest welcoming room with tall window and a few simple chairs.
Style: natural editorial photograph, authentic everyday clothing, believable hands and anatomy, understated composition.
Composition: landscape 10:7 framing, medium wide view from a slight side angle, table and volunteers clearly readable as a small thumbnail, no clutter.
Lighting: soft natural daylight.
Color palette: muted cream, slate blue, soft sage and natural wood, restrained contrast.
Constraints: visibly adult students, nobody posing or looking at the camera, no text, no logos, no watermarks, no oversaturation. This is an AI-generated fictional illustrative scene, not a record of an actual PIE activity.
```

## Reused images: provenance

The following records are copied from `f336934:docs/image-prompts.md`. The historical asset paths in the source records are intentionally preserved.

- `f336934:assets/members-community.webp` is now `assets/story-familiar-faces.webp`.
- `f336934:assets/events-coffee.webp` is now `assets/event-coffee.webp`.
- `f336934:assets/experiences-paris.webp` is now `assets/story-paris-routine.webp`.
- Original generation date: 2026-09-16; built-in `image_gen.imagegen`, new images without references.
- Original source PNGs were 1448 × 1086 pixels, resized to 1000 × 750 WebP at quality 82, method 6.

### Earlier events-coffee record

- Generation mode: built-in tool, new image.
- Source PNG: `/Users/hell/.codex/generated_images/01a0a91b-70a8-73d1-aaa1-458f8d2fb8f4/exec-e2bc3635-7f18-4b42-b481-a9b07b04b2c6.png`
- Final web asset: `assets/events-coffee.webp`
- Original size: 1448 × 1086 px.

#### Exact prompt

```text
Use case: photorealistic-natural.
Asset type: landscape 4:3 photographic illustration for a Paris international student community website, no typography.
Art direction: natural candid editorial lifestyle photography, like a carefully photographed student journal. Adult students in their early twenties. Soft daylight, believable expressions, real skin texture, subtly worn materials, modest everyday clothing. Cohesive muted slate-blue, cream, sage and soft ochre palette. Slight natural grain, not exaggerated vintage.
Composition: central subjects safe for web cropping; readable at a small website card size.
Constraints: fictional illustrative scene, no real organization branding. No words, readable text, watermarks, logos, university signage. No camera-facing posed gaze, no hyperpolished corporate stock-photo look, no oversaturated sheen, no surreal elements. Natural correct anatomy and hands.
Scene: a lived-in small Paris café, warm soft daylight through a large window.
Subject: exactly four adult international students of varied backgrounds around a wooden café table at an informal coffee meetup; one speaking while the others listen or smile naturally. All people seated, no raised hands or toasting. Ceramic espresso cups and a plain carafe on the slightly worn wood, foreground cup and tabletop detail. Off-center candid composition but faces inside a central crop-safe area. Indoor setting must be clearly visible and distinct from an outdoor campus scene. Muted ochre, cream and slate blue, cozy yet airy, no readable café menus or lettering.
```

### Earlier experiences-paris record

- Generation mode: built-in tool, new image.
- Source PNG: `/Users/hell/.codex/generated_images/01a0a91b-70a8-73d1-aaa1-458f8d2fb8f4/exec-365ad97c-5a42-4f33-959c-105581ee0c12.png`
- Final web asset: `assets/experiences-paris.webp`
- Original size: 1448 × 1086 px.

#### Exact prompt

```text
Use case: photorealistic-natural.
Asset type: landscape 4:3 photographic illustration for a Paris international student community website, no typography.
Art direction: natural candid editorial lifestyle photography, like a carefully photographed student journal. Adult students in their early twenties. Soft daylight, believable expressions, real skin texture, subtly worn materials, modest everyday clothing. Cohesive muted slate-blue, cream, sage and soft ochre palette. Slight natural grain, not exaggerated vintage.
Composition: central subjects safe for web cropping; readable at a small website card size.
Constraints: fictional illustrative scene, no real organization branding. No words, readable text, watermarks, logos, university signage. No camera-facing posed gaze, no hyperpolished corporate stock-photo look, no oversaturated sheen, no surreal elements. Natural correct anatomy and hands.
Scene: an outdoor café table in Paris with a softly focused riverside and pale Paris façades in the distance.
Subject: one adult international student in their early twenties, seen from over their shoulder, quietly writing in a small open cream notebook beside a ceramic coffee cup. The person is secondary but visible, wearing a simple muted sage jacket. Close editorial composition focusing on the notebook, hand holding a pen naturally, cup and the lived-in city atmosphere. Notebook pages have only indistinct nonverbal pen marks, absolutely no readable text. Soft morning daylight, intimate everyday personal travel journal mood, matte surfaces and gentle depth of field. No Eiffel Tower necessary, no exaggerated tourist postcard appearance.
```

### Earlier members-community record


- Generation mode: built-in tool, new image.
- Source PNG: `/Users/hell/.codex/generated_images/01a0a91b-70a8-73d1-aaa1-458f8d2fb8f4/exec-943a98be-4bae-401a-a919-be8797377dfa.png`
- Final web asset: `assets/members-community.webp`
- Original size: 1448 × 1086 px.

#### Exact prompt

```text
Use case: photorealistic-natural.
Asset type: landscape 4:3 photographic illustration for a Paris international student community website, no typography.
Art direction: natural candid editorial lifestyle photography, like a carefully photographed student journal. Adult students in their early twenties. Soft daylight, believable expressions, real skin texture, subtly worn materials, modest everyday clothing. Cohesive muted slate-blue, cream, sage and soft ochre palette. Slight natural grain, not exaggerated vintage.
Composition: central subjects safe for web cropping; readable at a small website card size.
Constraints: fictional illustrative scene, no real organization branding. No words, readable text, watermarks, logos, university signage. No camera-facing posed gaze, no hyperpolished corporate stock-photo look, no oversaturated sheen, no surreal elements. Natural correct anatomy and hands.
Scene: outside a Paris university courtyard beside pale limestone steps, soft overcast daylight.
Subject: exactly four adult international students of varied backgrounds having a relaxed friendly conversation, one sitting on the steps and three close beside them at the same level. Medium shot with all four faces clearly legible near the center, genuine listening and small smiles, one person talking. Simple clothing in slate blue, cream and sage, a modest canvas tote resting nearby. Natural hands at rest, no elaborate gestures. A softly focused stone courtyard and a little greenery establish Paris without an obvious monument. Welcoming, unposed everyday social connection.
```
