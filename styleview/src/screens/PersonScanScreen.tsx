/**
 * Guided orbit capture — person stays still, camera walks a full circle (Object Capture style).
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Button } from '../components/Button';
import { OrbitCamera, type OrbitCameraHandle } from '../components/OrbitCamera';
import { API_URL } from '../config';
import { fetchScanStatus, modelAbsoluteUrl, reconstructPersonScan, type ScanStatus } from '../services/scanApi';
import { colors } from '../theme';

const TARGET = 24;
const SNAP_MS = 1100;

type Props = {
  onBack: () => void;
  onModelReady: (modelUrl: string) => void;
};

export function PersonScanScreen({ onBack, onModelReady }: Props) {
  const cameraRef = useRef<OrbitCameraHandle>(null);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchScanStatus()
      .then(setStatus)
      .catch(() => {
        setStatus(null);
        setErr(`Cannot reach backend at ${API_URL}. See README.md (backend on :3001, same Wi‑Fi, styleview/.env).`);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const snap = async () => {
    const uri = await cameraRef.current?.snap();
    if (uri) setShots((s) => [...s, uri]);
  };

  const startOrbit = () => {
    setErr(null);
    setScanning(true);
    void snap();
    intervalRef.current = setInterval(() => void snap(), SNAP_MS);
  };

  const stopOrbit = () => {
    setScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    void snap();
  };

  const build = async () => {
    setBusy(true);
    setErr(null);
    try {
      const result = await reconstructPersonScan(shots);
      onModelReady(modelAbsoluteUrl(result.modelUrl));
    } catch (e: any) {
      setErr(e?.message ?? 'Build failed');
    } finally {
      setBusy(false);
    }
  };

  const progress = Math.min(1, shots.length / TARGET);
  const ringOffset = 283 * (1 - progress);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Text style={styles.title}>Scan person</Text>
      </View>

      <Text style={styles.body}>
        The person stands still. Walk a full circle with your {Platform.OS === 'web' ? 'camera' : 'phone'}, keeping them
        in frame. Photos upload to your Mac for Apple Photogrammetry.
      </Text>

      {status && (
        <Text style={styles.meta}>
          Backend: {status.macOS ? 'macOS ✓' : 'needs macOS'} · min {status.minPhotos} photos · target {TARGET}
        </Text>
      )}

      <View style={styles.preview}>
        <OrbitCamera ref={cameraRef} onError={setErr} />
        <View style={styles.ring} pointerEvents="none">
          <Svg width={100} height={100}>
            <Circle cx={50} cy={50} r={45} stroke="#333" strokeWidth={6} fill="none" />
            <Circle
              cx={50}
              cy={50}
              r={45}
              stroke={colors.accent}
              strokeWidth={6}
              fill="none"
              strokeDasharray={283}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <Text style={styles.count}>{shots.length}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {!scanning ? (
          <Button label="Start orbit capture" onPress={startOrbit} />
        ) : (
          <Button label="Stop (finish orbit)" onPress={stopOrbit} />
        )}
        <Button label="Single shot" variant="secondary" onPress={() => void snap()} />
      </View>

      {shots.length > 0 && (
        <View style={styles.thumbs}>
          {shots.slice(-6).map((uri, i) => (
            <Image key={`${i}-${uri.slice(-12)}`} source={{ uri }} style={styles.thumb} />
          ))}
        </View>
      )}

      {err && <Text style={styles.err}>{err}</Text>}

      {shots.length >= (status?.minPhotos ?? 10) && (
        <View style={styles.card}>
          {busy ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Button label="Reconstruct 3D model" onPress={() => void build()} />
          )}
        </View>
      )}

      {shots.length > 0 && shots.length < (status?.minPhotos ?? 10) && (
        <Text style={styles.warn}>Capture at least {status?.minPhotos ?? 10} images before reconstructing.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { color: colors.muted, fontSize: 13 },
  preview: { height: 360, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  ring: { position: 'absolute', top: 12, right: 12, alignItems: 'center' },
  count: { color: colors.text, fontWeight: '700', marginTop: -72, marginBottom: 40 },
  row: { gap: 10 },
  thumbs: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  thumb: { width: 56, height: 72, borderRadius: 6 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12 },
  err: { color: colors.danger },
  warn: { color: colors.muted, fontSize: 14 },
});