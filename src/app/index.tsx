import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { ComicButton, Notice } from '@/components/ui';
import { ART_STYLES, findLabel } from '@/lib/options';
import { useComics, useStoreLoaded } from '@/lib/store';
import { colors, fonts, MAX_PAGE_WIDTH, shadow } from '@/lib/theme';
import type { Comic } from '@/lib/types';
import { useBackendStatus } from '@/lib/backend';

const GAP = 12;

const STATUS_LABEL: Record<Comic['status'], string> = {
  scripting: '✍️ Menulis skrip',
  drawing: '🎨 Sedang dilukis',
  ready: '✅ Siap',
  error: '⚠️ Gagal',
};

export default function HomeScreen() {
  const comics = useComics();
  const loaded = useStoreLoaded();
  const { status, error } = useBackendStatus();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MAX_PAGE_WIDTH) - 32;
  const columns = contentWidth > 520 ? 3 : 2;
  const cardWidth = (contentWidth - GAP * (columns - 1)) / columns;

  return (
    <FlatList
      key={columns}
      data={comics}
      keyExtractor={(c) => c.id}
      numColumns={columns}
      columnWrapperStyle={styles.columns}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      ListHeaderComponent={
        <View>
          <View style={[styles.hero, shadow]}>
            <Text style={styles.heroTitle}>KOMIK LAB</Text>
            <Text style={styles.heroText}>
              Tulis idea anda — AI akan tulis cerita, cipta watak, lukis panel dan letak dialog secara
              automatik.
            </Text>
            <ComicButton
              label="Buat Komik Baru"
              icon="✨"
              size="lg"
              variant="dark"
              onPress={() => router.push('/create')}
            />
          </View>

          {error ? (
            <View style={styles.notice}>
              <Notice tone="error">Pelayan tidak dapat dihubungi: {error}</Notice>
            </View>
          ) : status?.demo ? (
            <View style={styles.notice}>
              <Notice tone="warn">
                {status.mode === 'server'
                  ? 'Mod demo: pelayan belum ada ANTHROPIC_API_KEY, jadi cerita adalah contoh tetap.'
                  : 'Mod demo: masukkan kunci API Anthropic anda dalam Tetapan untuk komik sebenar daripada idea anda.'}
              </Notice>
              <ComicButton
                size="sm"
                variant="secondary"
                icon="⚙️"
                label="Buka Tetapan"
                style={styles.noticeButton}
                onPress={() => router.push('/settings')}
              />
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Koleksi Saya</Text>
          {loaded && comics.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>Belum ada komik. Jom buat yang pertama!</Text>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <ComicCard comic={item} width={cardWidth} onPress={() => router.push(`/comic/${item.id}`)} />
      )}
    />
  );
}

function ComicCard({ comic, width, onPress }: { comic: Comic; width: number; onPress: () => void }) {
  const cover = comic.panels.find((p) => p.image)?.image;
  const done = comic.panels.filter((p) => p.status === 'done').length;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <View style={styles.cover}>
        {cover?.kind === 'uri' ? (
          <Image source={{ uri: cover.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : cover?.kind === 'svg' ? (
          <SvgXml xml={cover.svg} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        ) : (
          <Text style={styles.coverEmoji}>🖍️</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {comic.title || comic.request.idea}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {findLabel(ART_STYLES, comic.request.artStyle)} • {comic.request.panelCount} panel
        </Text>
        <Text style={styles.cardStatus}>
          {STATUS_LABEL[comic.status]}
          {comic.status === 'drawing' ? ` ${done}/${comic.panels.length}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, maxWidth: MAX_PAGE_WIDTH, width: '100%', alignSelf: 'center' },
  hero: {
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 54,
    lineHeight: 58,
    color: colors.red,
    letterSpacing: 2,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  heroText: { fontFamily: fonts.comicBold, fontSize: 17, lineHeight: 24, color: colors.ink },
  notice: { marginTop: 16 },
  noticeButton: { alignSelf: 'flex-start', marginTop: 10 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    marginTop: 26,
    marginBottom: 12,
    letterSpacing: 1,
  },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { fontFamily: fonts.comicBold, fontSize: 16, color: colors.inkSoft, textAlign: 'center' },
  columns: { gap: GAP, marginBottom: GAP },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 14,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  cover: {
    aspectRatio: 1,
    backgroundColor: '#F4EEDF',
    borderBottomWidth: 2.5,
    borderBottomColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverEmoji: { fontSize: 40 },
  cardBody: { padding: 10, gap: 3 },
  cardTitle: { fontFamily: fonts.comicBold, fontSize: 15, color: colors.ink, lineHeight: 19 },
  cardMeta: { fontFamily: fonts.comic, fontSize: 12, color: colors.inkSoft },
  cardStatus: { fontFamily: fonts.comicBold, fontSize: 12, color: colors.ink },
});
