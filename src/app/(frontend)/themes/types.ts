export interface ThemeConfig {
  id: string
  name: string
  description: string
  cssClass: string
}

export const THEMES: Record<string, ThemeConfig> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Lab',
    description: 'Sci-fi лаборатория с неоновыми акцентами',
    cssClass: 'theme-cyber',
  },
  nature: {
    id: 'nature',
    name: 'Nature Flow',
    description: 'Природная тема с органическими формами',
    cssClass: 'theme-nature',
  },
  techno: {
    id: 'techno',
    name: 'Techno Grid',
    description: 'Техно-минимализм с геометрией',
    cssClass: 'theme-techno',
  },
}

export const DEFAULT_THEME = 'cyber'
