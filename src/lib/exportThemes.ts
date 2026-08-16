export type ThemeId = 'cream' | 'dark' | 'kraft';
export type LayoutId = 'grid' | 'spines';

export interface ExportTheme {
  id: ThemeId;
  label: string;
  background: string;
  textColor: string;
  accentColor: string;
}

export const EXPORT_THEMES: ExportTheme[] = [
  { id: 'cream', label: 'Light / Cream', background: '#f6f1e7', textColor: '#2a2622', accentColor: '#b08d57' },
  { id: 'dark', label: 'Dark', background: '#181614', textColor: '#f6f1e7', accentColor: '#c9a86a' },
  { id: 'kraft', label: 'Kraft Paper', background: '#c9a06a', textColor: '#2a2018', accentColor: '#5a3d24' },
];

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;
