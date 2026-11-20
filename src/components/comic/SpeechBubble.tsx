import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';
import type { DialogueLine } from '@/lib/types';

export type Align = 'left' | 'center' | 'right';

export function alignOf(position: DialogueLine['position']): Align {
  if (position.endsWith('left')) return 'left';
  if (position.endsWith('right')) return 'right';
  return 'center';
}

const ALIGN_SELF = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

export function SpeechBubble({
  line,
  fontSize,
  showSpeaker,
  placement,
}: {
  line: DialogueLine;
  fontSize: number;
  showSpeaker: boolean;
  placement: 'top' | 'bottom';
}) {
  const align = alignOf(line.position);
  const isThought = line.kind === 'thought';
  const isShout = line.kind === 'shout';
  const isWhisper = line.kind === 'whisper';
  const tailOffset =
    align === 'left' ? { left: 18 } : align === 'right' ? { right: 18 } : { left: '46%' as const };

  return (
    <View
      style={[
        styles.wrap,
        { alignSelf: ALIGN_SELF[align] },
        placement === 'top' ? { marginBottom: isThought ? 12 : 10 } : { marginTop: isThought ? 12 : 10 },
      ]}>
      <View
        style={[
          styles.bubble,
          isThought && styles.thought,
          isShout && styles.shout,
          isWhisper && styles.whisper,
          { paddingHorizontal: fontSize * 0.75, paddingVertical: fontSize * 0.45 },
        ]}>
        {showSpeaker && line.speaker && line.speaker.toLowerCase() !== 'narrator' ? (
          <Text style={[styles.speaker, { fontSize: Math.max(8, fontSize * 0.68) }]} numberOfLines={1}>
            {line.speaker}
          </Text>
        ) : null}
        <Text
          style={[
            styles.text,
            { fontSize: isShout ? fontSize * 1.08 : fontSize, lineHeight: fontSize * 1.22 },
            isShout && styles.shoutText,
            isWhisper && styles.whisperText,
          ]}>
          {isShout ? line.text.toUpperCase() : line.text}
        </Text>
      </View>

      {isThought ? (
        <View
          style={[
            styles.thoughtDots,
            placement === 'top' ? { top: '100%' } : { bottom: '100%', flexDirection: 'column-reverse' },
            tailOffset,
          ]}>
          <View style={[styles.dot, { width: 9, height: 9 }]} />
          <View style={[styles.dot, { width: 5, height: 5, marginLeft: 6 }]} />
        </View>
      ) : (
        <>
          <View
            style={[
              styles.tail,
              placement === 'top'
                ? { top: '100%', marginTop: -2.5, borderTopColor: colors.ink, borderTopWidth: 12 }
                : {
                    bottom: '100%',
                    marginBottom: -2.5,
                    borderBottomColor: colors.ink,
                    borderBottomWidth: 12,
                  },
              tailOffset,
            ]}
          />
          <View
            style={[
              styles.tailInner,
              placement === 'top'
                ? { top: '100%', marginTop: -4.5, borderTopColor: '#fff', borderTopWidth: 9 }
                : { bottom: '100%', marginBottom: -4.5, borderBottomColor: '#fff', borderBottomWidth: 9 },
              align === 'left'
                ? { left: 20.5 }
                : align === 'right'
                  ? { right: 20.5 }
                  : { left: '46%', marginLeft: 2.5 },
            ]}
          />
        </>
      )}
    </View>
  );
}

export function CaptionBox({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <View style={[styles.caption, { paddingHorizontal: fontSize * 0.6, paddingVertical: fontSize * 0.35 }]}>
      <Text style={[styles.captionText, { fontSize: fontSize * 0.95, lineHeight: fontSize * 1.18 }]}>
        {text}
      </Text>
    </View>
  );
}

export function Sfx({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <View pointerEvents="none" style={styles.sfxWrap}>
      <Text
        style={[
          styles.sfx,
          { fontSize: fontSize * 2.3, textShadowOffset: { width: fontSize * 0.18, height: fontSize * 0.18 } },
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '78%', position: 'relative' },
  bubble: {
    backgroundColor: '#fff',
    borderColor: colors.ink,
    borderWidth: 2.5,
    borderRadius: 18,
  },
  thought: { borderRadius: 999 },
  shout: { borderWidth: 3.5, borderRadius: 6, transform: [{ rotate: '-1.5deg' }] },
  whisper: { borderStyle: 'dashed' },
  speaker: {
    fontFamily: fonts.comicBold,
    color: colors.red,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  text: { fontFamily: fonts.comicBold, color: colors.ink, textAlign: 'center' },
  shoutText: { fontFamily: fonts.display, letterSpacing: 0.6 },
  whisperText: { color: colors.inkSoft, fontFamily: fonts.comic },
  tail: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailInner: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  thoughtDots: { position: 'absolute', marginTop: 2 },
  dot: { borderRadius: 99, borderWidth: 2, borderColor: colors.ink, backgroundColor: '#fff', marginTop: 1 },
  caption: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: colors.caption,
    borderColor: colors.ink,
    borderWidth: 2.5,
    marginBottom: 6,
  },
  captionText: { fontFamily: fonts.comicBold, color: colors.ink },
  sfxWrap: {
    position: 'absolute',
    right: '6%',
    bottom: '16%',
    transform: [{ rotate: '-10deg' }],
  },
  sfx: {
    fontFamily: fonts.display,
    color: colors.yellow,
    letterSpacing: 1.5,
    textShadowColor: colors.ink,
    textShadowRadius: 0,
  },
});
