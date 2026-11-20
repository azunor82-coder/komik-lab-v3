import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, shadow, shadowSmall } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dark';

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: colors.yellow,
  secondary: colors.card,
  danger: colors.red,
  dark: colors.ink,
};

export function ComicButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  size = 'md',
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = variant === 'danger' || variant === 'dark' ? '#fff' : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        size === 'lg' && styles.buttonLg,
        { backgroundColor: VARIANT_BG[variant] },
        size === 'sm' ? shadowSmall : shadow,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            size === 'sm' && styles.buttonTextSm,
            size === 'lg' && styles.buttonTextLg,
            { color: textColor },
          ]}>
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  emoji,
  selected,
  onPress,
  disabled,
  note,
  style,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  note?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        selected && shadowSmall,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {emoji ? `${emoji} ` : ''}
        {label}
      </Text>
      {note ? <Text style={styles.chipNote}>{note}</Text> : null}
    </Pressable>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'error';
  children: ReactNode;
}) {
  const bg = tone === 'error' ? '#FFE1DF' : tone === 'warn' ? colors.caption : '#E3F0FF';
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 2 },
  buttonLg: { minHeight: 60, paddingHorizontal: 22 },
  buttonText: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 0.8 },
  buttonTextSm: { fontSize: 16 },
  buttonTextLg: { fontSize: 26 },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  disabled: { opacity: 0.5 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.yellow },
  chipText: { fontFamily: fonts.comicBold, fontSize: 15, color: colors.ink },
  chipTextSelected: { color: colors.ink },
  chipNote: { fontFamily: fonts.comic, fontSize: 11, color: colors.inkSoft, marginTop: 1 },
  sectionTitleWrap: { marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, letterSpacing: 0.6 },
  sectionHint: { fontFamily: fonts.comic, fontSize: 14, color: colors.inkSoft, marginTop: 2 },
  notice: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noticeText: { fontFamily: fonts.comicBold, fontSize: 14, color: colors.ink, lineHeight: 20 },
});
