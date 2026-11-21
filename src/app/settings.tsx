import Constants from 'expo-constants';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComicButton, Notice, SectionTitle } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { backendMode, type BackendMode } from '@/lib/backend';
import { testAnthropicKey } from '@/lib/local-backend';
import { maskKey, saveSetting, useSettings, type Settings } from '@/lib/settings';
import { colors, fonts, MAX_PAGE_WIDTH } from '@/lib/theme';

const MODE_TEXT: Record<BackendMode, { icon: string; title: string; text: string }> = {
  device: {
    icon: '📱',
    title: 'Kunci anda (dalam telefon)',
    text: 'Komik dijana terus dari telefon ini menggunakan kunci API anda.',
  },
  server: {
    icon: '🖥️',
    title: 'Pelayan Komik Lab',
    text: 'Komik dijana oleh pelayan. Masukkan kunci di bawah untuk guna kunci anda sendiri.',
  },
  demo: {
    icon: '🎭',
    title: 'Mod demo',
    text: 'Tiada kunci API — app menggunakan cerita dan lukisan contoh.',
  },
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const mode = MODE_TEXT[backendMode(settings)];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.modeCard}>
          <Text style={styles.modeIcon}>{mode.icon}</Text>
          <View style={styles.flex}>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeText}>{mode.text}</Text>
          </View>
        </View>

        <KeyField
          name="anthropicKey"
          title="Kunci API Anthropic"
          hint="Wajib untuk komik sebenar. Claude menulis cerita dan (jika dipilih) melukis panel SVG."
          placeholder="sk-ant-..."
          link={{
            label: 'Dapatkan kunci di console.anthropic.com',
            url: 'https://console.anthropic.com/settings/keys',
          }}
          settings={settings}
          test={testAnthropicKey}
        />

        <KeyField
          name="openaiKey"
          title="Kunci API OpenAI"
          hint="Pilihan. Hanya untuk penjana gambar “OpenAI Image”."
          placeholder="sk-..."
          link={{
            label: 'Dapatkan kunci di platform.openai.com',
            url: 'https://platform.openai.com/api-keys',
          }}
          settings={settings}
        />

        <View style={styles.block}>
          <Notice tone="info">
            🔒 Kunci disimpan dengan selamat dalam telefon ini sahaja dan hanya dihantar terus kepada
            Anthropic / OpenAI. Setiap komik menggunakan kredit akaun API anda.
          </Notice>
        </View>

        <Text style={styles.version}>Komik Lab v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function KeyField({
  name,
  title,
  hint,
  placeholder,
  link,
  settings,
  test,
}: {
  name: keyof Settings;
  title: string;
  hint: string;
  placeholder: string;
  link: { label: string; url: string };
  settings: Settings;
  test?: (key: string) => Promise<void>;
}) {
  const saved = settings[name];
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  const save = async () => {
    const key = value.trim();
    if (!key) return;
    setBusy(true);
    setMessage(null);
    try {
      if (test) await test(key);
      await saveSetting(name, key);
      setValue('');
      setMessage({ tone: 'info', text: test ? '✅ Kunci sah dan disimpan.' : '✅ Kunci disimpan.' });
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (!saved || !test) return;
    setBusy(true);
    setMessage(null);
    try {
      await test(saved);
      setMessage({ tone: 'info', text: '✅ Kunci berfungsi.' });
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await saveSetting(name, null);
    setMessage({ tone: 'info', text: 'Kunci telah dipadam dari telefon ini.' });
  };

  return (
    <View>
      <SectionTitle hint={hint}>{title}</SectionTitle>
      {saved ? (
        <View style={styles.savedRow}>
          <Text style={styles.savedKey}>🔑 {maskKey(saved)}</Text>
          {test ? (
            <ComicButton size="sm" variant="secondary" label="Uji" loading={busy} onPress={check} />
          ) : null}
          <ComicButton size="sm" variant="danger" label="Padam" onPress={remove} />
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={saved ? 'Tukar kunci…' : placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textContentType="password"
          accessibilityLabel={title}
          onSubmitEditing={save}
        />
        <ComicButton label="Simpan" loading={busy && !!value} disabled={!value.trim()} onPress={save} />
      </View>
      {message ? (
        <View style={styles.message}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </View>
      ) : null}
      <Text style={styles.link} onPress={() => Linking.openURL(link.url)} accessibilityRole="link">
        {link.label} ↗
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, maxWidth: MAX_PAGE_WIDTH, width: '100%', alignSelf: 'center' },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 14,
  },
  modeIcon: { fontSize: 32 },
  modeTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, letterSpacing: 0.6 },
  modeText: { fontFamily: fonts.comic, fontSize: 14, color: colors.inkSoft, marginTop: 2, lineHeight: 19 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  savedKey: { flex: 1, fontFamily: fonts.comicBold, fontSize: 15, color: colors.ink },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontFamily: fonts.comicBold,
    fontSize: 16,
    color: colors.ink,
  },
  message: { marginTop: 10 },
  link: { marginTop: 10, fontFamily: fonts.comicBold, fontSize: 14, color: colors.blue },
  block: { marginTop: 28 },
  version: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: fonts.comic,
    fontSize: 12,
    color: colors.muted,
  },
});
