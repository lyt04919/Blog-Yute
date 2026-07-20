---
name: YYsuni Blog
description: A minimalist personal digital garden for curated thoughts and crafted experiences.
colors:
  ink: "#1d1d1f"
  paper: "#ffffff"
  muted: "#86868b"
  surface: "#f5f5f7"
  accent: "#8B4513"
  dark-ink: "#f5f5f7"
  dark-paper: "#000000"
  dark-muted: "#a1a1a6"
  dark-surface: "#111111"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'PingFang SC', -apple-system, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "'PingFang SC', -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0"
  label:
    fontFamily: "'PingFang SC', -apple-system, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: YYsuni Blog

## 1. Overview

**Creative North Star: "The Minimalist Atelier"**

This design system embodies a brightly-lit, almost-white workspace where every object has been deliberately chosen and placed. Like an Apple Store or a Japanese design studio, the surface is nearly pure — the content itself provides the color and texture. The atmosphere is one of calm confidence: nothing shouts, everything earns its place.

The system rejects decoration for its own sake. No gradients that don't serve a purpose, no shadows that don't describe elevation, no animation that doesn't guide attention. The design principles from PRODUCT.md — "less is more," "typography is design," "content is king" — are expressed through extreme restraint in color and generous, rhythmic spacing.

**Key Characteristics:**
- Monochrome foundation with a single, rare accent color
- Serif display type (Playfair Display) for headlines, sans-serif for body
- Flat surfaces by default; depth conveyed through tonal layering, not shadow
- Generous whitespace as a structural element, not an afterthought
- Dark mode is a native, independently designed theme — not an inversion

## 2. Colors

The palette is intentionally limited: a near-black ink, pure paper white, and a warm muted tone for secondary text. A single brick-red accent appears sparingly — on hover states, active indicators, and the rare moment that demands emphasis.

### Primary
- **Ink** (`#1d1d1f`): Primary text, headings, borders in light mode. Not pure black — slightly warm, slightly soft.
- **Paper** (`#ffffff`): Background, card surfaces, input fields in light mode.

### Secondary
- **Muted** (`#86868b`): Secondary text, captions, placeholders, disabled states. The most common color after Ink.
- **Surface** (`#f5f5f7`): Card backgrounds, subtle containers, code block backgrounds. Slightly off-white to lift from Paper.

### Accent
- **Brick Red** (`#8B4513`): Hover states on primary buttons, active navigation indicators, rare emphasis. Used on ≤5% of any screen. Its rarity is the point.

### Neutral (Dark Mode)
- **Dark Ink** (`#f5f5f7`): Primary text in dark mode. Warm off-white, not harsh pure white.
- **Dark Paper** (`#000000`): Background in dark mode. Pure black for OLED depth.
- **Dark Muted** (`#a1a1a6`): Secondary text in dark mode.
- **Dark Surface** (`#111111`): Card backgrounds, elevated surfaces in dark mode.

### Named Rules
**The One Voice Rule.** The accent color is used on ≤5% of any given screen. Its rarity is the point. If you find yourself reaching for it twice in one view, reconsider.

**The No-Pure-Black Rule.** In light mode, text is `#1d1d1f`, not `#000000`. In dark mode, text is `#f5f5f7`, not `#ffffff`. The slight warmth prevents visual fatigue.

## 3. Typography

**Display Font:** Playfair Display (with Georgia, Times New Roman fallback)
**Body Font:** PingFang SC / -apple-system stack (with Segoe UI, Roboto, Helvetica Neue fallback)

**Character:** A classical-meets-modern pairing. Playfair's high-contrast serifs bring editorial authority to headlines; the system sans-serif body ensures crisp readability at small sizes. The contrast between the two families is deliberate — they should never be confused for one another.

