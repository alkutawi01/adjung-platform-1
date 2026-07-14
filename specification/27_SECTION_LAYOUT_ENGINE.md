# Adjung Section Layout Engine: Spatial Grammar Specification

A Blueprint is a spatial grammar rather than a page template. It defines how editorial space behaves, not how a page looks.

This document serves as the formal architectural constitution of the Adjung Section layout engine, defining the dual-stream content model, the composition pipeline, and the rules of editorial rhythm, grammar, and slot behavior.

---

## 1. Dual-Stream Content Architecture

The layout engine does not select every asset on a page. Instead, it acts as a **Composition Engine** that merges two independent content streams into a single editorial layout:

1. **Publication Stream**: Automated flow of articles, essays, and scholarly entries managed by ranking rules.
   - Raw Publications -> Publication Pipeline -> **Resolved Publication Pool** -> Engine-Controlled Slots.
2. **Editorial Assets Stream**: Manually selected assets curated by human editors.
   - Manual Curations -> **Reserved Editorial Pool** -> Reserved Editorial Slots.

```
Publication Stream                        Editorial Assets Stream
  (Raw Publications)                         (Manual Curations)
          │                                          │
          ▼                                          ▼
 [Publication Pipeline]                     [Reserved Editorial Pool]
          │                                          │
          ▼                                          ▼
[Resolved Publication Pool]                 [Reserved Editorial Slots]
          │                                          │
          └───────────────────┬──────────────────────┘
                              ▼
                     [Composition Engine]
                              ▼
                     [Final Layout IR]
```

### Separation of Responsibilities
- **The Editor** decides **what** the reserved editorial assets are (e.g., Book Covers, Historical Images, Quran Verses, Hadith, Pull Quotes, Editorial Notes, Timelines, Maps, Manuscript Fragments).
- **The Composition Engine** decides **where** these assets appear, maintaining spatial grammar, visual harmony, and editorial rhythm. The engine cannot drop, delete, or replace these assets.

---

## 2. Composition Budget

Every Section Blueprint must define a **Composition Budget** that sets the balance between engine-controlled slots and reserved editorial slots. This budget is configurable per Section (e.g., Malaysian Edition, Scholarly Journal, Magazine, Sports Section).

```yaml
blueprint:
  id: editorial_main_3col
  composition_budget:
    engine_slots: 225
    reserved_editorial_slots: 25
```

---

## 3. Hierarchy of Composition Concepts

1. **Blueprint**: The master configuration asset containing grid column counts, Composition Budget parameters, Spatial Grammar rules, and Editorial Rhythm strategies.
2. **Spatial Grammar**: The unbreakable structural constraints (e.g., maximum hero counts, tag exclusion rules, note adjacency limits).
3. **Editorial Rhythm**: The pacing engine that decides the sequencing of layout slots (e.g., placing a quote after a heavy article, or spacing out cover stories).
4. **Spatial Stanza**: The geometric, multi-row grid templates (e.g., Left Hero, Right Hero, Balanced Columns) selected to satisfy the Rhythm sequence.
5. **Slot**: The individual layout placeholder representing either an Engine-Controlled Slot or a Reserved Editorial Slot.

---

## 4. Slot Capabilities: Slide Stacks & Carousels

To support displaying multiple related assets without taking up excessive grid space, slots can support a **Carousel Stack** state. 

### Rules for Carousels
- A slot must be explicitly configured in the Blueprint schema to allow a carousel (`carousel: true`).
- A carousel slot only accepts equivalent content classes (e.g., a stack of Books, or a stack of Historical Images).
- The Blueprint defines a maximum item limit (`max_items`) for the stack to prevent visual clutter.
- The Layout IR output will pass an array of publications or assets under that slot instead of a single object.
- The React Presentational Component renders the stack as an elegant, inline-animated slide panel within the exact coordinates of the slot, preventing any layout shift in the CSS Grid.

---

## 5. The 10-Stage Composition Pipeline

