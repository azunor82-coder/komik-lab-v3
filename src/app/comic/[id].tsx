import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComicPage } from '@/components/comic/ComicPage';
import { PanelEditor, type PanelEdits } from '@/components/PanelEditor';
import { ComicButton, Notice } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { drawPanel, redrawFailed, retryComic, startGeneration } from '@/lib/generator';
import { deleteComicImages } from '@/lib/image-files';
import { ART_STYLES, GENRES, PROVIDERS, findLabel } from '@/lib/options';
import { shareComicImage } from '@/lib/share';
import { removeComic, updateComic, updatePanel, useComic, useStoreLoaded } from '@/lib/store';
import { colors, fonts, MAX_PAGE_WIDTH } from '@/lib/theme';
import type { Comic } from '@/lib/types';

export default function ComicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comic = useComic(id);
  const loaded = useStoreLoaded();
  const insets = useSafeAreaInsets();
  const pageRef = useRef<ComponentRef<typeof View>>(null);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  // Resume generation if the app was closed mid-way.
  useEffect(() => {
    if (comic && (comic.status === 'scripting' || comic.status === 'drawing')) startGeneration(comic.id);
  }, [comic?.id, comic?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!comic) {
    return (
      <View style={styles.center}>
        {loaded ? (
          <Text style={styles.muted}>Komik tidak dijumpai.</Text>
        ) : (
          <ActivityIndicator color={colors.ink} />
        )}
      </View>
    );
  }

  const editingIndex = comic.panels.findIndex((p) => p.id === editingPanelId);
  const editingPanel = editingIndex >= 0 ? comic.panels[editingIndex] : null;
  const failed = comic.panels.filter((p) => p.status === 'error').length;
  const busy = comic.status === 'scripting' || comic.status === 'drawing';

  const onShare = async () => {
    setSharing(true);
    try {
      await shareComicImage(pageRef, comic.title || 'Komik');
    } catch (error) {
      showAlert('Tidak dapat berkongsi', errorMessage(error));
    } finally {
      setSharing(false);
    }
  };

  const onDelete = () =>
    confirm('Padam komik ini?', 'Tindakan ini tidak boleh dibatalkan.', () => {
      deleteComicImages(comic.id);
      removeComic(comic.id);
      router.back();
    });

  const onSaveEdits = (edits: PanelEdits, redraw: boolean) => {
    const panelId = editingPanelId;
    if (!panelId) return;
    updatePanel(comic.id, panelId, (p) => ({ ...p, ...edits }));
    setEditingPanelId(null);
    if (redraw) drawPanel(comic.id, panelId, { newSeed: true });
  };

  return (
    <>
      <Stack.Screen options={{ title: comic.title || 'Komik Baru' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <ProgressBanner comic={comic} />

        {comic.demo ? (
          <View style={styles.block}>
            <Notice tone="warn">
              Ini komik demo. Tetapkan ANTHROPIC_API_KEY di pelayan untuk cerita sebenar daripada idea anda.
            </Notice>
          </View>
        ) : null}

        {comic.panels.length > 0 ? (
          <>
            <ComicPage ref={pageRef} comic={comic} onPanelPress={setEditingPanelId} />
            <Text style={styles.tip}>💡 Ketik mana-mana panel untuk sunting dialog atau lukis semula.</Text>

            <View style={styles.actions}>
              <ComicButton
                label={Platform.OS === 'web' ? 'Muat Turun PNG' : 'Kongsi'}
                icon="📤"
                loading={sharing}
                disabled={busy}
                style={styles.action}
                onPress={onShare}
              />
              <ComicButton
                label={comic.showSpeakers ? 'Sorok Nama' : 'Tunjuk Nama'}
                icon="🏷️"
                variant="secondary"
                style={styles.action}
                onPress={() => updateComic(comic.id, (c) => ({ ...c, showSpeakers: !c.showSpeakers }))}
              />
              {failed > 0 && !busy ? (
                <ComicButton
                  label={`Cuba Lagi (${failed})`}
                  icon="🔁"
                  variant="secondary"
                  style={styles.action}
                  onPress={() => redrawFailed(comic.id)}
                />
              ) : null}
            </View>
          </>
        ) : null}

        <Details comic={comic} />

        <ComicButton
          label="Padam Komik"
          icon="🗑️"
          variant="danger"
          size="sm"
          style={styles.delete}
          onPress={onDelete}
        />
      </ScrollView>

      {editingPanel ? (
        <PanelEditor
          key={editingPanel.id}
          panel={editingPanel}
          index={editingIndex}
          characterNames={comic.characters.map((c) => c.name)}
          busy={editingPanel.status === 'generating'}
          onClose={() => setEditingPanelId(null)}
          onSave={onSaveEdits}
        />
      ) : null}
    </>
  );
}

function ProgressBanner({ comic }: { comic: Comic }) {
  if (comic.status === 'scripting') {
    return (
      <View style={[styles.banner, styles.block]}>
        <ActivityIndicator color={colors.ink} />
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>Claude sedang menulis skrip…</Text>
          <Text style={styles.bannerText}>Mencipta watak, babak dan dialog. Biasanya 20–60 saat.</Text>
        </View>
      </View>
    );
  }
  if (comic.status === 'drawing') {
    const done = comic.panels.filter((p) => p.status === 'done' || p.status === 'error').length;
    const total = comic.panels.length || 1;
    return (
      <View style={[styles.banner, styles.block]}>
        <ActivityIndicator color={colors.ink} />
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>
            Melukis panel {Math.min(done + 1, total)}/{total}…
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(done / total) * 100}%` }]} />
          </View>
        </View>
      </View>
    );
  }
  if (comic.status === 'error') {
    return (
      <View style={styles.block}>
        <Notice tone="error">{comic.error ?? 'Ralat tidak diketahui.'}</Notice>
        <ComicButton label="Cuba Lagi" icon="🔁" style={styles.retry} onPress={() => retryComic(comic.id)} />
      </View>
    );
  }
  return null;
}

function Details({ comic }: { comic: Comic }) {
  return (
    <View style={styles.details}>
      <Text style={styles.detailsTitle}>Butiran</Text>
      {comic.synopsis ? <Text style={styles.detailsText}>{comic.synopsis}</Text> : null}
      <Text style={styles.detailsMeta}>
        Idea: <Text style={styles.detailsText}>{comic.request.idea}</Text>
      </Text>
      <Text style={styles.detailsMeta}>
        {findLabel(GENRES, comic.request.genre)} • {findLabel(ART_STYLES, comic.request.artStyle)} •{' '}
        {findLabel(PROVIDERS, comic.request.provider)}
      </Text>
      {comic.characters.length > 0 ? (
        <>
          <Text style={[styles.detailsTitle, styles.charactersTitle]}>Watak</Text>
          {comic.characters.map((c) => (
            <Text key={c.name} style={styles.detailsMeta}>
              <Text style={styles.characterName}>{c.name}</Text> — {c.appearance}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  );
}

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Padam', style: 'destructive', onPress: onConfirm },
  ]);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: fonts.comicBold, fontSize: 16, color: colors.inkSoft },
  content: { padding: 16, maxWidth: MAX_PAGE_WIDTH, width: '100%', alignSelf: 'center' },
  block: { marginBottom: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 14,
  },
  bannerTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, letterSpacing: 0.6 },
  bannerText: { fontFamily: fonts.comic, fontSize: 14, color: colors.inkSoft, marginTop: 2 },
  progressTrack: {
    height: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 99,
    marginTop: 6,
    overflow: 'hidden',
    backgroundColor: '#F4EEDF',
  },
  progressFill: { height: '100%', backgroundColor: colors.green },
  retry: { marginTop: 12 },
  tip: {
    fontFamily: fonts.comic,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 10,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  action: { flexGrow: 1 },
  details: {
    marginTop: 24,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#FFFDF7',
    gap: 6,
  },
  detailsTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: 0.6 },
  charactersTitle: { marginTop: 8 },
  detailsText: { fontFamily: fonts.comicBold, fontSize: 14, color: colors.ink, lineHeight: 20 },
  detailsMeta: { fontFamily: fonts.comic, fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  characterName: { fontFamily: fonts.comicBold, color: colors.ink },
  delete: { marginTop: 24, alignSelf: 'center' },
});