### Hierarchy
- **Display** (500, clamp(2rem, 5vw, 3.5rem), line-height 1.1): Hero headlines only. Tight letter-spacing (`-0.02em`). Used once per page.
- **Headline** (600, 1.75rem, line-height 1.25): Section titles, page headers. Slight negative tracking (`-0.01em`).
- **Title** (600, 1.25rem, line-height 1.4): Card titles, subsections. No letter-spacing adjustment.
- **Body** (400, 15px, line-height 1.8): Prose, descriptions, all long-form content. Max line length: 65ch.
- **Label** (500, 0.85rem, line-height 1.4, letter-spacing 0.02em): Buttons, tags, metadata, captions. Slightly wider tracking for clarity at small sizes.

### Named Rules
**The Serif-Only-At-Display Rule.** Playfair Display appears only at Display and Headline sizes. Never use it for body text, labels, or UI elements. The serif/sans boundary is a hard line.

## 4. Elevation

This system is flat by default. Depth is conveyed through tonal layering (Surface vs. Paper) rather than shadow. Shadows appear only as a response to state — hover, focus, or temporary elevation — and even then, they are extremely subtle.

### Shadow Vocabulary
- **Ambient** (`0 4px 12px rgba(0, 0, 0, 0.05)`): Default hover shadow for buttons and cards. Barely perceptible.
- **Lifted** (`0 40px 50px -32px rgba(0, 0, 0, 0.05)`): Large soft shadow for modals and floating panels. Diffuse, not directional.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. If a shadow is present, there must be a reason — hover, focus, or the element is temporarily elevated above its context.

## 5. Components

### Buttons
- **Shape:** Medium radius (12px). Not pill-shaped, not sharp-cornered.
- **Primary:** Ink background (`#1d1d1f`), Paper text, padding 10px 24px. Hover shifts to Brick Red accent.
- **Ghost:** Transparent background, Ink text, 1px Ink border. Hover fills with Surface color.
- **Transition:** Background-color 200ms, transform 150ms. No scale transforms — color and subtle shadow only.

### Cards / Containers
- **Corner Style:** Medium radius (12px).
- **Background:** Surface color (`#f5f5f7` light, `#111111` dark).
- **Shadow Strategy:** None at rest. Ambient shadow on hover only.
- **Border:** 1px solid Border color (`#e8e8ed` light, `#333333` dark). Subtle, structural.
- **Internal Padding:** 24px (`p-6`).

### Inputs / Fields
- **Style:** 1px Border color stroke, Paper background, medium radius.
- **Focus:** Border shifts to Ink color. No glow, no ring. The border darkens — that's the signal.
- **Placeholder:** Muted color. Must maintain 4.5:1 contrast against Paper.

### Navigation
- **Style:** Transparent background, Ink text. No background container.
- **Hover:** Text shifts to Muted color. No underline, no background fill.
- **Active:** Brick Red accent on the active item. Underline or dot indicator, not background.

### Tags / Chips
- **Style:** Surface background, Muted text, small radius (6px), padding 4px 12px.
- **No border.** The tonal difference from Paper is sufficient.

## 6. Do's and Don'ts

### Do:
- **Do** use generous whitespace. When in doubt, add more space.
- **Do** let typography carry the visual hierarchy. Size, weight, and spacing before color.
- **Do** maintain the serif/sans boundary. Playfair for display headlines only.
- **Do** use the Brick Red accent sparingly. Its rarity makes it meaningful.
- **Do** design dark mode as a native theme, not an inversion. Independent color choices.
- **Do** respect `prefers-reduced-motion`. Crossfade or instant transitions for users who request reduced motion.

### Don't:
- **Don't** use gradient text (`background-clip: text`). Decorative, never meaningful.
- **Don't** use glassmorphism or heavy backdrop blur. The system is flat and confident.
- **Don't** use side-stripe borders (colored left/right borders >1px) as accents. Use full borders, background tints, or nothing.
- **Don't** use uppercase with wide tracking for section labels. The "eyebrow" pattern is an AI cliché.
- **Don't** use numbered section markers (01 / 02 / 03) unless the sequence carries real information.
- **Don't** use pure black (`#000000`) or pure white (`#ffffff`) for text. The slight warmth of Ink and Dark Ink prevents fatigue.
- **Don't** animate layout properties (width, height, top, left). Use transform and opacity only.
- **Don't** use identical card grids with icon + heading + text repeated endlessly. Vary the rhythm.
