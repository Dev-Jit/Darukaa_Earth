/** Darukaa.Earth design tokens — shared by CSS (index.css) and JS (charts, maps). */
export const palette = {
  canopy: "#1B4332",
  canopyDeep: "#143326",
  canopySoft: "#E4EDE7",
  loam: "#B8860B",
  loamSoft: "#F4EBD3",
  mist: "#EFF2ED",
  bark: "#1A2620",
  silt: "#5C6B63",
  water: "#3D6B7A",
  waterSoft: "#E4EEF0",
  edge: "#D4DDD6",
  surface: "#FFFFFF",
  danger: "#6B3A32",
  dangerSoft: "#F4EBE8",
  dangerEdge: "#E4D0CC",
};

export const fonts = {
  heading: 'Spectral, Georgia, "Times New Roman", serif',
  body: '"IBM Plex Sans", system-ui, sans-serif',
};

export const radii = {
  ui: 8,
};

export const shadows = {
  none: "none",
  hairline: "0 1px 0 rgba(26, 38, 32, 0.04)",
};

export const typeScale = {
  kicker: "0.6875rem",
  caption: "0.8125rem",
  body: "0.9375rem",
  section: "1.25rem",
  pageTitle: "1.75rem",
  metric: "1.75rem",
};

export const status = {
  monitoring: palette.canopy,
  verification: palette.loam,
  water: palette.water,
  idle: palette.silt,
};

export const mapSiteColors = {
  fill: palette.canopy,
  fillOpacity: 0.35,
  outline: palette.canopyDeep,
};
