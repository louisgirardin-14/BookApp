export type ThemeId = 'cream' | 'dark' | 'kraft' | 'bookish';
export type LayoutId = 'grid' | 'spines';

export interface ExportTheme {
  id: ThemeId;
  label: string;
  background: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}

export const EXPORT_THEMES: ExportTheme[] = [
  { id: 'cream', label: 'Light / Cream', background: '#f6f1e7', textColor: '#2a2622', mutedColor: '#8a8072', accentColor: '#8a8072' },
  { id: 'dark', label: 'Dark', background: '#000000', textColor: '#f5f3ef', mutedColor: '#8c8880', accentColor: '#8c8880' },
  { id: 'kraft', label: 'Kraft Paper', background: '#c9a06a', textColor: '#2a2018', mutedColor: '#6b4a2c', accentColor: '#6b4a2c' },
  { id: 'bookish', label: 'Bookish', background: '#faf3ee', textColor: '#4a3a3a', mutedColor: '#a98f8f', accentColor: '#c17f6f' },
];

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;
