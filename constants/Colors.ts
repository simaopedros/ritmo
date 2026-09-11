import { colors } from './theme';

const tintColorLight = colors.accent;
const tintColorDark = colors.accentSoft;

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.text,
    background: colors.bg,
    tint: tintColorDark,
    tabIconDefault: colors.textMuted,
    tabIconSelected: tintColorDark,
  },
};
