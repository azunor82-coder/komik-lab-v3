export const colors = {
  paper: '#FFF7E6',
  card: '#FFFFFF',
  ink: '#151515',
  inkSoft: '#4A4A4A',
  muted: '#8A8172',
  yellow: '#FFD23F',
  red: '#EF3E36',
  blue: '#2D7DD2',
  green: '#3BB273',
  pink: '#FF8FA3',
  line: '#E6DCC6',
  caption: '#FFF3B0',
} as const;

export const fonts = {
  display: 'Bangers_400Regular',
  comic: 'ComicNeue_400Regular',
  comicBold: 'ComicNeue_700Bold',
} as const;

export const shadow = {
  boxShadow: `4px 4px 0px ${colors.ink}`,
} as const;

export const shadowSmall = {
  boxShadow: `2px 2px 0px ${colors.ink}`,
} as const;

export const MAX_PAGE_WIDTH = 720;
