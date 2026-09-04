---
name: Lumina Liquid Glass
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3b494c'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#6b7a7d'
  outline-variant: '#bac9cc'
  surface-tint: '#006875'
  primary: '#006875'
  on-primary: '#ffffff'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#00daf3'
  secondary: '#0059bb'
  on-secondary: '#ffffff'
  secondary-container: '#0070ea'
  on-secondary-container: '#fefcff'
  tertiary: '#576065'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9d2d8'
  on-tertiary-container: '#515a5f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#dbe4ea'
  tertiary-fixed-dim: '#bfc8ce'
  on-tertiary-fixed: '#141d21'
  on-tertiary-fixed-variant: '#3f484d'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 32px
  element-gap: 16px
  glass-margin: 24px
---

## Brand & Style

This design system centers on the concept of "Liquid Glass"—a high-gloss, ultra-transparent aesthetic that moves away from traditional frosted glassmorphism toward high-clarity, refractive surfaces. The brand personality is futuristic, intelligent, and highly polished, evoking the feeling of interacting with a tangible, light-filled physical object. 

The target audience consists of tech-forward users who value high-end aesthetics and fluid motion. The emotional response should be one of clarity and "magic," where AI interactions feel like bioluminescent ripples on a pristine surface. The style combines **Ultra-Minimalism** with **High-Gloss Tactility**, using razor-sharp transparency and glowing boundary light rather than background blurs to define structure.

## Colors

The palette is anchored in a high-contrast "Light Mode" foundation that utilizes deep sky blues for depth and electric cyan for interactive energy.

- **Primary (Electric Cyan):** Used exclusively for high-priority interactive states and critical "life" indicators of the AI.
- **Secondary (Deep Sky Blue):** Used for primary navigation and text-link emphasis.
- **Surface (Vibrant White):** A pure white base, often used at low opacities (5-10%) to create the glass panes.
- **Glow (Accent):** A soft, highly luminous cyan used for the "boundary light" effect on element borders.

Avoid solid backgrounds; utilize the hierarchy of transparency to define layers.

## Typography

This design system uses **Geist** for its technical precision and clean, modernist terminals. The typographic hierarchy is designed to feel spacious and effortless.

- **Headlines:** Set with tight letter spacing to emphasize the "machined" quality of the AI.
- **Body Text:** Ample line height is required to ensure legibility against transparent, high-gloss backgrounds.
- **Micro-copy:** Use `label-caps` for secondary metadata and status indicators to maintain a technical, HUD-like feel.
- **Contrast:** Always use high-contrast ink (Deep Sky Blue or Black) for body text to ensure WCAG compliance over glass surfaces.

## Layout & Spacing

The layout philosophy is "Organic Fluidity." Rather than a rigid 12-column grid, this design system uses a **Floating Layer Model**. Elements are positioned relative to the viewport center, creating a sense of weightlessness.

- **The Chat Stream:** Centered at 720px wide on desktop, allowing the "liquid" background to bleed into the margins.
- **Reflow:** On mobile, margins shrink to 16px, and the ultra-rounded corners remain consistent to preserve the "pebble" aesthetic.
- **Rhythm:** Uses a 4px base unit. Gaps between glass cards should be generous (minimum 16px) to allow the background gradients to define the edges.

## Elevation & Depth

Depth is not communicated through drop shadows, but through **Refractive Light** and **Border Luminance**.

- **Boundary Lights:** Every "liquid glass" container features a 1px solid border. The top and left borders use a higher opacity white (40%), while the bottom and right borders use the Electric Cyan (30%) to simulate light hitting a glass edge.
- **No Blur:** Backgrounds must remain 100% clear. Visual separation is achieved by a 5% white fill on the surface and a subtle "Inner Glow" (box-shadow: inset) that mimics the thickness of the glass.
- **Stacking:** Higher elevation elements receive a secondary "Glow Trace"—a 2px outer neon cyan stroke with 0px blur, making the element appear as if it is electrified.

## Shapes

The shape language is **Ultra-Rounded**. There are no sharp corners in the design system.

- **Containers:** All primary UI containers (chat bubbles, input bars, panels) use the `rounded-xl` (3rem) or full `pill` setting.
- **Interaction States:** When hovered, shapes should subtly "swell" (scale 1.02x) to mimic the surface tension of a liquid drop.
- **Continuity:** Smaller elements like checkboxes and radio buttons must be perfectly circular to match the organic nature of the containers.

## Components

- **Liquid Input Bar:** A pill-shaped, 100% transparent container with a 1px "Boundary Light" border. On focus, the border transitions from white to Electric Cyan with a subtle outer glow.
- **Chat Bubbles:**
    - *User:* Right-aligned, transparent glass with a white border.
    - *AI:* Left-aligned, transparent glass with an Electric Cyan border and a faint cyan inner-gradient (5% opacity).
- **Glass Buttons:** High-gloss surfaces with no background color. Text is Primary Cyan. On hover, the button fills with a 10% Cyan tint and the border light intensifies.
- **Bioluminescent Chips:** Small status indicators that use a solid Electric Cyan fill but with a 50% transparency, featuring a pulsing 4px glow to indicate active processing.
- **Refractive Cards:** Used for rich media or tool outputs. These have a slightly higher surface opacity (10%) and "catch" more light at the top-left edge.
- **Scrollbars:** Hidden by default, appearing as a thin, high-gloss "liquid" filament when active.