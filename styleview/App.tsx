import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { applyNetworkRestriction } from './src/services/privacy';
import { colors } from './src/theme';
import { Mode } from './src/types';

applyNetworkRestriction();

export default function App() {
  const [mode, setMode] = useState<Mode>('shirt');
  const [previewing, setPreviewing] = useState(false);

  // Stop the camera whenever the tab is hidden.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onHide = () => document.hidden && setPreviewing(false);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

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
