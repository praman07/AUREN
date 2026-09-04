---
name: Auren Liquid Glass
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#525657'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b6e70'
  on-tertiary-container: '#eff1f3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

The design system is a premium, production-grade interface framework that blends the tactile depth of **Glassmorphism** with the systematic rigor of **Corporate Modern** design. It is engineered for high-end enterprise environments where clarity and aesthetic sophistication are paramount.

The brand personality is authoritative yet ethereal. It avoids heavy containers, instead using light, refraction, and selective translucency to establish hierarchy. The emotional response is one of "calm precision"—the UI should feel like a high-end physical tool crafted from machined aluminum and polished glass.

Key aesthetic principles:
- **Optical Balance:** Alignment is driven by visual weight rather than rigid bounding boxes.
- **Material Logic:** Surfaces respond to light. Translucency is reserved for elevated or ephemeral layers (drawers, modals, floating toolbars).
- **Subtle Refraction:** Borders are not just solid colors but thin, multi-stop gradients that mimic the edge of a glass pane.

## Colors

The palette is rooted in a "Liquid Glass" philosophy, utilizing cool neutrals to create a high-contrast, professional environment.

- **Sapphire Blue (#2563eb):** Used sparingly as a surgical accent for primary actions, focus states, and active indicators.
- **Deep Graphite (#0f172a):** The primary color for typography and high-contrast iconography, providing grounded legibility against light backgrounds.
- **Soft White (#f8fafc):** The base canvas color, chosen to reduce eye strain compared to pure white while maintaining a crisp, clinical feel.
- **Cool Neutral Gray (#64748b):** Used for secondary metadata and de-emphasized UI elements.

**Functional Surface Tokens:**
- `surface-glass`: `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)`.
- `border-glass`: `1px solid rgba(255, 255, 255, 0.4)` with a secondary inner stroke of `rgba(15, 23, 42, 0.05)`.

## Typography

This design system utilizes **Inter** exclusively to ensure maximum legibility and a systematic, developer-friendly aesthetic. 

The typographic scale is intentionally polarized:
- **Headings** use generous tracking and tight line heights to create a commanding presence.
- **Body Text** is kept compact (14px) to optimize for information density in enterprise workflows.
- **Labels** utilize uppercase styling for structural metadata (e.g., table headers, section titles) to differentiate from interactive content.

Vertical rhythm is maintained by ensuring all line heights are multiples of 4px.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with wide margins to create an expensive, "airy" feel. 

- **Desktop (1440px+):** 12-column grid, 40px side margins, 24px gutters.
- **Tablet (768px - 1439px):** 8-column grid, 24px side margins, 16px gutters.
- **Mobile (<768px):** 4-column grid, 16px side margins, 16px gutters.

Space is used as a primary separator rather than lines. Grouping is achieved through varying the `stack` increments. For example, related input fields use `stack-sm`, while distinct page sections use `stack-xl`.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Refraction** rather than traditional drop shadows.

1.  **Level 0 (Base):** The `tertiary_color_hex` soft white background.
2.  **Level 1 (Surface):** Subtle 1px borders in neutral-200. Used for static content areas.
3.  **Level 2 (Glass):** Elements that float or scroll over Level 0/1. These use the `surface-glass` token with a 20px blur and a "Liquid Border"—a top-weighted highlight that mimics light hitting the top edge of glass.
4.  **Level 3 (Focus):** For modals and primary drawers. Includes a deep, 10% opacity sapphire-tinted ambient shadow (`0px 20px 50px rgba(37, 99, 235, 0.1)`) to pull the element toward the user.

**Motion Note:** Transitions between elevation levels should use a "snappy" spring: `stiffness: 300, damping: 30`.

## Shapes

The design system uses a **Rounded** (0.5rem) base to soften the corporate aesthetic while maintaining professional structure.

- **Standard Elements (Buttons, Inputs):** 8px (0.5rem).
- **Containers (Cards, Glass Drawers):** 16px (1rem) for `rounded-lg`.
- **Large Floating Modals:** 24px (1.5rem) for `rounded-xl`.
- **Search Bars & Tags:** Always pill-shaped to denote high interactivity.

## Components

### Buttons
- **Primary:** Solid Sapphire Blue. On hover, a subtle 2px vertical displacement (upward) with a slight increase in shadow spread.
- **Ghost/Glass:** Transparent background with `border-glass`. On hover, the background fills to 10% Sapphire Blue.

### Glass AI Composer
A flagship component. Use a `surface-glass` container with a persistent 1px sapphire-to-transparent gradient border. The text caret should be Sapphire Blue. When the AI is "thinking," the refraction blur should oscillate slightly in intensity.

### Refined Tables
No vertical borders. Horizontal borders are 0.5px thick in a very light neutral. Row hover states should use a 2% Graphite fill with no transition delay to feel "mechanical."

### Drawers
Drawers emerge from the right with a 30% backdrop-blur overlay on the main content. The drawer itself is `surface-glass` with a hard 1px left-edge border highlight.

### Inputs
Minimalist style. Only a bottom border (2px) in inactive state. On focus, the border transitions to Sapphire Blue, and a subtle light-blue glow appears behind the input area.

### Motion Details
- **Elastic Transitions:** Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for scale-up effects on buttons.
- **Hover:** All interactive elements must have a 100ms transition on their background and border properties.