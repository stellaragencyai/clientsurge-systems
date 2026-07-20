# ClientSurge Design System Gallery Usage

`CSDesignSystemGallery` is an isolated validation component for Design System 2.1. It is intentionally not mounted to a public or authenticated production route.

## Purpose

Use the gallery to validate:

- Semantic token behavior.
- Product primitive consistency.
- Responsive wrapping and stacking.
- Empty and unavailable-data truthfulness.
- Loading, success, warning, danger, and information states.
- Keyboard focus and reduced-motion behavior.

## Temporary local use

Mount the component only in a local development route or Storybook-style environment. Do not expose it in production navigation.

## Required review widths

- 375px.
- 768px.
- 1024px.
- 1440px.

## Removal policy

The gallery may remain in the repository as a visual regression fixture, but it must not become a customer-facing route unless explicitly protected and approved.
