export const FLOAT_ZONES = [
  { label: "FN", min: 0.00, max: 0.07, color: "#22d3ee" },
  { label: "MW", min: 0.07, max: 0.15, color: "#4ade80" },
  { label: "FT", min: 0.15, max: 0.38, color: "#facc15" },
  { label: "WW", min: 0.38, max: 0.45, color: "#fb923c" },
  { label: "BS", min: 0.45, max: 1.00, color: "#f87171" },
];

export const zoneActive = (zone, min, max) => min < zone.max && max > zone.min;
