import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors, fonts } from '@/lib/theme';
import type { Panel } from '@/lib/types';

import { CaptionBox, Sfx, SpeechBubble } from './SpeechBubble';

export function PanelView({
  panel,
  index,
  width,
  height,
  fontSize,
  showSpeakers,
  onPress,
}: {
  panel: Panel;
  index: number;
  width: number;
  height: number;
  fontSize: number;
  showSpeakers: boolean;
  onPress?: () => void;
}) {
  const top = panel.dialogue.filter((d) => d.position.startsWith('top'));
  const bottom = panel.dialogue.filter((d) => d.position.startsWith('bottom'));
  const busy = panel.status === 'generating' || panel.status === 'pending';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Panel ${index + 1}: ${panel.scene}`}
      style={[styles.panel, { width, height }]}>
      <PanelArt panel={panel} />

      {panel.image ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { padding: Math.max(5, fontSize * 0.45) }]}>
          <View style={styles.overlay}>
            <View>
              {panel.caption ? <CaptionBox text={panel.caption} fontSize={fontSize} /> : null}
              {top.map((line, i) => (
                <SpeechBubble
                  key={`t${i}`}
                  line={line}
                  fontSize={fontSize}
                  showSpeaker={showSpeakers}
                  placement="top"
                />
              ))}
            </View>
            <View>
              {bottom.map((line, i) => (
                <SpeechBubble
                  key={`b${i}`}
                  line={line}
                  fontSize={fontSize}
                  showSpeaker={showSpeakers}
                  placement="bottom"
                />
              ))}
            </View>
          </View>
          {panel.sfx ? <Sfx text={panel.sfx} fontSize={fontSize} /> : null}
        </View>
      ) : null}

      {busy && panel.image ? (
        <View style={styles.busyBadge}>
          <ActivityIndicator size="small" color={colors.ink} />
        </View>
      ) : null}
    </Pressable>
  );
}

function PanelArt({ panel }: { panel: Panel }) {
  if (panel.image?.kind === 'uri') {
    return (
      <Image
        source={{ uri: panel.image.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
      />
    );
  }
  if (panel.image?.kind === 'svg') {
    return (
      <View style={StyleSheet.absoluteFill}>
        <SvgXml
          xml={panel.image.svg}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          fallback={<Placeholder panel={panel} message="SVG tidak dapat dipaparkan." />}
        />
      </View>
    );
  }
  return <Placeholder panel={panel} />;
}

function Placeholder({ panel, message }: { panel: Panel; message?: string }) {
  const isError = panel.status === 'error' || !!message;
  return (
    <View style={[StyleSheet.absoluteFill, styles.placeholder, isError && styles.placeholderError]}>
      {isError ? (
        <>
          <Text style={styles.placeholderIcon}>⚠️</Text>
          <Text style={styles.placeholderText} numberOfLines={4}>
            {message ?? panel.error ?? 'Gagal dijana.'}
          </Text>
          <Text style={styles.placeholderHint}>Ketik untuk cuba lagi</Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.ink} />
          <Text style={styles.placeholderText} numberOfLines={3}>
            {panel.status === 'generating' ? 'Sedang melukis…' : 'Menunggu giliran…'}
          </Text>
          <Text style={styles.placeholderScene} numberOfLines={3}>
            {panel.scene}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  overlay: { flex: 1, justifyContent: 'space-between' },
  busyBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: colors.yellow,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 4,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
    backgroundColor: '#F4EEDF',
  },
  placeholderError: { backgroundColor: '#FFE9E7' },
  placeholderIcon: { fontSize: 22 },
  placeholderText: {
    fontFamily: fonts.comicBold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  placeholderHint: { fontFamily: fonts.comic, fontSize: 12, color: colors.red },
  placeholderScene: {
    fontFamily: fonts.comic,
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
