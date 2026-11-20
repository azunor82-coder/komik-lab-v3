import { Bangers_400Regular } from '@expo-google-fonts/bangers';
import { ComicNeue_400Regular, ComicNeue_700Bold } from '@expo-google-fonts/comic-neue';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { View } from 'react-native';

import { loadComics } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
loadComics();

const noopSubscribe = () => () => {};

/**
 * False during web server rendering and hydration, true afterwards (and always
 * true on native). The library lives in device storage, so the web server can't
 * render it — we render a plain shell first to keep hydration consistent.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export default function RootLayout() {
  const isClient = useIsClient();
  const [fontsLoaded, fontError] = useFonts({
    Bangers_400Regular,
    ComicNeue_400Regular,
    ComicNeue_700Bold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!isClient || !ready) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.yellow },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 24 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.paper },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="index" options={{ title: 'Komik Lab' }} />
        <Stack.Screen name="create" options={{ title: 'Komik Baru' }} />
        <Stack.Screen name="comic/[id]" options={{ title: 'Komik' }} />
      </Stack>
    </>
  );
}
