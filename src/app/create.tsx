import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, ComicButton, Notice, SectionTitle } from '@/components/ui';
import { createComic } from '@/lib/generator';
import { ART_STYLES, GENRES, LANGUAGES, PANEL_COUNTS, PROVIDERS, SAMPLE_IDEAS } from '@/lib/options';
import { colors, fonts, MAX_PAGE_WIDTH } from '@/lib/theme';
import type { ImageProvider, Language } from '@/lib/types';
import { useBackendStatus } from '@/lib/backend';

const MIN_IDEA = 5;

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { status } = useBackendStatus();
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState(GENRES[0].id);
  const [artStyle, setArtStyle] = useState(ART_STYLES[0].id);
  const [panelCount, setPanelCount] = useState<number>(6);
  const [language, setLanguage] = useState<Language>('ms');
  const [provider, setProvider] = useState<ImageProvider>('pollinations');

  const providerUnavailable = (id: ImageProvider) => id === 'openai' && status !== null && !status.openai;
  const canSubmit = idea.trim().length >= MIN_IDEA && !providerUnavailable(provider);

  const randomIdea = () => {
    const list = SAMPLE_IDEAS[language];
    let next = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1) while (next === idea) next = list[Math.floor(Math.random() * list.length)];
    setIdea(next);
  };

  const submit = () => {
    if (!canSubmit) return;
    const comic = createComic({ idea: idea.trim(), genre, artStyle, panelCount, language, provider });
    router.replace(`/comic/${comic.id}`);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled">
        <SectionTitle hint="Ceritakan secara ringkas — watak, tempat dan apa yang berlaku.">
          Idea Cerita
        </SectionTitle>
        <TextInput
          style={styles.ideaInput}
          value={idea}
          onChangeText={setIdea}
          placeholder="Contoh: Seekor kucing yang bercita-cita menjadi angkasawan…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          accessibilityLabel="Idea cerita"
        />
        <View style={styles.ideaActions}>
          <ComicButton size="sm" variant="secondary" icon="🎲" label="Idea Rawak" onPress={randomIdea} />
          <Text style={styles.counter}>{idea.length}/2000</Text>
        </View>

        <SectionTitle>Genre</SectionTitle>
        <View style={styles.chips}>
          {GENRES.map((g) => (
            <Chip
              key={g.id}
              label={g.label}
              emoji={g.emoji}
              selected={genre === g.id}
              onPress={() => setGenre(g.id)}
            />
          ))}
        </View>

        <SectionTitle>Gaya Lukisan</SectionTitle>
        <View style={styles.chips}>
          {ART_STYLES.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              emoji={s.emoji}
              selected={artStyle === s.id}
              onPress={() => setArtStyle(s.id)}
            />
          ))}
        </View>

        <SectionTitle>Bilangan Panel</SectionTitle>
        <View style={styles.chips}>
          {PANEL_COUNTS.map((n) => (
            <Chip key={n} label={`${n} panel`} selected={panelCount === n} onPress={() => setPanelCount(n)} />
          ))}
        </View>

        <SectionTitle>Bahasa Dialog</SectionTitle>
        <View style={styles.chips}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.id}
              label={l.label}
              emoji={l.emoji}
              selected={language === l.id}
              onPress={() => setLanguage(l.id)}
            />
          ))}
        </View>

        <SectionTitle hint="Cerita & dialog sentiasa ditulis oleh Claude.">Penjana Gambar</SectionTitle>
        <View style={styles.providers}>
          {PROVIDERS.map((p) => {
            const unavailable = providerUnavailable(p.id);
            return (
              <Chip
                key={p.id}
                label={p.label}
                emoji={p.emoji}
                note={unavailable ? 'Masukkan kunci OpenAI dalam Tetapan dahulu' : p.description}
                selected={provider === p.id}
                disabled={unavailable}
                style={styles.providerChip}
                onPress={() => setProvider(p.id)}
              />
            );
          })}
        </View>

        {status?.demo ? (
          <View style={styles.notice}>
            <Notice tone="warn">
              Mod demo aktif — skrip akan menggunakan cerita contoh
              {provider === 'claude-svg' ? ' dan lukisan contoh' : ''}. Masukkan kunci API Anthropic dalam
              Tetapan untuk cerita sebenar.
            </Notice>
          </View>
        ) : null}

        <ComicButton
          label="Jana Komik!"
          icon="✨"
          size="lg"
          style={styles.submit}
          disabled={!canSubmit}
          onPress={submit}
        />
        {idea.trim().length < MIN_IDEA ? (
          <Text style={styles.helper}>Tulis sekurang-kurangnya {MIN_IDEA} aksara untuk idea anda.</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, maxWidth: MAX_PAGE_WIDTH, width: '100%', alignSelf: 'center' },
  ideaInput: {
    minHeight: 120,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
    fontFamily: fonts.comicBold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  ideaActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  counter: { fontFamily: fonts.comic, fontSize: 12, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providers: { gap: 8 },
  providerChip: { borderRadius: 14, paddingVertical: 10 },
  notice: { marginTop: 18 },
  submit: { marginTop: 28 },
  helper: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.comic,
    fontSize: 13,
    color: colors.inkSoft,
  },
});
