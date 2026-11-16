/*
 * Name:         App.tsx
 * Description:  Root component of StyleView. Holds the selected try-on mode, the
 *               current shirt, and which screen is open (home, shirt editor, preview).
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1 reqs. 1, 5, 6, 7).
 *               2026-11-16  Added shirt state and the shirt editor screen (Sprint 2).
 * Preconditions:  Rendered once by Expo as the app entry point.
 * Postconditions: Exactly one screen is shown. Leaving the preview, or hiding the
 *                 browser tab, closes the preview so the camera is turned off.
 * Errors:       None handled here; camera errors are handled in PreviewScreen.
 */
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { ShirtEditorScreen } from './src/screens/ShirtEditorScreen';
import { SAMPLE_SHIRT } from './src/sampleShirt';
import { applyNetworkRestriction } from './src/services/privacy';
import { colors } from './src/theme';
import { Mode, Shirt } from './src/types';

// Install the network restriction before anything can touch the camera.
applyNetworkRestriction();

type Screen = 'home' | 'editor' | 'preview';

export default function App() {
  const [mode, setMode] = useState<Mode>('shirt');
  const [screen, setScreen] = useState<Screen>('home');
  const [shirt, setShirt] = useState<Shirt>(SAMPLE_SHIRT);
  const [custom, setCustom] = useState(false);

  // Block: stop the camera whenever the tab is hidden (web only; native has no
  // `document`). Closing the preview unmounts the camera.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onHide = () => document.hidden && setScreen((s) => (s === 'preview' ? 'home' : s));
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Block: simple navigation driven by `screen`.
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'preview' && (
        <PreviewScreen mode={mode} shirt={shirt} onBack={() => setScreen('home')} />
      )}
      {screen === 'editor' && (
        <ShirtEditorScreen
          onCancel={() => setScreen('home')}
          onDone={(s) => {
            setShirt(s);
            setCustom(true);
            setScreen('preview'); // req. 19: go straight to trying it on
          }}
        />
      )}
      {screen === 'home' && (
        <HomeScreen
          mode={mode}
          onModeChange={setMode}
          usingCustomShirt={custom}
          onUseSample={() => {
            setShirt(SAMPLE_SHIRT);
            setCustom(false);
          }}
          onEditShirt={() => setScreen('editor')}
          onStart={() => setScreen('preview')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
