# Expanded event image prompts

Generated on 16 September 2026 for the fictional example events in `events.html`.

## Method and review

- Mode: built-in `image_gen.imagegen`, generate mode; three independent calls, one per asset.
- No reference images, previous page imagery, collage, contact sheet, or CLI/API fallback was used.
- Every source image is a separate 1536 × 1024 PNG. Each source was displayed and visually inspected for its own activity, adult subjects, natural editorial style, anatomy, and crop suitability.
- The board-game image shows a generic game in a student room; the sketch-walk image shows notebooks and a phone in a general garden; the dinner image shows distinct personal meals and no food exchange.
- Final files use full-frame downscaling only to 800 × 533, then WebP encoding at quality 86, method 6 with bundled Pillow. No retouching, compositing, or image crop was applied.
- Originals remain in the built-in generated-image directory. The website uses the local final assets below.
- All images are illustrative AI-generated scenes; they do not document real PIE members, organizers, venues, or scheduled activities.

## Assets and exact prompts

### board-games

- Source: `/Users/hell/.codex/generated_images/01a0aa16-4879-7341-a979-445357521775/exec-5b0cebff-ef75-49c6-ae24-93231ec0a401.png`
- Source dimensions: 1536 × 1024
- Final: `/Users/hell/AIRE_Study/PIE_UPC/assets/event-board-games.webp`
- Final dimensions: 800 × 533
- Consumed by: `events.html`

```text
Use case: photorealistic-natural
Asset type: an illustrative event photo on a fictional international student community website.
Style/medium: natural editorial photography, candid adult students, realistic details and skin texture, calm everyday atmosphere.
Composition/framing: one complete landscape photograph, 3:2 aspect ratio. Main people and activity comfortably inside the central two-thirds with breathing room, suitable for gentle responsive image crops.
Lighting/mood: soft natural light, welcoming and relaxed.
Color palette: muted cream, sage green, slate blue, warm wood, subtle autumn colors.
Constraints: all people are adults. No real organization identity or affiliation. No text overlays, no watermarks, no logos, no contact sheet, no collage, no graphic frame. Generate exactly one image.
Primary request: four adult international students enjoying a beginner-friendly board game evening in a modest shared student room.
Scene/backdrop: a comfortable communal room, a light wooden table, simple chairs, neutral shelves and a small window in the background.
Subject: casually dressed adult friends concentrating and smiling around a simple generic board with colored wooden game pieces and blank-backed cards; one player gently explains a move. Keep the table activity and natural conversation central. Unbranded games, no readable printed text. Everyone feels like a participant, with no designated organizer.
Avoid: party imagery, alcohol, staged cheering, studio polish, distorted hands, exaggerated luxury.
```

### sketch-walk

- Source: `/Users/hell/.codex/generated_images/01a0aa16-4879-7341-a979-445357521775/exec-d9fb9079-a11b-4542-a378-015315668f94.png`
- Source dimensions: 1536 × 1024
- Final: `/Users/hell/AIRE_Study/PIE_UPC/assets/event-sketch-walk.webp`
- Final dimensions: 800 × 533
- Consumed by: `events.html`

```text
Use case: photorealistic-natural
Asset type: an illustrative event photo on a fictional international student community website.
Style/medium: natural editorial photography, candid adult students, realistic details and skin texture, calm everyday atmosphere.
Composition/framing: one complete landscape photograph, 3:2 aspect ratio. Main people and activity comfortably inside the central two-thirds with breathing room, suitable for gentle responsive image crops.
Lighting/mood: soft natural light, welcoming and relaxed.
Color palette: muted cream, sage green, slate blue, warm wood, subtle autumn colors.
Constraints: all people are adults. No real organization identity or affiliation. No text overlays, no watermarks, no logos, no contact sheet, no collage, no graphic frame. Generate exactly one image.
Primary request: three adult international students pausing on an autumn neighbourhood sketch walk in a general Paris public garden.
Scene/backdrop: an unidentifiable Paris garden path with trees, a simple bench, fallen autumn leaves and distant pale buildings; dry weather, no famous landmark or named venue.
Subject: adult friends casually observing their surroundings, two with small notebooks and pencils, one with a smartphone held naturally as a camera; a small loose pencil sketch is visible without any legible text. A quiet creative pause, with garden scenery as well as people visible.
Avoid: art-class instructor pose, museum interiors, branded clothing, prominent monuments, rain, dramatic filters, text.
```

### shared-table

- Source: `/Users/hell/.codex/generated_images/01a0aa16-4879-7341-a979-445357521775/exec-42a22ec9-0e9e-4163-a6bb-dce34be9df8b.png`
- Source dimensions: 1536 × 1024
- Final: `/Users/hell/AIRE_Study/PIE_UPC/assets/event-shared-table.webp`
- Final dimensions: 800 × 533
- Consumed by: `events.html`

```text
Use case: photorealistic-natural
Asset type: an illustrative event photo on a fictional international student community website.
Style/medium: natural editorial photography, candid adult students, realistic details and skin texture, calm everyday atmosphere.
Composition/framing: one complete landscape photograph, 3:2 aspect ratio. Main people and activity comfortably inside the central two-thirds with breathing room, suitable for gentle responsive image crops.
Lighting/mood: soft natural light, welcoming and relaxed.
Color palette: muted cream, sage green, slate blue, warm wood, subtle autumn colors.
Constraints: all people are adults. No real organization identity or affiliation. No text overlays, no watermarks, no logos, no contact sheet, no collage, no graphic frame. Generate exactly one image.
Primary request: four adult international students talking over their own evening meals in a shared student dining room.
Scene/backdrop: a modest shared dining room with a wooden table, simple chairs, a softly lit window, understated cream and sage interior.
Subject: friends seated comfortably around the same table, each with their own distinct lunchbox or plate and a water glass; one closed extra food container has a tiny blank label. Everyone is eating their own food, nobody is serving or exchanging food. Relaxed friendly conversation, not a party.
Avoid: communal buffet, shared serving platters, passing food, alcohol, restaurant service, readable text, formal host, staged toast.
```

## Content choices

The six events are in date order, and calendar checks confirm Thursday 24 September, Sunday 27 September, Friday 2 October, Wednesday 7 October, Saturday 10 October, and Sunday 18 October 2026. The original three event titles, dates, fees, images, and demo status are preserved. Brief preparation and duration details make the examples easier to understand.

The new activities cover a free indoor game evening, a free outdoor creative walk with a rain postponement condition, and a bring-your-own-meal dinner. Generic venues avoid suggesting a real booking. The dinner explicitly keeps food sharing optional and asks for ingredient/allergen labels. Each row retains the existing event structure and “Example event” label; the existing page-wide fictional-content and AI-image notice remains intact.
