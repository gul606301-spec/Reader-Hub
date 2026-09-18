/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#10233F',
    tint: '#F06449',

    // Core surfaces
    background: '#F8F5F0',
    foreground: '#10233F',

    // Cards / elevated surfaces
    card: '#FFFDF9',
    cardForeground: '#10233F',

    // Primary action color (buttons, links, active states)
    primary: '#F06449',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E7EDF3',
    secondaryForeground: '#10233F',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEF0ED',
    mutedForeground: '#6F7885',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F5C96A',
    accentForeground: '#10233F',

    // Destructive actions (delete, error states)
    destructive: '#D9534F',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#DDE2E0',
    input: '#DDE2E0',
  },

  dark: {
    text: '#F8F5F0',
    tint: '#FF8067',
    background: '#0E1A2B',
    foreground: '#F8F5F0',
    card: '#17263A',
    cardForeground: '#F8F5F0',
    primary: '#FF8067',
    primaryForeground: '#0E1A2B',
    secondary: '#22344B',
    secondaryForeground: '#F8F5F0',
    muted: '#1C2D42',
    mutedForeground: '#A8B3C1',
    accent: '#F5C96A',
    accentForeground: '#0E1A2B',
    destructive: '#FF776E',
    destructiveForeground: '#0E1A2B',
    border: '#2A3D52',
    input: '#2A3D52',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
