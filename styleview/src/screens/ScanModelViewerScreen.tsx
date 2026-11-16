import React, { Component, type ReactNode } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { UsdzScanCanvas } from '../three/UsdzScanCanvas';
import { colors } from '../theme';

type Props = { modelUrl: string; onBack: () => void };

type ErrState = { message: string };

class ViewerErrorBoundary extends Component<{ children: ReactNode }, ErrState> {
  state: ErrState = { message: '' };
  static getDerivedStateFromError(err: Error) {
    return { message: err.message || 'Could not load USDZ' };
  }
  render() {
    if (this.state.message) {
      return (
        <View style={styles.errBox}>
          <Text style={styles.err}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function NativeUsdzViewer({ modelUrl }: { modelUrl: string }) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dest = `${FileSystem.cacheDirectory}styleview-person.usdz`;
        await FileSystem.deleteAsync(dest, { idempotent: true });
        const downloaded = await FileSystem.downloadAsync(modelUrl, dest);
        if (!cancelled) setLocalUri(downloaded.uri);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Download failed');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  const openQuickLook = async () => {
    if (!localUri) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'model/vnd.usdz+zip',
          UTI: 'com.pixar.universal-scene-description-mobile',
        });
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Could not open model');
    }
  };

  if (busy) return <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />;
  if (err) return <Text style={styles.err}>{err}</Text>;

  return (
    <View style={styles.nativeBox}>
      <Text style={styles.body}>Your USDZ is ready on this device.</Text>
      <Button label="View in 3D (Quick Look)" onPress={() => void openQuickLook()} />
      <Text style={styles.note}>In the share sheet, tap Quick Look to orbit the scan in AR.</Text>
    </View>
  );
}

export function ScanModelViewerScreen({ modelUrl, onBack }: Props) {
  return (
    <View style={styles.full}>
      <View style={styles.header}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Text style={styles.title}>Your 3D scan</Text>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.canvas}>
          <ViewerErrorBoundary>
            <UsdzScanCanvas url={modelUrl} />
          </ViewerErrorBoundary>
        </View>
      ) : (
        <NativeUsdzViewer modelUrl={modelUrl} />
      )}

      <Text style={styles.note}>
        {Platform.OS === 'web'
          ? 'Drag to orbit (Three.js).'
          : 'Reconstruction still runs on your Mac; the phone uploads photos then downloads USDZ.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  canvas: { flex: 1, minHeight: 420, borderRadius: 16, overflow: 'hidden' },
  nativeBox: { flex: 1, justifyContent: 'center', gap: 16, padding: 16 },
  body: { color: colors.text, fontSize: 16, textAlign: 'center' },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  errBox: { flex: 1, justifyContent: 'center', padding: 16 },
  err: { color: colors.danger, textAlign: 'center' },
});