The engine processes and merges both pools into a continuous Layout Intermediate Representation (Layout IR).

```
[Publication Pool]                     [Reserved Editorial Pool]
        │                                          │
        ▼                                          ▼
[Stage 1: Validation]  (Filter out drafts/corrupt data)
        │
        ▼
[Stage 2: Eligibility]  (Apply section filtering & visibility)
        │
        ▼
[Stage 3: Editorial Classification]  (Featured, Fresh, Classical, etc.)
        │
        ▼
[Stage 4: Editorial Policy]  (Apply manual pins & category weights)
        │
        ▼
[Stage 5: Ranking] ──► Produces: Sorted Pools
        │
        ▼
[Stage 6: Composition Policy (Grammar Check)]  (Verify budget & rhythm constraints)
        │
        ▼
[Stage 7: Rhythm Generation]  (Generate pacing sequence of Engine and Reserved slots)
        │
        ▼
[Stage 8: Stanza Generation]  (Select geometric grid blocks matching Rhythm)
        │
        ▼
[Stage 9: Slot Assignment & Adaptability]  (Place content; apply Fallback, Resize, Collapse)
        │
        ▼
[Stage 10: Rendering] ──► Produces: Continuous Layout IR to CSS Grid
```

---

## 6. Blueprint Adaptability & Spatial Reflow

Since the grid is generated procedurally, slot adaptations propagate down the layout dynamically:

1. **Fallback Class**: If a slot cannot find its preferred content class, it consumes an acceptable fallback class.
2. **Resize Slot**: If a fallback content is used, the slot coordinates shrink to match the fallback's natural size (e.g., a Book slot shrinking from 4x4 to 3x2 when filled by an Essay).
3. **Collapse Slot**: If no content is available for an optional slot, the slot is marked as collapsed.
4. **Spatial Reflow**: When a slot is resized or collapsed, the engine recalculates the row offsets of all subsequent stanzas in the layout, ensuring that empty spaces do not create holes in the page.
5. **Preservation of Reserved Assets**: Under no circumstances can the engine discard, resize, or replace a Reserved Editorial Slot to resolve a content gap. The engine must preserve all editor-selected assets.

---

## 7. Layout Intermediate Representation (Layout IR)

The resulting Layout IR maps positions to grid coordinates:

```json
{
  "blueprintId": "editorial_main_3col",
  "device": "desktop",
  "totalSlots": 250,
  "compositionBudget": {
    "engineSlots": 225,
    "reservedEditorialSlots": 25
  },
  "assignments": [
    {
      "stanzaIndex": 0,
      "slotId": "hero_left",
      "slotType": "engine_controlled",
      "gridPosition": { "rowStart": 1, "colStart": 1 },
      "gridSpan": { "rowSpan": 2, "colSpan": 2 },
      "visualWeight": "critical",
      "publication": {
        "id": "pub-120",
        "title": "Introduction to Islamic Logic",
        "contentType": "Essay"
      }
    },
    {
      "stanzaIndex": 0,
      "slotId": "carousel_books_01",
      "slotType": "engine_controlled",
      "gridPosition": { "rowStart": 1, "colStart": 3 },
      "gridSpan": { "rowSpan": 2, "colSpan": 1 },
      "visualWeight": "medium",
      "isCarousel": true,
      "publications": [
        {
          "id": "pub-book-01",
          "title": "Al-Ghazali On Logic",
          "contentType": "Book"
        },
        {
          "id": "pub-book-02",
          "title": "Avicenna and the Aristotelian Tradition",
          "contentType": "Book"
        }
      ]
    }
  ]
}
```

---

## 8. Next Steps for Implementation

The developmental roadmap proceeds with compiling three key specifications:
1. **Blueprint & Stanza Specification**: Defining grid stanza layouts, Composition Budgets, and repeating rhythm files.
2. **Editorial Policy Specification**: Managing content classification, ranking, and curation rules.
3. **Editorial Grammar & Rhythm Specification**: Establishing sequence limits, content rhythm rules, and pacing patterns.
