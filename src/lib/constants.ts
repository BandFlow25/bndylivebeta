// src/lib/constants.ts
export const GENRES = [
  'Rock', 'Jazz', 'Blues', 'Alternative', 'Folk', 'Pop', 
  'Indie', 'Metal', 'Soul', 'Funk', 'Country', 'Rock n Roll', 'Punk', 'Hip Hop', 'Other'
] as const;

export const COLLECTIONS = {
  BANDS: 'bf_bands',
  EVENTS: 'bf_events',
  VENUES: 'bf_venues',
  ARTISTS: 'bf_artists'
} as const;

// Date range options for list view
export const DATE_RANGES = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "thisWeek", label: "This Week" },
  { id: "thisWeekend", label: "This Weekend" },
  { id: "nextWeek", label: "Next Week" },
  { id: "nextWeekend", label: "Next Weekend" },
  { id: "future", label: "Future Events" },
  { id: "all", label: "All Events" }
] as const;

// Distance options (in km)
export const DISTANCE_OPTIONS = [
  { value: 5, label: "5mile radius" },
  { value: 10, label: "10mile radius" },
  { value: 25, label: "25mile radius" },
  { value: 50, label: "50mile radius" }
] as const;