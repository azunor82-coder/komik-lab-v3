import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/lib/theme';
import type { BubbleKind, BubblePosition, DialogueLine, Panel } from '@/lib/types';

import { Chip, ComicButton, SectionTitle } from './ui';

const KINDS: { id: BubbleKind; label: string }[] = [
  { id: 'speech', label: '💬 Cakap' },
  { id: 'thought', label: '💭 Fikir' },
  { id: 'shout', label: '📢 Jerit' },
  { id: 'whisper', label: '🤫 Bisik' },
];

const POSITIONS: { id: BubblePosition; label: string }[] = [
  { id: 'top-left', label: '↖ Kiri' },
  { id: 'top', label: '↑ Tengah' },
  { id: 'top-right', label: '↗ Kanan' },
  { id: 'bottom-left', label: '↙ Kiri' },
  { id: 'bottom', label: '↓ Tengah' },
  { id: 'bottom-right', label: '↘ Kanan' },
];

export interface PanelEdits {
  scene: string;
  imagePrompt: string;
  caption: string | null;
  sfx: string | null;
  dialogue: DialogueLine[];
}

export function PanelEditor({
  panel,
  index,
  characterNames,
  busy,
  onClose,
  onSave,
}: {
  panel: Panel;
  index: number;
  characterNames: string[];
  busy: boolean;
  onClose: () => void;
  onSave: (edits: PanelEdits, redraw: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const [scene, setScene] = useState(panel.scene);
  const [imagePrompt, setImagePrompt] = useState(panel.imagePrompt);
  const [caption, setCaption] = useState(panel.caption ?? '');
  const [sfx, setSfx] = useState(panel.sfx ?? '');
  const [dialogue, setDialogue] = useState<DialogueLine[]>(panel.dialogue);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateLine = (i: number, patch: Partial<DialogueLine>) =>
    setDialogue((lines) => lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const save = (redraw: boolean) =>
    onSave(
      {
        scene: scene.trim(),
        imagePrompt: imagePrompt.trim() || panel.imagePrompt,
        caption: caption.trim() || null,
        sfx: sfx.trim() || null,
        dialogue: dialogue
          .map((l) => ({ ...l, text: l.text.trim(), speaker: l.speaker.trim() }))
          .filter((l) => l.text.length > 0),
      },
      redraw
    );

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} visible>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 12 : 16 }]}>
          <Text style={styles.headerTitle}>Sunting Panel {index + 1}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled">
          <SectionTitle hint="Apa yang berlaku dalam panel ini.">Babak</SectionTitle>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={scene}
            onChangeText={setScene}
            multiline
          />

          <SectionTitle>Dialog</SectionTitle>
          {dialogue.map((line, i) => (
            <View key={i} style={styles.lineCard}>
              <View style={styles.lineHeader}>
                <TextInput
                  style={[styles.input, styles.speakerInput]}
                  value={line.speaker}
                  onChangeText={(speaker) => updateLine(i, { speaker })}
                  placeholder="Penutur"
                  placeholderTextColor={colors.muted}
                />
                <Pressable
                  onPress={() => setDialogue((lines) => lines.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel="Buang dialog"
                  hitSlop={8}>
                  <Text style={styles.remove}>🗑️</Text>
                </Pressable>
              </View>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={line.text}
                onChangeText={(text) => updateLine(i, { text })}
                placeholder="Teks dialog"
                placeholderTextColor={colors.muted}
                multiline
              />
              <View style={styles.chips}>
                {KINDS.map((k) => (
                  <Chip
                    key={k.id}
                    label={k.label}
                    selected={line.kind === k.id}
                    onPress={() => updateLine(i, { kind: k.id })}
                  />
                ))}
              </View>
              <Text style={styles.smallLabel}>Kedudukan belon</Text>
              <View style={styles.chips}>
                {POSITIONS.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.label}
                    selected={line.position === p.id}
                    onPress={() => updateLine(i, { position: p.id })}
                  />
                ))}
              </View>
            </View>
          ))}
          {dialogue.length < 4 ? (
            <ComicButton
              size="sm"
              variant="secondary"
              icon="➕"
              label="Tambah dialog"
              style={styles.addLine}
              onPress={() =>
                setDialogue((lines) => [
                  ...lines,
                  { speaker: characterNames[0] ?? '', text: '', kind: 'speech', position: 'top-left' },
                ])
              }
            />
          ) : null}

          <SectionTitle hint="Kotak narasi kuning di atas panel.">Kapsyen</SectionTitle>
          <TextInput
            style={styles.input}
            value={caption}
            onChangeText={setCaption}
            placeholder="(kosong)"
            placeholderTextColor={colors.muted}
          />

          <SectionTitle hint="Contoh: BAM!, KRING!, Zzz">Kesan Bunyi</SectionTitle>
          <TextInput
            style={styles.input}
            value={sfx}
            onChangeText={setSfx}
            placeholder="(kosong)"
            placeholderTextColor={colors.muted}
          />

          <Pressable onPress={() => setShowAdvanced((v) => !v)} accessibilityRole="button">
            <Text style={styles.advancedToggle}>{showAdvanced ? '▾' : '▸'} Arahan gambar (lanjutan)</Text>
          </Pressable>
          {showAdvanced ? (
            <>
              <Text style={styles.smallLabel}>
                Dalam Bahasa Inggeris. Digunakan bila panel dilukis semula.
              </Text>
              <TextInput
                style={[styles.input, styles.multiline, { minHeight: 110 }]}
                value={imagePrompt}
                onChangeText={setImagePrompt}
                multiline
              />
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <ComicButton label="Simpan" variant="secondary" style={styles.flex} onPress={() => save(false)} />
          <ComicButton
            label="Lukis Semula"
            icon="🎨"
            style={styles.flex}
            loading={busy}
            onPress={() => save(true)}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: colors.ink,
    backgroundColor: colors.yellow,
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: 1 },
  close: { fontSize: 24, fontWeight: '700', color: colors.ink },
  content: { paddingHorizontal: 18, maxWidth: 720, width: '100%', alignSelf: 'center' },
  input: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.comicBold,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  lineCard: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFDF7',
    marginBottom: 12,
  },
  lineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  speakerInput: { flex: 1, paddingVertical: 8 },
  remove: { fontSize: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smallLabel: { fontFamily: fonts.comic, fontSize: 13, color: colors.inkSoft, marginBottom: 4 },
  addLine: { alignSelf: 'flex-start' },
  advancedToggle: {
    marginTop: 24,
    marginBottom: 8,
    fontFamily: fonts.comicBold,
    fontSize: 16,
    color: colors.blue,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: colors.paper,
    borderTopWidth: 2,
    borderTopColor: colors.line,
  },
  flex: { flex: 1 },
});
