import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { PersonScanScreen } from './src/screens/PersonScanScreen';
import { ScanModelViewerScreen } from './src/screens/ScanModelViewerScreen';
import { applyNetworkRestriction } from './src/services/privacy';
import { colors } from './src/theme';

applyNetworkRestriction();

type Screen = 'home' | 'personScan' | 'scanViewer';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [scanModelUrl, setScanModelUrl] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'scanViewer' && scanModelUrl && (
        <ScanModelViewerScreen modelUrl={scanModelUrl} onBack={() => setScreen('home')} />
      )}
      {screen === 'personScan' && (
        <PersonScanScreen
          onBack={() => setScreen('home')}
          onModelReady={(url) => {
            setScanModelUrl(url);
            setScreen('scanViewer');
          }}
        />
      )}
      {screen === 'home' && <HomeScreen onStartPersonScan={() => setScreen('personScan')} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });