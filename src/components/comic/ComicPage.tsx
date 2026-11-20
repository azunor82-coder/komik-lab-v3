import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildRows, panelAspect } from '@/lib/layout';
import { colors, fonts } from '@/lib/theme';
import type { Comic } from '@/lib/types';

import { PanelView } from './PanelView';

const BORDER = 3;

export function ComicPage({
  comic,
  onPanelPress,
  ref,
}: {
  comic: Comic;
  onPanelPress?: (panelId: string) => void;
  ref?: Ref<ComponentRef<typeof View>>;
}) {
  const [width, setWidth] = useState(0);
  const padding = width > 500 ? 18 : 10;
  const gutter = width > 500 ? 12 : 8;
  const inner = Math.max(0, width - padding * 2 - BORDER * 2);
  const fontSize = Math.min(18, Math.max(11, inner * 0.036));
  const rows = buildRows(comic.panels);
  let index = 0;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.page, { padding }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.titleBox}>
        <Text style={[styles.title, { fontSize: Math.max(26, inner * 0.085) }]}>{comic.title}</Text>
      </View>

      {width > 0
        ? rows.map((row, r) => {
            const full = row.length === 1;
            const panelWidth = full ? inner : (inner - gutter) / 2;
            const panelHeight = panelWidth / panelAspect(full);
            return (
              <View key={r} style={[styles.row, { gap: gutter, marginTop: gutter }]}>
                {row.map((panel) => {
                  const i = index++;
                  return (
                    <PanelView
                      key={panel.id}
                      panel={panel}
                      index={i}
                      width={panelWidth}
                      height={panelHeight}
                      fontSize={fontSize}
                      showSpeakers={comic.showSpeakers}
                      onPress={onPanelPress ? () => onPanelPress(panel.id) : undefined}
                    />
                  );
                })}
              </View>
            );
          })
        : null}

      <Text style={styles.footer}>Komik Lab • dijana dengan AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    borderWidth: BORDER,
    borderColor: colors.ink,
    width: '100%',
  },
  titleBox: {
    alignSelf: 'center',
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 4,
    transform: [{ rotate: '-1deg' }],
    marginBottom: 4,
    maxWidth: '100%',
  },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: 1,
  },
  row: { flexDirection: 'row' },
  footer: {
    marginTop: 10,
    textAlign: 'right',
    fontFamily: fonts.comicBold,
    fontSize: 11,
    color: colors.muted,
  },
});
