---
name: Luminous Precision
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
  on-surface-variant: '#414755'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5d5e63'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe4'
  on-secondary-container: '#616267'
  tertiary: '#5b5c60'
  on-tertiary: '#ffffff'
  tertiary-container: '#747479'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2e2e7'
  secondary-fixed-dim: '#c6c6cb'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474b'
  tertiary-fixed: '#e3e2e7'
  tertiary-fixed-dim: '#c6c6cb'
  on-tertiary-fixed: '#1a1b1f'
  on-tertiary-fixed-variant: '#46464b'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-sm: 12px
  stack-md: 32px
  stack-lg: 80px
---

## Brand & Style

This design system embodies a "High-End Technical" aesthetic, blending the clinical precision of professional tools with the fluid, premium feel of modern editorial design. It targets a sophisticated audience that values clarity, performance, and aesthetic restraint.

The visual narrative is driven by **Liquid Glassmorphism**: surfaces appear as highly refractive, ultra-thin lenses rather than thick frosted panels. The emotional response should be one of "effortless power"—a UI that feels lightweight and invisible until interacted with. Key styling traits include:
- **Optical Clarity:** High transparency with minimal background blur to maintain a "sharp" feel.
- **Grainy Textures:** Subtle monochromatic noise applied to gradients to add tactile depth and break digital perfection.
- **Specular Highlights:** Thin, 1px inner borders that simulate light catching the edge of a glass pane.
- **Spaciousness:** An aggressive use of white space to isolate functional groups and emphasize content.

## Colors

The palette is strictly functional, utilizing a high-contrast foundation of pure white and a vibrant, "Electric Blue" for primary actions.

- **Primary (#007AFF):** Used for critical calls to action, active states, and focus indicators. It provides a burst of energy against the monochromatic backdrop.
- **Neutral (#FFFFFF):** The bedrock of the system. Used for base layers and primary surfaces to ensure maximum brightness.
- **Glass Accents:** Transparent variants of white (e.g., `rgba(255, 255, 255, 0.7)`) are used for layered surfaces.
- **Grainy Gradients:** Backgrounds should feature soft, sweeping gradients from #FFFFFF to #F2F2F7 with a 3% monochromatic noise overlay to prevent banding and add a "printed" quality.

## Typography

The typography system uses **Inter** to achieve a neutral, systematic appearance that mirrors high-end operating systems. 

- **Optical Sizing:** Large display type uses tight letter-spacing (-0.04em) to create a "locked-in" editorial look.
- **Hierarchy:** Contrast is achieved through weight shifts (SemiBold to Regular) rather than excessive color changes.
- **Readability:** Body text maintains a generous line-height (1.6) to support the spacious layout philosophy.
- **Labels:** Small labels use uppercase with increased tracking to ensure legibility on translucent glass backgrounds.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid** grid. Content is centered within a maximum container width of 1280px, while background effects and glass panels may bleed to the edges of the viewport.

- **The 8pt Rhythm:** All margins and paddings are multiples of 8px. 
- **Vertical Air:** Sections are separated by large "stack" increments (80px+) to allow the eye to rest and emphasize the "clean" brand promise.
- **Refinement:** Use 64px horizontal margins on desktop to create a centered, "gallery-style" focus for the core application logic.
- **Mobile:** On mobile, margins reduce to 20px, and vertical stacking compresses to 40px-60px for better information density.

## Elevation & Depth

Depth is not communicated through heavy shadows, but through **light refraction and layering**.

- **Surface Tiers:**
    - **Layer 0 (Base):** Pure #FFFFFF with grainy gradients.
    - **Layer 1 (Glass Panel):** 70% opacity white with a 4px-8px backdrop blur. This is the primary container style.
    - **Layer 2 (Floating/Active):** 90% opacity white with a subtle "Ambient Lift" shadow (0px 20px 40px rgba(0, 0, 0, 0.04)).
- **Specular Borders:** Every glass panel must have a 1px solid border. The top and left borders should be slightly brighter (`rgba(255,255,255,0.8)`) and the bottom/right slightly darker (`rgba(0,0,0,0.05)`) to simulate physical light interaction.
- **Refraction:** Avoid "muddy" blurs. Keep the `backdrop-filter: blur()` values low (under 12px) to maintain sharp underlying shapes.

## Shapes

The shape language is "Squircle-adjacent"—clean, modern, and friendly without being overly juvenile.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Main content glass panels use 1.5rem (24px) to create a distinct structural framing.
- **Consistency:** Never mix sharp corners with rounded corners in the same component group.
- **Interactive States:** On hover, primary buttons may slightly "bloat" or increase in roundedness by 2px to signal interactivity through fluid motion.

## Components

- **Buttons:** 
    - *Primary:* Solid #007AFF with white text. No shadow; high-contrast only.
    - *Secondary (Glass):* Translucent white background with a 1px specular border and blue text.
- **Input Fields:** Minimalist design with only a bottom border (1px, #E5E5E5) that turns into the Primary Blue on focus. Use a subtle 2% gray tint for the input area to define the hit zone.
- **Cards:** These are the primary expression of the "Liquid Glass" style. Use high-transparency backgrounds, 24px padding, and the dual-tone specular border.
- **Chips:** Highly rounded (pill-shaped), using a light blue tint `rgba(0, 122, 255, 0.1)` for background and the Primary Blue for text.
- **Segmented Controls:** A glass-on-glass interaction where the active segment is a solid white "pill" that slides behind the text labels.
- **Progress Indicators:** Use ultra-thin 2px lines. The track should be #F2F2F7 and the indicator the Primary Blue.