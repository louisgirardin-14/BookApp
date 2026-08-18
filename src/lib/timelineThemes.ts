export type TimelineThemeId = 'mustard' | 'plum' | 'sage';

export interface TimelineTheme {
  id: TimelineThemeId;
  label: string;
  background: string;
  connector: string;
  textColor: string;
  captionColor: string;
}

// A bold poster palette, deliberately separate from the quiet literary
// EXPORT_THEMES used by Grid/Spines -- this layout is closer to the
// "Cameras Timeline" infographic reference than to a book-cover keepsake.
export const TIMELINE_THEMES: TimelineTheme[] = [
  { id: 'mustard', label: 'Mustard & Teal', background: '#f0b429', connector: '#0f8b8d', textColor: '#20281f', captionColor: '#3d4a3a' },
  { id: 'plum', label: 'Rose & Plum', background: '#f4c9c0', connector: '#6b2e4f', textColor: '#3a1a2a', captionColor: '#7a5361' },
  { id: 'sage', label: 'Sage & Navy', background: '#cfe0c3', connector: '#1f3a5f', textColor: '#1c2b1a', captionColor: '#43523f' },
];
