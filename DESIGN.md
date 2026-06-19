---
name: Lifestory
description: Premium, warm, restrained family legacy product interface.
colors:
  surface-page: "#faf6ed"
  surface-elev: "#fdfbf6"
  surface-quiet: "#f5efe1"
  border-soft: "#ece2cc"
  border-mid: "#dccfb3"
  ink-900: "#1d1610"
  ink-800: "#3f342d"
  ink-700: "#40342c"
  ink-600: "#5a4d42"
  ink-500: "#73685f"
  ink-300: "#9c8e7e"
  ink-100: "#e9e0d0"
  brand-400: "#aa8d5c"
  brand-500: "#927648"
  brand-700: "#82693c"
  brand-900: "#3f2f1d"
  success: "#3a6e44"
  warning: "#9d6e1c"
  danger: "#b34a4a"
typography:
  display:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(2.75rem, 7vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(2rem, 4vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section-sm: "clamp(3.5rem, 6vw, 5rem)"
  section-md: "clamp(5rem, 8vw, 7rem)"
  section-lg: "clamp(6rem, 10vw, 9rem)"
components:
  button-primary:
    backgroundColor: "{colors.brand-700}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "14px 32px"
  button-secondary:
    backgroundColor: "{colors.surface-elev}"
    textColor: "{colors.ink-700}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  card-soft:
    backgroundColor: "{colors.surface-elev}"
    textColor: "{colors.ink-700}"
    rounded: "{rounded.lg}"
    padding: "24px"
  field-floating:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink-800}"
    rounded: "{rounded.md}"
    padding: "20px 16px 10px"
---

# Design System: Lifestory

## 1. Overview

**Creative North Star: "The Quiet Family Archive"**

Lifestory should feel like a private family archive prepared by a careful studio: warm enough for personal memory, restrained enough for trust, and premium without theatrical decoration. The interface serves clients who are handling sensitive family material, so clarity, calm pacing, and stable interaction matter more than visual surprise.

The system uses warm cream surfaces, dark brown ink, and a rare bronze accent. Marketing pages may use Playfair Display for emotional headlines, but product surfaces should rely on Inter for labels, controls, data, and repeated workflows. Product UI must feel familiar and dependable: the tree, search, drawers, forms, and sync states should disappear into the task.

**Key Characteristics:**
- Warm cream surface system with dark ink and controlled bronze emphasis.
- Serif display typography for legacy storytelling; Inter for operational UI.
- Rounded but disciplined surfaces: soft product cards, pill CTAs, compact controls.
- Motion is purposeful, short, and state-based; reduced motion is required.
- Visual density can increase inside the family-tree workspace, but hierarchy must stay calm.

## 2. Colors

The palette is a warm archival neutral system anchored by bronze, with dark brown ink carrying most hierarchy.

### Primary
- **Archive Bronze** (`brand-700`): the primary action, selected state, focus, and lineage-highlight color. Use sparingly; its rarity signals importance.
- **Soft Bronze** (`brand-400`): hover accents, rules, subtle badges, and non-primary emphasis.

### Neutral
- **Warm Archive Page** (`surface-page`): the default page background for public and auth surfaces.
- **Raised Ivory Surface** (`surface-elev`): elevated cards, drawers, nav bars, menus, and form surfaces.
- **Quiet Cream Band** (`surface-quiet`): section contrast, inactive segmented controls, and non-selected product chrome.
- **Deep Family Ink** (`ink-900`): maximum emphasis, dark panels, and hero contrast.
- **Readable Brown Ink** (`ink-700`): primary body text and product UI text.
- **Muted Archive Ink** (`ink-500`): secondary text, helper copy, and inactive labels.
- **Soft Border** (`border-soft`): low-emphasis borders.
- **Mid Border** (`border-mid`): controls, drawers, and structural product separators.

### Tertiary
- **Success Green** (`success`): completed sync, positive confirmation, and safe status.
- **Warning Ochre** (`warning`): attention states that are not destructive.
- **Danger Red** (`danger`): destructive actions and validation errors only.

### Named Rules
**The Bronze Rarity Rule.** Bronze is for primary action, current selection, focus, and meaningful lineage emphasis. Do not use it as general decoration.

**The Archive Contrast Rule.** Body text must stay on `ink-700` or darker on cream surfaces. Muted text is for secondary copy only and must still pass WCAG AA.

## 3. Typography

**Display Font:** Playfair Display (with serif fallback)  
**Body Font:** Inter (with sans-serif fallback)  
**Label/Mono Font:** Inter

**Character:** The pairing is legacy editorial plus product clarity. Playfair gives family stories weight and ceremony; Inter keeps controls, data, and forms legible.

### Hierarchy
- **Display** (500, `clamp(2.75rem, 7vw, 6rem)`, `0.98`): hero headlines and emotionally important public-page statements only.
- **Headline** (500, `clamp(2rem, 4vw, 3.75rem)`, `1.05`): section titles, auth split panels, and drawer feature titles.
- **Title** (700, `1rem`, `1.35`): card headings, modal titles, tab labels, and product panel headings.
- **Body** (400, `1rem`, `1.7`): prose, descriptions, instructions, and story content. Keep long prose near 65-75ch.
- **Label** (700, `0.75rem`, `0.12em`): badges, tabs, compact metadata, and tool chrome. Uppercase labels are allowed, but not as a repeated section scaffold.

### Named Rules
**The Serif Boundary Rule.** Do not use Playfair for buttons, inputs, dense controls, tables, or repeated product labels. Product workflows stay in Inter.

**The Tight But Not Cramped Rule.** Display letter spacing may be tight, but never tighter than `-0.04em`; the current system uses `-0.02em` to `-0.025em`.

## 4. Elevation

Lifestory uses a hybrid of tonal layering, borders, and soft warm shadows. Flat cream layers establish the archive feeling; shadows appear on cards, CTAs, drawers, menus, and hover states when depth supports interaction.

### Shadow Vocabulary
- **Soft Surface** (`0 14px 28px rgba(59,43,24,0.08)`): standard card lift and quiet hover.
- **Elevated Surface** (`0 18px 36px rgba(59,43,24,0.12)`): menus, active panels, and important product containers.
- **Lifted Surface** (`0 22px 44px rgba(59,43,24,0.16)`): interactive card hover and focused auth forms.
- **Deep Drawer** (`0 28px 60px rgba(17,12,8,0.24)`): dark panels, major drawers, and overlays.
- **CTA Glow** (`0 14px 30px rgba(130,105,60,0.28)`): primary CTA only.

### Named Rules
**The One Depth Signal Rule.** Do not combine a visible border and a wide decorative shadow unless the component is an active drawer, menu, or CTA. Static cards should be quieter.

**The Drawer Clarity Rule.** Member-detail and archive drawers may use deeper elevation because they sit above a canvas; the movement and shadow must clarify layering, not decorate.

## 5. Components

### Buttons
- **Shape:** pill by default (`9999px`) for shared Button primitives; squared-off outline CTAs are used selectively in the navbar and mobile menu.
- **Primary:** bronze gradient or `brand-700`, white text, medium-to-large padding (`14px 32px`), and CTA shadow.
- **Hover / Focus:** primary buttons lift slightly and may use a restrained shine; focus uses a bronze ring and visible offset.
- **Secondary / Ghost / Outline:** cream or transparent surfaces with ink text, soft borders, and minimal hover fill.

### Chips
- **Style:** pill chips with a 1px border, low-chroma cream or brand-tinted backgrounds, and uppercase Inter labels.
- **State:** selected chips invert to bronze with white text; unselected chips stay quiet and readable.

### Cards / Containers
- **Corner Style:** soft rounded cards (`20px`) and larger editorial cards (`28px`), but avoid larger radii on new card surfaces.
- **Background:** `surface-elev` for raised content, `surface-quiet` for quiet chrome, dark ink for high-emphasis panels.
- **Shadow Strategy:** soft or elevated shadows; hover may lift one step.
- **Border:** 1px warm borders from `border-soft` or `border-mid`.
- **Internal Padding:** 16px for compact product cards, 24-32px for editorial cards and auth forms.

### Inputs / Fields
- **Style:** floating-label fields with white background, `20px` radius, warm border, and Inter labels.
- **Focus:** bronze border and soft bronze ring. Focus must be visible on keyboard and touch workflows.
- **Error / Disabled:** danger border and alert text for errors; disabled fields use quiet cream fill and muted ink.

### Navigation
- **Style:** sticky warm cream navbar with subtle blur, soft border, and logo-first hierarchy.
- **Typography:** public nav may use small Playfair links; app/tool chrome uses Inter.
- **State:** active nav uses dark ink plus a small bronze dot. Mobile nav uses large serif links only in the public menu, not in dense app controls.

### Family Tree Workspace
- **Canvas:** full-bleed dark/warm image-backed canvas with cream overlay, stable toolbar chrome, and compact segmented controls.
- **Member Drawer:** right-side panel, warm elevated surface, dark image header, bronze selected tabs, and smooth drawer motion with reduced-motion fallback.
- **Search:** rounded cream/white field with visible result menu; search selection should focus the canvas without causing abrupt overlay feedback.

## 6. Do's and Don'ts

### Do:
- **Do** preserve the existing warm cream, dark ink, and bronze identity before inventing new colors.
- **Do** use Inter for product controls, dense labels, forms, and app chrome.
- **Do** reserve Playfair for story-rich headings, public-page moments, and member-story emphasis.
- **Do** keep all text, placeholders, and muted labels at WCAG AA contrast.
- **Do** make motion explain state changes: drawer entry, selected tab, hover, loading, sync, and focus.
- **Do** treat family-tree touch gestures conservatively; canceled gestures should feel like non-events.

### Don't:
- **Don't** make the interface look like a generic AI-generated template.
- **Don't** use overused SaaS patterns, decorative card grids, generic hero-metric blocks, gradient text, excessive glass effects, or ornamental clutter.
- **Don't** use bronze as a decorative wash across every section.
- **Don't** introduce ad-hoc hex values when a Tailwind token or CSS custom property already exists.
- **Don't** use Playfair in buttons, dense forms, data, or repeated product labels.
- **Don't** ship abrupt mount/unmount panels for member details; drawers should feel layered and intentional.
