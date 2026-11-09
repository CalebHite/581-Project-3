/*
 * Name:         App.tsx
 * Description:  Root component of StyleView. Holds the selected try-on mode and
 *               whether the camera preview is open, and switches between the
 *               home and preview screens.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1 reqs. 1, 5, 6, 7).
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
import { applyNetworkRestriction } from './src/services/privacy';
import { colors } from './src/theme';
import { Mode } from './src/types';

// Install the network restriction before anything can touch the camera.
applyNetworkRestriction();

export default function App() {
  const [mode, setMode] = useState<Mode>('shirt');
  const [previewing, setPreviewing] = useState(false);

  // Block: stop the camera whenever the tab is hidden (web only; native has no
  // `document`). Closing the preview unmounts the camera.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onHide = () => document.hidden && setPreviewing(false);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Block: simple two-screen navigation driven by `previewing`.
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {previewing ? (
        <PreviewScreen mode={mode} onBack={() => setPreviewing(false)} />
      ) : (
        <HomeScreen mode={mode} onModeChange={setMode} onStart={() => setPreviewing(true)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
